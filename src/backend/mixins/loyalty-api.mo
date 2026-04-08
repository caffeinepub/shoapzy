import Map "mo:core/Map";
import Principal "mo:core/Principal";
import LoyaltyLib "../lib/loyalty";
import LoyaltyTypes "../types/loyalty";

mixin (
  loyaltyPoints : Map.Map<Principal, Nat>,
) {
  /// Get caller's current loyalty points balance.
  public query ({ caller }) func getLoyaltyPoints() : async Nat {
    if (caller.isAnonymous()) { return 0 };
    LoyaltyLib.getPoints(loyaltyPoints, caller);
  };

  /// Redeem loyalty points for a discount on an order.
  /// Each point = 1 rupee. Max 20% of orderTotal can be redeemed.
  public shared ({ caller }) func redeemLoyaltyPoints(
    pointsToRedeem : Nat,
    orderTotal : Nat,
  ) : async LoyaltyTypes.RedeemResult {
    if (caller.isAnonymous()) {
      return #err("Please login to redeem loyalty points");
    };
    LoyaltyLib.redeemPoints(loyaltyPoints, caller, pointsToRedeem, orderTotal);
  };
};
