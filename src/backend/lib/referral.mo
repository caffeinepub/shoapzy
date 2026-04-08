import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Types "../types/referral";

module {
  /// Map from owner Principal -> their own referral code
  public type OwnerCodeMap = Map.Map<Principal, Text>;

  /// Map from referral code (Text) -> owner Principal
  public type CodeOwnerMap = Map.Map<Text, Principal>;

  /// Map from referrer Principal -> list of referred Principals
  public type ReferredMap = Map.Map<Principal, List.List<Principal>>;

  /// Derive a referral code from the principal's text: first 8 chars uppercase.
  /// Generates and persists a code on first call.
  public func getOrCreateCode(
    ownerCodeMap : OwnerCodeMap,
    codeOwnerMap : CodeOwnerMap,
    caller : Principal,
  ) : Text {
    switch (ownerCodeMap.get(caller)) {
      case (?existing) { existing };
      case (null) {
        // Take first 8 chars of principal text, uppercase, strip '-'
        let txt = caller.toText();
        let chars = txt.toArray();
        var code = "";
        var count = 0;
        for (c in chars.values()) {
          if (count < 8) {
            let ch = Text.fromChar(c);
            if (ch != "-") {
              code := code # ch.toUpper();
              count += 1;
            };
          };
        };
        // Ensure uniqueness: if collision, append first 4 more
        let finalCode = if (codeOwnerMap.containsKey(code)) {
          code # (txt.size() % 1000).toText()
        } else { code };
        ownerCodeMap.add(caller, finalCode);
        codeOwnerMap.add(finalCode, caller);
        finalCode;
      };
    };
  };

  /// Apply a referral code: validates not-self, not-already-referred, code-exists.
  /// Awards 50 loyalty points to both the caller and the code owner.
  public func applyReferralCode(
    ownerCodeMap : OwnerCodeMap,
    codeOwnerMap : CodeOwnerMap,
    referredMap : ReferredMap,
    loyaltyPoints : Map.Map<Principal, Nat>,
    caller : Principal,
    code : Text,
  ) : { #ok; #err : Text } {
    // Lookup owner of the code
    switch (codeOwnerMap.get(code)) {
      case (null) { #err("Invalid referral code") };
      case (?referrer) {
        // Cannot use your own referral code
        if (Principal.equal(referrer, caller)) {
          return #err("Cannot use your own referral code");
        };
        // Check if caller was already referred by someone
        let alreadyReferred = referredMap.any(func(_k : Principal, list : List.List<Principal>) : Bool {
          list.find(func(p : Principal) : Bool { Principal.equal(p, caller) }) != null
        });
        if (alreadyReferred) {
          return #err("You have already used a referral code");
        };
        // Add caller to referrer's referred list
        let list = switch (referredMap.get(referrer)) {
          case (null) { List.empty<Principal>() };
          case (?l) { l };
        };
        list.add(caller);
        referredMap.add(referrer, list);
        // Award 50 points to both
        let referrerPts = switch (loyaltyPoints.get(referrer)) {
          case (null) { 0 };
          case (?p) { p };
        };
        loyaltyPoints.add(referrer, referrerPts + 50);
        let callerPts = switch (loyaltyPoints.get(caller)) {
          case (null) { 0 };
          case (?p) { p };
        };
        loyaltyPoints.add(caller, callerPts + 50);
        #ok;
      };
    };
  };

  /// Return referral statistics for the caller.
  public func getReferralStats(
    ownerCodeMap : OwnerCodeMap,
    referredMap : ReferredMap,
    loyaltyPoints : Map.Map<Principal, Nat>,
    caller : Principal,
  ) : Types.ReferralStats {
    let referralCode = switch (ownerCodeMap.get(caller)) {
      case (null) { "" };
      case (?c) { c };
    };
    let referredList = switch (referredMap.get(caller)) {
      case (null) { List.empty<Principal>() };
      case (?l) { l };
    };
    let totalReferrals = referredList.size();
    // All referrals are considered successful (they applied the code)
    let successfulReferrals = totalReferrals;
    // Each successful referral earned 50 points
    let bonusPointsEarned = successfulReferrals * 50;
    {
      referralCode;
      totalReferrals;
      successfulReferrals;
      bonusPointsEarned;
    };
  };
};
