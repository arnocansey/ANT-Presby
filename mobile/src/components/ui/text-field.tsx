import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function TextField({ label, error, hint, style, ...props }: TextInputProps & { label: string; error?: string; hint?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.field}>
      <AppText variant="small" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        // VoiceOver/TalkBack read the error (or hint) with the field, so the reason is never silent.
        accessibilityHint={error || hint}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.background, borderColor: error ? colors.danger : colors.input },
          props.multiline && styles.multiline,
          style,
        ]}
        {...props}
      />
      {error ? (
        <AppText variant="small" tone="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="small" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Space.xs },
  label: { fontWeight: '600' },
  input: { minHeight: MIN_TOUCH, borderWidth: 1, borderRadius: Corner.control, paddingHorizontal: Space.md, fontSize: 16 },
  multiline: { minHeight: 110, paddingTop: Space.sm + 4, textAlignVertical: 'top' },
});

export default TextField;
