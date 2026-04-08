import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
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
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can create coupons");
    };
    if (code.size() == 0) { return #err("Coupon code cannot be empty") };
    if (discountPercent == 0 or discountPercent > 100) {
      return #err("Discount percent must be between 1 and 100");
    };
    if (validFrom >= validTo) { return #err("validFrom must be before validTo") };
    let upperCode = code.toUpper();
    if (coupons.containsKey(upperCode)) {
      return #err("Coupon code already exists: " # upperCode);
    };
    let coupon = CouponsLib.createCoupon(coupons, code, discountPercent, validFrom, validTo, usageLimit);
    #ok(coupon);
  };

  /// List all coupons (admin only).
  public query ({ caller }) func listCoupons() : async [Types.CouponPublic] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list coupons");
    };
    CouponsLib.listCoupons(coupons);
  };

  /// Validate a coupon code. Returns discount percent on success.
  public query func validateCoupon(code : Text) : async { #ok : Nat; #err : Text } {
    CouponsLib.validateCoupon(coupons, code, Time.now());
  };

  /// Apply a coupon (increment usedCount). Called after a successful order.
  public shared ({ caller }) func applyCoupon(code : Text) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Please login to apply a coupon");
    };
    switch (CouponsLib.validateCoupon(coupons, code, Time.now())) {
      case (#err(msg)) { #err(msg) };
      case (#ok(_)) {
        CouponsLib.applyCoupon(coupons, code);
        #ok;
      };
    };
  };

  /// Deactivate a coupon (admin only).
  public shared ({ caller }) func deactivateCoupon(code : Text) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can deactivate coupons");
    };
    let upperCode = code.toUpper();
    if (not coupons.containsKey(upperCode)) {
      return #err("Coupon not found: " # upperCode);
    };
    CouponsLib.deactivateCoupon(coupons, code);
    #ok;
  };

  /// Get all active, unexpired coupons (public).
  public query func getAllActiveCoupons() : async [Types.CouponPublic] {
    CouponsLib.getAllActiveCoupons(coupons, Time.now());
  };
};
