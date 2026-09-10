import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { SyncProvider } from './context/SyncContext';
import { AppNavigator } from './navigation/AppNavigator';
import { StatusBar } from 'react-native';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SyncProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SyncProvider>
    </SafeAreaProvider>
  );
}

export default App;
