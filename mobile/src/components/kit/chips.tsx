import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/kit/icon-button';
import { AppText } from '@/components/ui/app-text';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function Chip({
  label,
  onPress,
  selected = false,
  icon,
  disabled = false,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  icon?: IconName;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.background,
          borderColor: selected ? colors.primary : colors.input,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}>
      {icon ? <Ionicons name={icon} size={16} color={fg} /> : null}
      <AppText variant="small" style={[styles.label, { color: fg }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

// Single choice from a short list. `scroll` keeps long lists on one swipeable line.
export function ChipGroup<T extends string | number | undefined>({
  options,
  value,
  onChange,
  scroll = false,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  scroll?: boolean;
}) {
  const chips = options.map((option, index) => (
    <Chip
      key={`${String(option.value)}-${index}`}
      label={option.label}
      selected={option.value === value}
      onPress={() => onChange(option.value)}
    />
  ));
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {chips}
      </ScrollView>
    );
  }
  return <View style={[styles.row, styles.wrap]}>{chips}</View>;
}

// Underline tabs (spec §2.4 "Tabs"): equal-width, 44px tall.
export function UnderlineTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.tabs, { borderBottomColor: colors.border }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.tab, { borderBottomColor: active ? colors.primary : 'transparent' }]}>
            <AppText variant="bodyStrong" style={{ color: active ? colors.primary : colors.muted }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    borderWidth: 1,
    borderRadius: Corner.pill,
    paddingHorizontal: Space.md,
  },
  label: { fontWeight: '600' },
  row: { flexDirection: 'row', gap: Space.sm },
  wrap: { flexWrap: 'wrap' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, marginBottom: -1 },
});
