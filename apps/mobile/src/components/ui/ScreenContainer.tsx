import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRefreshAll } from '../../../hooks/useRefreshAll';
import { QueryKeyName } from '../../lib/queryKeys';
import { colors } from '../../theme/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  skipRefresh?: QueryKeyName[];
}

export function ScreenContainer({ children, skipRefresh }: ScreenContainerProps) {
  const { refreshing, refresh } = useRefreshAll(skipRefresh)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}
