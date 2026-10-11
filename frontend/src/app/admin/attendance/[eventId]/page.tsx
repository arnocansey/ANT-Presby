import { redirect } from 'next/navigation';

// The check-in sheet moved to /check-in so ushers can use it too.
export default async function OldCheckInPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  redirect(`/check-in/${encodeURIComponent(eventId)}`);
}
