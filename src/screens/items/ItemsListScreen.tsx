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
import { Item } from '../../types';
import { itemApi } from '../../api/itemApi';
import { AddItemModal } from './AddItemModal';
import { Search, Plus, Package, Edit3, Trash2, Tag } from 'lucide-react-native';

export const ItemsListScreen = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
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

  const fetchItems = async (query = '') => {
    try {
      const data = await itemApi.getItems({ search: query });
      setItems(data);
    } catch (error: any) {
      console.log('Error fetching items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems(search);
  }, [search]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems(search);
  };

  const handleDelete = (item: Item) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await itemApi.deleteItem(item.id);
              fetchItems(search);
            } catch (error: any) {
              Alert.alert('Error', 'Could not delete item.');
            }
          },
        },
      ],
    );
  };

  const renderItemCard = ({ item }: { item: Item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.titleRow}>
          <Package size={20} color="#2563eb" style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.unit && (
              <Text style={styles.unitBadge}>Unit: {item.unit}</Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              setEditingItem(item);
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

      <View style={styles.priceRow}>
        <View style={styles.priceTag}>
          <Tag size={14} color="#16a34a" />
          <Text style={styles.priceText}>
            RS {Number(item.current_price).toLocaleString()}
          </Text>
        </View>

        {item.average_price && (
          <Text style={styles.avgPriceText}>
            Avg: RS {Number(item.average_price).toLocaleString()}
          </Text>
        )}
      </View>

      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
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
          placeholder="Search items catalog..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Items List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItemCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: keyboardHeight + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          }
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingItem(null);
          setModalVisible(true);
        }}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Modal */}
      <AddItemModal
        visible={modalVisible}
        itemToEdit={editingItem}
        onClose={() => setModalVisible(false)}
        onSuccess={() => fetchItems(search)}
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
  listContent: { paddingHorizontal: 16, gap: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  itemName: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  unitBadge: { fontSize: 12, color: '#64748b', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: { color: '#166534', fontWeight: '700', fontSize: 15 },
  avgPriceText: { fontSize: 13, color: '#64748b' },
  description: { fontSize: 13, color: '#64748b', marginTop: 2 },
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
