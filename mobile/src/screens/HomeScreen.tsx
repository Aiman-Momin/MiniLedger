import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage } from '../api/client';
import {
  fetchLoans,
  fetchSummary,
  markLoanRepaid,
  type Loan,
  type LoanSummary,
} from '../api/loans';
import { useAuth } from '../auth/AuthContext';
import { LoanCard } from '../components/LoanCard';
import { ReceiptViewer } from '../components/ReceiptViewer';
import { SummaryCard } from '../components/SummaryCard';
import { confirmAction, showMessage } from '../dialogs';
import { formatPhone, formatRupees } from '../format';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, fontSize, radius, spacing } from '../theme';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openReceipt, setOpenReceipt] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [nextLoans, nextSummary] = await Promise.all([fetchLoans(), fetchSummary()]);
      setLoans(nextLoans);
      setSummary(nextSummary);
      setError(null);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function confirmLogOut() {
    if (await confirmAction({ title: 'Log out?', confirmLabel: 'Log out', destructive: true })) {
      signOut();
    }
  }

  async function confirmRepaid(loan: Loan) {
    const confirmed = await confirmAction({
      title: 'Mark as repaid?',
      message: `${loan.friendName} paid back ${formatRupees(loan.amount)}.`,
      confirmLabel: 'Mark repaid',
    });
    if (!confirmed) return;

    setUpdatingId(loan.id);
    try {
      await markLoanRepaid(loan.id);
      await load();
    } catch (repayError) {
      showMessage('Could not update entry', errorMessage(repayError));
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={loans}
        keyExtractor={(loan) => loan.id}
        renderItem={({ item }) => (
          <LoanCard
            loan={item}
            updating={updatingId === item.id}
            onMarkRepaid={confirmRepaid}
            onOpenReceipt={setOpenReceipt}
          />
        )}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topBar}>
              <View>
                <Text style={styles.wordmark}>MiniLedger</Text>
                {user ? <Text style={styles.account}>{formatPhone(user.phone)}</Text> : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Log out"
                onPress={confirmLogOut}
                hitSlop={8}
                style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              >
                <Feather name="log-out" size={18} color={colors.text} />
              </Pressable>
            </View>

            {error ? (
              <Pressable accessibilityRole="button" onPress={refresh} style={styles.errorBanner}>
                <Feather name="wifi-off" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}. Tap to try again.</Text>
              </Pressable>
            ) : null}

            {summary ? <SummaryCard summary={summary} /> : null}

            {loans.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Entries</Text>
                <Text style={styles.sectionCount}>{loans.length}</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          error ? undefined : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather name="book-open" size={22} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Nothing on the books yet</Text>
              <Text style={styles.emptyText}>
                When you lend money to a friend, add it here so you both remember.
              </Text>
            </View>
          )
        }
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 112 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('AddEntry')}
        style={({ pressed }) => [
          styles.addButton,
          { bottom: insets.bottom + spacing.xl },
          pressed && styles.addButtonPressed,
        ]}
      >
        <Feather name="plus" size={20} color={colors.onPrimary} />
        <Text style={styles.addButtonText}>New entry</Text>
      </Pressable>

      <ReceiptViewer uri={openReceipt} onClose={() => setOpenReceipt(null)} />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: fontSize.heading,
    lineHeight: fontSize.heading + 4,
    color: colors.text,
  },
  account: {
    fontFamily: fonts.regular,
    fontSize: fontSize.small - 1,
    color: colors.textMuted,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconButtonPressed: {
    backgroundColor: colors.sunken,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerTint,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.small,
    color: colors.danger,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.title - 2,
    color: colors.text,
  },
  sectionCount: {
    fontFamily: fonts.medium,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    backgroundColor: colors.sunken,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  separator: {
    height: spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTint,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.text,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.body - 1,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  addButton: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingLeft: spacing.lg + 2,
    paddingRight: spacing.xl,
    paddingVertical: spacing.md + 3,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  addButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  addButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.body,
    color: colors.onPrimary,
  },
});
