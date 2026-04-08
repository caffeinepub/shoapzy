import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";
import VariantTypes "types/variants";

module {
  // Old Product type (no variants field)
  type OldProduct = {
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

  // New Product type (with variants field)
  type NewProduct = {
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

  type OldActor = {
    products : Map.Map<Text, OldProduct>;
  };

  type NewActor = {
    products : Map.Map<Text, NewProduct>;
  };

  public func run(old : OldActor) : NewActor {
    let products = old.products.map<Text, OldProduct, NewProduct>(
      func(_id, p) {
        { p with variants = [] };
      }
    );
    { products };
  };
};
