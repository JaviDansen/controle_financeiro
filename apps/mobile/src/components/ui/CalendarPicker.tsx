import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from './Icon';
import { colors } from '../../theme/colors';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
const WEEKDAYS = ['D','S','T','Q','Q','S','S']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

interface Props {
  year: number
  month: number
  selectedDay: number
  onPrevMonth: () => void
  onNextMonth: () => void
  onSelectDay: (day: number) => void
}

export function CalendarPicker({ year, month, selectedDay, onPrevMonth, onNextMonth, onSelectDay }: Props) {
  const now = new Date()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDow = getFirstDayOfWeek(year, month)
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <View style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        <Pressable onPress={onPrevMonth} hitSlop={12} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.hairline, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.ChevL size={14} color={colors.ink} sw={2.5} />
        </Pressable>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink, letterSpacing: -0.3 }}>
          {MONTHS[month]} {year}
        </Text>
        <Pressable onPress={onNextMonth} hitSlop={12} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.hairline, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.ChevR size={14} color={colors.ink} sw={2.5} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingTop: 10, paddingBottom: 4 }}>
        {WEEKDAYS.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.muted }}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: 8, paddingBottom: 12 }}>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row' }}>
            {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
              const isSelected = day === selectedDay
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
              return (
                <Pressable key={col} onPress={() => day && onSelectDay(day)} disabled={!day} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 5 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? colors.ink : 'transparent', borderWidth: isToday && !isSelected ? 1.5 : 0, borderColor: colors.ink }}>
                    {day ? (
                      <Text style={{ fontSize: 13, fontWeight: isSelected ? '600' : '400', color: isSelected ? '#FBFAF6' : colors.ink }}>
                        {day}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: colors.hairline, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon.Calendar size={13} color={colors.muted} sw={1.8} />
        <Text style={{ fontSize: 13, color: colors.muted }}>
          Selecionado:{' '}
          <Text style={{ fontWeight: '600', color: colors.ink }}>
            {selectedDay} de {MONTHS[month]} de {year}
          </Text>
        </Text>
      </View>
    </View>
  )
}

export { MONTHS, MONTHS_SHORT }
