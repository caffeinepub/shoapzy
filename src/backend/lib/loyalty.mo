import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/loyalty";

module {
  public type RedeemResult = Types.RedeemResult;

  /// Calculate points earned from a purchase (1 point per 10 rupees).
  public func calcPointsEarned(totalAmount : Nat) : Nat {
    totalAmount / 10;
  };

  /// Award points to a buyer after a successful purchase.
  public func awardPoints(
    pointsMap : Map.Map<Principal, Nat>,
    buyer : Principal,
    totalAmount : Nat,
  ) : () {
    let earned = calcPointsEarned(totalAmount);
    if (earned == 0) { return };
    let current = switch (pointsMap.get(buyer)) {
      case (null) { 0 };
      case (?p) { p };
    };
    pointsMap.add(buyer, current + earned);
  };

  /// Get current points balance for a user.
  public func getPoints(
    pointsMap : Map.Map<Principal, Nat>,
    user : Principal,
  ) : Nat {
    switch (pointsMap.get(user)) {
      case (null) { 0 };
      case (?p) { p };
    };
  };

  /// Validate and deduct points for redemption.
  /// Each point = 1 rupee; max redemption = 20% of orderTotal.
  /// Returns #ok with points used and discount amount, or #err.
  public func redeemPoints(
    pointsMap : Map.Map<Principal, Nat>,
    user : Principal,
    pointsToRedeem : Nat,
    orderTotal : Nat,
  ) : RedeemResult {
    if (pointsToRedeem == 0) {
      return #err("Points to redeem must be greater than 0");
    };
    let balance = getPoints(pointsMap, user);
    if (pointsToRedeem > balance) {
      return #err("Insufficient loyalty points. You have " # balance.toText() # " points.");
    };
    let maxDiscount = orderTotal * 20 / 100;
    // Each point = 1 rupee discount
    let discountAmount = if (pointsToRedeem > maxDiscount) { maxDiscount } else { pointsToRedeem };
    let actualPointsUsed = discountAmount; // 1 point = 1 rupee
    pointsMap.add(user, balance - actualPointsUsed);
    #ok({ pointsUsed = actualPointsUsed; discountAmount });
  };
};
