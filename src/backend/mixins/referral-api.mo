import Map "mo:core/Map";
import Principal "mo:core/Principal";
import ReferralLib "../lib/referral";
import Types "../types/referral";

mixin (
  ownerCodeMap : ReferralLib.OwnerCodeMap,
  codeOwnerMap : ReferralLib.CodeOwnerMap,
  referredMap : ReferralLib.ReferredMap,
  loyaltyPoints : Map.Map<Principal, Nat>,
) {

  /// Returns the caller's unique referral code (generates one on first call).
  public shared ({ caller }) func getReferralCode() : async Text {
    ReferralLib.getOrCreateCode(ownerCodeMap, codeOwnerMap, caller);
  };

  /// Apply a referral code during registration. Awards 50 points to both parties.
  public shared ({ caller }) func applyReferralCode(code : Text) : async { #ok; #err : Text } {
    ReferralLib.applyReferralCode(ownerCodeMap, codeOwnerMap, referredMap, loyaltyPoints, caller, code);
  };

  /// Returns referral statistics for the caller.
  public query ({ caller }) func getReferralStats() : async Types.ReferralStats {
    ReferralLib.getReferralStats(ownerCodeMap, referredMap, loyaltyPoints, caller);
  };
};
