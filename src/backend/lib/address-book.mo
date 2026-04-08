import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/address-book";

module {
  public type AddressMap = Map.Map<Principal, List.List<Types.SavedAddress>>;

  /// Return all saved addresses for the caller (empty list if none).
  public func getSavedAddresses(
    addressBook : AddressMap,
    caller : Principal,
  ) : [Types.SavedAddress] {
    switch (addressBook.get(caller)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  /// Add a new saved address. Maximum 5 addresses per user.
  /// Generates a UUID-like id from principal text + timestamp.
  public func addSavedAddress(
    addressBook : AddressMap,
    caller : Principal,
    address : Types.SavedAddress,
  ) : { #ok; #err : Text } {
    let list = switch (addressBook.get(caller)) {
      case (null) { List.empty<Types.SavedAddress>() };
      case (?l) { l };
    };
    if (list.size() >= 5) {
      return #err("Maximum 5 saved addresses allowed");
    };
    // Generate a unique id if not provided (or always override for safety)
    let ts = Time.now();
    let id = caller.toText() # "-" # (ts.toNat() % 1_000_000_000).toText();
    let newAddress = { address with id };
    list.add(newAddress);
    addressBook.add(caller, list);
    #ok;
  };

  /// Update an existing saved address identified by its id.
  public func updateSavedAddress(
    addressBook : AddressMap,
    caller : Principal,
    address : Types.SavedAddress,
  ) : { #ok; #err : Text } {
    switch (addressBook.get(caller)) {
      case (null) { #err("No saved addresses found") };
      case (?list) {
        let idx = list.findIndex(func(a : Types.SavedAddress) : Bool { a.id == address.id });
        switch (idx) {
          case (null) { #err("Address not found") };
          case (?i) {
            list.put(i, address);
            addressBook.add(caller, list);
            #ok;
          };
        };
      };
    };
  };

  /// Delete a saved address by id.
  public func deleteSavedAddress(
    addressBook : AddressMap,
    caller : Principal,
    addressId : Text,
  ) : { #ok; #err : Text } {
    switch (addressBook.get(caller)) {
      case (null) { #err("No saved addresses found") };
      case (?list) {
        let before = list.size();
        let filtered = list.filter(func(a : Types.SavedAddress) : Bool { a.id != addressId });
        if (filtered.size() == before) {
          return #err("Address not found");
        };
        addressBook.add(caller, filtered);
        #ok;
      };
    };
  };
};
