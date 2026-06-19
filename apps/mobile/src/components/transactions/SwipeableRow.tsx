import React, { useRef } from 'react'
import { View } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { Icon } from '../ui/Icon'

interface SwipeableRowProps {
  children: React.ReactNode
  onDelete: () => void
}

export function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const swipeRef = useRef<Swipeable>(null)

  function handleOpen() {
    swipeRef.current?.close()
    onDelete()
  }

  function renderRightActions() {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', width: 80 }}>
        <View style={{
          width: 56, height: 56, borderRadius: 16,
          backgroundColor: '#D32F2F',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.Trash size={20} color="#fff" sw={1.8} />
        </View>
      </View>
    )
  }

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={60}
      overshootRight={false}
      onSwipeableOpen={handleOpen}
      friction={2}
    >
      {children}
    </Swipeable>
  )
}
