import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requestOtp, verifyOtp } from '../api/auth';
import { ApiError, errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/Button';
import { OtpInput } from '../components/OtpInput';
import { TextField } from '../components/TextField';
import { formatPhone } from '../format';
import { colors, fonts, fontSize, radius, spacing } from '../theme';
import { isValidIndianMobile } from '../validation';

type Step = 'phone' | 'code';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function sendCode() {
    if (!isValidIndianMobile(phone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await requestOtp(phone);
      setStep('code');
      setCode('');
      setResendIn(result.resendAfterSeconds);
    } catch (requestError) {
      setError(errorMessage(requestError));
      if (requestError instanceof ApiError && requestError.status === 429 && step === 'code') {
        const details = requestError.details as { retryAfterSeconds?: number } | undefined;
        setResendIn(details?.retryAfterSeconds ?? 30);
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (code.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { token, user } = await verifyOtp(phone, code);
      await signIn(token, user);
    } catch (verifyError) {
      setError(errorMessage(verifyError));
      setLoading(false);
    }
  }

  function changeNumber() {
    setStep('phone');
    setCode('');
    setError(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Feather name="book-open" size={18} color={colors.onPrimary} />
            </View>
            <Text style={styles.brandName}>MiniLedger</Text>
          </View>

          {step === 'phone' ? (
            <>
              <Text style={styles.headline}>Keep track of what your friends owe you.</Text>
              <Text style={styles.subtitle}>
                Sign in with your mobile number. We will send you a one-time code.
              </Text>

              <View style={styles.form}>
                <TextField
                  label="Mobile number"
                  prefix="+91"
                  value={phone}
                  onChangeText={(text) => setPhone(text.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  keyboardType="number-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  maxLength={10}
                  autoFocus
                  error={error ?? undefined}
                  onSubmitEditing={sendCode}
                />
                <Button title="Send OTP" onPress={sendCode} loading={loading} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.headline}>Enter your code</Text>
              <View style={styles.sentTo}>
                <Text style={styles.subtitle}>
                  Sent to <Text style={styles.phone}>{formatPhone(phone)}</Text>
                </Text>
                <Pressable onPress={changeNumber} disabled={loading} hitSlop={8}>
                  <Text style={styles.link}>Change number</Text>
                </Pressable>
              </View>

              <View style={styles.form}>
                <OtpInput
                  value={code}
                  onChange={setCode}
                  onSubmit={verifyCode}
                  hasError={error !== null}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.hint}>
                  <Feather name="terminal" size={16} color={colors.textMuted} />
                  <Text style={styles.hintText}>
                    Check the server log for your OTP. SMS is mocked in this build.
                  </Text>
                </View>

                <Button title="Verify" onPress={verifyCode} loading={loading} />

                <View style={styles.resendRow}>
                  <Text style={styles.resendLabel}>Did not get it?</Text>
                  {resendIn > 0 ? (
                    <Text style={styles.countdown}>Resend in {resendIn}s</Text>
                  ) : (
                    <Pressable onPress={sendCode} disabled={loading} hitSlop={8}>
                      <Text style={styles.link}>Resend code</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.body + 1,
    color: colors.text,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 44,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    lineHeight: 23,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  sentTo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    columnGap: spacing.md,
  },
  phone: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  form: {
    gap: spacing.lg,
    marginTop: spacing.xxl,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSize.small,
    color: colors.danger,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.sunken,
  },
  hintText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.small - 1,
    lineHeight: 18,
    color: colors.textMuted,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  resendLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.small,
    color: colors.primary,
  },
  countdown: {
    fontFamily: fonts.medium,
    fontSize: fontSize.small,
    color: colors.textFaint,
    fontVariant: ['tabular-nums'],
  },
});
