'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type Registration = {
  id: number;
  created_at: string;
  event_name?: string;
  name?: string;
};

async function fetchRegistrations(): Promise<Registration[]> {
  const res = await apiClient.get('/events/registrations/user');
  return res.data.data;
}

export default function RegistrationsPage() {
  const { data, isLoading } = useQuery<Registration[]>({
    queryKey: ['registrations'],
    queryFn: fetchRegistrations,
  });

  return (
    <div className="container-max py-12 sm:py-16">
      <Card>
        <CardHeader>
          <CardTitle>Your Event Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-ui-subtle">Loading...</p>}
          {!isLoading && (!data || data.length === 0) && <p className="text-ui-subtle">No registrations yet.</p>}
          {!isLoading && data && (
            <ul className="space-y-3">
              {data.map((r) => (
                <li key={r.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="font-semibold">{r.event_name || r.name}</div>
                  <div className="text-sm text-ui-subtle">Registered at: {new Date(r.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

