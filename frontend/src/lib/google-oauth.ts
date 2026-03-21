declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (error: { type?: string }) => void;
          }) => { requestAccessToken: (options?: { prompt?: string }) => void };
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

export const loadGoogleIdentityScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google OAuth is only available in the browser'));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');

      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Google OAuth')), {
          once: true,
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google OAuth'));
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
};

export const requestGoogleAccessToken = async (clientId: string) => {
  if (!clientId) {
    throw new Error('Google OAuth is not configured yet');
  }

  await loadGoogleIdentityScript();

  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'Google sign-in failed'));
          return;
        }

        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error?.type || 'Google sign-in failed'));
      },
    });

    if (!tokenClient) {
      reject(new Error('Google OAuth is not available'));
      return;
    }

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });
};
