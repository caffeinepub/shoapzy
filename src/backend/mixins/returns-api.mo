import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import ReturnsLib "../lib/returns";
import Types "../types/returns";

mixin (
  returnRequests : Map.Map<Text, Types.ReturnRequest>,
  accessControlState : AccessControl.AccessControlState,
  ordersRef : Map.Map<Text, { buyer : Principal; status : { #pending; #paid; #approved; #shipped; #delivered; #cancelled; #return_requested; #return_approved; #return_rejected }; items : [{ seller : Principal; productId : Text; quantity : Nat; price : Nat }]; id : Text; totalAmount : Nat; paymentMethod : { #online; #cod }; timestamp : Int; deliveryAddress : ?Text } >,
) {
  /// Submit a return request for a delivered order (buyer only, one per order).
  public shared ({ caller }) func submitReturnRequest(orderId : Text, reason : Text) : async { #ok : Types.ReturnRequest; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Please login to submit a return request");
    };
    // Check order exists and caller is the buyer
    switch (ordersRef.get(orderId)) {
      case (null) { return #err("Order not found") };
      case (?order) {
        if (not Principal.equal(order.buyer, caller)) {
          return #err("Unauthorized: Only the buyer can request a return");
        };
        // Check order is delivered
        switch (order.status) {
          case (#delivered) {};
          case (_) { return #err("Returns can only be requested for delivered orders") };
        };
        // Check no existing return for this order
        switch (ReturnsLib.getReturnRequestByOrder(returnRequests, orderId)) {
          case (?_) { return #err("A return request already exists for this order") };
          case (null) {};
        };
        // Create return request with unique ID based on time
        let requestId = "ret-" # Time.now().toText();
        let request = ReturnsLib.submitReturnRequest(returnRequests, requestId, orderId, caller, reason);
        // Update order status to return_requested
        let updatedOrder = { order with status = #return_requested };
        ordersRef.add(orderId, updatedOrder);
        #ok(request);
      };
    };
  };

  /// Approve a return request (admin only).
  public shared ({ caller }) func approveReturn(requestId : Text, adminComment : ?Text) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can approve return requests");
    };
    switch (returnRequests.get(requestId)) {
      case (null) { return #err("Return request not found") };
      case (?req) {
        switch (req.status) {
          case (#pending) {};
          case (_) { return #err("Only pending return requests can be approved") };
        };
        ReturnsLib.approveReturn(returnRequests, requestId, adminComment);
        // Update order status to return_approved
        switch (ordersRef.get(req.orderId)) {
          case (?order) {
            let updatedOrder = { order with status = #return_approved };
            ordersRef.add(req.orderId, updatedOrder);
          };
          case (null) {};
        };
        #ok;
      };
    };
  };

  /// Reject a return request (admin only).
  public shared ({ caller }) func rejectReturn(requestId : Text, adminComment : ?Text) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can reject return requests");
    };
    switch (returnRequests.get(requestId)) {
      case (null) { return #err("Return request not found") };
      case (?req) {
        switch (req.status) {
          case (#pending) {};
          case (_) { return #err("Only pending return requests can be rejected") };
        };
        ReturnsLib.rejectReturn(returnRequests, requestId, adminComment);
        // Update order status to return_rejected
        switch (ordersRef.get(req.orderId)) {
          case (?order) {
            let updatedOrder = { order with status = #return_rejected };
            ordersRef.add(req.orderId, updatedOrder);
          };
          case (null) {};
        };
        #ok;
      };
    };
  };

  /// Get all return requests (admin only).
  public query ({ caller }) func getAllReturnRequests() : async [Types.ReturnRequest] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all return requests");
    };
    ReturnsLib.getAllReturnRequests(returnRequests);
  };

  /// Get the caller's own return requests (buyer).
  public query ({ caller }) func getMyReturnRequests() : async [Types.ReturnRequest] {
    ReturnsLib.getMyReturnRequests(returnRequests, caller);
  };

  /// Get return request for a specific order (buyer or seller of that order, or admin).
  public query ({ caller }) func getReturnRequestByOrder(orderId : Text) : async ?Types.ReturnRequest {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    // Check if caller is buyer or seller of this order
    let hasAccess = switch (ordersRef.get(orderId)) {
      case (null) { isAdmin };
      case (?order) {
        if (Principal.equal(order.buyer, caller) or isAdmin) {
          true
        } else {
          order.items.find(func(item : { seller : Principal; productId : Text; quantity : Nat; price : Nat }) : Bool {
            Principal.equal(item.seller, caller)
          }) != null
        };
      };
    };
    if (not hasAccess) {
      Runtime.trap("Unauthorized: You do not have access to this return request");
    };
    ReturnsLib.getReturnRequestByOrder(returnRequests, orderId);
  };

  /// Seller updates order status (approved -> shipped, shipped -> delivered).
  public shared ({ caller }) func updateSellerOrderStatus(orderId : Text, newStatus : { #pending; #paid; #approved; #shipped; #delivered; #cancelled; #return_requested; #return_approved; #return_rejected }) : async { #ok; #err : Text } {
    switch (ordersRef.get(orderId)) {
      case (null) { return #err("Order not found") };
      case (?order) {
        // Check caller is a seller of at least one item in the order
        let isSeller = order.items.find(func(item : { seller : Principal; productId : Text; quantity : Nat; price : Nat }) : Bool {
          Principal.equal(item.seller, caller)
        }) != null;
        if (not isSeller) {
          return #err("Unauthorized: You are not a seller for this order");
        };
        // Validate transition: only approved->shipped or shipped->delivered
        let validTransition = switch (order.status, newStatus) {
          case (#approved, #shipped) { true };
          case (#shipped, #delivered) { true };
          case (_) { false };
        };
        if (not validTransition) {
          return #err("Invalid status transition: sellers can only move orders from approved to shipped, or shipped to delivered");
        };
        let updatedOrder = { order with status = newStatus };
        ordersRef.add(orderId, updatedOrder);
        #ok;
      };
    };
  };
};
