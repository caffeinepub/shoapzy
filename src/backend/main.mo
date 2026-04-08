import AccessControl "mo:caffeineai-authorization/access-control";
import Stripe "mo:caffeineai-stripe/stripe";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import UserApproval "mo:caffeineai-user-approval/approval";
import Storage "mo:caffeineai-object-storage/Storage";
import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Array "mo:core/Array";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import ReturnsTypes "types/returns";
import ReturnsMixin "mixins/returns-api";
import SellerProfileMixin "mixins/seller-profile-api";
import CouponsTypes "types/coupons";
import CouponsApi "mixins/coupons-api";
import VariantTypes "types/variants";
import VariantsApi "mixins/variants-api";
import LoyaltyApi "mixins/loyalty-api";
import LoyaltyLib "lib/loyalty";
import AddressBookApi "mixins/address-book-api";
import AddressBookLib "lib/address-book";
import ReferralApi "mixins/referral-api";



actor {
  // Record seller registration
  public type SellerRegistration = {
    principal : Principal;
    shopName : Text;
    shopDescription : ?Text;
  };

  public type SellerInfo = {
    principal : Principal;
    shopName : Text;
    shopDescription : ?Text;
    status : Text; // "pending", "approved", "rejected"
  };

  // UserProfile keeps sellerApproved: Bool for upgrade compatibility.
  // Rejected sellers are tracked in a separate rejectedSellers map.
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
    mrp : Nat;
    discountPercent : Nat;
    category : Text;
    image : Storage.ExternalBlob;
    seller : Principal;
    stock : Nat;
    isActive : Bool;
    variants : [VariantTypes.ProductVariant];
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
    #return_requested;
    #return_approved;
    #return_rejected;
  };

  type Order = {
    id : Text;
    buyer : Principal;
    items : [CartItem];
    totalAmount : Nat;
    paymentMethod : { #online; #cod };
    status : OrderStatus;
    timestamp : Int;
    deliveryAddress : ?Text;
  };

  public type AdminCommissionBreakdown = {
    adminCommission : Nat;
    sellerPayments : [(Principal, Nat)];
  };

  public type OrderCommissionBreakdown = {
    orderId : Text;
    commission : AdminCommissionBreakdown;
  };

  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);

  // Kept for stable state upgrade compatibility with previous version
  let storageState : {} = {};

  let userProfiles = Map.empty<Principal, UserProfile>();
  let products = Map.empty<Text, Product>();
  let carts = Map.empty<Principal, [CartItem]>();
  let orders = Map.empty<Text, Order>();

  // Separate map to track rejected sellers (avoids type migration issues)
  let rejectedSellers = Map.empty<Principal, Bool>();

  // Wishlist: maps each user to an array of product IDs they have saved
  let wishlists = Map.empty<Principal, [Text]>();

  // Reviews domain
  public type Review = {
    id : Nat;
    productId : Text;
    buyerId : Principal;
    buyerName : Text;
    rating : Nat;
    reviewText : Text;
    timestamp : Int;
  };

  public type ReviewSummary = {
    productId : Text;
    averageRating : Float;
    reviewCount : Nat;
  };

  let reviews = Map.empty<Nat, Review>();
  var reviewCounter : Nat = 0;

  // Return requests
  let returnRequests = Map.empty<Text, ReturnsTypes.ReturnRequest>();

  // Coupons
  let coupons = Map.empty<Text, CouponsTypes.Coupon>();

  // Loyalty points: keyed by Principal, value is points balance
  let loyaltyPoints = Map.empty<Principal, Nat>();

  // Address book: keyed by Principal, value is list of saved addresses
  let addressBook : AddressBookLib.AddressMap = Map.empty();

  // Referral: owner->code, code->owner, referrer->list of referred
  let referralOwnerCode = Map.empty<Principal, Text>();
  let referralCodeOwner = Map.empty<Text, Principal>();
  let referralReferred = Map.empty<Principal, List.List<Principal>>();

  include MixinObjectStorage();
  include MixinAuthorization(accessControlState);
  include ReturnsMixin(returnRequests, accessControlState, orders);
  include SellerProfileMixin(userProfiles, products, reviews);
  include CouponsApi(coupons, accessControlState);
  include VariantsApi(products, accessControlState);
  include LoyaltyApi(loyaltyPoints);
  include AddressBookApi(addressBook);
  include ReferralApi(referralOwnerCode, referralCodeOwner, referralReferred, loyaltyPoints);

  // Helper: get seller status as text
  func getSellerStatus(principal : Principal) : Text {
    switch (userProfiles.get(principal)) {
      case (null) { "none" };
      case (?profile) {
        if (profile.role != "seller") { "none" }
        else if (profile.sellerApproved) { "approved" }
        else if (rejectedSellers.containsKey(principal)) { "rejected" }
        else { "pending" };
      };
    };
  };

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
    let isAdmin = AccessControl.hasPermission(accessControlState, caller, #admin);
    let isApprovedSeller = switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) { profile.sellerApproved };
    };
    if (not (isApprovedSeller or isAdmin)) {
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

  // Cart management -- allow any logged-in user
  public shared ({ caller }) func addToCart(item : CartItem) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Please login to add items to cart");
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

  // Order Management -- allow any logged-in user
  public shared ({ caller }) func placeOrder(order : Order) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Please login to place an order");
    };
    orders.add(order.id, order);
    // Award loyalty points: 1 point per 10 rupees spent
    LoyaltyLib.awardPoints(loyaltyPoints, caller, order.totalAmount);
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
              Runtime.trap("Unauthorized: Only admins or buyers can cancel orders");
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
          case (#return_requested) { Runtime.trap("Use submitReturnRequest to request a return") };
          case (#return_approved) { if (not isAdmin) { Runtime.trap("Unauthorized: Only admins can approve returns") } };
          case (#return_rejected) { if (not isAdmin) { Runtime.trap("Unauthorized: Only admins can reject returns") } };
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
    if (caller.isAnonymous()) {
      Runtime.trap("Please login to register as a seller");
    };
    // Remove from rejected if re-registering
    rejectedSellers.remove(caller);
    UserApproval.requestApproval(approvalState, caller);
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
        UserApproval.setApproval(approvalState, seller, #approved);
        rejectedSellers.remove(seller);
        let updatedProfile = { profile with sellerApproved = true };
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
        UserApproval.setApproval(approvalState, seller, #rejected);
        // Mark as rejected in separate map so they don't show as pending
        rejectedSellers.add(seller, true);
        let updatedProfile = { profile with sellerApproved = false };
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
      if (profile.role == "seller" and not profile.sellerApproved and not rejectedSellers.containsKey(principal)) {
        pending.add(principal, true);
      };
    };
    pending.keys().toArray();
  };

  public query ({ caller }) func getPendingSellerDetails() : async [SellerRegistration] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view pending seller details");
    };
    let sellerRegs = Map.empty<Principal, SellerRegistration>();
    for ((principal, profile) in userProfiles.entries()) {
      // Only include sellers that are pending (not approved, not rejected)
      if (profile.role == "seller" and not profile.sellerApproved and not rejectedSellers.containsKey(principal)) {
        let sellerReg : SellerRegistration = {
          principal;
          shopName = switch (profile.shopName) {
            case (null) { "No Shop Name" };
            case (?shopName) { shopName };
          };
          shopDescription = profile.shopDescription;
        };
        sellerRegs.add(principal, sellerReg);
      };
    };
    sellerRegs.values().toArray();
  };

  // Get ALL sellers (pending + approved + rejected) for admin
  public query ({ caller }) func getAllSellers() : async [SellerInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all sellers");
    };
    let result = Map.empty<Principal, SellerInfo>();
    for ((principal, profile) in userProfiles.entries()) {
      if (profile.role == "seller") {
        let status = if (profile.sellerApproved) { "approved" }
          else if (rejectedSellers.containsKey(principal)) { "rejected" }
          else { "pending" };
        let info : SellerInfo = {
          principal;
          shopName = switch (profile.shopName) {
            case (null) { "No Shop Name" };
            case (?n) { n };
          };
          shopDescription = profile.shopDescription;
          status;
        };
        result.add(principal, info);
      };
    };
    result.values().toArray();
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
      totalEarnings += order.totalAmount * 10 / 100;
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
    if (caller.isAnonymous()) {
      Runtime.trap("Please login to request approval");
    };
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
    if (caller.isAnonymous()) {
      Runtime.trap("Please login to save profile");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      return null;
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
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

  // Expose seller status for frontend
  public query ({ caller }) func getCallerSellerStatus() : async Text {
    getSellerStatus(caller);
  };

  // Wishlist Management
  public shared ({ caller }) func addToWishlist(productId : Text) : async Bool {
    if (caller.isAnonymous()) {
      Runtime.trap("Please login to add items to wishlist");
    };
    let current = switch (wishlists.get(caller)) {
      case (null) { [] };
      case (?ids) { ids };
    };
    // Avoid duplicates
    if (current.find(func(id : Text) : Bool { id == productId }) != null) {
      return true;
    };
    wishlists.add(caller, current.concat([productId]));
    true;
  };

  public shared ({ caller }) func removeFromWishlist(productId : Text) : async Bool {
    if (caller.isAnonymous()) {
      Runtime.trap("Please login to manage your wishlist");
    };
    switch (wishlists.get(caller)) {
      case (null) { false };
      case (?ids) {
        wishlists.add(caller, ids.filter(func(id : Text) : Bool { id != productId }));
        true;
      };
    };
  };

  public query ({ caller }) func getCallerWishlist() : async [Text] {
    if (caller.isAnonymous()) {
      return [];
    };
    switch (wishlists.get(caller)) {
      case (null) { [] };
      case (?ids) { ids };
    };
  };

  public query ({ caller }) func isInWishlist(productId : Text) : async Bool {
    if (caller.isAnonymous()) {
      return false;
    };
    switch (wishlists.get(caller)) {
      case (null) { false };
      case (?ids) {
        ids.find(func(id : Text) : Bool { id == productId }) != null;
      };
    };
  };

  // ── Reviews ──────────────────────────────────────────────────────────────

  public shared ({ caller }) func addReview(productId : Text, rating : Nat, reviewText : Text) : async { #ok : Text; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Please login to submit a review");
    };
    if (rating < 1 or rating > 5) {
      return #err("Rating must be between 1 and 5");
    };
    // Prevent duplicate reviews from the same principal for the same product
    let duplicate = reviews.values().toArray().find(func(r : Review) : Bool {
      Principal.equal(r.buyerId, caller) and r.productId == productId
    });
    if (duplicate != null) {
      return #err("You have already reviewed this product");
    };
    // Derive buyer display name from profile or shorten principal
    let buyerName : Text = switch (userProfiles.get(caller)) {
      case (null) {
        let txt = caller.toText();
        if (txt.size() > 10) { Text.fromArray(txt.toArray().sliceToArray(0, 10)) # "..." } else { txt }
      };
      case (?profile) {
        if (profile.name != "") { profile.name }
        else {
          let txt = caller.toText();
          if (txt.size() > 10) { Text.fromArray(txt.toArray().sliceToArray(0, 10)) # "..." } else { txt }
        }
      };
    };
    reviewCounter += 1;
    let review : Review = {
      id = reviewCounter;
      productId;
      buyerId = caller;
      buyerName;
      rating;
      reviewText;
      timestamp = Time.now();
    };
    reviews.add(reviewCounter, review);
    #ok("Review submitted successfully");
  };

  public query func getProductReviews(productId : Text) : async [Review] {
    let filtered = reviews.values().toArray().filter(func(r : Review) : Bool {
      r.productId == productId
    });
    filtered.sort(func(a : Review, b : Review) : { #less; #equal; #greater } {
      if (a.timestamp > b.timestamp) { #less }
      else if (a.timestamp < b.timestamp) { #greater }
      else { #equal }
    });
  };

  public query func getProductAverageRating(productId : Text) : async Float {
    let productReviews = reviews.values().toArray().filter(func(r : Review) : Bool {
      r.productId == productId
    });
    let count = productReviews.size();
    if (count == 0) { return 0.0 };
    let total = productReviews.foldLeft(0, func(acc : Nat, r : Review) : Nat { acc + r.rating });
    total.toFloat() / count.toFloat();
  };

  public query func getReviewSummaries() : async [ReviewSummary] {
    let totals = Map.empty<Text, (Nat, Nat)>();
    for (review in reviews.values()) {
      switch (totals.get(review.productId)) {
        case (null) { totals.add(review.productId, (review.rating, 1)) };
        case (?(sum, cnt)) { totals.add(review.productId, (sum + review.rating, cnt + 1)) };
      };
    };
    totals.entries().toArray().map<(Text, (Nat, Nat)), ReviewSummary>(func((productId, (sum, cnt))) : ReviewSummary {
      {
        productId;
        averageRating = sum.toFloat() / cnt.toFloat();
        reviewCount = cnt;
      }
    });
  };
};
