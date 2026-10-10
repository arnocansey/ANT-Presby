'use client';

import React from 'react';
import { Banknote, CheckCircle2, Hourglass } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import StatCard from '@/components/admin/stat-card';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { statusLabel, statusTone } from '@/components/admin/status';
import { useAdminDonations, useUpdateDonationStatus } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';

type Donation = {
  id: number;
  reference: string;
  amount: number | string;
  status: string;
  donation_type?: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  created_at?: string;
};

const STATUS_OPTIONS = ['pending', 'completed', 'failed', 'cancelled'];

export default function AdminDonationsPage() {
  const { data, isLoading, isError, refetch } = useAdminDonations();
  const updateStatus = useUpdateDonationStatus();
  const [statusFilter, setStatusFilter] = React.useState('');
  const [query, setQuery] = React.useState('');
  const donations = (data ?? []) as Donation[];

  const filteredDonations = donations.filter((donation) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      String(donation.reference || '').toLowerCase().includes(q) ||
      String(donation.email || '').toLowerCase().includes(q) ||
      String(donation.donation_type || '').toLowerCase().includes(q);
    const matchesStatus = !statusFilter || donation.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const filtering = Boolean(query.trim() || statusFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Donations' }]}
        title="Donations"
        description="Track donation records and update their status."
      />

      <section aria-label="Totals" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="All records" icon={Banknote} loading={isLoading} value={donations.length} />
        <StatCard
          label="Completed"
          icon={CheckCircle2}
          loading={isLoading}
          value={donations.filter((item) => item.status === 'completed').length}
        />
        <StatCard
          label="Pending"
          icon={Hourglass}
          loading={isLoading}
          value={donations.filter((item) => item.status === 'pending').length}
        />
      </section>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <div className="w-full sm:max-w-sm">
          <Input
            aria-label="Search donations"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by reference, email or type"
          />
        </div>
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="sm:w-48"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton label="Loading donations" />
      ) : isError && donations.length === 0 ? (
        <LoadError what="donations" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage={filtering ? 'No donations match the current filters.' : 'No donations yet.'}
          columns={[
            {
              key: 'reference',
              header: 'Reference',
              render: (donation: Donation) => (
                <div>
                  <p className="font-semibold text-foreground">{donation.reference || `Donation #${donation.id}`}</p>
                  <p className="text-xs text-muted">{donation.email || 'No email attached'}</p>
                </div>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              render: (donation: Donation) => <span className="font-semibold tabular-nums">{formatCurrency(donation.amount)}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (donation: Donation) => <Badge tone={statusTone(donation.status)}>{statusLabel(donation.status)}</Badge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (donation: Donation) => (
                <div className="flex flex-wrap gap-2">
                  {donation.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateStatus.mutate({ id: donation.id, status: 'completed' })}
                      disabled={updateStatus.isPending}
                    >
                      Mark completed
                    </Button>
                  )}
                  {donation.status !== 'failed' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateStatus.mutate({ id: donation.id, status: 'failed' })}
                      disabled={updateStatus.isPending}
                    >
                      Mark failed
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredDonations}
        />
      )}
    </div>
  );
}
