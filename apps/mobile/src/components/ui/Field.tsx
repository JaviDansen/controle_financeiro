import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface FieldProps {
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  placeholder?: string;
}

export function Field({ label, type = 'text', value, onChange, icon, trailing, placeholder }: FieldProps) {
  const [focused, setFocused] = useState(false);

  const isPassword = type === 'password';
  const isEmail = type === 'email';

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: focused ? colors.ink : colors.hairline,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={{
        fontSize: 12,
        fontWeight: '500',
        color: colors.muted,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
      }}>
        {label}
      </Text>
      <View style={containerStyle}>
        {icon && (
          <View style={{ opacity: focused ? 1 : 0.6 }}>
            {icon}
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={isPassword}
          keyboardType={isEmail ? 'email-address' : 'default'}
          autoCapitalize={isEmail || isPassword ? 'none' : 'sentences'}
          autoCorrect={!isPassword && !isEmail}
          style={{
            flex: 1,
            fontSize: 16,
            color: colors.ink,
            letterSpacing: isPassword ? 3 : 0,
          }}
        />
        {trailing}
      </View>
    </View>
  );
}
