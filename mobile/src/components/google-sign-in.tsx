import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { FormMessage } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { getApiErrorMessage, useGoogleLogin } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';

const CLIENT_IDS = {
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

// Google's auth hook throws during render when this platform's client id is missing, which closes the app.
// Screens render <GoogleSignIn /> only when this is true, so a build without Google ids simply hides the button.
export const isGoogleSignInConfigured = (): boolean =>
  Boolean(Platform.select({ android: CLIENT_IDS.android, ios: CLIENT_IDS.ios, default: CLIENT_IDS.web }));

export function GoogleSignIn({ pendingLabel = 'Connecting...' }: { pendingLabel?: string }) {
  const { colors } = useAppTheme();
  const googleLoginMutation = useGoogleLogin();
  const signInWithGoogle = googleLoginMutation.mutateAsync;
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: CLIENT_IDS.android,
    iosClientId: CLIENT_IDS.ios,
    webClientId: CLIENT_IDS.web,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'token',
  });

  React.useEffect(() => {
    if (response?.type !== 'success') return;
    const accessToken =
      response.authentication?.accessToken ||
      (typeof response.params?.access_token === 'string' ? response.params.access_token : '');
    if (!accessToken) return;

    signInWithGoogle(accessToken)
      .then((session) => router.replace(session.user?.role === 'admin' ? '/admin' : '/account'))
      .catch(() => undefined); // The inline message below shows the error.
  }, [response, signInWithGoogle]);

  return (
    <>
      <AppButton
        label={googleLoginMutation.isPending ? pendingLabel : 'Continue with Google'}
        variant="secondary"
        icon={<Ionicons name="logo-google" size={18} color={colors.text} />}
        disabled={!request || googleLoginMutation.isPending}
        onPress={() => promptAsync()}
      />
      {googleLoginMutation.isError ? (
        <FormMessage tone="danger">{getApiErrorMessage(googleLoginMutation.error, 'Google sign-in failed.')}</FormMessage>
      ) : null}
    </>
  );
}

// Shown until Google sign-in is configured: the button is visible but disabled, with a "coming soon" note.
export function GoogleSignInPlaceholder() {
  const { colors } = useAppTheme();
  return (
    <>
      <AppButton
        label="Continue with Google"
        variant="secondary"
        icon={<Ionicons name="logo-google" size={18} color={colors.muted} />}
        disabled
        accessibilityLabel="Continue with Google, coming soon"
      />
      <AppText variant="small" tone="muted" style={{ textAlign: 'center' }}>
        Google sign-in is coming soon.
      </AppText>
    </>
  );
}

// The real button once a client id is configured, otherwise the placeholder.
export function GoogleSignInOption({ pendingLabel }: { pendingLabel?: string }) {
  return isGoogleSignInConfigured() ? <GoogleSignIn pendingLabel={pendingLabel} /> : <GoogleSignInPlaceholder />;
}

export default GoogleSignIn;
