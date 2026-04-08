module {
  public type AddressLabel = { #home; #office; #other };

  public type SavedAddress = {
    id : Text;
    tag : AddressLabel;
    name : Text;
    phone : Text;
    street : Text;
    city : Text;
    state : Text;
    pincode : Text;
  };
};
