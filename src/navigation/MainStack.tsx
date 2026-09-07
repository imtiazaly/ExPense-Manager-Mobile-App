import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { BillsListScreen } from '../screens/bills/BillsListScreen';
import { CreateBillScreen } from '../screens/bills/CreateBillScreen';
import { VendorsListScreen } from '../screens/vendors/VendorsListScreen';
import { ItemsListScreen } from '../screens/items/ItemsListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Expense Manager' }}
      />
      <Stack.Screen
        name="BillsList"
        component={BillsListScreen}
        options={{ title: 'All Bills' }}
      />
      <Stack.Screen
        name="CreateBill"
        component={CreateBillScreen}
        options={{ title: 'New Bill' }}
      />
      <Stack.Screen
        name="VendorsList"
        component={VendorsListScreen}
        options={{ title: 'Vendors' }}
      />
      <Stack.Screen
        name="ItemsList"
        component={ItemsListScreen}
        options={{ title: 'Items Catalog' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
    </Stack.Navigator>
  );
};
