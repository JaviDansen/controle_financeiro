import { Text, View } from "react-native"; // Importa os componentes básicos de texto e container do React Native.

type CardSummaryItemProps = { // Define as propriedades aceitas pelo resumo de cartão.
  cardName: string; // Nome do cartão.
  currentMonthTotal: number; // Total gasto no mês atual.
  openInstallmentsCount: number; // Quantidade de parcelas abertas.
  openInstallmentsTotal: number; // Valor total das parcelas abertas.
  closingDay: number; // Dia de fechamento da fatura.
  bestPurchaseDay: number; // Melhor dia para compra.
};

export function CardSummaryItem({ // Componente responsável por exibir o resumo financeiro de um cartão.
  cardName,
  currentMonthTotal,
  openInstallmentsCount,
  openInstallmentsTotal,
  closingDay,
  bestPurchaseDay,
}: CardSummaryItemProps) {

  function formatCurrency(value: number) { // Função responsável por formatar valores monetários simples em BRL.
    return `R$ ${value.toFixed(2).replace(".", ",")}`; // Converte número para formato monetário brasileiro.
  }

  return (
    <View
      testID="card-summary-item" // Identificador usado em testes automatizados.
      className="bg-zinc-900 rounded-3xl p-5 gap-4 w-72"
    >

      <View className="gap-1"> {/* Área principal do cartão. */}

        <Text className="text-white text-lg font-bold"> {/* Nome do cartão. */}
          {cardName}
        </Text>

        <Text className="text-green-400 text-2xl font-bold"> {/* Total gasto no mês atual. */}
          {formatCurrency(currentMonthTotal)}
        </Text>

      </View>

      <View className="gap-2"> {/* Área das informações secundárias do cartão. */}

        <Text className="text-zinc-400 text-sm"> {/* Quantidade de parcelas abertas. */}
          {openInstallmentsCount} parcelas abertas
        </Text>

        <Text className="text-zinc-400 text-sm"> {/* Valor total das parcelas abertas. */}
          Total parcelado: {formatCurrency(openInstallmentsTotal)}
        </Text>

        <Text className="text-zinc-500 text-xs"> {/* Dia de fechamento da fatura. */}
          Fecha dia {closingDay}
        </Text>

        <Text className="text-zinc-500 text-xs"> {/* Melhor dia de compra do cartão. */}
          Melhor compra dia {bestPurchaseDay}
        </Text>

      </View>

    </View>
  );
}

export default CardSummaryItem; // Exporta o componente como padrão do arquivo.