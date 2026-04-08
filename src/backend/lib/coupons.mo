import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types/coupons";

module {
  public type Coupon = Types.Coupon;
  public type CouponPublic = Types.CouponPublic;

  /// Convert internal Coupon (with var fields) to shared CouponPublic.
  public func toPublic(c : Coupon) : CouponPublic {
    {
      code = c.code;
      discountPercent = c.discountPercent;
      validFrom = c.validFrom;
      validTo = c.validTo;
      usageLimit = c.usageLimit;
      usedCount = c.usedCount;
      isActive = c.isActive;
    };
  };

  /// Create a new coupon (admin only). Stores the code uppercased.
  public func createCoupon(
    coupons : Map.Map<Text, Coupon>,
    code : Text,
    discountPercent : Nat,
    validFrom : Int,
    validTo : Int,
    usageLimit : Nat,
  ) : CouponPublic {
    let upperCode = code.toUpper();
    let coupon : Coupon = {
      code = upperCode;
      discountPercent;
      validFrom;
      validTo;
      usageLimit;
      var usedCount = 0;
      var isActive = true;
    };
    coupons.add(upperCode, coupon);
    toPublic(coupon);
  };

  /// List all coupons (admin only).
  public func listCoupons(coupons : Map.Map<Text, Coupon>) : [CouponPublic] {
    coupons.values().toArray().map(func(c : Coupon) : CouponPublic { toPublic(c) });
  };

  /// Validate a coupon code. Returns #ok(discountPercent) or #err(message).
  public func validateCoupon(
    coupons : Map.Map<Text, Coupon>,
    code : Text,
    now : Int,
  ) : { #ok : Nat; #err : Text } {
    let upperCode = code.toUpper();
    switch (coupons.get(upperCode)) {
      case (null) { #err("Invalid coupon code") };
      case (?c) {
        if (not c.isActive) { return #err("Coupon is no longer active") };
        if (now < c.validFrom) { return #err("Coupon is not yet valid") };
        if (now > c.validTo) { return #err("Coupon has expired") };
        if (c.usageLimit > 0 and c.usedCount >= c.usageLimit) {
          return #err("Coupon usage limit has been reached");
        };
        #ok(c.discountPercent);
      };
    };
  };

  /// Increment usedCount for a coupon after successful application.
  public func applyCoupon(
    coupons : Map.Map<Text, Coupon>,
    code : Text,
  ) : () {
    let upperCode = code.toUpper();
    switch (coupons.get(upperCode)) {
      case (null) { Runtime.trap("Coupon not found: " # upperCode) };
      case (?c) {
        c.usedCount += 1;
      };
    };
  };

  /// Deactivate a coupon (admin only).
  public func deactivateCoupon(
    coupons : Map.Map<Text, Coupon>,
    code : Text,
  ) : () {
    let upperCode = code.toUpper();
    switch (coupons.get(upperCode)) {
      case (null) { Runtime.trap("Coupon not found: " # upperCode) };
      case (?c) {
        c.isActive := false;
      };
    };
  };

  /// Get all currently active and unexpired coupons (public query).
  public func getAllActiveCoupons(
    coupons : Map.Map<Text, Coupon>,
    now : Int,
  ) : [CouponPublic] {
    coupons.values().toArray()
      .filter(func(c : Coupon) : Bool {
        c.isActive and now >= c.validFrom and now <= c.validTo and
        (c.usageLimit == 0 or c.usedCount < c.usageLimit)
      })
      .map(func(c : Coupon) : CouponPublic { toPublic(c) });
  };
};
