module {
  public type LoyaltyBalance = {
    principal : Principal;
    points : Nat;
  };

  public type RedeemResult = {
    #ok : { pointsUsed : Nat; discountAmount : Nat };
    #err : Text;
  };
};
