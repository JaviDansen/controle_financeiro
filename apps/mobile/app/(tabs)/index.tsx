import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { HomeHeader } from '../../src/components/home/HomeHeader';
import { HomeBalanceCard } from '../../src/components/home/HomeBalanceCard';
import { HomeTxList } from '../../src/components/home/HomeTxList';
import { HomeCardsCarousel } from '../../src/components/home/HomeCardsCarousel';
import { useTransactions } from '../../hooks/useTransactions';
import { useCards } from '../../hooks/useCards';
import { useAuthStore } from '../../store/auth.store';
import { getCurrentMonthParam } from '../../src/lib/date';
import { colors } from '../../src/theme/colors';

/* ─── Dashboard ──────────────────────────────────────────── */
export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const monthParam = getCurrentMonthParam();

  const { monthSummary, recentTransactions, sparkData, isLoading, isError, refetch } = useTransactions(monthParam);
  const { allCards, isLoading: cardsLoading } = useCards();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <ScreenContainer>
        <HomeHeader name={user?.name?.split(' ')[0] ?? ''} initials={initials} />

        {/* Hero card de saldo */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          {monthSummary && (
            <HomeBalanceCard
              summary={monthSummary}
              sparkData={sparkData}
              isLoading={isLoading}
              isError={isError}
              onRetry={refetch}
            />
          )}
        </View>

        {/* Últimas transações */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 22, paddingTop: 24, paddingBottom: 6,
        }}>
          <Text style={{ fontSize: 17, fontWeight: '500', color: colors.ink, letterSpacing: -0.4 }}>
            Últimas transações
          </Text>
          <Pressable onPress={() => router.push('/transactions')}>
            <Text style={{ fontSize: 13, color: colors.ink2, fontWeight: '500', textDecorationLine: 'underline' }}>
              {recentTransactions.hasMore ? `Ver todas (${recentTransactions.total})` : 'Ver todas'}
            </Text>
          </Pressable>
        </View>

        <HomeTxList items={recentTransactions.items} isLoading={isLoading} />

        {/* Cartões de crédito */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 22, paddingTop: 24, paddingBottom: 6,
        }}>
          <Text style={{ fontSize: 17, fontWeight: '500', color: colors.ink, letterSpacing: -0.4 }}>
            Meus cartões
          </Text>
          <Pressable onPress={() => router.push('/cards')}>
            <Text style={{ fontSize: 13, color: colors.ink2, fontWeight: '500', textDecorationLine: 'underline' }}>
              Ver todos
            </Text>
          </Pressable>
        </View>

        <HomeCardsCarousel
          cards={allCards}
          isLoading={cardsLoading}
          onCardTap={() => router.push('/cards')}
        />

        <View style={{ height: 32 }} />
    </ScreenContainer>
  );
}
