import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'

type TabIconProps = { focused: boolean; label: string; emoji: string }

function TabIcon({ focused, label, emoji }: TabIconProps) {
  return (
    <View style={{ alignItems: 'center', gap: 2, paddingTop: 6 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{
        fontSize: 10,
        fontWeight: focused ? '700' : '400',
        color: focused ? '#15151A' : '#8B8B92',
        letterSpacing: -0.1,
      }}>
        {label}
      </Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ECE7DC',
          borderTopWidth: 1,
          borderTopColor: '#DDD7C8',
          height: 72,
          paddingBottom: 12,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Início" emoji="◎" />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Transações" emoji="↕" />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Cartões" emoji="▭" />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Metas" emoji="◈" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Perfil" emoji="◉" />
          ),
        }}
      />
    </Tabs>
  )
}
