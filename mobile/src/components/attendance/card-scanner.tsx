import { CameraView, useCameraPermissions } from 'expo-camera';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormMessage } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

const REPEAT_IGNORE_MS = 3000;

type Props = {
  visible: boolean;
  onClose: () => void;
  // Resolves to the message to show ("Ama Mensah checked in"); rejects with the error to show.
  onScan: (text: string) => Promise<string>;
};

// Full-screen camera that checks people in one after another from their QR cards.
export function CardScanner({ visible, onClose, onScan }: Props) {
  const { colors } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [message, setMessage] = React.useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const busy = React.useRef(false);
  const last = React.useRef({ text: '', at: 0 });

  const handle = async ({ data }: { data: string }) => {
    const now = Date.now();
    // The camera sees the same card many times a second; act on it once.
    if (busy.current || (data === last.current.text && now - last.current.at < REPEAT_IGNORE_MS)) return;
    busy.current = true;
    last.current = { text: data, at: now };
    try {
      setMessage({ tone: 'success', text: await onScan(data) });
      Vibration.vibrate(40);
    } catch (error) {
      setMessage({ tone: 'danger', text: error instanceof Error ? error.message : 'Could not check in' });
      Vibration.vibrate([0, 60, 80, 60]);
    } finally {
      busy.current = false;
    }
  };

  const close = () => {
    setMessage(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
        {!permission ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !permission.granted ? (
          <View style={[styles.center, styles.gap]}>
            <AppText style={styles.centerText}>Camera access is needed to scan cards. You can still find people by name.</AppText>
            <AppButton label="Allow camera" onPress={() => requestPermission()} />
            <AppButton label="Close" variant="secondary" onPress={close} />
          </View>
        ) : (
          <View style={styles.fill}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handle}
            />
            <View style={[styles.overlay, { backgroundColor: colors.background }]}>
              <AppText variant="small" tone="muted" style={styles.centerText}>
                Point the camera at a member&apos;s check-in card.
              </AppText>
              <View accessibilityLiveRegion="polite">
                {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
              </View>
              <AppButton label="Done" onPress={close} />
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.lg },
  gap: { gap: Space.md },
  centerText: { textAlign: 'center' },
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: Space.lg, gap: Space.sm },
});
