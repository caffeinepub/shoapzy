import Types "../types/seller-profile";
import ReviewTypes "../types/reviews";
import VariantTypes "../types/variants";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type SellerProfileData = Types.SellerProfileData;
  public type Review = ReviewTypes.Review;

  type UserProfile = {
    name : Text;
    shopName : ?Text;
    shopDescription : ?Text;
    role : Text;
    sellerApproved : Bool;
  };

  type Product = {
    id : Text;
    title : Text;
    description : Text;
    price : Nat;
    mrp : Nat;
    discountPercent : Nat;
    category : Text;
    image : Storage.ExternalBlob;
    seller : Principal;
    stock : Nat;
    isActive : Bool;
    variants : [VariantTypes.ProductVariant];
  };

  /// Returns aggregated seller profile data for an approved seller, or null if not found/not approved.
  public func getSellerProfileData(
    userProfiles : Map.Map<Principal, UserProfile>,
    products : Map.Map<Text, Product>,
    reviews : Map.Map<Nat, Review>,
    seller : Principal,
  ) : ?SellerProfileData {
    switch (userProfiles.get(seller)) {
      case (null) { null };
      case (?profile) {
        if (profile.role != "seller" or not profile.sellerApproved) { return null };
        let shopName = switch (profile.shopName) {
          case (null) { "Unknown Shop" };
          case (?n) { n };
        };
        // Count active products for this seller
        let sellerProducts = products.values().toArray()
          .filter(func(p : Product) : Bool { p.seller == seller and p.isActive });
        let productCount = sellerProducts.size();
        // Collect product IDs for this seller
        let productIds = sellerProducts.map(func(p : Product) : Text { p.id });
        // Gather all reviews for seller's products
        let sellerReviews = reviews.values().toArray()
          .filter(func(r : Review) : Bool {
            productIds.find(func(id : Text) : Bool { id == r.productId }) != null
          });
        let totalReviews = sellerReviews.size();
        let averageRating : Float = if (totalReviews == 0) { 0.0 } else {
          let total = sellerReviews.foldLeft(0, func(acc : Nat, r : Review) : Nat { acc + r.rating });
          total.toFloat() / totalReviews.toFloat()
        };
        ?{
          principal = seller;
          shopName;
          shopDescription = profile.shopDescription;
          averageRating;
          totalReviews;
          productCount;
        };
      };
    };
  };

  /// Returns reviews across all products of a seller, sorted newest first, up to limit.
  public func getSellerReviews(
    products : Map.Map<Text, Product>,
    reviews : Map.Map<Nat, Review>,
    seller : Principal,
    limit : Nat,
  ) : [Review] {
    let productIds = products.values().toArray()
      .filter(func(p : Product) : Bool { p.seller == seller })
      .map(func(p : Product) : Text { p.id });

    let sellerReviews = reviews.values().toArray()
      .filter(func(r : Review) : Bool {
        productIds.find(func(id : Text) : Bool { id == r.productId }) != null
      })
      .sort(func(a : Review, b : Review) : { #less; #equal; #greater } {
        if (a.timestamp > b.timestamp) { #less }
        else if (a.timestamp < b.timestamp) { #greater }
        else { #equal }
      });

    if (limit == 0 or sellerReviews.size() <= limit) {
      sellerReviews
    } else {
      sellerReviews.sliceToArray(0, limit)
    };
  };
};
