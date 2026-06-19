import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { CardsHeader } from '../../src/components/cards/CardsHeader';
import { CardsEmptyState } from '../../src/components/cards/CardsEmptyState';
import { CardsCarousel } from '../../src/components/cards/CardsCarousel';
import { CardDetailPanel } from '../../src/components/cards/CardDetailPanel';
import { CardActionsSheet } from '../../src/components/cards/CardActionsSheet';
import { CardReassignModal } from '../../src/components/cards/CardReassignModal';
import { useCards } from '../../hooks/useCards';
import { useTransactions } from '../../hooks/useTransactions';
import { useCardDeletion } from '../../hooks/useCardDeletion';
import { getCurrentMonthParam } from '../../src/lib/date';

export default function CardsScreen() {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const monthParam = getCurrentMonthParam();
  const { allCards, creditCards, isLoading } = useCards();
  const { summary } = useTransactions(monthParam);
  const deletion = useCardDeletion(allCards);

  const activeCard = allCards[activeIdx] ?? null;
  const monthIncome = summary?.income ?? 0;

  useEffect(() => {
    if (activeIdx > allCards.length - 1) setActiveIdx(0);
  }, [activeIdx, allCards.length]);

  function handleEdit() {
    setIsActionsOpen(false);
    if (activeCard) router.push({ pathname: '/(tabs)/add', params: { id: activeCard.id } });
  }

  if (isLoading) return null;

  return (
    <>
      <ScreenContainer>
        {allCards.length === 0 ? (
          <CardsEmptyState onNewPress={() => router.push('/(tabs)/add')} />
        ) : (
          <>
            <CardsHeader
              totalCards={allCards.length}
              creditCount={creditCards.total}
              onNewPress={() => router.push('/(tabs)/add')}
            />
            <CardsCarousel cards={allCards} activeIdx={activeIdx} onCardPress={setActiveIdx} />
            {activeCard && (
              <CardDetailPanel
                card={activeCard}
                monthIncome={monthIncome}
                onMorePress={() => setIsActionsOpen(true)}
              />
            )}
          </>
        )}
        <View style={{ height: 32 }} />
      </ScreenContainer>
      <CardActionsSheet
        visible={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        onEdit={handleEdit}
        onRemove={() => { setIsActionsOpen(false); if (activeCard) deletion.handleDelete(activeCard); }}
        isDeleting={deletion.isDeleting}
      />
      <CardReassignModal
        blockedTxs={deletion.blockedTxs}
        otherCards={deletion.otherCards}
        reassignTargets={deletion.reassignTargets}
        onTargetChange={(txId, target) => deletion.setReassignTargets(prev => ({ ...prev, [txId]: target }))}
        onConfirm={deletion.handleReassignConfirm}
        onCancel={deletion.handleReassignCancel}
        isPending={deletion.isReassigning}
      />
    </>
  );
}
