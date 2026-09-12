import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Vendor, Item, User as Purchaser } from '../../types';
import { authApi } from '../../api/authApi';
import { vendorApi } from '../../api/vendorApi';
import { itemApi } from '../../api/itemApi';
import { billApi } from '../../api/billApi';
import { useAuth } from '../../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import {
  Plus,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  User,
  PackagePlus,
  Search,
  X,
} from 'lucide-react-native';
import { showErrorSnackbar, showSuccessSnackbar } from '../../utils/snackbar';

type Props = NativeStackScreenProps<MainStackParamList, 'CreateBill'>;

interface LineItemState {
  item_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const CreateBillScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();

  // Form States
  const [purchaserName, setPurchaserName] = useState(user?.name || '');
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [billNumber, setBillNumber] = useState(
    `INV-${Date.now().toString().slice(-5)}`,
  );
  const [billDate, setBillDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [status, setStatus] = useState<'paid' | 'unpaid' | 'pending'>(
    'pending',
  );
  const [lineItems, setLineItems] = useState<LineItemState[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Data Fetching States
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState<Purchaser[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [itemSearch, setItemSearch] = useState('');

  // Collapsible Add Item Form States
  const [isAddItemExpanded, setIsAddItemExpanded] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [savingNewItem, setSavingNewItem] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [vData, iData, uData] = await Promise.all([
          vendorApi.getVendors({ active_only: true }),
          itemApi.getItems({ active_only: true }),
          authApi.getUsers(),
        ]);
        setVendors(vData);
        setAvailableItems(iData);
        setUsersList(uData);
        console.log('Fetched Users:', uData);
        if (vData.length > 0) setSelectedVendorId(vData[0].id);
      } catch (e) {
        showErrorSnackbar('Failed to load initial data.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const addLineItem = (item: Item) => {
    const existing = lineItems.find(li => li.item_id === item.id);
    if (existing) {
      setLineItems(
        lineItems.map(li =>
          li.item_id === item.id
            ? {
                ...li,
                quantity: li.quantity + 1,
                total_price: (li.quantity + 1) * li.unit_price,
              }
            : li,
        ),
      );
    } else {
      setLineItems([
        ...lineItems,
        {
          item_id: item.id,
          name: item.name,
          quantity: 1,
          unit_price: item.current_price,
          total_price: item.current_price,
        },
      ]);
    }
  };

  // Real-time catalog items filter logic
  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(itemSearch.trim().toLowerCase()),
  );

  // Auto pre-fill collapsible form with search text
  const handleQuickPreFillNewItem = () => {
    setNewItemName(itemSearch.trim());
    setIsAddItemExpanded(true);
  };

  const updateQuantity = (itemId: number, qtyStr: string) => {
    const qty = Number(qtyStr);
    setLineItems(
      lineItems.map(li => {
        if (li.item_id === itemId) {
          const validQty = isNaN(qty) || qty < 0 ? 0 : qty;
          return {
            ...li,
            quantity: validQty,
            total_price: validQty * li.unit_price,
          };
        }
        return li;
      }),
    );
  };

  const updateUnitPrice = (itemId: number, priceStr: string) => {
    const price = Number(priceStr);
    setLineItems(
      lineItems.map(li => {
        if (li.item_id === itemId) {
          const validPrice = isNaN(price) || price < 0 ? 0 : price;
          return {
            ...li,
            unit_price: validPrice,
            total_price: li.quantity * validPrice,
          };
        }
        return li;
      }),
    );
  };

  const removeLineItem = (itemId: number) => {
    setLineItems(lineItems.filter(li => li.item_id !== itemId));
  };

  // Create & Insert New Item into DB
  const handleCreateNewItem = async () => {
    if (!newItemName.trim()) {
      showErrorSnackbar('Please enter new item name.');
      return;
    }
    const priceNum = Number(newItemPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showErrorSnackbar('Please enter a valid price for the item.');
      return;
    }

    try {
      setSavingNewItem(true);
      const createdItem = await itemApi.createItem({
        name: newItemName.trim(),
        current_price: priceNum,
        unit: newItemUnit.trim() || 'pcs',
        description: newItemDescription.trim(),
      });

      // Update local available items list
      setAvailableItems(prev => [createdItem, ...prev]);

      // Automatically add newly created item to current bill
      addLineItem(createdItem);

      // Reset & Collapse Form
      setNewItemName('');
      setNewItemPrice('');
      setNewItemDescription('');
      setIsAddItemExpanded(false);

      showSuccessSnackbar(`Item "${createdItem.name}" saved & added to bill!`);
    } catch (error: any) {
      showErrorSnackbar('Failed to create new item. Try again.');
    } finally {
      setSavingNewItem(false);
    }
  };

  const grandTotal = lineItems.reduce((acc, curr) => acc + curr.total_price, 0);

  const handleSubmit = async () => {
    if (!purchaserName.trim()) {
      showErrorSnackbar('Please enter or select purchaser name.');
      return;
    }

    if (!selectedVendorId) {
      showErrorSnackbar('Please select a vendor.');
      return;
    }

    if (!billNumber.trim()) {
      showErrorSnackbar('Please enter a bill number.');
      return;
    }

    if (lineItems.length === 0) {
      showErrorSnackbar('Please add at least one item to the bill.');
      return;
    }

    try {
      setSubmitting(true);
      await billApi.createBill({
        purchaser_name: purchaserName.trim(),
        vendor_id: selectedVendorId,
        bill_number: billNumber.trim(),
        bill_date: billDate,
        status,
        items: lineItems.map(li => ({
          item_id: li.item_id,
          quantity: li.quantity,
          unit_price: li.unit_price,
        })),
      });

      showSuccessSnackbar('Bill created successfully!');
      navigation.goBack();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create bill.';
      showErrorSnackbar(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Purchaser & Vendor Section */}
        <View style={styles.card}>
          {/* Purchaser Name Input */}
          <Text style={styles.label}>Purchaser Name (Kharidar) *</Text>
          <View style={styles.inputWithIcon}>
            <User size={18} color="#64748b" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.innerInput}
              placeholder="Enter or select purchaser name"
              placeholderTextColor="#94a3b8"
              value={purchaserName}
              onChangeText={setPurchaserName}
            />
          </View>

          {/* Select Registered Purchaser Chips */}
          <View style={{ marginTop: 6 }}>
            <Text
              style={{
                fontSize: 11,
                color: '#64748b',
                fontWeight: '600',
                marginBottom: 4,
              }}
            >
              Select Registered Purchaser:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              {/* Database Users List */}
              {usersList.map(u => (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.chip,
                    purchaserName === u.name && styles.activeChip,
                  ]}
                  onPress={() => setPurchaserName(u.name)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      purchaserName === u.name && styles.activeChipText,
                    ]}
                  >
                    {u.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Vendor Selector */}
          <Text style={styles.label}>Select Vendor (Supplier) *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
          >
            {vendors.map(v => (
              <TouchableOpacity
                key={v.id}
                style={[
                  styles.chip,
                  selectedVendorId === v.id && styles.activeChip,
                ]}
                onPress={() => setSelectedVendorId(v.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedVendorId === v.id && styles.activeChipText,
                  ]}
                >
                  {v.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bill Number & Date */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Bill Number *</Text>
              <TextInput
                style={styles.input}
                value={billNumber}
                onChangeText={setBillNumber}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Bill Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={billDate}
                onChangeText={setBillDate}
              />
            </View>
          </View>

          {/* Bill Status */}
          <Text style={styles.label}>Bill Status</Text>
          <View style={styles.statusRow}>
            {(['pending', 'paid', 'unpaid'] as const).map(st => (
              <TouchableOpacity
                key={st}
                style={[
                  styles.statusOption,
                  status === st && styles.activeStatusOption,
                ]}
                onPress={() => setStatus(st)}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    status === st && styles.activeStatusOptionText,
                  ]}
                >
                  {st.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add Items Section with Real-time Search */}
        <View style={styles.card}>
          <View style={styles.headerBetween}>
            <Text style={styles.sectionTitle}>
              Catalog Items ({filteredItems.length})
            </Text>
            {itemSearch.length > 0 && (
              <TouchableOpacity onPress={() => setItemSearch('')}>
                <Text
                  style={{ fontSize: 12, color: '#dc2626', fontWeight: '600' }}
                >
                  Clear Search
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Search Input */}
          <View style={styles.inputWithIcon}>
            <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.innerInput}
              placeholder="Search items by name..."
              placeholderTextColor="#94a3b8"
              value={itemSearch}
              onChangeText={setItemSearch}
            />
            {itemSearch.length > 0 && (
              <TouchableOpacity onPress={() => setItemSearch('')}>
                <X size={16} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          {/* Catalog Items Chips */}
          {filteredItems.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              {filteredItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemChip}
                  onPress={() => addLineItem(item)}
                >
                  <Plus size={14} color="#2563eb" style={{ marginRight: 4 }} />
                  <Text style={styles.itemChipText}>{item.name}</Text>
                  <Text style={styles.itemChipPrice}>
                    RS {item.current_price}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noResultBox}>
              <Text style={styles.noResultText}>
                No item found matching "{itemSearch}"
              </Text>
              <TouchableOpacity
                style={styles.quickAddBtn}
                onPress={handleQuickPreFillNewItem}
              >
                <PackagePlus
                  size={16}
                  color="#16a34a"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.quickAddBtnText}>
                  + Add "{itemSearch}" to Catalog
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Collapsible Tab for Adding New Item */}
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setIsAddItemExpanded(!isAddItemExpanded)}
            activeOpacity={0.8}
          >
            <View style={styles.collapsibleTitleRow}>
              <PackagePlus
                size={18}
                color="#2563eb"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.collapsibleHeaderText}>
                + Item not in catalog? Add New Item
              </Text>
            </View>
            {isAddItemExpanded ? (
              <ChevronUp size={18} color="#2563eb" />
            ) : (
              <ChevronDown size={18} color="#2563eb" />
            )}
          </TouchableOpacity>

          {isAddItemExpanded && (
            <View style={styles.collapsibleForm}>
              <Text style={styles.formSubTitle}>
                Create & Insert New Item into Database
              </Text>

              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Cement Bag, Steel Rod"
                placeholderTextColor="#94a3b8"
                value={newItemName}
                onChangeText={setNewItemName}
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Price / Rate (RS) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 1200"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={newItemPrice}
                    onChangeText={setNewItemPrice}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="pcs / kg / box"
                    placeholderTextColor="#94a3b8"
                    value={newItemUnit}
                    onChangeText={setNewItemUnit}
                  />
                </View>
              </View>

              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Item specification..."
                placeholderTextColor="#94a3b8"
                value={newItemDescription}
                onChangeText={setNewItemDescription}
              />

              <TouchableOpacity
                style={styles.saveItemBtn}
                onPress={handleCreateNewItem}
                disabled={savingNewItem}
              >
                {savingNewItem ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveItemBtnText}>
                    Save Item & Add to Bill
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Selected Bill Line Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Selected Bill Items ({lineItems.length})
          </Text>

          {lineItems.map(item => (
            <View key={item.item_id} style={styles.lineItemRow}>
              {/* Item Name */}
              <View style={{ flex: 1.3 }}>
                <Text style={styles.lineItemName}>{item.name}</Text>
              </View>

              {/* Editable Rate / Price */}
              <View style={styles.qtyBox}>
                <Text style={styles.qtyLabel}>Rate:</Text>
                <TextInput
                  style={styles.rateInput}
                  value={item.unit_price.toString()}
                  onChangeText={txt => updateUnitPrice(item.item_id, txt)}
                  keyboardType="numeric"
                />
              </View>

              {/* Editable Quantity */}
              <View style={styles.qtyBox}>
                <Text style={styles.qtyLabel}>Qty:</Text>
                <TextInput
                  style={styles.qtyInput}
                  value={item.quantity.toString()}
                  onChangeText={txt => updateQuantity(item.item_id, txt)}
                  keyboardType="numeric"
                />
              </View>

              {/* Item Total & Delete */}
              <View style={styles.rowRightBox}>
                <Text style={styles.lineItemTotal}>
                  RS {item.total_price.toLocaleString()}
                </Text>
                <TouchableOpacity onPress={() => removeLineItem(item.item_id)}>
                  <Trash2 size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Grand Total:</Text>
            <Text style={styles.totalAmount}>
              RS {grandTotal.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <CheckCircle2 size={20} color="#ffffff" />
              <Text style={styles.submitBtnText}>Save & Create Bill</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 16, paddingBottom: 160 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginTop: 4 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    color: '#0f172a',
    marginTop: 4,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 4,
  },
  innerInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
  },
  chipRow: { flexDirection: 'row', marginTop: 4 },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  activeMiniChip: { backgroundColor: '#dbeafe' },
  miniChipText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  activeMiniChipText: { color: '#1e40af' },
  row: { flexDirection: 'row', gap: 12 },
  horizontalScroll: { flexDirection: 'row', marginVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  activeChip: { backgroundColor: '#2563eb' },
  chipText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  activeChipText: { color: '#ffffff' },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  activeStatusOption: { backgroundColor: '#1e293b' },
  statusOptionText: { color: '#64748b', fontWeight: '700', fontSize: 12 },
  activeStatusOptionText: { color: '#ffffff' },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginRight: 8,
  },
  itemChipText: { fontWeight: '600', color: '#1e40af', fontSize: 13 },
  itemChipPrice: { color: '#3b82f6', fontSize: 12, marginLeft: 6 },

  headerBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noResultBox: {
    padding: 14,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  noResultText: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '600',
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  quickAddBtnText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 13,
  },

  /* Collapsible Add Item Form */
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  collapsibleTitleRow: { flexDirection: 'row', alignItems: 'center' },
  collapsibleHeaderText: { fontSize: 14, fontWeight: '700', color: '#0369a1' },
  collapsibleForm: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  formSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
  },
  saveItemBtn: {
    backgroundColor: '#16a34a',
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveItemBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },

  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 8,
  },
  lineItemName: { fontWeight: '700', color: '#1e293b', fontSize: 14 },
  lineItemRate: { fontSize: 12, color: '#64748b' },
  rateInput: {
    width: 60,
    height: 34,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    textAlign: 'center',
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  rowRightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyLabel: { fontSize: 12, color: '#64748b' },
  qtyInput: {
    width: 40,
    height: 34,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    textAlign: 'center',
    color: '#0f172a',
    fontSize: 13,
  },
  lineItemTotal: { fontWeight: '700', color: '#0f172a', fontSize: 14 },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  totalAmount: { fontSize: 20, fontWeight: '800', color: '#2563eb' },
  submitBtn: {
    backgroundColor: '#2563eb',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
