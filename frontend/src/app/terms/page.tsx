'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="container-max py-12 sm:py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight sm:text-3xl">Terms and Agreement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-ui-muted">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">1. Membership Account</h2>
            <p>
              By creating an account, you confirm that the information you provide is accurate and that
              you are responsible for maintaining the confidentiality of your login credentials.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">2. Acceptable Use</h2>
            <p>
              You agree to use ANT PRESS respectfully and lawfully. Misuse, abusive behavior, or
              unauthorized access attempts may result in account suspension.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">3. Donations and Events</h2>
            <p>
              Donations and event registrations made through the platform must be genuine. The church may
              contact you to verify suspicious activity or confirm updates.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">4. Privacy</h2>
            <p>
              Your personal information is processed for church communication, event management, and
              ministry support. Please review the privacy policy for full details.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">5. Updates to Terms</h2>
            <p>
              These terms may be updated periodically. Continued use of the platform after updates means
              you accept the revised terms.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
