import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, fontSize, radius, spacing } from '../theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  prefix?: string;
};

export function TextField({
  label,
  error,
  prefix,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          error ? styles.inputRowError : null,
        ]}
      >
        {prefix ? (
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>{prefix}</Text>
          </View>
        ) : null}
        <TextInput
          placeholderTextColor={colors.textFaint}
          style={[styles.input, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  inputRowFocused: {
    borderColor: colors.primary,
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  prefix: {
    paddingRight: spacing.md,
    marginRight: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  prefixText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.body,
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    color: colors.text,
    paddingVertical: spacing.md,
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.danger,
  },
});
