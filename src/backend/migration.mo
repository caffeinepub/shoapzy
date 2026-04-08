import Map "mo:core/Map";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  // ── Old types (copied from .old/src/backend/main.mo) ──────────────────────

  type OldCartItem = {
    productId : Text;
    seller : Principal;
    quantity : Nat;
    price : Nat;
  };

  type OldOrderStatus = {
    #pending;
    #paid;
    #approved;
    #shipped;
    #delivered;
    #cancelled;
  };

  type OldOrder = {
    id : Text;
    buyer : Principal;
    items : [OldCartItem];
    totalAmount : Nat;
    paymentMethod : { #online; #cod };
    status : OldOrderStatus;
    timestamp : Int;
  };

  type OldProduct = {
    id : Text;
    title : Text;
    description : Text;
    price : Nat;
    category : Text;
    image : Storage.ExternalBlob;
    seller : Principal;
    stock : Nat;
    isActive : Bool;
  };

  // ── New types (matching new main.mo) ───────────────────────────────────────

  type NewOrderStatus = {
    #pending;
    #paid;
    #approved;
    #shipped;
    #delivered;
    #cancelled;
    #return_requested;
    #return_approved;
    #return_rejected;
  };

  type NewCartItem = {
    productId : Text;
    seller : Principal;
    quantity : Nat;
    price : Nat;
  };

  type NewOrder = {
    id : Text;
    buyer : Principal;
    items : [NewCartItem];
    totalAmount : Nat;
    paymentMethod : { #online; #cod };
    status : NewOrderStatus;
    timestamp : Int;
    deliveryAddress : ?Text;
  };

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
  };

  // ── Actor state shapes ─────────────────────────────────────────────────────

  type OldActor = {
    products : Map.Map<Text, OldProduct>;
    orders : Map.Map<Text, OldOrder>;
  };

  type NewActor = {
    products : Map.Map<Text, NewProduct>;
    orders : Map.Map<Text, NewOrder>;
  };

  // ── Migration function ─────────────────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    let products = old.products.map<Text, OldProduct, NewProduct>(
      func(_id, p) {
        { p with mrp = p.price; discountPercent = 0 }
      }
    );

    let orders = old.orders.map<Text, OldOrder, NewOrder>(
      func(_id, o) {
        let newStatus : NewOrderStatus = switch (o.status) {
          case (#pending) { #pending };
          case (#paid) { #paid };
          case (#approved) { #approved };
          case (#shipped) { #shipped };
          case (#delivered) { #delivered };
          case (#cancelled) { #cancelled };
        };
        { o with status = newStatus; deliveryAddress = null }
      }
    );

    { products; orders };
  };
};
