import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Types "../types/coupons";

module {
  public type Coupon = Types.Coupon;
  public type CouponPublic = Types.CouponPublic;

  /// Convert internal Coupon (with var fields) to shared CouponPublic.
  public func toPublic(_c : Coupon) : CouponPublic {
    Runtime.trap("not implemented");
  };

  /// Create a new coupon (admin only). Stores the code uppercased.
  public func createCoupon(
    _coupons : Map.Map<Text, Coupon>,
    _code : Text,
    _discountPercent : Nat,
    _validFrom : Int,
    _validTo : Int,
    _usageLimit : Nat,
  ) : CouponPublic {
    Runtime.trap("not implemented");
  };

  /// List all coupons (admin only).
  public func listCoupons(_coupons : Map.Map<Text, Coupon>) : [CouponPublic] {
    Runtime.trap("not implemented");
  };

  /// Validate a coupon code. Returns #ok(discountPercent) or #err(message).
  public func validateCoupon(
    _coupons : Map.Map<Text, Coupon>,
    _code : Text,
    _now : Int,
  ) : { #ok : Nat; #err : Text } {
    Runtime.trap("not implemented");
  };

  /// Increment usedCount for a coupon after successful application.
  public func applyCoupon(
    _coupons : Map.Map<Text, Coupon>,
    _code : Text,
  ) : () {
    Runtime.trap("not implemented");
  };

  /// Deactivate a coupon (admin only).
  public func deactivateCoupon(
    _coupons : Map.Map<Text, Coupon>,
    _code : Text,
  ) : () {
    Runtime.trap("not implemented");
  };

  /// Get all currently active and unexpired coupons (public query).
  public func getAllActiveCoupons(
    _coupons : Map.Map<Text, Coupon>,
    _now : Int,
  ) : [CouponPublic] {
    Runtime.trap("not implemented");
  };
};
