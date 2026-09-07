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
} from 'react-native';
import { Vendor } from '../../types';
import { vendorApi } from '../../api/vendorApi';
import { AddVendorModal } from './AddVendorModal';
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Edit3,
  Trash2,
} from 'lucide-react-native';

export const VendorsListScreen = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const fetchVendors = async (query = '') => {
    try {
      const data = await vendorApi.getVendors({ search: query });
      setVendors(data);
    } catch (error: any) {
      console.log('Error fetching vendors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVendors(search);
  }, [search]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVendors(search);
  };

  const handleDelete = (vendor: Vendor) => {
    Alert.alert(
      'Delete Vendor',
      `Are you sure you want to delete ${vendor.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await vendorApi.deleteVendor(vendor.id);
              fetchVendors(search);
            } catch (error: any) {
              Alert.alert('Error', 'Could not delete vendor.');
            }
          },
        },
      ],
    );
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.vendorName}>{item.name}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              setEditingVendor(item);
              setModalVisible(true);
            }}
          >
            <Edit3 size={18} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={18} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>

      {item.phone && (
        <View style={styles.infoRow}>
          <Phone size={14} color="#64748b" />
          <Text style={styles.infoText}>{item.phone}</Text>
        </View>
      )}

      {item.email && (
        <View style={styles.infoRow}>
          <Mail size={14} color="#64748b" />
          <Text style={styles.infoText}>{item.email}</Text>
        </View>
      )}

      {item.address && (
        <View style={styles.infoRow}>
          <MapPin size={14} color="#64748b" />
          <Text style={styles.infoText}>{item.address}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Vendors List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={item => item.id.toString()}
          renderItem={renderVendorItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No vendors found</Text>
            </View>
          }
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingVendor(null);
          setModalVisible(true);
        }}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Modal */}
      <AddVendorModal
        visible={modalVisible}
        vendorToEdit={editingVendor}
        onClose={() => setModalVisible(false)}
        onSuccess={() => fetchVendors(search)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 46,
  },
  searchInput: { flex: 1, color: '#0f172a', fontSize: 15 },
  listContent: { paddingHorizontal: 16, paddingBottom: 80, gap: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendorName: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  actions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: '#64748b' },
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
