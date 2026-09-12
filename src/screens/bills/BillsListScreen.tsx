import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Bill } from '../../types';
import { billApi } from '../../api/billApi';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList, MainStackParamList } from '../../navigation/types';
import {
  Search,
  Plus,
  Receipt,
  Calendar,
  Trash2,
  User,
  Building2,
} from 'lucide-react-native';
import { showErrorSnackbar, showSuccessSnackbar } from '../../utils/snackbar';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'BillsList'>,
  NativeStackScreenProps<MainStackParamList>
>;

export const BillsListScreen: React.FC<Props> = ({ navigation }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBills = async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1 && !isRefresh) setLoading(true);

      const statusParam = selectedStatus === 'all' ? undefined : selectedStatus;
      const res = await billApi.getBills({
        search,
        status: statusParam,
        page: pageNum,
        per_page: 20,
      });

      if (pageNum === 1) {
        setBills(res.data);
      } else {
        setBills(prev => [...prev, ...res.data]);
      }

      if (res.meta) {
        setHasMore(res.meta.current_page < res.meta.last_page);
      } else {
        setHasMore(false);
      }
    } catch (error: any) {
      showErrorSnackbar('Could not load bills. Try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setPage(1);
      fetchBills(1);
    });
    return unsubscribe;
  }, [navigation, search, selectedStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchBills(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBills(nextPage);
    }
  };

  const handleDelete = async (bill: Bill) => {
    try {
      await billApi.deleteBill(bill.id);
      showSuccessSnackbar(`Bill #${bill.bill_number} deleted successfully.`);
      fetchBills(1);
    } catch (error: any) {
      showErrorSnackbar('Could not delete bill.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
            <Text style={[styles.badgeText, { color: '#15803d' }]}>PAID</Text>
          </View>
        );
      case 'unpaid':
        return (
          <View style={[styles.badge, { backgroundColor: '#fee2e2' }]}>
            <Text style={[styles.badgeText, { color: '#b91c1c' }]}>UNPAID</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
            <Text style={[styles.badgeText, { color: '#b45309' }]}>
              PENDING
            </Text>
          </View>
        );
    }
  };

  const renderBillCard = ({ item }: { item: Bill }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BillDetail', { billId: item.id })}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <View style={styles.vendorBox}>
          <Receipt size={20} color="#2563eb" style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.billNumber}>Bill #{item.bill_number}</Text>
            <View style={styles.subDetailRow}>
              <Building2 size={13} color="#64748b" style={{ marginRight: 4 }} />
              <Text style={styles.vendorName}>
                Vendor: {item.vendor?.name || 'Supplier'}
              </Text>
            </View>
          </View>
        </View>
        {getStatusBadge(item.status)}
      </View>

      <View style={styles.middleRow}>
        <View style={styles.purchaserRow}>
          <User size={13} color="#2563eb" style={{ marginRight: 4 }} />
          <Text style={styles.purchaserText}>
            Purchaser: {item.user?.name || 'Kharidar'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.dateRow}>
          <Calendar size={13} color="#64748b" style={{ marginRight: 4 }} />
          <Text style={styles.dateText}>{item.bill_date}</Text>
        </View>

        <View style={styles.rightBox}>
          <Text style={styles.amountText}>
            RS {Number(item.grand_total).toLocaleString()}
          </Text>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.deleteBtn}
          >
            <Trash2 size={16} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Search & Create Button */}
      <View style={styles.topRow}>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by bill # or vendor..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateBill')}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'paid', 'unpaid'] as const).map(st => (
          <TouchableOpacity
            key={st}
            style={[
              styles.filterPill,
              selectedStatus === st && styles.activeFilterPill,
            ]}
            onPress={() => setSelectedStatus(st)}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedStatus === st && styles.activeFilterPillText,
              ]}
            >
              {st.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bills FlatList */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={bills}
          keyExtractor={item => item.id.toString()}
          renderItem={renderBillCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={{ marginVertical: 16 }}
                color="#2563eb"
              />
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No bills found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topRow: { flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 10 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: { flex: 1, color: '#0f172a', fontSize: 14 },
  createBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  activeFilterPill: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  filterPillText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  activeFilterPillText: { color: '#ffffff' },
  listContent: { padding: 16, paddingTop: 4, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vendorBox: { flexDirection: 'row', alignItems: 'center' },
  billNumber: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  subDetailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  vendorName: { fontSize: 13, color: '#64748b' },
  middleRow: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  purchaserRow: { flexDirection: 'row', alignItems: 'center' },
  purchaserText: { fontSize: 12, fontWeight: '600', color: '#1e40af' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 12, color: '#64748b' },
  rightBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  deleteBtn: { padding: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});