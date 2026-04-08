module {
  public type SellerProfileData = {
    principal : Principal;
    shopName : Text;
    shopDescription : ?Text;
    averageRating : Float;
    totalReviews : Nat;
    productCount : Nat;
  };
};
