module {
  public type Coupon = {
    code : Text;
    discountPercent : Nat;
    validFrom : Int;
    validTo : Int;
    usageLimit : Nat;
    var usedCount : Nat;
    var isActive : Bool;
  };

  public type CouponPublic = {
    code : Text;
    discountPercent : Nat;
    validFrom : Int;
    validTo : Int;
    usageLimit : Nat;
    usedCount : Nat;
    isActive : Bool;
  };
};
