import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const VendorsListScreen = () => (
  <View style={styles.container}>
    <Text>Vendors List Screen</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
