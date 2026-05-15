import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native"; // Importa componentes básicos de layout e interação do React Native.

import BalanceCard from "../../components/BalanceCard"; // Importa o card principal de saldo financeiro.

import CardSummaryItem from "../../components/CardSummaryItem"; // Importa o componente de resumo de cartão.

import TransactionListItem from "../../components/TransactionListItem"; // Importa o componente de item de transação.

import { useDashboard } from "../../hooks/useDashboard"; // Importa o hook responsável pelos dados da Home.

export default function Home() { // Tela principal da Home do aplicativo.

  const {
    summary,
    transactions,
    cards,
    isLoading,
    isError,
  } = useDashboard(); // Consome os dados centralizados do dashboard.

  return (
    <View className="flex-1 bg-black"> {/* Container principal da tela. */}

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5 gap-6 pb-32"
        showsVerticalScrollIndicator={false}
      >

        <Text className="text-white text-3xl font-bold"> {/* Título principal da tela. */}
          Dashboard
        </Text>

        <BalanceCard
          totalIncome={summary?.totalIncome ?? 0} // Receita total do usuário.
          totalExpenses={summary?.totalExpenses ?? 0} // Despesa total do usuário.
          balance={summary?.balance ?? 0} // Saldo final do usuário.
          isLoading={isLoading} // Estado de carregamento.
          isError={isError} // Estado de erro.
        />

        <View className="gap-4"> {/* Seção de cartões financeiros. */}

          <Text className="text-white text-xl font-semibold"> {/* Título da seção de cartões. */}
            Cartões
          </Text>

          {cards?.length ? ( // Verifica se existem cartões disponíveis.
            cards.map((card) => (
              <CardSummaryItem
                key={card.id}
                cardName={card.cardName}
                currentMonthTotal={card.currentMonthTotal}
                openInstallmentsCount={card.openInstallmentsCount}
                openInstallmentsTotal={card.openInstallmentsTotal}
                closingDay={card.closingDay}
                bestPurchaseDay={card.bestPurchaseDay}
              />
            ))
          ) : (
            <Text className="text-zinc-500"> {/* Estado vazio da seção de cartões. */}
              Nenhum cartão encontrado.
            </Text>
          )}

        </View>

        <View className="gap-4"> {/* Seção das últimas transações. */}

          <Text className="text-white text-xl font-semibold"> {/* Título da seção de transações. */}
            Últimas transações
          </Text>

          {transactions?.length ? ( // Verifica se existem transações disponíveis.
            transactions.map((transaction) => (
              <TransactionListItem
                key={transaction.id}
                title={transaction.title}
                category={transaction.category}
                date={transaction.date}
                amount={transaction.amount}
                type={transaction.type}
              />
            ))
          ) : (
            <Text className="text-zinc-500"> {/* Estado vazio da seção de transações. */}
              Nenhuma transação encontrada.
            </Text>
          )}

        </View>

      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.8} // Define opacidade ao pressionar o botão.
        className="absolute bottom-8 right-6 bg-green-500 w-16 h-16 rounded-full items-center justify-center"
      >

        <Text className="text-black text-3xl font-bold"> {/* Ícone do botão flutuante. */}
          +
        </Text>

      </TouchableOpacity>

    </View>
  );
}