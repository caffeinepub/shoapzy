import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";
import AccessControl "mo:caffeineai-authorization/access-control";
import VariantsLib "../lib/variants";
import VariantTypes "../types/variants";

mixin (
  products : Map.Map<Text, {
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
  }>,
  accessControlState : AccessControl.AccessControlState,
) {
  /// Add or update a single variant for a product (seller/admin only).
  public shared ({ caller }) func addProductVariant(
    productId : Text,
    variant : VariantTypes.ProductVariant,
  ) : async { #ok; #err : Text } {
    switch (products.get(productId)) {
      case (null) { return #err("Product not found") };
      case (?product) {
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        if (product.seller != caller and not isAdmin) {
          return #err("Unauthorized: Only the seller or admin can manage variants");
        };
        let updatedVariants = VariantsLib.addVariant(product.variants, variant);
        let updatedProduct = { product with variants = updatedVariants };
        products.add(productId, updatedProduct);
        #ok;
      };
    };
  };

  /// Replace all variants for a product (seller/admin only).
  public shared ({ caller }) func updateProductVariants(
    productId : Text,
    variants : [VariantTypes.ProductVariant],
  ) : async { #ok; #err : Text } {
    switch (products.get(productId)) {
      case (null) { return #err("Product not found") };
      case (?product) {
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        if (product.seller != caller and not isAdmin) {
          return #err("Unauthorized: Only the seller or admin can manage variants");
        };
        let updatedProduct = { product with variants = VariantsLib.setVariants(variants) };
        products.add(productId, updatedProduct);
        #ok;
      };
    };
  };

  /// Get all variants for a product (public).
  public query func getProductVariants(productId : Text) : async [VariantTypes.ProductVariant] {
    switch (products.get(productId)) {
      case (null) { [] };
      case (?product) { product.variants };
    };
  };
};
