import '../global.css';
import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon } from '../src/components/ui/Icon';
import { colors } from '../src/theme/colors';

/* ─── Tab item individual ────────────────────────────────── */
function TabItem({
  route, index, state, descriptors, navigation,
}: {
  route: BottomTabBarProps['state']['routes'][0];
  index: number;
  state: BottomTabBarProps['state'];
  descriptors: BottomTabBarProps['descriptors'];
  navigation: BottomTabBarProps['navigation'];
}) {
  const { options } = descriptors[route.key];
  const isFocused = state.index === index;
  const color = isFocused ? colors.ink : colors.muted;

  const onPress = () => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}
    >
      {options.tabBarIcon?.({ focused: isFocused, color, size: 22 })}
      <Text style={{ fontSize: 10, fontWeight: '500', color }}>{options.title}</Text>
    </Pressable>
  );
}

/* ─── Tab bar customizado ────────────────────────────────── */
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const showAddButton = pathname === '/transactions' || pathname === '/cards';

  const handleAdd = () => {
    if (pathname === '/transactions') {
      Alert.alert('Nova transação'); // TODO: abrir modal
    } else {
      Alert.alert('Novo cartão');    // TODO: abrir modal
    }
  };

  // filtra o placeholder "add" da lista de tabs visíveis
  const routes = state.routes.filter(r => r.name !== 'add');

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
      height: 58 + insets.bottom,
      paddingBottom: insets.bottom,
      alignItems: 'center',
    }}>
      {showAddButton ? (
        // 5 slots: Início | Transações | [+] | Cartões | Perfil
        <>
          {routes.slice(0, 2).map((route) => {
            const originalIndex = state.routes.findIndex(r => r.key === route.key);
            return (
              <TabItem
                key={route.key}
                route={route}
                index={originalIndex}
                state={state}
                descriptors={descriptors}
                navigation={navigation}
              />
            );
          })}

          <Pressable
            onPress={handleAdd}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.ink,
              shadowOpacity: 0.2,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 5,
            }}>
              <Icon.Plus color="#FBFAF6" size={20} sw={2.2} />
            </View>
          </Pressable>

          {routes.slice(2).map((route) => {
            const originalIndex = state.routes.findIndex(r => r.key === route.key);
            return (
              <TabItem
                key={route.key}
                route={route}
                index={originalIndex}
                state={state}
                descriptors={descriptors}
                navigation={navigation}
              />
            );
          })}
        </>
      ) : (
        // 4 slots: Início | Transações | Cartões | Perfil
        routes.map((route) => {
          const originalIndex = state.routes.findIndex(r => r.key === route.key);
          return (
            <TabItem
              key={route.key}
              route={route}
              index={originalIndex}
              state={state}
              descriptors={descriptors}
              navigation={navigation}
            />
          );
        })
      )}
    </View>
  );
}

/* ─── Root layout ────────────────────────────────────────── */
export default function RootLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Icon.Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transações',
          tabBarIcon: ({ color, size }) => <Icon.Tx color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cartões',
          tabBarIcon: ({ color, size }) => <Icon.Card color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Icon.Profile color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{ href: null, title: '' }}
      />
    </Tabs>
  );
}
