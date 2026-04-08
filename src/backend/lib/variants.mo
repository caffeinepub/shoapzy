import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Types "../types/variants";

module {
  public type ProductVariant = Types.ProductVariant;

  /// Add or replace a single variant on a product's variant list.
  /// Returns the updated list of variants.
  public func addVariant(
    variants : [ProductVariant],
    variant : ProductVariant,
  ) : [ProductVariant] {
    // Replace if same id already exists, otherwise append
    let existing = variants.find(func(v : ProductVariant) : Bool { v.id == variant.id });
    switch (existing) {
      case (?_) {
        variants.map(func(v : ProductVariant) : ProductVariant {
          if (v.id == variant.id) { variant } else { v }
        })
      };
      case (null) { variants.concat([variant]) };
    };
  };

  /// Replace the full variants list for a product.
  public func setVariants(
    _variants : [ProductVariant],
  ) : [ProductVariant] {
    _variants;
  };
};
