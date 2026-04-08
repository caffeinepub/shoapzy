import AddressBookLib "../lib/address-book";
import Types "../types/address-book";

mixin (addressBook : AddressBookLib.AddressMap) {

  /// Returns all saved addresses for the authenticated caller.
  public query ({ caller }) func getSavedAddresses() : async [Types.SavedAddress] {
    AddressBookLib.getSavedAddresses(addressBook, caller);
  };

  /// Add a new saved address (max 5 per account).
  public shared ({ caller }) func addSavedAddress(address : Types.SavedAddress) : async { #ok; #err : Text } {
    AddressBookLib.addSavedAddress(addressBook, caller, address);
  };

  /// Update an existing saved address by id.
  public shared ({ caller }) func updateSavedAddress(address : Types.SavedAddress) : async { #ok; #err : Text } {
    AddressBookLib.updateSavedAddress(addressBook, caller, address);
  };

  /// Delete a saved address by id.
  public shared ({ caller }) func deleteSavedAddress(addressId : Text) : async { #ok; #err : Text } {
    AddressBookLib.deleteSavedAddress(addressBook, caller, addressId);
  };
};
