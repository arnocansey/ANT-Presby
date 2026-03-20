'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="container-max py-12 sm:py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight sm:text-3xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-ui-muted">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">1. Information We Collect</h2>
            <p>
              We collect account details you provide (name, email, phone), plus activity data related to
              events, prayer requests, and donations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">2. How We Use Information</h2>
            <p>
              Your information is used for church communication, member support, event coordination, and
              secure platform operations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">3. Data Protection</h2>
            <p>
              We apply reasonable security measures to protect personal data and limit access to authorized
              administrators and system processes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">4. Sharing</h2>
            <p>
              We do not sell personal data. Information is only shared where required for payment processing,
              legal obligations, or trusted service operation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">5. Contact</h2>
            <p>
              If you have questions about your privacy or data usage, contact the church admin team through
              the Contact page.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
