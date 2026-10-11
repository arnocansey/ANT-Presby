'use client';

import Image from 'next/image';
import { Printer } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import QrCode from '@/components/attendance/QrCode';
import { useCheckInCards } from '@/hooks/useApi';

// Printable check-in cards for members without a smartphone (A4, three across).
export default function PrintCheckInCardsPage() {
  const { data: cards, isLoading, isError, refetch } = useCheckInCards();

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader
          breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Members', href: '/admin/users' }, { label: 'Check-in cards' }]}
          title="Check-in cards"
          description="Print these, cut them out and hand them to members. Ushers scan them at the entrance."
          actions={
            <Button onClick={() => window.print()} disabled={!cards?.length}>
              <Printer className="h-4 w-4" aria-hidden="true" /> Print
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <CardListSkeleton count={3} label="Loading cards" />
      ) : isError && !cards ? (
        <LoadError what="check-in cards" onRetry={() => refetch()} />
      ) : !cards?.length ? (
        <p className="text-sm text-muted">No active members yet.</p>
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
