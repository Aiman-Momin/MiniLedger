import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ApiError, errorMessage } from '../api/client';
import { createLoan, type ReceiptFile } from '../api/loans';
import { Button } from '../components/Button';
import { DueDateField } from '../components/DueDateField';
import { TextField } from '../components/TextField';
import { showMessage } from '../dialogs';
import { toIsoDate } from '../format';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, fontSize, radius, spacing } from '../theme';
import { MAX_FRIEND_NAME_LENGTH, validateLoanForm, type LoanFormErrors } from '../validation';

type AddEntryScreenProps = NativeStackScreenProps<RootStackParamList, 'AddEntry'>;

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function oneWeekFromToday() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return toIsoDate(date);
}

function toReceiptFile(asset: ImagePicker.ImagePickerAsset): ReceiptFile {
  const type = asset.mimeType ?? 'image/jpeg';
  return {
    uri: asset.uri,
    type,
    name: asset.fileName ?? `receipt.${type.split('/')[1]}`,
  };
}

export function AddEntryScreen({ navigation }: AddEntryScreenProps) {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(oneWeekFromToday);
  const [receipt, setReceipt] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [errors, setErrors] = useState<LoanFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function acceptReceipt(result: ImagePicker.ImagePickerResult) {
    if (result.canceled) return;
    const asset = result.assets[0];

    if (asset.mimeType && !RECEIPT_TYPES.includes(asset.mimeType)) {
      setErrors((current) => ({ ...current, receipt: 'Pick a JPG, PNG or WEBP image' }));
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_RECEIPT_BYTES) {
      setErrors((current) => ({ ...current, receipt: 'Receipt must be 5MB or smaller' }));
      return;
    }

    setErrors((current) => ({ ...current, receipt: undefined }));
    setReceipt(asset);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showMessage(
        'Camera access needed',
        'Allow camera access in Settings to photograph a receipt.',
      );
      return;
    }
    acceptReceipt(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 }));
  }

  async function pickFromGallery() {
    acceptReceipt(
      await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 }),
    );
  }

  function chooseReceiptSource() {
    if (Platform.OS === 'web') {
      pickFromGallery();
      return;
    }
    Alert.alert('Attach receipt', undefined, [
      { text: 'Take photo', onPress: takePhoto },
      { text: 'Choose from gallery', onPress: pickFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function submit() {
    const formErrors = validateLoanForm({ friendName, amount, dueDate });
    setErrors(formErrors);
    setSubmitError(null);
    if (Object.keys(formErrors).length > 0) return;

    setSubmitting(true);
    try {
      await createLoan({
        friendName: friendName.trim(),
        amount: Number(amount),
        dueDate,
        receipt: receipt ? toReceiptFile(receipt) : null,
      });
      navigation.goBack();
    } catch (createError) {
      if (createError instanceof ApiError && createError.fieldErrors.length > 0) {
        setErrors(
          Object.fromEntries(createError.fieldErrors.map(({ field, message }) => [field, message])),
        );
      } else {
        setSubmitError(errorMessage(createError));
      }
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.amountBlock}>
        <Text style={styles.amountLabel}>How much did you lend?</Text>
        <View style={[styles.amountRow, errors.amount ? styles.amountRowError : null]}>
          <Text style={styles.currency}>₹</Text>
          <TextInput
            accessibilityLabel="Amount"
            value={amount}
            onChangeText={(text) => setAmount(text.replace(',', '.'))}
            placeholder="0"
            placeholderTextColor={colors.textFaint}
            keyboardType="decimal-pad"
            autoFocus
            style={styles.amountInput}
          />
        </View>
        {errors.amount ? <Text style={styles.error}>{errors.amount}</Text> : null}
      </View>

      <View style={styles.fields}>
        <TextField
          label="Lent to"
          value={friendName}
          onChangeText={setFriendName}
          placeholder="Friend's name"
          autoCapitalize="words"
          maxLength={MAX_FRIEND_NAME_LENGTH}
          error={errors.friendName}
        />

        <DueDateField value={dueDate} onChange={setDueDate} error={errors.dueDate} />

        <View style={styles.field}>
          <Text style={styles.label}>Receipt</Text>
          {receipt ? (
            <View style={styles.receiptCard}>
              <Image source={{ uri: receipt.uri }} style={styles.receiptPreview} />
              <View style={styles.receiptInfo}>
                <Text style={styles.receiptTitle}>Receipt attached</Text>
                <Pressable onPress={chooseReceiptSource} hitSlop={8}>
                  <Text style={styles.link}>Replace</Text>
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove receipt"
                onPress={() => setReceipt(null)}
                hitSlop={8}
                style={styles.removeButton}
              >
                <Feather name="x" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={chooseReceiptSource}
              style={({ pressed }) => [styles.dropzone, pressed && styles.dropzonePressed]}
            >
              <View style={styles.dropzoneIcon}>
                <Feather name="paperclip" size={18} color={colors.primary} />
              </View>
              <View style={styles.dropzoneText}>
                <Text style={styles.dropzoneTitle}>Attach a receipt</Text>
                <Text style={styles.dropzoneHint}>
                  {Platform.OS === 'web'
                    ? 'JPG, PNG or WEBP, up to 5MB'
                    : 'Take a photo or pick one, up to 5MB'}
                </Text>
              </View>
            </Pressable>
          )}
          {errors.receipt ? <Text style={styles.error}>{errors.receipt}</Text> : null}
        </View>
      </View>

      {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

      <Button title="Save entry" onPress={submit} loading={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  amountBlock: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  amountLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    paddingBottom: spacing.sm,
  },
  amountRowError: {
    borderBottomColor: colors.danger,
  },
  currency: {
    fontFamily: fonts.medium,
    fontSize: 28,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.display,
    fontSize: fontSize.display,
    color: colors.text,
    paddingVertical: 0,
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  fields: {
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  dropzone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  dropzonePressed: {
    backgroundColor: colors.sunken,
  },
  dropzoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTint,
  },
  dropzoneText: {
    flex: 1,
    gap: 2,
  },
  dropzoneTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.body - 1,
    color: colors.text,
  },
  dropzoneHint: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  receiptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  receiptPreview: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.sunken,
  },
  receiptInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  receiptTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.body - 1,
    color: colors.text,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.small,
    color: colors.primary,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sunken,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.danger,
  },
});
