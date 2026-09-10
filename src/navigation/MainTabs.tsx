import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { BillsListScreen } from '../screens/bills/BillsListScreen';
import { ItemsListScreen } from '../screens/items/ItemsListScreen';
import { VendorsListScreen } from '../screens/vendors/VendorsListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  User,
} from 'lucide-react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      {/* 1. All Bills */}
      <Tab.Screen
        name="BillsList"
        component={BillsListScreen}
        options={{
          title: 'All Bills',
          tabBarLabel: 'Bills',
          tabBarIcon: ({ color, size }) => (
            <Receipt size={size || 22} color={color} />
          ),
        }}
      />

      {/* 2. Items Catalog */}
      <Tab.Screen
        name="ItemsList"
        component={ItemsListScreen}
        options={{
          title: 'Items Catalog',
          tabBarLabel: 'Items',
          tabBarIcon: ({ color, size }) => (
            <Package size={size || 22} color={color} />
          ),
        }}
      />

      {/* 3. Dashboard (Center Curved Elevated Button) */}
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Expense Manager',
          tabBarLabel: 'Dashboard',
          tabBarButton: props => (
            <TouchableOpacity
              {...props}
              activeOpacity={0.85}
              style={styles.centerTabContainer}
            >
              <View style={styles.centerTabCircle}>
                <LayoutDashboard size={26} color="#ffffff" />
              </View>
              <Text style={styles.centerTabLabel}>Dashboard</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* 4. Vendors */}
      <Tab.Screen
        name="VendorsList"
        component={VendorsListScreen}
        options={{
          title: 'Vendors',
          tabBarLabel: 'Vendors',
          tabBarIcon: ({ color, size }) => (
            <Users size={size || 22} color={color} />
          ),
        }}
      />

      {/* 5. Profile */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size || 22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  centerTabContainer: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  centerTabCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    borderWidth: 4,
    borderColor: '#f8fafc',
  },
  centerTabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 2,
  },
});
