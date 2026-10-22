import { StyleSheet, Text, View } from 'react-native';
import type { LoanSummary } from '../api/loans';
import { formatAmount, formatRupees } from '../format';
import { colors, fonts, fontSize, radius, spacing } from '../theme';

export function SummaryCard({ summary }: { summary: LoanSummary }) {
  const { totalLent, totalRepaid, overdueAmount, outstanding, counts } = summary;
  const notDueYet = Math.round((outstanding - overdueAmount) * 100) / 100;

  const segments = [
    { label: 'Repaid', amount: totalRepaid, color: colors.successOnPrimary },
    { label: 'Overdue', amount: overdueAmount, color: colors.dangerOnPrimary },
    { label: 'Not due yet', amount: notDueYet, color: colors.onPrimaryMuted },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Outstanding</Text>
      <View style={styles.amountRow}>
        <Text style={styles.currency}>₹</Text>
        <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
          {formatAmount(outstanding)}
        </Text>
      </View>
      <Text style={styles.caption}>
        {counts.total === 0
          ? 'Nothing lent yet'
          : `of ${formatRupees(totalLent)} lent across ${counts.total} ${counts.total === 1 ? 'entry' : 'entries'}`}
      </Text>

      <View style={styles.track}>
        {segments
          .filter((segment) => segment.amount > 0)
          .map((segment) => (
            <View
              key={segment.label}
              style={[styles.segment, { flex: segment.amount, backgroundColor: segment.color }]}
            />
          ))}
      </View>

      <View style={styles.legend}>
        {segments.map((segment) => (
          <View key={segment.label} style={styles.legendItem}>
            <View style={styles.legendLabelRow}>
              <View style={[styles.dot, { backgroundColor: segment.color }]} />
              <Text style={styles.legendLabel}>{segment.label}</Text>
            </View>
            <Text style={styles.legendValue} numberOfLines={1}>
              {formatRupees(segment.amount)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  eyebrow: {
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.onPrimaryMuted,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  currency: {
    fontFamily: fonts.medium,
    fontSize: fontSize.title + 2,
    color: colors.onPrimaryMuted,
    marginTop: spacing.sm,
    marginRight: spacing.xs,
  },
  amount: {
    flexShrink: 1,
    fontFamily: fonts.display,
    fontSize: fontSize.display,
    lineHeight: fontSize.display + 6,
    color: colors.onPrimary,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: fontSize.small,
    color: colors.onPrimaryMuted,
    marginTop: spacing.xs,
  },
  track: {
    flexDirection: 'row',
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.onPrimaryTrack,
    overflow: 'hidden',
    gap: 2,
    marginTop: spacing.xl,
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  legendItem: {
    flex: 1,
    gap: spacing.xs,
  },
  legendLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.onPrimaryMuted,
  },
  legendValue: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.body,
    color: colors.onPrimary,
  },
});
