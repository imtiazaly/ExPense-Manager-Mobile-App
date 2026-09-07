import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { billApi } from '../../api/billApi';
import { Bill } from '../../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import {
  Users,
  Package,
  Receipt,
  PlusCircle,
  UserCheck,
  LogOut,
  TrendingUp,
  Clock,
  ChevronRight,
} from 'lucide-react-native';

type Props = NativeStackScreenProps<MainStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [totalBillsCount, setTotalBillsCount] = useState<number>(0);
  const [pendingBillsCount, setPendingBillsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadDashboardData = async () => {
    try {
      const res = await billApi.getBills({ per_page: 100 });
      const bills = res.data || [];

      setTotalBillsCount(res.meta?.total || bills.length);
      setRecentBills(bills.slice(0, 4));

      // Calculate Totals
      const totalSum = bills.reduce(
        (acc, curr) => acc + Number(curr.grand_total),
        0,
      );
      setTotalExpense(totalSum);

      const pendingCount = bills.filter(
        b => b.status === 'pending' || b.status === 'unpaid',
      ).length;
      setPendingBillsCount(pendingCount);
    } catch (error) {
      console.log('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Financial Overview Cards */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
          ]}
        >
          <TrendingUp size={22} color="#2563eb" style={{ marginBottom: 8 }} />
          <Text style={styles.statLabel}>Total Expense</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Text style={styles.statValue}>
              RS {totalExpense.toLocaleString()}
            </Text>
          )}
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
          ]}
        >
          <Clock size={22} color="#d97706" style={{ marginBottom: 8 }} />
          <Text style={styles.statLabel}>Pending Bills</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#d97706" />
          ) : (
            <Text style={styles.statValue}>{pendingBillsCount} Bills</Text>
          )}
        </View>
      </View>

      {/* Quick Actions Title */}
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
          <Text style={styles.cardTitle}>All Bills ({totalBillsCount})</Text>
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

      {/* Recent Bills Section */}
      <View style={styles.headerBetween}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <TouchableOpacity onPress={() => navigation.navigate('BillsList')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentSection}>
        {recentBills.length > 0 ? (
          recentBills.map(bill => (
            <TouchableOpacity
              key={bill.id}
              style={styles.recentRow}
              onPress={() =>
                navigation.navigate('BillDetail', { billId: bill.id })
              }
            >
              <View style={styles.recentLeft}>
                <Receipt
                  size={20}
                  color="#2563eb"
                  style={{ marginRight: 10 }}
                />
                <View>
                  <Text style={styles.recentVendor}>
                    {bill.vendor?.name || 'Vendor'}
                  </Text>
                  <Text style={styles.recentDate}>
                    #{bill.bill_number} • {bill.bill_date}
                  </Text>
                </View>
              </View>
              <View style={styles.recentRight}>
                <Text style={styles.recentAmount}>
                  RS {Number(bill.grand_total).toLocaleString()}
                </Text>
                <ChevronRight size={18} color="#94a3b8" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No recent bills created yet.</Text>
          </View>
        )}
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
          <ChevronRight size={20} color="#94a3b8" />
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
  content: { padding: 16, gap: 16, paddingBottom: 40 },
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
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  statLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  headerBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  seeAllText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
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
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  recentSection: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  recentLeft: { flexDirection: 'row', alignItems: 'center' },
  recentVendor: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  recentDate: { fontSize: 12, color: '#64748b', marginTop: 2 },
  recentRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recentAmount: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  emptyBox: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
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
