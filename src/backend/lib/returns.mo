import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/returns";

module {
  public type ReturnRequest = Types.ReturnRequest;
  public type ReturnStatus = Types.ReturnStatus;

  /// Submit a return request for a delivered order.
  /// Only the buyer of the order can call this. One request per order.
  public func submitReturnRequest(
    returnRequests : Map.Map<Text, ReturnRequest>,
    requestId : Text,
    orderId : Text,
    buyerId : Principal,
    reason : Text,
  ) : ReturnRequest {
    let request : ReturnRequest = {
      id = requestId;
      orderId;
      buyerId;
      reason;
      status = #pending;
      timestamp = Time.now();
      adminComment = null;
    };
    returnRequests.add(requestId, request);
    request;
  };

  /// Approve a return request (admin only).
  public func approveReturn(
    returnRequests : Map.Map<Text, ReturnRequest>,
    requestId : Text,
    adminComment : ?Text,
  ) : () {
    switch (returnRequests.get(requestId)) {
      case (null) { Runtime.trap("Return request not found") };
      case (?req) {
        let updated : ReturnRequest = { req with status = #approved; adminComment };
        returnRequests.add(requestId, updated);
      };
    };
  };

  /// Reject a return request (admin only).
  public func rejectReturn(
    returnRequests : Map.Map<Text, ReturnRequest>,
    requestId : Text,
    adminComment : ?Text,
  ) : () {
    switch (returnRequests.get(requestId)) {
      case (null) { Runtime.trap("Return request not found") };
      case (?req) {
        let updated : ReturnRequest = { req with status = #rejected; adminComment };
        returnRequests.add(requestId, updated);
      };
    };
  };

  /// Get all return requests (admin only).
  public func getAllReturnRequests(
    returnRequests : Map.Map<Text, ReturnRequest>,
  ) : [ReturnRequest] {
    returnRequests.values().toArray();
  };

  /// Get return requests for a specific buyer.
  public func getMyReturnRequests(
    returnRequests : Map.Map<Text, ReturnRequest>,
    buyerId : Principal,
  ) : [ReturnRequest] {
    returnRequests.values().toArray().filter(func(r : ReturnRequest) : Bool {
      Principal.equal(r.buyerId, buyerId)
    });
  };

  /// Get return request for a specific order.
  public func getReturnRequestByOrder(
    returnRequests : Map.Map<Text, ReturnRequest>,
    orderId : Text,
  ) : ?ReturnRequest {
    returnRequests.values().toArray().find(func(r : ReturnRequest) : Bool {
      r.orderId == orderId
    });
  };
};
