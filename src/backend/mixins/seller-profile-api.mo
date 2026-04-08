import SellerProfileLib "../lib/seller-profile";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";
import ReviewTypes "../types/reviews";
import VariantTypes "../types/variants";

mixin (
  userProfiles : Map.Map<Principal, { name : Text; shopName : ?Text; shopDescription : ?Text; role : Text; sellerApproved : Bool }>,
  products : Map.Map<Text, { id : Text; title : Text; description : Text; price : Nat; mrp : Nat; discountPercent : Nat; category : Text; image : Storage.ExternalBlob; seller : Principal; stock : Nat; isActive : Bool; variants : [VariantTypes.ProductVariant] }>,
  reviews : Map.Map<Nat, ReviewTypes.Review>,
) {
  /// Get aggregated profile data for a seller. Returns null if seller not found or not approved.
  public query func getSellerProfileData(seller : Principal) : async ?SellerProfileLib.SellerProfileData {
    SellerProfileLib.getSellerProfileData(userProfiles, products, reviews, seller);
  };

  /// Get reviews for all products of a seller, newest first, up to limit.
  public query func getSellerReviews(seller : Principal, limit : Nat) : async [SellerProfileLib.Review] {
    SellerProfileLib.getSellerReviews(products, reviews, seller, limit);
  };
};
