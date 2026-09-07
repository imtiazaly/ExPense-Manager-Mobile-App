import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Bill } from '../../types';
import { billApi } from '../../api/billApi';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import {
  Receipt,
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Trash2,
} from 'lucide-react-native';

type Props = NativeStackScreenProps<MainStackParamList, 'BillDetail'>;

export const BillDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { billId } = route.params;
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBillDetails = async () => {
    try {
      setLoading(true);
      const data = await billApi.getBillDetails(billId);
      setBill(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load bill details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillDetails();
  }, [billId]);

  const handleDelete = () => {
    if (!bill) return;
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
              navigation.goBack();
            } catch (e) {
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

  if (loading || !bill) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Bill Header Card */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconTitle}>
            <Receipt size={24} color="#2563eb" style={{ marginRight: 8 }} />
            <Text style={styles.billNumber}>Bill #{bill.bill_number}</Text>
          </View>
          {getStatusBadge(bill.status)}
        </View>

        <View style={styles.dateRow}>
          <Calendar size={16} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={styles.dateText}>Date: {bill.bill_date}</Text>
        </View>
      </View>

      {/* Vendor Details Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Vendor Information</Text>
        {bill.vendor ? (
          <View style={styles.vendorDetails}>
            <View style={styles.infoRow}>
              <User size={16} color="#64748b" />
              <Text style={styles.vendorName}>{bill.vendor.name}</Text>
            </View>

            {bill.vendor.phone && (
              <View style={styles.infoRow}>
                <Phone size={14} color="#64748b" />
                <Text style={styles.infoText}>{bill.vendor.phone}</Text>
              </View>
            )}

            {bill.vendor.email && (
              <View style={styles.infoRow}>
                <Mail size={14} color="#64748b" />
                <Text style={styles.infoText}>{bill.vendor.email}</Text>
              </View>
            )}

            {bill.vendor.address && (
              <View style={styles.infoRow}>
                <MapPin size={14} color="#64748b" />
                <Text style={styles.infoText}>{bill.vendor.address}</Text>
              </View>
            )}

            {/* Bank details if available */}
            {bill.vendor.bank_name && (
              <View style={styles.bankBox}>
                <Building2
                  size={16}
                  color="#2563eb"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.bankText}>
                  {bill.vendor.bank_name} - {bill.vendor.account_number} (
                  {bill.vendor.account_title})
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.infoText}>No Vendor Details</Text>
        )}
      </View>

      {/* Bill Items List Table */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bill Line Items</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>Item</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Rate</Text>
          <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>
            Total
          </Text>
        </View>

        {bill.items && bill.items.length > 0 ? (
          bill.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 2, fontWeight: '600' }]}>
                {item.item?.name || `Item #${item.item_id}`}
              </Text>
              <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>
                {Number(item.unit_price).toLocaleString()}
              </Text>
              <Text
                style={[
                  styles.td,
                  { flex: 1.2, textAlign: 'right', fontWeight: '700' },
                ]}
              >
                {Number(item.total_price).toLocaleString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.infoText}>No items found in this bill.</Text>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand Total:</Text>
          <Text style={styles.totalAmount}>
            RS {Number(bill.grand_total).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Delete Action Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Trash2 size={20} color="#dc2626" style={{ marginRight: 8 }} />
        <Text style={styles.deleteText}>Delete Bill Record</Text>
      </TouchableOpacity>
    </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconTitle: { flexDirection: 'row', alignItems: 'center' },
  billNumber: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dateText: { fontSize: 14, color: '#64748b' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  vendorDetails: { gap: 8, marginTop: 4 },
  vendorName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: '#64748b' },
  bankBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  bankText: { color: '#1e40af', fontSize: 13, fontWeight: '600' },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 8,
    marginTop: 4,
  },
  th: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
    alignItems: 'center',
  },
  td: { fontSize: 13, color: '#1e293b' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  totalAmount: { fontSize: 22, fontWeight: '800', color: '#2563eb' },
  deleteButton: {
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
  deleteText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
