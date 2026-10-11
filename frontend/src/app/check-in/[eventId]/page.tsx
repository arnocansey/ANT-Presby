'use client';

import { useParams } from 'next/navigation';
import CheckInSheet from '@/components/attendance/CheckInSheet';

export default function CheckInEventPage() {
  const params = useParams<{ eventId: string }>();
  const id = Number(params?.eventId);
  return <CheckInSheet eventId={Number.isInteger(id) && id > 0 ? id : undefined} />;
}
