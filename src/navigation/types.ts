export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  BillsList: undefined;
  CreateBill: undefined;
  BillDetail: { billId: number };
  VendorsList: undefined;
  ItemsList: undefined;
  Profile: undefined;
};