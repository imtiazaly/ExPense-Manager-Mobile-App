import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { SyncProvider } from './src/context/SyncContext';
import { AppNavigator } from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <SyncProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SyncProvider>
    </SafeAreaProvider>
  );
}

export default App;