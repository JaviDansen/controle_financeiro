import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon } from '../../src/components/ui/Icon';
import { colors } from '../../src/theme/colors';

function TabItem({
  route,
  index,
  state,
  descriptors,
  navigation,
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
      style={{ flex: 1, alignItems: 'center', gap: 3 }}
    >
      {options.tabBarIcon?.({ focused: isFocused, color, size: 22 })}
      <Text style={{ fontSize: 10, fontWeight: '500', color }}>{options.title}</Text>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  const showAddButton = pathname === '/transactions' || pathname === '/cards';

  const handleAdd = () => {
    if (pathname === '/transactions') {
      router.push('/(tabs)/new-transaction');
      return;
    }

    if (pathname === '/cards') {
      router.push('/(tabs)/add');
      return;
    }
  };

  const hiddenRoutes = new Set(['add', 'new-transaction', 'new-transaction-step2', 'new-transaction-step3', 'import-extract']);
  const routes = state.routes.filter((r) => !hiddenRoutes.has(r.name));

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.hairline,
        paddingTop: 6,
        paddingBottom: Math.max(insets.bottom, 8),
        minHeight: 58 + insets.bottom,
        alignItems: 'flex-start',
      }}
    >
      {showAddButton ? (
        <>
          {routes.slice(0, 2).map((route) => {
            const originalIndex = state.routes.findIndex((r) => r.key === route.key);
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
            style={{ flex: 1, alignItems: 'center' }}
          >
            <View
              style={{
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
              }}
            >
              <Icon.Plus color="#FBFAF6" size={20} sw={2.2} />
            </View>
          </Pressable>

          {routes.slice(2).map((route) => {
            const originalIndex = state.routes.findIndex((r) => r.key === route.key);
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
        routes.map((route) => {
          const originalIndex = state.routes.findIndex((r) => r.key === route.key);
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

export default function TabsLayout() {
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
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Icon.Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transacoes',
          tabBarIcon: ({ color, size }) => <Icon.Tx color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cartoes',
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
      <Tabs.Screen name="add" options={{ href: null, title: '' }} />
      <Tabs.Screen name="new-transaction" options={{ href: null, title: '' }} />
      <Tabs.Screen name="new-transaction-step2" options={{ href: null, title: '' }} />
      <Tabs.Screen name="new-transaction-step3" options={{ href: null, title: '' }} />
      <Tabs.Screen name="import-extract" options={{ href: null, title: '' }} />
    </Tabs>
  );
}
