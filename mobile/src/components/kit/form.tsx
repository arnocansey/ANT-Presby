import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ChipGroup } from '@/components/kit/chips';
import { AppText } from '@/components/ui/app-text';
import { TextField } from '@/components/ui/text-field';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

type TextFieldProps = React.ComponentProps<typeof TextField>;

// TextField wired to react-hook-form. Values are shown as strings; empty for null/undefined.
export function FormTextField<T extends FieldValues>({
  control,
  name,
  ...props
}: Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur'> & {
  control: Control<T, any, any>;
  name: Path<T>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextField
          {...props}
          value={value === undefined || value === null ? '' : String(value)}
          onChangeText={onChange}
          onBlur={onBlur}
        />
      )}
    />
  );
}

export function ChoiceField<T extends string | number | undefined>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
}) {
  return (
    <View style={styles.field} accessibilityLabel={label}>
      <AppText variant="small" style={styles.bold}>
        {label}
      </AppText>
      <ChipGroup options={options} value={value} onChange={onChange} />
      {error ? (
        <AppText variant="small" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <AppText variant="bodyStrong">{label}</AppText>
        {description ? (
          <AppText variant="small" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.input, true: colors.primary }}
        thumbColor={value ? colors.onPrimary : colors.muted}
        ios_backgroundColor={colors.input}
      />
    </View>
  );
}

export function CheckboxRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.checkRow}>
      <View
        style={[
          styles.box,
          { borderColor: checked ? colors.primary : colors.input, backgroundColor: checked ? colors.primary : colors.background },
        ]}>
        {checked ? <Ionicons name="checkmark" size={16} color={colors.onPrimary} /> : null}
      </View>
      <AppText variant="small" style={styles.checkLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

// Inline result line under a form; the icon and the words carry the meaning, not just the colour.
export function FormMessage({ tone, children }: { tone: 'danger' | 'success'; children: string }) {
  const { colors } = useAppTheme();
  const color = tone === 'danger' ? colors.danger : colors.success;
  return (
    <View accessibilityLiveRegion="polite" style={[styles.message, { borderColor: color, backgroundColor: colors.surface }]}>
      <Ionicons name={tone === 'danger' ? 'alert-circle-outline' : 'checkmark-circle-outline'} size={18} color={color} />
      <AppText variant="small" style={[styles.messageText, { color }]}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Space.xs },
  bold: { fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, minHeight: MIN_TOUCH },
  switchCopy: { flex: 1, gap: 2 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm + 4, minHeight: MIN_TOUCH, paddingVertical: Space.xs },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { flex: 1 },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm, borderWidth: 1, borderRadius: Corner.control, padding: Space.sm + 4 },
  messageText: { flex: 1 },
});
