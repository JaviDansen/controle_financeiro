import React, { useCallback, useMemo, useState, useTransition } from 'react';
import { Alert, FlatList, Platform, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { TxHeader } from '../../src/components/transactions/TxHeader';
import { TxSummaryCards } from '../../src/components/transactions/TxSummaryCards';
import { TxTabBar } from '../../src/components/transactions/TxTabBar';
import { TxListFooterHint } from '../../src/components/transactions/TxBody';
import { TxSkeletonList } from '../../src/components/transactions/TxSkeletonList';
import { TxEmptyState } from '../../src/components/transactions/TxEmptyState';
import { DateHeader, TxListRow } from '../../src/components/transactions/TxDateGroup';
import { TxDetailModal } from '../../src/components/transactions/TxDetailModal';
import { TxActionSheet } from '../../src/components/transactions/TxActionSheet';
import { useTransactions, useDeleteAllTransactions, useDeleteTransaction } from '../../hooks/useTransactions';
import { useTransactionFilter, useTransactionCounts, TabKey, TxListItem } from '../../hooks/useTransactionFilter';
import { queryKeys } from '../../src/lib/queryKeys';
import { getCurrentMonth, getCurrentMonthParam } from '../../src/lib/date';
import { Transaction } from '../../services/transactions.service';
import { colors } from '../../src/theme/colors';

export default function TransactionsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // tab: atualizado imediatamente (feedback visual do botão pressionado).
  // deferredTab: segue tab via transição — o recálculo pesado de items()
  // (filter+reduce+reduce aninhado sobre o mês inteiro) fica marcado como
  // não-urgente, então o React pinta o botão ativo antes de processar a lista
  // em vez de bloquear os dois no mesmo commit síncrono.
  const [tab, setTabImmediate] = useState<TabKey>('all');
  const [deferredTab, setDeferredTab] = useState<TabKey>('all');
  const [isPending, startTransition] = useTransition();
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [actionTx, setActionTx] = useState<Transaction | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const setTab = useCallback((next: TabKey) => {
    setTabImmediate(next);
    startTransition(() => setDeferredTab(next));
  }, []);

  const monthParam = getCurrentMonthParam();
  const { transactions, summary, isLoading } = useTransactions(monthParam);
  const counts = useTransactionCounts(transactions ?? []);
  const { items } = useTransactionFilter(transactions ?? [], deferredTab);
  const deleteMutation = useDeleteTransaction(monthParam);
  const deleteAllMutation = useDeleteAllTransactions(monthParam);

  // Pull-to-refresh desta tela invalida só o que ela mostra — não usa
  // useRefreshAll (que invalida todas as queryKeys do app) porque a maior
  // parte não é relevante para a tela de transações.
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.transactions(monthParam) });
    setRefreshing(false);
  }, [queryClient, monthParam]);

  const handlePress = useCallback((tx: Transaction) => setDetailTx(tx), []);
  const handleDelete = useCallback((tx: Transaction) => deleteMutation.mutate(tx.id), [deleteMutation]);
  const handleDeleteAll = useCallback(() => {
    if (!transactions?.length || deleteAllMutation.isPending) return;

    Alert.alert(
      'Excluir transacoes do mes',
      'Essa acao remove todas as transacoes atualmente exibidas nesta tela. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir tudo',
          style: 'destructive',
          onPress: () => {
            deleteAllMutation.mutate(undefined, {
              onSuccess: ({ deletedCount }) => {
                Alert.alert(
                  'Transacoes excluidas',
                  deletedCount === 1
                    ? '1 transacao foi removida.'
                    : `${deletedCount} transacoes foram removidas.`
                );
              },
              onError: (error) => {
                Alert.alert(
                  'Erro ao excluir',
                  error instanceof Error ? error.message : 'Nao foi possivel excluir as transacoes.'
                );
              },
            });
          },
        },
      ]
    );
  }, [transactions, deleteAllMutation]);

  const handleEdit = useCallback((tx: Transaction) => {
    setActionTx(null);
    setDetailTx(null);
    router.push({
      pathname: '/(tabs)/new-transaction',
      params: {
        txId: tx.id,
        type: tx.type,
        amount: tx.amount.toString(),
        title: tx.title,
        date: tx.date,
        categoryId: tx.categoryId,
        categoryName: tx.categoryName,
        categoryColor: tx.categoryColor,
        categoryIcon: tx.categoryIcon ?? '',
        cardId: tx.cardId ?? '',
        notes: tx.notes ?? '',
        isRecurring: tx.isRecurring ? '1' : '0',
        status: tx.status,
      },
    });
  }, [router]);

  const renderItem = useCallback(({ item }: { item: TxListItem }) => {
    if (item.kind === 'date-header') {
      return <DateHeader dateKey={item.dateKey} net={item.net} />;
    }
    return (
      <TxListRow item={item} onPressTx={handlePress} onDeleteTx={handleDelete} />
    );
  }, [handlePress, handleDelete]);

  const keyExtractor = useCallback((item: TxListItem) => item.key, []);

  // Skeleton cobre tanto o loading inicial (isLoading) quanto o intervalo em
  // que a transição de aba ainda está processando a lista pesada (isPending)
  // — dá feedback imediato ao toque em vez de a tela parecer travada.
  const showSkeleton = isLoading || isPending;

  const ListHeader = useMemo(() => (
    <View>
      <TxHeader
        currentMonth={getCurrentMonth()}
        onDeleteAll={handleDeleteAll}
        disableDeleteAll={!transactions?.length || deleteAllMutation.isPending}
      />
      <TxSummaryCards totalIn={summary?.income ?? 0} totalOut={summary?.expense ?? 0} />
      <TxTabBar tab={tab} counts={counts} onTabChange={setTab} />
      {showSkeleton && <TxSkeletonList />}
    </View>
  ), [
    counts,
    deleteAllMutation.isPending,
    handleDeleteAll,
    showSkeleton,
    summary?.expense,
    summary?.income,
    tab,
    transactions?.length,
  ]);

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <FlatList
          data={showSkeleton ? [] : items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={!showSkeleton && items.length > 0 ? <TxListFooterHint /> : null}
          ListEmptyComponent={!showSkeleton ? <TxEmptyState /> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          showsVerticalScrollIndicator={false}
          initialNumToRender={16}
          maxToRenderPerBatch={16}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      </SafeAreaView>
      <TxDetailModal tx={detailTx} onClose={() => setDetailTx(null)} onEdit={handleEdit} />
      <TxActionSheet tx={actionTx} onClose={() => setActionTx(null)} onEdit={handleEdit} />
    </>
  );
}
