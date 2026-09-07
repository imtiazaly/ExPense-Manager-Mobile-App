import React, { useState, useEffect } from 'react';
import {
  Modal,
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
import { Item } from '../../types';
import { itemApi } from '../../api/itemApi';

interface Props {
  visible: boolean;
  itemToEdit?: Item | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddItemModal: React.FC<Props> = ({
  visible,
  itemToEdit,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setUnit(itemToEdit.unit || '');
      setCurrentPrice(
        itemToEdit.current_price ? itemToEdit.current_price.toString() : '',
      );
      setDescription(itemToEdit.description || '');
    } else {
      setName('');
      setUnit('');
      setCurrentPrice('');
      setDescription('');
    }
  }, [itemToEdit, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Item name is required.');
      return;
    }

    if (
      !currentPrice ||
      isNaN(Number(currentPrice)) ||
      Number(currentPrice) < 0
    ) {
      Alert.alert('Validation Error', 'Please enter a valid price.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: name.trim(),
        unit: unit.trim() || undefined,
        current_price: Number(currentPrice),
        description: description.trim() || undefined,
      };

      if (itemToEdit) {
        await itemApi.updateItem(itemToEdit.id, payload);
      } else {
        await itemApi.createItem(payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to save item.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {itemToEdit ? 'Edit Item' : 'Add New Item'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Printer Paper / Sugar"
            />

            <Text style={styles.label}>Unit (e.g. kg, pcs, box, litre)</Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={setUnit}
              placeholder="e.g. pcs / kg"
            />

            <Text style={styles.label}>Price (RS / $) *</Text>
            <TextInput
              style={styles.input}
              value={currentPrice}
              onChangeText={setCurrentPrice}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Optional details..."
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Item</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  closeBtn: { fontSize: 20, color: '#64748b', padding: 4 },
  form: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    color: '#0f172a',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#64748b', fontWeight: '600' },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { color: '#ffffff', fontWeight: '600' },
});
