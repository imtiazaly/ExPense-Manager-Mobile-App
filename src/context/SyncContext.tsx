import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from '../services/syncService';
import { WifiOff, RefreshCw } from 'lucide-react-native';

interface SyncContextType {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  triggerManualSync: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType>({} as SyncContextType);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshPendingCount = async () => {
    const queue = await syncService.getQueue();
    setPendingCount(queue.length);
  };

  const triggerManualSync = async () => {
    if (!isOnline || isSyncing) return;
    try {
      setIsSyncing(true);
      await syncService.processQueue();
      await refreshPendingCount();
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    refreshPendingCount();

    // Listen to real-time network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const onlineState =
        !!state.isConnected && !!state.isInternetReachable !== false;
      setIsOnline(onlineState);

      // Auto-Sync when internet is restored
      if (onlineState) {
        triggerManualSync();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        pendingCount,
        isSyncing,
        triggerManualSync,
        refreshPendingCount,
      }}
    >
      <View style={{ flex: 1 }}>
        {/* Offline Warning Top Banner */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <WifiOff size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.bannerText}>
              Offline Mode — Changes saved locally ({pendingCount} pending sync)
            </Text>
          </View>
        )}

        {/* Syncing Indicator Banner */}
        {isOnline && isSyncing && (
          <View style={styles.syncingBanner}>
            <RefreshCw size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.bannerText}>
              Syncing offline data with server...
            </Text>
          </View>
        )}

        {children}
      </View>
    </SyncContext.Provider>
  );
};

export const useSync = () => useContext(SyncContext);

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncingBanner: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
