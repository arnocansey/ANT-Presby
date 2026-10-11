'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import QrCode from '@/components/attendance/QrCode';
import { useCheckInCards } from '@/hooks/useApi';

// The API returns at most this many cards in one go.
const CARD_LIMIT = 1000;

const parseIds = (value: string | null) =>
  (value ?? '')
    .split(',')
    .map((part) => Number(part))
    .filter((id) => Number.isInteger(id) && id > 0);

// Printable check-in cards for members without a smartphone (A4, three across).
// ?ids=1,2 prints chosen members (e.g. one lost card); no ids prints every active member.
function PrintCheckInCards() {
  const ids = parseIds(useSearchParams().get('ids'));
  const { data: cards, isLoading, isError, refetch } = useCheckInCards(ids.length ? ids : undefined);
  const chosen = ids.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-3 print:hidden">
        <PageHeader
          breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Members', href: '/admin/users' }, { label: 'Check-in cards' }]}
          title="Check-in cards"
          description={
            chosen
              ? 'Cards for the members you chose. Print, cut out and hand them over.'
              : 'Cards for every active member. Print, cut them out and hand them to members. Ushers scan them at the entrance.'
          }
          actions={
            <Button onClick={() => window.print()} disabled={!cards?.length}>
              <Printer className="h-4 w-4" aria-hidden="true" /> Print
            </Button>
          }
        />
        {chosen ? (
          <p className="text-sm text-muted">
            <Link href="/admin/users/cards" className="font-semibold text-link hover:underline">
              Show cards for every member instead
            </Link>
          </p>
        ) : null}
        {!chosen && cards?.length === CARD_LIMIT ? (
          <p role="status" className="text-sm text-warning">
            Only the first {CARD_LIMIT} members are shown. Use Print card on the Members page for anyone else.
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <CardListSkeleton count={3} label="Loading cards" />
      ) : isError && !cards ? (
        <LoadError what="check-in cards" onRetry={() => refetch()} />
      ) : !cards?.length ? (
        <p className="text-sm text-muted">No active members to print.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3">
          {cards.map((card) => {
            const name = `${card.first_name || ''} ${card.last_name || ''}`.trim() || 'Member';
            return (
              <li
                key={card.id}
                className="flex break-inside-avoid flex-col items-center gap-2 rounded-lg border border-border bg-white p-4 text-center text-black"
              >
                <Image src="/brand/crest.png" width={32} height={32} alt="" />
                <p className="text-sm font-semibold">{name}</p>
                <QrCode text={card.qr_text} size={140} label={`Check-in card for ${name}`} />
                <p className="font-mono text-xs tracking-widest">{card.code}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function PrintCheckInCardsPage() {
  return (
    <React.Suspense fallback={<CardListSkeleton count={3} label="Loading cards" />}>
      <PrintCheckInCards />
    </React.Suspense>
  );
}
