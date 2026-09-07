import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Vendor, Item } from '../../types';
import { vendorApi } from '../../api/vendorApi';
import { itemApi } from '../../api/itemApi';
import { billApi } from '../../api/billApi';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react-native';

type Props = NativeStackScreenProps<MainStackParamList, 'CreateBill'>;

interface LineItemState {
  item_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const CreateBillScreen: React.FC<Props> = ({ navigation }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
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
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [vData, iData] = await Promise.all([
          vendorApi.getVendors({ active_only: true }),
          itemApi.getItems({ active_only: true }),
        ]);
        setVendors(vData);
        setAvailableItems(iData);
        if (vData.length > 0) setSelectedVendorId(vData[0].id);
      } catch (e) {
        Alert.alert('Error', 'Failed to load vendors or items.');
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

  const removeLineItem = (itemId: number) => {
    setLineItems(lineItems.filter(li => li.item_id !== itemId));
  };

  const grandTotal = lineItems.reduce((acc, curr) => acc + curr.total_price, 0);

  const handleSubmit = async () => {
    if (!selectedVendorId) {
      Alert.alert('Validation Error', 'Please select a vendor.');
      return;
    }

    if (!billNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a bill number.');
      return;
    }

    if (lineItems.length === 0) {
      Alert.alert(
        'Validation Error',
        'Please add at least one item to the bill.',
      );
      return;
    }

    try {
      setSubmitting(true);
      await billApi.createBill({
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

      Alert.alert('Success', 'Bill created successfully!');
      navigation.goBack();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create bill.';
      Alert.alert('Error', msg);
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Vendor Selector */}
        <View style={styles.card}>
          <Text style={styles.label}>Select Vendor *</Text>
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

        {/* Add Items Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Available Items (Tap to Add)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
          >
            {availableItems.map(item => (
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
        </View>

        {/* Selected Bill Line Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Selected Bill Items ({lineItems.length})
          </Text>

          {lineItems.map(item => (
            <View key={item.item_id} style={styles.lineItemRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.lineItemName}>{item.name}</Text>
                <Text style={styles.lineItemRate}>
                  @ RS {item.unit_price} each
                </Text>
              </View>

              <View style={styles.qtyBox}>
                <Text style={styles.qtyLabel}>Qty:</Text>
                <TextInput
                  style={styles.qtyInput}
                  value={item.quantity.toString()}
                  onChangeText={txt => updateQuantity(item.item_id, txt)}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.lineItemTotal}>
                RS {item.total_price.toLocaleString()}
              </Text>

              <TouchableOpacity onPress={() => removeLineItem(item.item_id)}>
                <Trash2 size={18} color="#dc2626" />
              </TouchableOpacity>
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
  content: { padding: 16, gap: 16, paddingBottom: 40 },
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
