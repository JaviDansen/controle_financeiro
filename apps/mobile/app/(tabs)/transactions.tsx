import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { TxHeader } from '../../src/components/transactions/TxHeader';
import { TxSummaryCards } from '../../src/components/transactions/TxSummaryCards';
import { TxTabBar } from '../../src/components/transactions/TxTabBar';
import { TxBody } from '../../src/components/transactions/TxBody';
import { TxDetailModal } from '../../src/components/transactions/TxDetailModal';
import { TxActionSheet } from '../../src/components/transactions/TxActionSheet';
import { useTransactions, useDeleteTransaction } from '../../hooks/useTransactions';
import { useTransactionFilter, TabKey } from '../../hooks/useTransactionFilter';
import { getCurrentMonth, getCurrentMonthParam } from '../../src/lib/date';
import { Transaction } from '../../services/transactions.service';

export default function TransactionsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('all');
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [actionTx, setActionTx] = useState<Transaction | null>(null);

  const monthParam = getCurrentMonthParam();
  const { transactions, summary, isLoading } = useTransactions(monthParam);
  const { groups, dateKeys, counts } = useTransactionFilter(transactions ?? [], tab);
  const deleteMutation = useDeleteTransaction(monthParam);

  function handleEdit(tx: Transaction) {
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
  }

  return (
    <>
      <ScreenContainer>
        <TxHeader currentMonth={getCurrentMonth()} />
        <TxSummaryCards totalIn={summary?.income ?? 0} totalOut={summary?.expense ?? 0} />
        <TxTabBar tab={tab} counts={counts} onTabChange={setTab} />
        <TxBody
          isLoading={isLoading}
          dateKeys={dateKeys}
          groups={groups}
          onPress={setDetailTx}
          onDelete={(tx) => deleteMutation.mutate(tx.id)}
        />
      </ScreenContainer>
      <TxDetailModal tx={detailTx} onClose={() => setDetailTx(null)} onEdit={handleEdit} />
      <TxActionSheet tx={actionTx} onClose={() => setActionTx(null)} onEdit={handleEdit} />
    </>
  );
}
