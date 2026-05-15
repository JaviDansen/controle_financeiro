import { Text, View } from "react-native"; // Importa os componentes básicos de texto e container do React Native.

type TransactionListItemProps = { // Define as propriedades aceitas pelo componente de transação.
  title: string; // Nome principal da transação.
  category: string; // Categoria financeira da transação.
  date: string; // Data da transação.
  amount: number; // Valor monetário da transação.
  type: "income" | "expense"; // Define se é receita ou despesa.
};

export function TransactionListItem({ // Componente responsável por renderizar uma transação individual da Home.
  title,
  category,
  date,
  amount,
  type,
}: TransactionListItemProps) {

  const amountColor = type === "income" // Verifica se a transação é receita ou despesa.
    ? "text-green-400" // Cor verde para receitas.
    : "text-red-400"; // Cor vermelha para despesas.

  function formatCurrency(value: number) { // Função responsável por formatar valores monetários simples em BRL.
    return `R$ ${value.toFixed(2).replace(".", ",")}`; // Converte número para formato monetário brasileiro.
  }

  return (
    <View
      testID="transaction-item" // Identificador usado em testes automatizados.
      className="flex-row items-center justify-between bg-zinc-900 rounded-2xl p-4"
    >

      <View className="gap-1"> {/* Área textual principal da transação. */}

        <Text className="text-white font-semibold text-base"> {/* Nome da transação. */}
          {title}
        </Text>

        <Text className="text-zinc-400 text-sm"> {/* Categoria da transação. */}
          {category}
        </Text>

        <Text className="text-zinc-500 text-xs"> {/* Data da transação. */}
          {date}
        </Text>

      </View>

      <Text
        className={`font-bold text-lg ${amountColor}`} // Valor monetário com cor dinâmica.
      >
        {type === "expense" ? "-" : "+"} {/* Prefixo visual do tipo financeiro. */}
        {formatCurrency(amount)}
      </Text>

    </View>
  );
}

export default TransactionListItem; // Exporta o componente como padrão do arquivo.