'use client';

import { Button } from '@/components/ui/button';

// Google sign-in is wired only when a client id is configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID).
// Until then the button is shown but disabled, with a "coming soon" note.
export const isGoogleSignInConfigured = () => Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export default function GoogleButton({ onClick, pending }: { onClick: () => void; pending: boolean }) {
  if (!isGoogleSignInConfigured()) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          disabled
          aria-describedby="google-signin-soon"
        >
          Continue with Google
        </Button>
        <p id="google-signin-soon" className="text-center text-xs text-muted">
          Google sign-in is coming soon.
        </p>
      </div>
    );
  }

  return (
    <Button type="button" variant="secondary" size="lg" className="w-full" onClick={onClick} loading={pending}>
      {pending ? 'Connecting to Google...' : 'Continue with Google'}
    </Button>
  );
}
