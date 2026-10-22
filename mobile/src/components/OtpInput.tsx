import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, fontSize, radius, spacing } from '../theme';

const CODE_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
  hasError: boolean;
};

export function OtpInput({ value, onChange, onSubmit, hasError }: OtpInputProps) {
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, CODE_LENGTH - 1);

  return (
    <View>
      <View style={styles.boxes} pointerEvents="none">
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <View
            key={index}
            style={[
              styles.box,
              value[index] ? styles.boxFilled : null,
              focused && index === activeIndex && styles.boxActive,
              hasError && styles.boxError,
            ]}
          >
            <Text style={styles.digit}>{value[index] ?? ''}</Text>
          </View>
        ))}
      </View>
      <TextInput
        accessibilityLabel="One-time password"
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, CODE_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        maxLength={CODE_LENGTH}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus
        caretHidden
        style={styles.hiddenInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  boxes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    aspectRatio: 0.82,
    maxHeight: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: colors.borderStrong,
  },
  boxActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  boxError: {
    borderColor: colors.danger,
  },
  digit: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.title + 4,
    color: colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0,
  },
});
