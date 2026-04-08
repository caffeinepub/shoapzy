import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import CouponsLib "../lib/coupons";
import Types "../types/coupons";

mixin (
  coupons : Map.Map<Text, Types.Coupon>,
  accessControlState : AccessControl.AccessControlState,
) {
  /// Create a new coupon (admin only).
  public shared ({ caller }) func createCoupon(
    code : Text,
    discountPercent : Nat,
    validFrom : Int,
    validTo : Int,
    usageLimit : Nat,
  ) : async { #ok : Types.CouponPublic; #err : Text } {
    Runtime.trap("not implemented");
  };

  /// List all coupons (admin only).
  public query ({ caller }) func listCoupons() : async [Types.CouponPublic] {
    Runtime.trap("not implemented");
  };

  /// Validate a coupon code. Returns discount percent on success.
  public query func validateCoupon(code : Text) : async { #ok : Nat; #err : Text } {
    Runtime.trap("not implemented");
  };

  /// Apply a coupon (increment usedCount). Called after a successful order.
  public shared ({ caller }) func applyCoupon(code : Text) : async { #ok; #err : Text } {
    Runtime.trap("not implemented");
  };

  /// Deactivate a coupon (admin only).
  public shared ({ caller }) func deactivateCoupon(code : Text) : async { #ok; #err : Text } {
    Runtime.trap("not implemented");
  };

  /// Get all active, unexpired coupons (public).
  public query func getAllActiveCoupons() : async [Types.CouponPublic] {
    Runtime.trap("not implemented");
  };
};
