import Types "../types/seller-profile";
import ReviewTypes "../types/reviews";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
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
  };

  /// Returns aggregated seller profile data for an approved seller, or null if not found/not approved.
  public func getSellerProfileData(
    _userProfiles : Map.Map<Principal, UserProfile>,
    _products : Map.Map<Text, Product>,
    _reviews : Map.Map<Nat, Review>,
    _seller : Principal,
  ) : ?SellerProfileData {
    Runtime.trap("not implemented");
  };

  /// Returns reviews across all products of a seller, sorted newest first, up to limit.
  public func getSellerReviews(
    _products : Map.Map<Text, Product>,
    _reviews : Map.Map<Nat, Review>,
    _seller : Principal,
    _limit : Nat,
  ) : [Review] {
    Runtime.trap("not implemented");
  };
};
