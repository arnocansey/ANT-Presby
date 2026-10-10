import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';

import { FormMessage, FormTextField, LoadingList, MediaFrame, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Corner } from '@/constants/tokens';
import { getApiErrorMessage, useAdminEvents, useRemoveEventImage, useUpdateAdminEvent, useUploadEventImage } from '@/hooks/use-api';
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
      <Screen>
        <ScreenHeader back eyebrow="Edit event" title="Admin access required" subtitle="Sign in with an admin account to edit events." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader back eyebrow="Edit event" title={event?.name || 'Edit event'} />
      {!event ? (
        <LoadingList count={3} height={72} />
      ) : (
        <>
          <AppCard>
            <AppText variant="bodyStrong">Cover image</AppText>
            {imageUri ? <MediaFrame uri={imageUri} height={180} radius={Corner.control} accessibilityLabel="Event cover image" /> : null}
            <AppButton
              label={uploadImage.isPending ? 'Uploading...' : imageUri ? 'Change image' : 'Add image'}
              variant="secondary"
              onPress={() => !uploadImage.isPending && pickImage()}
            />
            {imageUri ? (
              <AppButton
                label="Remove image"
                variant="danger"
                onPress={() =>
                  !removeImage.isPending &&
                  removeImage.mutate(undefined, {
                    onError: (error) => Alert.alert('Could not remove', getApiErrorMessage(error, 'Please try again.')),
                  })
                }
              />
            ) : null}
          </AppCard>

          <AppCard>
            <AppText variant="bodyStrong">Details</AppText>
            <FormTextField control={control} name="name" label="Name" placeholder="Event name" />
            <FormTextField control={control} name="description" label="Description" placeholder="Event description" multiline />
            <FormTextField
              control={control}
              name="eventDate"
              label="Event date"
              placeholder="2026-04-12T09:00:00.000Z"
              hint="ISO format, for example 2026-04-12T09:00:00.000Z"
              autoCapitalize="none"
            />
            <FormTextField control={control} name="location" label="Location" placeholder="Event location" />
            <FormTextField control={control} name="maxRegistrations" label="Max registrations" placeholder="Optional capacity" keyboardType="number-pad" />
            <AppButton label="Save changes" onPress={handleSubmit(onSubmit)} loading={updateMutation.isPending} />
            {updateMutation.isError ? (
              <FormMessage tone="danger">{getApiErrorMessage(updateMutation.error, 'Failed to update event.')}</FormMessage>
            ) : null}
          </AppCard>
        </>
      )}
    </Screen>
  );
}
