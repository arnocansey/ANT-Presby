import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/kit/icon-button';
import { AppText } from '@/components/ui/app-text';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

// A bordered card whose rows are separated by hairlines.
export function ListGroup({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const items = React.Children.toArray(children);
  return (
    <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {items.map((child, index) => (
        <View key={index} style={index > 0 ? [styles.divider, { borderTopColor: colors.border }] : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}

export function ListRow({
  label,
  icon,
  description,
  value,
  trailing,
  onPress,
  tone = 'default',
  accessibilityLabel,
}: {
  label: string;
  icon?: IconName;
  description?: string;
  value?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  tone?: 'default' | 'danger';
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  const accent = tone === 'danger' ? colors.danger : colors.primary;
  const content = (
    <>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: colors.surface }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <AppText variant="bodyStrong" numberOfLines={2} style={tone === 'danger' ? { color: colors.danger } : undefined}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="small" tone="muted" numberOfLines={2}>
            {description}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="small" tone="muted">
          {value}
        </AppText>
      ) : null}
      {trailing}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (value ? `${label}, ${value}` : label)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}>
      {content}
    </Pressable>
  );
}

// An icon followed by a short muted line, e.g. a time or a place.
export function InfoLine({ icon, children, selectable }: { icon: IconName; children: React.ReactNode; selectable?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.info}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <AppText variant="small" tone="muted" selectable={selectable} style={styles.infoText}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { borderWidth: 1, borderRadius: Corner.card, overflow: 'hidden' },
  divider: { borderTopWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm + 4,
    minHeight: MIN_TOUCH + 12,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm + 4,
  },
  icon: { width: 36, height: 36, borderRadius: Corner.control, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  info: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  infoText: { flex: 1 },
});
