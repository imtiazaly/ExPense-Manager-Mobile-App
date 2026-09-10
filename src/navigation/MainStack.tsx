import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { CreateBillScreen } from '../screens/bills/CreateBillScreen';
import { BillDetailScreen } from '../screens/bills/BillDetailScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateBill"
        component={CreateBillScreen}
        options={{ title: 'New Bill' }}
      />
      <Stack.Screen
        name="BillDetail"
        component={BillDetailScreen}
        options={{ title: 'Bill Details' }}
      />
    </Stack.Navigator>
  );
};