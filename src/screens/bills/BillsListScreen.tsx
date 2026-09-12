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
import { Bill, Vendor, User as Purchaser } from '../../types';
import { billApi } from '../../api/billApi';
import { vendorApi } from '../../api/vendorApi';
import { authApi } from '../../api/authApi';
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
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react-native';
import { showErrorSnackbar, showSuccessSnackbar } from '../../utils/snackbar';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'BillsList'>,
  NativeStackScreenProps<MainStackParamList>
>;

type DateRangeOption = 'all' | 'today' | 'weekly' | 'monthly' | 'custom';

export const BillsListScreen: React.FC<Props> = ({ navigation }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter Drawer State
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedPurchaserId, setSelectedPurchaserId] = useState<number | null>(
    null,
  );
  const [dateRangeType, setDateRangeType] = useState<DateRangeOption>('all');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');

  // Dropdown lists
  const [vendorsList, setVendorsList] = useState<Vendor[]>([]);
  const [purchasersList, setPurchasersList] = useState<Purchaser[]>([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load initial dropdown data (Vendors & Purchasers)
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [vData, uData] = await Promise.all([
          vendorApi.getVendors({ active_only: true }),
          authApi.getUsers(),
        ]);
        setVendorsList(vData);
        setPurchasersList(uData);
      } catch (e) {
        console.log('Error loading filter dropdowns:', e);
      }
    };
    loadDropdowns();
  }, []);

  // Helper to compute date parameters based on selected preset
  const getDateParams = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateRangeType === 'today') {
      return { from_date: todayStr, to_date: todayStr };
    }
    if (dateRangeType === 'weekly') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { from_date: d.toISOString().split('T')[0], to_date: todayStr };
    }
    if (dateRangeType === 'monthly') {
      const d = new Date();
      d.setDate(1); // First day of current month
      return { from_date: d.toISOString().split('T')[0], to_date: todayStr };
    }
    if (dateRangeType === 'custom') {
      return {
        from_date: customFromDate.trim() || undefined,
        to_date: customToDate.trim() || undefined,
      };
    }
    return { from_date: undefined, to_date: undefined };
  };

  const fetchBills = async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1 && !isRefresh) setLoading(true);

      const statusParam = selectedStatus === 'all' ? undefined : selectedStatus;
      const { from_date, to_date } = getDateParams();

      const res = await billApi.getBills({
        search: search.trim() || undefined,
        status: statusParam,
        vendor_id: selectedVendorId || undefined,
        purchaser_id: selectedPurchaserId || undefined,
        from_date,
        to_date,
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
      showErrorSnackbar('Could not load bills.');
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
  }, [
    navigation,
    search,
    selectedStatus,
    selectedVendorId,
    selectedPurchaserId,
    dateRangeType,
    customFromDate,
    customToDate,
  ]);

  const resetAllFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedVendorId(null);
    setSelectedPurchaserId(null);
    setDateRangeType('all');
    setCustomFromDate('');
    setCustomToDate('');
  };

  const activeFiltersCount =
    (selectedStatus !== 'all' ? 1 : 0) +
    (selectedVendorId !== null ? 1 : 0) +
    (selectedPurchaserId !== null ? 1 : 0) +
    (dateRangeType !== 'all' ? 1 : 0) +
    (search.trim().length > 0 ? 1 : 0);

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
      {/* Top Search Bar & Create Button */}
      <View style={styles.topRow}>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bill #, vendor, purchaser..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter Drawer Toggle Button */}
        <TouchableOpacity
          style={[
            styles.filterToggleBtn,
            activeFiltersCount > 0 && styles.activeFilterToggleBtn,
          ]}
          onPress={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <Filter
            size={18}
            color={activeFiltersCount > 0 ? '#ffffff' : '#2563eb'}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateBill')}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Expandable Advanced 5-Way Multi-Filter Panel */}
      {isFilterExpanded && (
        <View style={styles.filterDrawer}>
          <View style={styles.filterDrawerHeader}>
            <Text style={styles.filterDrawerTitle}>Advanced Bill Filters</Text>
            <TouchableOpacity onPress={resetAllFilters} style={styles.resetBtn}>
              <RotateCcw size={14} color="#dc2626" style={{ marginRight: 4 }} />
              <Text style={styles.resetBtnText}>Reset All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled>
            {/* 1. Status Filter */}
            <Text style={styles.filterLabel}>1. Filter by Status</Text>
            <View style={styles.chipRow}>
              {(['all', 'pending', 'paid', 'unpaid'] as const).map(st => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.filterChip,
                    selectedStatus === st && styles.activeFilterChip,
                  ]}
                  onPress={() => setSelectedStatus(st)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedStatus === st && styles.activeFilterChipText,
                    ]}
                  >
                    {st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 2. Date Range Filter */}
            <Text style={styles.filterLabel}>2. Filter by Date</Text>
            <View style={styles.chipRow}>
              {(['all', 'today', 'weekly', 'monthly', 'custom'] as const).map(
                dt => (
                  <TouchableOpacity
                    key={dt}
                    style={[
                      styles.filterChip,
                      dateRangeType === dt && styles.activeFilterChip,
                    ]}
                    onPress={() => setDateRangeType(dt)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        dateRangeType === dt && styles.activeFilterChipText,
                      ]}
                    >
                      {dt === 'today'
                        ? 'DAILY (TODAY)'
                        : dt === 'weekly'
                        ? 'WEEKLY'
                        : dt === 'monthly'
                        ? 'MONTHLY'
                        : dt.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>

            {/* Custom Date Inputs */}
            {dateRangeType === 'custom' && (
              <View style={styles.customDateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniLabel}>From Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="2026-09-01"
                    placeholderTextColor="#94a3b8"
                    value={customFromDate}
                    onChangeText={setCustomFromDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniLabel}>To Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="2026-09-30"
                    placeholderTextColor="#94a3b8"
                    value={customToDate}
                    onChangeText={setCustomToDate}
                  />
                </View>
              </View>
            )}

            {/* 3. Purchaser Filter */}
            <Text style={styles.filterLabel}>
              3. Filter by Purchaser (Kharidar)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedPurchaserId === null && styles.activeFilterChip,
                ]}
                onPress={() => setSelectedPurchaserId(null)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedPurchaserId === null && styles.activeFilterChipText,
                  ]}
                >
                  ALL PURCHASERS
                </Text>
              </TouchableOpacity>
              {purchasersList.map(u => (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.filterChip,
                    selectedPurchaserId === u.id && styles.activeFilterChip,
                  ]}
                  onPress={() => setSelectedPurchaserId(u.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedPurchaserId === u.id &&
                        styles.activeFilterChipText,
                    ]}
                  >
                    {u.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 4. Vendor Filter */}
            <Text style={styles.filterLabel}>
              4. Filter by Vendor (Supplier)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedVendorId === null && styles.activeFilterChip,
                ]}
                onPress={() => setSelectedVendorId(null)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedVendorId === null && styles.activeFilterChipText,
                  ]}
                >
                  ALL VENDORS
                </Text>
              </TouchableOpacity>
              {vendorsList.map(v => (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.filterChip,
                    selectedVendorId === v.id && styles.activeFilterChip,
                  ]}
                  onPress={() => setSelectedVendorId(v.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedVendorId === v.id && styles.activeFilterChipText,
                    ]}
                  >
                    {v.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ScrollView>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => setIsFilterExpanded(false)}
          >
            <Text style={styles.applyBtnText}>Apply & Close Filters</Text>
          </TouchableOpacity>
        </View>
      )}

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
              <Text style={styles.emptyText}>No bills matching filters.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topRow: { flexDirection: 'row', padding: 16, paddingBottom: 10, gap: 8 },
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
  searchInput: { flex: 1, color: '#0f172a', fontSize: 13 },
  filterToggleBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeFilterToggleBtn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc2626',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCountText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  createBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Filter Drawer */
  filterDrawer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 14,
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterDrawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  filterDrawerTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  resetBtn: { flexDirection: 'row', alignItems: 'center' },
  resetBtnText: { fontSize: 12, color: '#dc2626', fontWeight: '700' },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
    marginBottom: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 4,
    marginBottom: 4,
  },
  activeFilterChip: { backgroundColor: '#2563eb' },
  filterChipText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  activeFilterChipText: { color: '#ffffff' },
  customDateRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  miniLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  dateInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 36,
    fontSize: 12,
    color: '#0f172a',
    marginTop: 2,
  },
  applyBtn: {
    backgroundColor: '#1e293b',
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  applyBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

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
