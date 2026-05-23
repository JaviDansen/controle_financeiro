import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/ui/Icon';
import { USER } from '../../src/data/mocks/user';
import { colors } from '../../src/theme/colors';

interface ProfileRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}

function ProfileRow({ icon, label, value, onPress, destructive = false }: ProfileRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: destructive ? colors.negSoft : colors.bg,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 15, fontWeight: '500',
          color: destructive ? colors.neg : colors.ink,
        }}>
          {label}
        </Text>
        {value && (
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>{value}</Text>
        )}
      </View>
      {!destructive && (
        <Icon.ChevR size={14} color={colors.muted} sw={1.8} />
      )}
    </Pressable>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={{
      fontSize: 11,
      fontWeight: '500',
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      paddingHorizontal: 4,
      paddingBottom: 4,
      paddingTop: 16,
    }}>
      {children}
    </Text>
  );
}

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: '500', color: colors.ink, letterSpacing: -0.8 }}>
            Perfil
          </Text>
        </View>

        {/* Avatar + nome */}
        <View style={{
          marginHorizontal: 16,
          marginTop: 16,
          backgroundColor: colors.surface,
          borderRadius: 22,
          padding: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          borderWidth: 1, borderColor: colors.hairline,
        }}>
          <View style={{
            width: 60, height: 60, borderRadius: 30,
            backgroundColor: colors.ink,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 22, fontWeight: '600', color: colors.surface, letterSpacing: 0.5 }}>
              {USER.initials}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '500', color: colors.ink, letterSpacing: -0.3 }}>
              {USER.name}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{USER.email}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 2,
                backgroundColor: colors.accentSoft,
                borderRadius: 999,
              }}>
                <Text style={{ fontSize: 11, color: colors.accentInk, fontWeight: '500' }}>
                  Desde {USER.joined}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.muted }}>{USER.city}</Text>
            </View>
          </View>
        </View>

        {/* Conta */}
        <View style={{ marginHorizontal: 16 }}>
          <SectionTitle>Conta</SectionTitle>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            paddingHorizontal: 16,
            borderWidth: 1, borderColor: colors.hairline,
          }}>
            <ProfileRow
              icon={<Icon.Mail size={16} color={colors.ink2} />}
              label="E-mail"
              value={USER.email}
            />
            <View style={{ height: 1, backgroundColor: colors.hairline }} />
            <ProfileRow
              icon={<Icon.Lock size={16} color={colors.ink2} />}
              label="Alterar senha"
            />
            <View style={{ height: 1, backgroundColor: colors.hairline }} />
            <ProfileRow
              icon={<Icon.Bell size={16} color={colors.ink2} />}
              label="Notificações"
            />
          </View>

          <SectionTitle>Dados</SectionTitle>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            paddingHorizontal: 16,
            borderWidth: 1, borderColor: colors.hairline,
          }}>
            <ProfileRow
              icon={<Icon.Card size={16} color={colors.ink2} />}
              label="Cartões"
              value="3 cadastrados"
            />
            <View style={{ height: 1, backgroundColor: colors.hairline }} />
            <ProfileRow
              icon={<Icon.Tx size={16} color={colors.ink2} />}
              label="Exportar transações"
            />
          </View>

          <SectionTitle>Sessão</SectionTitle>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            paddingHorizontal: 16,
            borderWidth: 1, borderColor: colors.hairline,
          }}>
            <ProfileRow
              icon={<Icon.ChevL size={16} color={colors.neg} />}
              label="Sair da conta"
              destructive
            />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
