import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icon } from '../ui/Icon';
import { colors } from '../../theme/colors';

interface HomeHeaderProps {
  name: string;
  initials: string;
}

export function HomeHeader({ name, initials }: HomeHeaderProps) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 22,
      paddingTop: 8,
      paddingBottom: 6,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: colors.ink,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: colors.surface, fontSize: 14, fontWeight: '600', letterSpacing: 0.4 }}>
            {initials}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: colors.muted }}>Olá,</Text>
          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.ink, marginTop: 1 }}>
            {name}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1, borderColor: colors.hairline,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.Search size={18} color={colors.ink} />
        </Pressable>
        <Pressable style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1, borderColor: colors.hairline,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.Bell size={18} color={colors.ink} />
          <View style={{
            position: 'absolute', top: 8, right: 9,
            width: 7, height: 7, borderRadius: 4,
            backgroundColor: colors.neg,
            borderWidth: 1.5, borderColor: colors.bg,
          }} />
        </Pressable>
      </View>
    </View>
  );
}
