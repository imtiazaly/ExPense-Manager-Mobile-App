import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Keyboard,
} from 'react-native';
import { Bill } from '../../types';
import { billApi } from '../../api/billApi';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList, MainStackParamList } from '../../navigation/types';
import { Search, Plus, Receipt, Calendar, Trash2 } from 'lucide-react-native';

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
      console.log('Error fetching bills:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchBills(1);
  }, [search, selectedStatus]);

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

  const handleDelete = (bill: Bill) => {
    Alert.alert(
      'Delete Bill',
      `Are you sure you want to delete Bill #${bill.bill_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await billApi.deleteBill(bill.id);
              fetchBills(1);
            } catch (error: any) {
              Alert.alert('Error', 'Could not delete bill.');
            }
          },
        },
      ],
    );
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
    >
      <View style={styles.cardTop}>
        <View style={styles.vendorBox}>
          <Receipt size={18} color="#2563eb" style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.vendorName}>
              {item.vendor?.name || 'Unknown Vendor'}
            </Text>
            <Text style={styles.billNumber}>#{item.bill_number}</Text>
          </View>
        </View>
        {getStatusBadge(item.status)}
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.dateRow}>
          <Calendar size={14} color="#64748b" style={{ marginRight: 4 }} />
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
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by vendor or bill #..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {['all', 'paid', 'unpaid', 'pending'].map(st => (
          <TouchableOpacity
            key={st}
            style={[styles.tab, selectedStatus === st && styles.activeTab]}
            onPress={() => setSelectedStatus(st)}
          >
            <Text
              style={[
                styles.tabText,
                selectedStatus === st && styles.activeTabText,
              ]}
            >
              {st.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bills List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={bills}
          keyExtractor={item => item.id.toString()}
          renderItem={renderBillCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: keyboardHeight + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No bills found</Text>
            </View>
          }
        />
      )}

      {/* Floating Add Bill Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateBill')}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 46,
  },
  searchInput: { flex: 1, color: '#0f172a', fontSize: 15 },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  activeTab: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  activeTabText: { color: '#ffffff' },
  listContent: { paddingHorizontal: 16, gap: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendorBox: { flexDirection: 'row', alignItems: 'center' },
  vendorName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  billNumber: { fontSize: 12, color: '#64748b' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 13, color: '#64748b' },
  rightBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amountText: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  deleteBtn: { padding: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyText: { color: '#94a3b8', fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});