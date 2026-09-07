import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export const DashboardScreen = () => {
  const { logout } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard Placeholder</Text>
      <Button title="Logout" onPress={logout} color="#dc2626" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
});
