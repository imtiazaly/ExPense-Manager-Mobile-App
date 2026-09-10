export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  BillsList: undefined;
  ItemsList: undefined;
  Dashboard: undefined;
  VendorsList: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  CreateBill: undefined;
  BillDetail: { billId: number };
};