import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import {
  Users,
  Package,
  Receipt,
  PlusCircle,
  UserCheck,
  LogOut,
} from 'lucide-react-native';

type Props = NativeStackScreenProps<MainStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      {/* Navigation Grid */}
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('CreateBill')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#dbeafe' }]}>
            <PlusCircle size={24} color="#2563eb" />
          </View>
          <Text style={styles.cardTitle}>New Bill</Text>
          <Text style={styles.cardSub}>Create expense bill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('BillsList')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
            <Receipt size={24} color="#d97706" />
          </View>
          <Text style={styles.cardTitle}>All Bills</Text>
          <Text style={styles.cardSub}>Manage expenses</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('VendorsList')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
            <Users size={24} color="#16a34a" />
          </View>
          <Text style={styles.cardTitle}>Vendors</Text>
          <Text style={styles.cardSub}>Suppliers list</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('ItemsList')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
            <Package size={24} color="#9333ea" />
          </View>
          <Text style={styles.cardTitle}>Items</Text>
          <Text style={styles.cardSub}>Products catalog</Text>
        </TouchableOpacity>
      </View>

      {/* Account Settings & Profile */}
      <View style={styles.accountSection}>
        <TouchableOpacity
          style={styles.listRow}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.rowLeft}>
            <UserCheck size={20} color="#2563eb" />
            <Text style={styles.rowText}>My Profile & Bank Details</Text>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <LogOut size={20} color="#dc2626" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 16 },
  welcomeBanner: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
  },
  greeting: { color: '#94a3b8', fontSize: 14 },
  userName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  userEmail: { color: '#cbd5e1', fontSize: 13, marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  accountSection: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  rowArrow: { fontSize: 20, color: '#94a3b8' },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginTop: 8,
  },
  logoutText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
});