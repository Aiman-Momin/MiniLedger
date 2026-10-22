import { Feather } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Loan } from '../api/loans';
import { daysUntil, formatDate, formatRupees, formatTimestamp } from '../format';
import { avatarTones, colors, fonts, fontSize, radius, spacing } from '../theme';

type LoanCardProps = {
  loan: Loan;
  updating: boolean;
  onMarkRepaid: (loan: Loan) => void;
  onOpenReceipt: (url: string) => void;
};

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function toneFor(name: string) {
  let hash = 0;
  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1009;
  }
  return avatarTones[hash % avatarTones.length];
}

function describeTiming(loan: Loan) {
  if (loan.repaidAt) return `Repaid ${formatTimestamp(loan.repaidAt)}`;

  const days = daysUntil(loan.dueDate);
  if (days < -1) return `${-days} days overdue`;
  if (days === -1) return '1 day overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${formatDate(loan.dueDate)}`;
}

export function LoanCard({ loan, updating, onMarkRepaid, onOpenReceipt }: LoanCardProps) {
  const { receiptUrl, status } = loan;
  const tone = toneFor(loan.friendName);
  const isOverdue = status === 'overdue';
  const isRepaid = status === 'repaid';

  return (
    <View style={[styles.card, isOverdue && styles.overdueCard, isRepaid && styles.repaidCard]}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: tone.background }]}>
          <Text style={[styles.initials, { color: tone.text }]}>{initialsOf(loan.friendName)}</Text>
        </View>

        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={1}>
            {loan.friendName}
          </Text>
          <View style={styles.timing}>
            <Feather
              name={isRepaid ? 'check-circle' : isOverdue ? 'alert-circle' : 'clock'}
              size={13}
              color={isOverdue ? colors.danger : isRepaid ? colors.success : colors.textMuted}
            />
            <Text style={[styles.timingText, isOverdue && styles.overdueText]}>
              {describeTiming(loan)}
            </Text>
          </View>
        </View>

        <View style={styles.trailing}>
          <Text style={[styles.amount, isRepaid && styles.repaidAmount]}>
            {formatRupees(loan.amount)}
          </Text>
          {isOverdue ? (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueBadgeText}>Overdue</Text>
            </View>
          ) : (
            <Text style={[styles.statusText, isRepaid && styles.repaidStatusText]}>
              {isRepaid ? 'Repaid' : 'Pending'}
            </Text>
          )}
        </View>
      </View>

      {receiptUrl || !isRepaid ? (
        <View style={styles.footer}>
          {receiptUrl ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Receipt for ${loan.friendName}`}
              onPress={() => onOpenReceipt(receiptUrl)}
              style={({ pressed }) => [styles.receipt, pressed && styles.receiptPressed]}
            >
              <Image source={{ uri: receiptUrl }} style={styles.thumbnail} />
              <Text style={styles.receiptText}>Receipt</Text>
            </Pressable>
          ) : (
            <View />
          )}

          {!isRepaid ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onMarkRepaid(loan)}
              disabled={updating}
              hitSlop={6}
              style={({ pressed }) => [styles.repayButton, pressed && styles.repayButtonPressed]}
            >
              <Feather name="check" size={15} color={colors.primary} />
              <Text style={styles.repayText}>{updating ? 'Updating...' : 'Mark repaid'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  overdueCard: {
    backgroundColor: colors.dangerTint,
    borderColor: colors.dangerBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  repaidCard: {
    opacity: 0.6,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.small,
  },
  details: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.body,
    color: colors.text,
  },
  timing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timingText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.small - 1,
    color: colors.textMuted,
  },
  overdueText: {
    fontFamily: fonts.medium,
    color: colors.danger,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.body + 1,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  repaidAmount: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  statusText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  repaidStatusText: {
    color: colors.success,
  },
  overdueBadge: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  overdueBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.caption - 1,
    letterSpacing: 0.3,
    color: colors.onPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
  receipt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.sm,
    borderRadius: radius.sm,
  },
  receiptPressed: {
    opacity: 0.7,
  },
  thumbnail: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.sunken,
  },
  receiptText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.small - 1,
    color: colors.textMuted,
  },
  repayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
  },
  repayButtonPressed: {
    opacity: 0.75,
  },
  repayText: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.small - 1,
    color: colors.primary,
  },
});
