import Types "types/reviews";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";

module {
  public type Review = Types.Review;
  public type ReviewSummary = Types.ReviewSummary;

  /// Add a review for a product. Validates rating 1-5, prevents duplicate reviews.
  public func addReview(
    reviews : Map.Map<Nat, Review>,
    reviewCounter : Nat,
    caller : Principal,
    productId : Text,
    rating : Nat,
    reviewText : Text,
    buyerName : Text,
  ) : { #ok : (Nat, Review); #err : Text } {
    if (rating < 1 or rating > 5) {
      return #err("Rating must be between 1 and 5");
    };
    // Check for duplicate review from same caller for same product
    let duplicate = reviews.values().toArray().find(func(r : Review) : Bool {
      Principal.equal(r.buyerId, caller) and r.productId == productId
    });
    if (duplicate != null) {
      return #err("You have already reviewed this product");
    };
    let newId = reviewCounter + 1;
    let review : Review = {
      id = newId;
      productId;
      buyerId = caller;
      buyerName;
      rating;
      reviewText;
      timestamp = Time.now();
    };
    reviews.add(newId, review);
    #ok(newId, review);
  };

  /// Get all reviews for a product, sorted by timestamp descending (newest first).
  public func getProductReviews(reviews : Map.Map<Nat, Review>, productId : Text) : [Review] {
    let filtered = reviews.values().toArray().filter(func(r : Review) : Bool {
      r.productId == productId
    });
    filtered.sort(func(a : Review, b : Review) : { #less; #equal; #greater } {
      if (a.timestamp > b.timestamp) { #less }
      else if (a.timestamp < b.timestamp) { #greater }
      else { #equal }
    });
  };

  /// Calculate average rating for a product. Returns 0.0 if no reviews.
  public func getProductAverageRating(reviews : Map.Map<Nat, Review>, productId : Text) : Float {
    let productReviews = reviews.values().toArray().filter(func(r : Review) : Bool {
      r.productId == productId
    });
    let count = productReviews.size();
    if (count == 0) { return 0.0 };
    let total = productReviews.foldLeft(0, func(acc : Nat, r : Review) : Nat { acc + r.rating });
    total.toFloat() / count.toFloat();
  };

  /// Returns review summaries (average rating + count) for all products with at least one review.
  public func getReviewSummaries(reviews : Map.Map<Nat, Review>) : [ReviewSummary] {
    // Accumulate totals per productId
    let totals = Map.empty<Text, (Nat, Nat)>(); // productId -> (sum, count)
    for (review in reviews.values()) {
      switch (totals.get(review.productId)) {
        case (null) { totals.add(review.productId, (review.rating, 1)) };
        case (?(sum, cnt)) { totals.add(review.productId, (sum + review.rating, cnt + 1)) };
      };
    };
    totals.entries().toArray().map<(Text, (Nat, Nat)), ReviewSummary>(func((productId, (sum, cnt))) {
      {
        productId;
        averageRating = sum.toFloat() / cnt.toFloat();
        reviewCount = cnt;
      }
    });
  };
};
