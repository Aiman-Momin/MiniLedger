import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { describeDueDate, formatDate, fromIsoDate, toIsoDate } from '../format';
import { colors, fonts, fontSize, radius, spacing } from '../theme';

export type DueDateFieldProps = {
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
};

export function DueDateField({ value, onChange, error }: DueDateFieldProps) {
  function openAndroidPicker() {
    DateTimePickerAndroid.open({
      value: fromIsoDate(value),
      mode: 'date',
      onChange: (event, date) => {
        if (event.type === 'set' && date) onChange(toIsoDate(date));
      },
    });
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Due date</Text>
      {Platform.OS === 'ios' ? (
        <View style={[styles.box, error ? styles.boxError : null]}>
          <Feather name="calendar" size={18} color={colors.textMuted} />
          <View style={styles.spacer} />
          <DateTimePicker
            value={fromIsoDate(value)}
            mode="date"
            display="compact"
            accentColor={colors.primary}
            onChange={(_event, date) => date && onChange(toIsoDate(date))}
          />
        </View>
      ) : (
        <Pressable style={[styles.box, error ? styles.boxError : null]} onPress={openAndroidPicker}>
          <Feather name="calendar" size={18} color={colors.textMuted} />
          <Text style={styles.dateText}>{formatDate(value)}</Text>
          <Text style={styles.change}>Change</Text>
        </Pressable>
      )}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <Text style={styles.hint}>{describeDueDate(value)}</Text>
      )}
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
  box: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  boxError: {
    borderColor: colors.danger,
  },
  spacer: {
    flex: 1,
  },
  dateText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    color: colors.text,
  },
  change: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.small,
    color: colors.primary,
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
