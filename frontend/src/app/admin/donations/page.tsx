'use client';

import React from 'react';
import SimpleTable from '@/components/ui/table';
import { useAdminDonations, useUpdateDonationStatus } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

export default function AdminDonationsPage() {
  const { data, isLoading } = useAdminDonations();
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

  return (
    <div className="container-max space-y-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Donations</h1>
          <p className="mt-2 text-sm text-ui-subtle">Track donation records and update completion states.</p>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by reference, email, or type"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">All statuses</option>
            <option value="pending">pending</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Total Records</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{donations.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Completed</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{donations.filter((item) => item.status === 'completed').length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Pending</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{donations.filter((item) => item.status === 'pending').length}</CardContent></Card>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-4 text-sm text-ui-subtle">Loading donations...</CardContent></Card>
      ) : filteredDonations.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-4 text-sm text-ui-subtle">No donations match the current filters.</CardContent></Card>
      ) : (
        <SimpleTable
          columns={[
            {
              key: 'reference',
              header: 'Reference',
              render: (donation: Donation) => (
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{donation.reference || `Donation #${donation.id}`}</p>
                  <p className="text-xs text-ui-subtle">{donation.email || 'No email attached'}</p>
                </div>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              render: (donation: Donation) => `GHS ${Number(donation.amount || 0).toLocaleString()}`,
            },
            {
              key: 'status',
              header: 'Status',
              render: (donation: Donation) => (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${donation.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : donation.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                  {donation.status}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (donation: Donation) => (
                <div className="flex gap-2">
                  {donation.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus.mutate({ id: donation.id, status: 'completed' })}
                      disabled={updateStatus.isPending}
                    >
                      Mark Completed
                    </Button>
                  )}
                  {donation.status !== 'failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus.mutate({ id: donation.id, status: 'failed' })}
                      disabled={updateStatus.isPending}
                    >
                      Mark Failed
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
