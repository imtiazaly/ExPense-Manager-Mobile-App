import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ItemsListScreen = () => (
  <View style={styles.container}>
    <Text>Items List Screen</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
