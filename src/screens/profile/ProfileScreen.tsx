import React, { useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as UserIcon, Building2, Lock, LogOut } from 'lucide-react-native';

export const ProfileScreen = () => {
  const { user, setUser, logout } = useAuth();

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bankName, setBankName] = useState(user?.bank_name || '');
  const [accountTitle, setAccountTitle] = useState(user?.account_title || '');
  const [accountNumber, setAccountNumber] = useState(
    user?.account_number || '',
  );
  const [iban, setIban] = useState(user?.iban || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async () => {
    try {
      setSavingProfile(true);
      const res = await authApi.updateProfile({
        name,
        email,
        phone,
        bank_name: bankName,
        account_title: accountTitle,
        account_number: accountNumber,
        iban,
      });

      setUser(res.user);
      await AsyncStorage.setItem('user_data', JSON.stringify(res.user));
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in current and new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await authApi.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      Alert.alert('Success', res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to change password';
      Alert.alert('Error', msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* User Info Header */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <UserIcon size={20} color="#2563eb" />
            <Text style={styles.cardTitle}>Personal Details</Text>
          </View>

          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="e.g. +92 300 1234567"
          />
        </View>

        {/* Bank Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Building2 size={20} color="#2563eb" />
            <Text style={styles.cardTitle}>Bank Account Details</Text>
          </View>

          <Text style={styles.label}>Bank Name</Text>
          <TextInput
            style={styles.input}
            value={bankName}
            onChangeText={setBankName}
            placeholder="e.g. Meezan Bank"
          />

          <Text style={styles.label}>Account Title</Text>
          <TextInput
            style={styles.input}
            value={accountTitle}
            onChangeText={setAccountTitle}
            placeholder="e.g. Imtiaz Ali"
          />

          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="Account / Card Number"
          />

          <Text style={styles.label}>IBAN</Text>
          <TextInput
            style={styles.input}
            value={iban}
            onChangeText={setIban}
            placeholder="PK36 MEZN 0000..."
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleUpdateProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Save Profile Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Security / Password Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Lock size={20} color="#2563eb" />
            <Text style={styles.cardTitle}>Security & Password</Text>
          </View>

          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />

          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleChangePassword}
            disabled={savingPassword}
          >
            {savingPassword ? (
              <ActivityIndicator color="#1e293b" />
            ) : (
              <Text style={styles.secondaryButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color="#ffffff" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout Account</Text>
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
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
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  secondaryButtonText: { color: '#1e293b', fontSize: 15, fontWeight: '600' },
  logoutButton: {
    backgroundColor: '#dc2626',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  logoutIcon: { marginRight: 8 },
  logoutText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
