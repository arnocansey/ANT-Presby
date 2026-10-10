import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/kit/icon-button';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { Corner, Fixed, MAX_CONTENT_WIDTH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  icon,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: IconName;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: Fixed.scrim }]}>
        <View accessibilityViewIsModal style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {icon ? (
            <View style={[styles.icon, { backgroundColor: colors.surface }]}>
              <Ionicons name={icon} size={22} color={destructive ? colors.danger : colors.primary} />
            </View>
          ) : null}
          <AppText variant="section" accessibilityRole="header" style={styles.center}>
            {title}
          </AppText>
          {message ? (
            <AppText variant="small" tone="muted" style={styles.center}>
              {message}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            <View style={styles.action}>
              <AppButton label={cancelLabel} variant="secondary" onPress={onCancel} />
            </View>
            <View style={styles.action}>
              <AppButton label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.lg },
  card: { width: '100%', maxWidth: MAX_CONTENT_WIDTH / 2, borderWidth: 1, borderRadius: Corner.panel, padding: Space.lg, gap: Space.md },
  icon: { width: 48, height: 48, borderRadius: Corner.pill, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  center: { textAlign: 'center' },
  actions: { flexDirection: 'row', gap: Space.sm },
  action: { flex: 1 },
});
