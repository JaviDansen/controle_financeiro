import { View } from "react-native"; // Importa o componente base de container do React Native.

type SkeletonLoaderProps = { // Define as propriedades aceitas pelo SkeletonLoader.
  className?: string; // Permite receber classes extras do NativeWind para customização do skeleton.
};

export function SkeletonLoader({ // Componente reutilizável responsável por exibir um skeleton de carregamento.
  className = "", // Define uma string vazia como valor padrão caso nenhuma classe seja enviada.
}: SkeletonLoaderProps) {
  return (
    <View
      testID="skeleton-loader" // Identificador usado em testes automatizados para localizar o componente.
      className={`bg-gray-200 rounded-lg opacity-70 ${className}`} // Define aparência base do skeleton e concatena classes adicionais.
    />
  );
}

export default SkeletonLoader; // Exporta o componente como exportação padrão do arquivo.