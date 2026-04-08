import Types "../types/reviews";
import ReviewLib "../lib/reviews";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

mixin (
  reviews : Map.Map<Nat, ReviewLib.Review>,
  reviewCounter : Nat,
  userProfiles : Map.Map<Principal, { name : Text; shopName : ?Text; shopDescription : ?Text; role : Text; sellerApproved : Bool }>,
) {
  /// Submit a review for a product. Caller must be authenticated, rating 1-5, no duplicates.
  public shared ({ caller }) func addReview(productId : Text, rating : Nat, reviewText : Text) : async { #ok : Text; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Please login to submit a review");
    };
    let buyerName = switch (userProfiles.get(caller)) {
      case (null) { caller.toText() };
      case (?profile) {
        if (profile.name != "") { profile.name }
        else {
          let txt = caller.toText();
          if (txt.size() > 12) { txt.sliceToArray(0, 12).toIter() |> "" # (debug_show(_)) } else { txt }
        }
      };
    };
    switch (ReviewLib.addReview(reviews, reviewCounter, caller, productId, rating, reviewText, buyerName)) {
      case (#ok(newId, _)) {
        reviewCounter := newId;
        #ok("Review submitted successfully");
      };
      case (#err(msg)) { #err(msg) };
    };
  };

  /// Get all reviews for a product, newest first.
  public query func getProductReviews(productId : Text) : async [ReviewLib.Review] {
    ReviewLib.getProductReviews(reviews, productId);
  };

  /// Get average rating for a product (0.0 if no reviews).
  public query func getProductAverageRating(productId : Text) : async Float {
    ReviewLib.getProductAverageRating(reviews, productId);
  };

  /// Get review summaries (average rating + count) for all products with reviews.
  public query func getReviewSummaries() : async [ReviewLib.ReviewSummary] {
    ReviewLib.getReviewSummaries(reviews);
  };
};
