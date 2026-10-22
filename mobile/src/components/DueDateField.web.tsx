import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { describeDueDate } from '../format';
import { colors, fonts, fontSize, radius, spacing } from '../theme';
import { isRealDate } from '../validation';
import type { DueDateFieldProps } from './DueDateField';

export function DueDateField({ value, onChange, error }: DueDateFieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Due date</Text>
      <input
        type="date"
        aria-label="Due date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 54,
          boxSizing: 'border-box',
          border: `1px solid ${borderColor}`,
          borderRadius: radius.md,
          outline: 'none',
          backgroundColor: colors.surface,
          padding: `0 ${spacing.lg}px`,
          fontSize: fontSize.body,
          fontFamily: fonts.regular,
          color: colors.text,
          accentColor: colors.primary,
        }}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : isRealDate(value) ? (
        <Text style={styles.hint}>{describeDueDate(value)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.danger,
  },
});
