import { View, Text } from 'react-native'

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1117' }}>
      <Text style={{ color: '#6ee7b7', fontSize: 32, fontWeight: 'bold' }}>Hello World</Text>
      <Text style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>FinApp — Fase 1</Text>
    </View>
  )
}
