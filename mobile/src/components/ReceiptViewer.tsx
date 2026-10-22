import { Feather } from '@expo/vector-icons';
import { Image, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';

type ReceiptViewerProps = {
  uri: string | null;
  onClose: () => void;
};

export function ReceiptViewer({ uri, onClose }: ReceiptViewerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={uri !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[
          styles.backdrop,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        onPress={onClose}
      >
        {uri ? <Image source={{ uri }} style={styles.image} resizeMode="contain" /> : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close receipt"
        onPress={onClose}
        hitSlop={12}
        style={[styles.close, { top: insets.top + spacing.md }]}
      >
        <Feather name="x" size={22} color={colors.onPrimary} />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.lg,
  },
  image: {
    flex: 1,
    width: '100%',
    borderRadius: radius.md,
  },
  close: {
    position: 'absolute',
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onPrimaryTrack,
  },
});
