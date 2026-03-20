'use client';

import React from 'react';
import Link from 'next/link';
import { useProfile, useDonations, usePrayerRequests } from '@/hooks/useApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: donations } = useDonations();
  const { data: prayers } = usePrayerRequests();

  return (
    <div className="container-max py-12 sm:py-16">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Member Dashboard</h1>
          <p className="mt-2 text-sm text-ui-subtle">Track your profile, giving, and prayer activity in one place.</p>
        </div>
        <Button asChild>
          <Link href="/donate">Make a Donation</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ui-muted">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-sm text-ui-subtle">{profile?.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ui-muted">Recent donations: {donations?.length || 0}</p>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/donate">Give Again</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prayer Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ui-muted">Your requests: {prayers?.length || 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
