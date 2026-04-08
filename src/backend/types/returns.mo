module {
  public type ReturnStatus = {
    #pending;
    #approved;
    #rejected;
  };

  public type ReturnRequest = {
    id : Text;
    orderId : Text;
    buyerId : Principal;
    reason : Text;
    status : ReturnStatus;
    timestamp : Int;
    adminComment : ?Text;
  };
};
