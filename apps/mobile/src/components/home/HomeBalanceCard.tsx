import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icon } from '../ui/Icon';
import { fmtBRLShort } from '../../lib/currency';
import { colors } from '../../theme/colors';
import { MonthSummaryObject } from '../../../services/transactions.service';

interface HomeBalanceCardProps {
  summary: MonthSummaryObject;
  sparkData: number[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function Sparkbars({ data, height = 32 }: { data: number[]; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: Math.max((v / max) * height, v > 0 ? 3 : 2),
            backgroundColor: v > 0 ? '#FBFAF6' : 'rgba(255,255,255,0.15)',
            borderRadius: 2,
            opacity: v > 0 ? 0.5 + (i / data.length) * 0.5 : 1,
          }}
        />
      ))}
    </View>
  );
}

function SkeletonBlock({ w, h, radius = 8 }: { w: number; h: number; radius?: number }) {
  return (
    <View style={{
      width: w,
      height: h,
      borderRadius: radius,
      backgroundColor: 'rgba(255,255,255,0.10)',
    }} />
  );
}

export function HomeBalanceCard({ summary, sparkData, isLoading, isError, onRetry }: HomeBalanceCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <View style={{
      backgroundColor: colors.ink,
      borderRadius: 22,
      padding: 20,
      overflow: 'hidden',
    }}>
      {/* Cabeçalho: mês + toggle visibilidade */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon.Calendar size={13} color="rgba(251,250,246,0.7)" />
          <Text style={{ fontSize: 12, color: 'rgba(251,250,246,0.7)' }}>{summary.label}</Text>
          <Icon.ChevR size={11} color="rgba(251,250,246,0.7)" sw={1.5} />
        </View>
        <Pressable
          onPress={() => setShowBalance(prev => !prev)}
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: 6, borderRadius: 999 }}
        >
          {showBalance
            ? <Icon.Eye size={14} color="#fff" />
            : <Icon.EyeOff size={14} color="#fff" />
          }
        </Pressable>
      </View>

      {/* Label saldo */}
      <Text style={{
        fontSize: 12, color: 'rgba(251,250,246,0.6)',
        marginTop: 14, fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase',
      }}>
        Saldo do mês
      </Text>

      {/* Valor do saldo */}
      {isLoading ? (
        <View style={{ marginTop: 8 }}>
          <SkeletonBlock w={160} h={40} radius={10} />
        </View>
      ) : isError ? (
        <Pressable onPress={onRetry} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.neg, fontSize: 13 }}>Erro ao carregar. Toque para tentar novamente.</Text>
        </Pressable>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <Text style={{ fontSize: 18, color: 'rgba(251,250,246,0.6)' }}>R$</Text>
          <Text style={{ fontSize: 40, fontWeight: '500', color: '#FBFAF6', letterSpacing: -1.6, lineHeight: 48 }}>
            {showBalance ? `${summary.balance < 0 ? '−' : ''}${fmtBRLShort(summary.balance)}` : '•••••'}
          </Text>
        </View>
      )}

      {/* Sparkbars */}
      <View style={{ marginTop: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 11, color: 'rgba(251,250,246,0.6)' }}>Despesas — últimos 14 dias</Text>
          <Text style={{ fontSize: 11, color: 'rgba(251,250,246,0.6)' }}>R$ {fmtBRLShort(summary.expense)}</Text>
        </View>
        <Sparkbars data={sparkData} height={32} />
      </View>

      {/* Receitas / Despesas split */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: 12, padding: 12,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{
              width: 14, height: 14, borderRadius: 7,
              backgroundColor: colors.accent,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon.ArrowDn size={9} color="#0A0A0A" sw={2.5} />
            </View>
            <Text style={{ fontSize: 11, color: 'rgba(251,250,246,0.7)' }}>Receitas</Text>
          </View>
          {isLoading
            ? <SkeletonBlock w={80} h={20} radius={6} />
            : <Text style={{ fontSize: 16, fontWeight: '500', color: '#FBFAF6', marginTop: 4 }}>
                {showBalance ? `R$ ${fmtBRLShort(summary.income)}` : '•••••'}
              </Text>
          }
        </View>

        <View style={{
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: 12, padding: 12,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{
              width: 14, height: 14, borderRadius: 7,
              backgroundColor: colors.neg,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon.ArrowUp size={9} color="#fff" sw={2.5} />
            </View>
            <Text style={{ fontSize: 11, color: 'rgba(251,250,246,0.7)' }}>Despesas</Text>
          </View>
          {isLoading
            ? <SkeletonBlock w={80} h={20} radius={6} />
            : <Text style={{ fontSize: 16, fontWeight: '500', color: '#FBFAF6', marginTop: 4 }}>
                {showBalance ? `R$ ${fmtBRLShort(summary.expense)}` : '•••••'}
              </Text>
          }
        </View>
      </View>
    </View>
  );
}
