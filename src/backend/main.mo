import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import UserApproval "user-approval/approval";
import Storage "blob-storage/Storage";
import List "mo:core/List";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Record seller registration
  public type SellerRegistration = {
    principal : Principal;
    shopName : Text;
    shopDescription : ?Text;
  };

  public type UserProfile = {
    name : Text;
    shopName : ?Text;
    shopDescription : ?Text;
    role : Text; // "buyer", "seller", "admin"
    sellerApproved : Bool;
  };

  // For storing products
  type Product = {
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

  // For storing shopping cart items
  type CartItem = {
    productId : Text;
    seller : Principal;
    quantity : Nat;
    price : Nat;
  };

  // For storing orders
  type OrderStatus = {
    #pending;
    #paid;
    #approved;
    #shipped;
    #delivered;
    #cancelled;
  };

  type Order = {
    id : Text;
    buyer : Principal;
    items : [CartItem];
    totalAmount : Nat;
    paymentMethod : { #online; #cod };
    status : OrderStatus;
    timestamp : Int;
  };

  public type AdminCommissionBreakdown = {
    adminCommission : Nat;
    sellerPayments : [(Principal, Nat)];
  };

  public type OrderCommissionBreakdown = {
    orderId : Text;
    commission : AdminCommissionBreakdown;
  };

  type StorageState = { /* placeholder for persistent storage state */ };

  // Cart management
  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();
  let products = Map.empty<Text, Product>();
  let carts = Map.empty<Principal, [CartItem]>();
  let orders = Map.empty<Text, Order>();

  // Add persistent storage state as a field in your actor
  let storageState : StorageState = {};

  include MixinStorage();

  include MixinAuthorization(accessControlState);

  // First-time admin claim -- works only when no admin has been assigned yet
  public shared ({ caller }) func claimAdminRole() : async () {
    if (accessControlState.adminAssigned) {
      Runtime.trap("Admin role has already been claimed. Contact existing admin.");
    };
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous callers cannot claim admin role");
    };
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
  };

  public query func isStripeConfigured() : async Bool {
    true;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(
      {
        secretKey = "";
        allowedCountries = ["AT", "CH", "DE"];
      },
      sessionId,
      transform,
    );
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(
      {
        secretKey = "";
        allowedCountries = ["AT", "CH", "DE"];
      },
      caller,
      items,
      successUrl,
      cancelUrl,
      transform,
    );
  };

  // Product Management
  public query ({ caller }) func getProducts() : async [Product] {
    products.values().toArray();
  };

  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved sellers or admins can add products");
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    switch (products.get(product.id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?existingProduct) {
        if (existingProduct.seller != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only update your own products");
        };
      };
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        if (product.seller != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only delete your own products");
        };
      };
    };
    products.remove(productId);
  };

  // Cart management
  public shared ({ caller }) func addToCart(item : CartItem) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can add to cart");
    };
    let currentCart = switch (carts.get(caller)) {
      case (null) { [item] };
      case (?existingCart) { existingCart.concat([item]) };
    };
    carts.add(caller, currentCart);
  };

  public query ({ caller }) func getCallerCart() : async ?[CartItem] {
    carts.get(caller);
  };

  public shared ({ caller }) func clearCallerCart() : async () {
    carts.remove(caller);
  };

  // Order Management
  public shared ({ caller }) func placeOrder(order : Order) : async () {
    if (
      not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))
    ) {
      Runtime.trap("Unauthorized: Only approved users can place orders");
    };
    orders.add(order.id, order);
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Text, status : OrderStatus) : async () {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?existingOrder) {
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        var isBuyer = caller == existingOrder.buyer;
        var isSeller = false;
        for (item in existingOrder.items.vals()) {
          if (item.seller == caller) {
            isSeller := true;
          };
        };

        switch (status) {
          case (#approved) {
            if (not isAdmin) {
              Runtime.trap("Unauthorized: Only admins can approve orders");
            };
          };
          case (#cancelled) {
            if (not (isAdmin or isBuyer)) {
              if (not isAdmin) {
                Runtime.trap("Unauthorized: Only admins can cancel orders");
              } else {
                Runtime.trap("Unauthorized: Only buyers can cancel orders");
              };
            };
          };
          case (#shipped) {
            if (not (isAdmin or isSeller)) {
              Runtime.trap("Unauthorized: Only admins or sellers can mark orders as shipped");
            };
          };
          case (#delivered) {
            if (not (isAdmin or isSeller)) {
              Runtime.trap("Unauthorized: Only admins or sellers can mark orders as delivered");
            };
          };
          case (#paid) { if (not isAdmin) { Runtime.trap("Unauthorized: Only admins can mark orders as paid") } };
          case (#pending) { Runtime.trap("Cannot change order back to pending status") };
        };

        let updatedOrder = { existingOrder with status };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getUserOrders(user : Principal) : async [Order] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };
    orders.values().toArray().filter(func(o : Order) : Bool { o.buyer == user });
  };

  public query ({ caller }) func getSellerOrders(seller : Principal) : async [Order] {
    if (caller != seller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own seller orders");
    };
    orders.values().toArray().filter(func(o : Order) : Bool {
      o.items.find<CartItem>(func(item : CartItem) : Bool { item.seller == seller }) != null;
    });
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  // Seller Management
  public query ({ caller }) func isCallerSellerApproved() : async Bool {
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) { return true };
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) { profile.sellerApproved };
    };
  };

  public shared ({ caller }) func registerAsSeller(shopName : Text, shopDescription : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register as sellers");
    };
    let profile : UserProfile = {
      name = "";
      shopName = ?shopName;
      shopDescription;
      role = "seller";
      sellerApproved = false;
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func approveSeller(seller : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can approve sellers");
    };
    switch (userProfiles.get(seller)) {
      case (null) { Runtime.trap("Seller profile not found") };
      case (?profile) {
        let updatedProfile = {
          profile with sellerApproved = true;
        };
        userProfiles.add(seller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func rejectSeller(seller : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can reject sellers");
    };
    switch (userProfiles.get(seller)) {
      case (null) { Runtime.trap("Seller profile not found") };
      case (?profile) {
        let updatedProfile = {
          profile with sellerApproved = false;
        };
        userProfiles.add(seller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getPendingSellerRegistrations() : async [Principal] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view pending registrations");
    };
    let pending = Map.empty<Principal, Bool>();
    for ((principal, profile) in userProfiles.entries()) {
      if (profile.role == "seller" and not profile.sellerApproved) {
        pending.add(principal, true);
      };
    };
    pending.keys().toArray();
  };

  public query ({ caller }) func getSellerProducts(seller : Principal) : async [Product] {
    products.values().toArray().filter(func(p : Product) : Bool { p.seller == seller });
  };

  // Admin Dashboard
  public query ({ caller }) func getPlatformEarnings() : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view platform earnings");
    };
    var totalEarnings : Nat = 0;
    for (order in orders.values()) {
      totalEarnings += order.totalAmount * 10 / 100; // 10% commission
    };
    totalEarnings;
  };

  public query ({ caller }) func getOrderCommissionBreakdown(orderId : Text) : async ?({
    adminCommission : Nat;
    sellerPayments : [(Principal, Nat)];
  }) {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view commission breakdown");
    };
    switch (orders.get(orderId)) {
      case (null) { null };
      case (?order) {
        let adminCommission = order.totalAmount * 10 / 100;
        let sellerPaymentsMap = Map.empty<Principal, Nat>();
        for (item in order.items.values()) {
          let itemTotal = item.price * item.quantity;
          let sellerAmount = itemTotal * 90 / 100;
          switch (sellerPaymentsMap.get(item.seller)) {
            case (null) { sellerPaymentsMap.add(item.seller, sellerAmount) };
            case (?existing) { sellerPaymentsMap.add(item.seller, existing + sellerAmount) };
          };
        };
        let sellerPayments = sellerPaymentsMap.entries().toArray();
        ?{ adminCommission; sellerPayments };
      };
    };
  };

  // Approval system functions
  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user) {
      Runtime.trap("Unauthorized: You can only view your own profile");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getUserProducts(user : Principal) : async [Product] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only view your own products");
    };
    products.values().toArray().filter(func(p : Product) : Bool { p.seller == user });
  };

  public shared ({ caller }) func clearCart() : async () {
    carts.remove(caller);
  };
};
