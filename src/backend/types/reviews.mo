module {
  public type Review = {
    id : Nat;
    productId : Text;
    buyerId : Principal;
    buyerName : Text;
    rating : Nat;
    reviewText : Text;
    timestamp : Int;
  };

  public type ReviewSummary = {
    productId : Text;
    averageRating : Float;
    reviewCount : Nat;
  };
};
