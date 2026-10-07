import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen, BrandSectionHeader } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, useAdminEvents, useRemoveEventImage, useUpdateAdminEvent, useUploadEventImage } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { resolveImageUrl } from '@/lib/media';
import { useAuthStore } from '@/store/auth';

type EventFormValues = {
  name: string;
  description: string;
  eventDate: string;
  location: string;
  maxRegistrations: string;
};

export default function AdminEventEditScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const eventsQuery = useAdminEvents(isAdmin);
  const updateMutation = useUpdateAdminEvent();
  const { control, handleSubmit, reset } = useForm<EventFormValues>({
    defaultValues: { name: '', description: '', eventDate: '', location: '', maxRegistrations: '' },
  });

  const event = React.useMemo(
    () => (eventsQuery.data || []).find((item: any) => String(item?.id) === String(params.id)),
    [eventsQuery.data, params.id]
  );
  const uploadImage = useUploadEventImage(event?.id);
  const removeImage = useRemoveEventImage(event?.id);
  const imageUri = resolveImageUrl(event?.image_url);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [16, 9] });
    const asset = result.canceled ? undefined : result.assets?.[0];
    if (!asset) return;
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('Image too large', 'Choose an image under 5 MB.');
      return;
    }
    uploadImage.mutate(asset, {
      onError: (error) => Alert.alert('Could not upload', getApiErrorMessage(error, 'Please try again.')),
    });
  };

  React.useEffect(() => {
    if (event) {
      reset({
        name: event.name || '',
        description: event.description || '',
        eventDate: event.event_date || event.eventDate || '',
        location: event.location || '',
        maxRegistrations: event.max_registrations ? String(event.max_registrations) : '',
      });
    }
  }, [event, reset]);

  const onSubmit = async (values: EventFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: Number(params.id),
        payload: {
          name: values.name,
          description: values.description,
          eventDate: values.eventDate,
          location: values.location,
          maxRegistrations: values.maxRegistrations ? Number(values.maxRegistrations) : null,
        },
      });
      router.back();
    } catch {
      // inline error handles this
    }
  };

  if (!user || !isAdmin) {
    return (
      <BrandScreen>
        <BrandHero eyebrow="Edit Event" title="Admin access required" description="Sign in with an admin account to edit events." />
      </BrandScreen>
    );
  }

  return (
    <BrandScreen>
      <BrandHero eyebrow="Edit Event" title={event?.name || 'Edit event'} description="Update an event record from the mobile admin app." />
      <BrandCard>
        <BrandPill>Edit</BrandPill>
        <BrandSectionHeader title="Edit event" description="Adjust the key event details and save them back to ANT PRESS." />
        {!event ? (
          <ThemedText type="small">Loading event...</ThemedText>
        ) : (
          <>
            <View style={styles.imageBlock}>
              {imageUri ? <Image source={{ uri: imageUri }} style={styles.eventImage} contentFit="cover" /> : null}
              <BrandButton
                label={uploadImage.isPending ? 'Uploading...' : imageUri ? 'Change Image' : 'Add Image'}
                onPress={() => !uploadImage.isPending && pickImage()}
                variant="outline"
              />
              {imageUri ? (
                <BrandButton
                  label="Remove Image"
                  onPress={() =>
                    !removeImage.isPending &&
                    removeImage.mutate(undefined, {
                      onError: (error) => Alert.alert('Could not remove', getApiErrorMessage(error, 'Please try again.')),
                    })
                  }
                  variant="outline"
                />
              ) : null}
            </View>
            <Field control={control} name="name" label="Name" placeholder="Event name" />
            <Field control={control} name="description" label="Description" placeholder="Event description" multiline />
            <Field control={control} name="eventDate" label="Event Date" placeholder="2026-04-12T09:00:00.000Z" />
            <Field control={control} name="location" label="Location" placeholder="Event location" />
            <Field control={control} name="maxRegistrations" label="Max Registrations" placeholder="Optional capacity" />
            <BrandButton label="Save Changes" onPress={handleSubmit(onSubmit)} variant="secondary" />
            {updateMutation.isError ? (
              <ThemedText style={styles.errorText}>{getApiErrorMessage(updateMutation.error, 'Failed to update event.')}</ThemedText>
            ) : null}
          </>
        )}
      </BrandCard>
    </BrandScreen>
  );
}

function Field({ control, name, label, placeholder, multiline = false }: { control: any; name: keyof EventFormValues; label: string; placeholder: string; multiline?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={String(value ?? '')}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            multiline={multiline}
            style={[styles.input, multiline && styles.multiline, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageBlock: { gap: Spacing.two },
  eventImage: { width: '100%', height: 180, borderRadius: Radius.medium },
  field: { gap: Spacing.one },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  errorText: { color: '#B91C1C' },
});
