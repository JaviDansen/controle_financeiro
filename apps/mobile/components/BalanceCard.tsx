import { Text, View } from "react-native"; // Importa os componentes base de texto e container do React Native.

import SkeletonLoader from "./SkeletonLoader"; // Importa o componente reutilizável de skeleton loading.

type BalanceCardProps = { // Define as propriedades aceitas pelo BalanceCard.
    totalIncome: number; // Total de receitas do usuário.
    totalExpenses: number; // Total de despesas do usuário.
    balance: number; // Saldo final do usuário.
    isLoading?: boolean; // Define se o card está carregando.
    isError?: boolean; // Define se ocorreu algum erro no carregamento.
};

export function BalanceCard({ // Componente responsável por exibir o resumo financeiro principal da Home.
  totalIncome,
  totalExpenses,
  balance,
  isLoading = false,
  isError = false,
}: BalanceCardProps) {
    if (isLoading) { // Verifica se o componente ainda está carregando os dados.
        return (
            <View className="bg-zinc-900 rounded-3xl p-6 gap-4"> {/* Container principal do skeleton do card. */}
                <SkeletonLoader className="h-5 w-32" /> {/* Skeleton do título. */}

                <SkeletonLoader className="h-10 w-40" /> {/* Skeleton do saldo principal. */}

                <View className="flex-row justify-between mt-4"> {/* Área inferior do resumo financeiro. */}
                    <View className="gap-2"> {/* Coluna das receitas. */}
                        <SkeletonLoader className="h-4 w-20" /> {/* Skeleton label receita. */}
                        <SkeletonLoader className="h-6 w-24" /> {/* Skeleton valor receita. */}
                    </View>

                    <View className="gap-2"> {/* Coluna das despesas. */}
                        <SkeletonLoader className="h-4 w-20" /> {/* Skeleton label despesa. */}
                        <SkeletonLoader className="h-6 w-24" /> {/* Skeleton valor despesa. */}
                    </View>
                </View>
            </View>
        );
    }
    if (isError) { // Verifica se ocorreu erro ao carregar os dados.
        return (
            <View className="bg-red-100 border border-red-300 rounded-3xl p-6"> {/* Container de erro. */}
                <Text className="text-red-600 font-medium"> {/* Texto do erro exibido ao usuário. */}
                    Erro ao carregar resumo financeiro.
                </Text>
            </View>
        );
    }
    const balanceColor = balance >= 0 ? "text-green-400" : "text-red-400";

    return (
        <View className="bg-zinc-900 rounded-3xl p-6 gap-4"> {/* Container principal do card financeiro. */}

            <Text className="text-zinc-400 text-sm"> {/* Texto pequeno indicando o contexto do valor principal. */}
                Saldo atual
            </Text>

            <Text className={`text-4xl font-bold ${balanceColor}`}> {/* Valor principal do saldo com cor dinâmica. */}
                R$ {balance.toFixed(2)}
            </Text>

            <View className="flex-row justify-between mt-4"> {/* Área inferior contendo receitas e despesas. */}

                <View className="gap-1"> {/* Coluna de receitas. */}
                    <Text className="text-zinc-400 text-sm"> {/* Label das receitas. */}
                        Receitas
                    </Text>

                    <Text className="text-green-400 font-semibold text-lg"> {/* Valor das receitas. */}
                        R$ {totalIncome.toFixed(2)}
                    </Text>
                </View>

                <View className="gap-1 items-end"> {/* Coluna de despesas alinhada à direita. */}
                    <Text className="text-zinc-400 text-sm"> {/* Label das despesas. */}
                        Despesas
                    </Text>

                    <Text className="text-red-400 font-semibold text-lg"> {/* Valor das despesas. */}
                        R$ {totalExpenses.toFixed(2)}
                    </Text>
                </View>

            </View>
        </View>
    );
}

export default BalanceCard;