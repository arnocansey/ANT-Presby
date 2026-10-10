import LegalDocument, { type LegalSection } from '@/components/site/LegalDocument';

const sections: LegalSection[] = [
  {
    heading: 'Membership Account',
    body: 'By creating an account, you confirm that the information you provide is accurate and that you are responsible for maintaining the confidentiality of your login credentials.',
  },
  {
    heading: 'Acceptable Use',
    body: 'You agree to use ANT PRESS respectfully and lawfully. Misuse, abusive behavior, or unauthorized access attempts may result in account suspension.',
  },
  {
    heading: 'Donations and Events',
    body: 'Donations and event registrations made through the platform must be genuine. The church may contact you to verify suspicious activity or confirm updates.',
  },
  {
    heading: 'Privacy',
    body: 'Your personal information is processed for church communication, event management, and ministry support. Please review the privacy policy for full details.',
  },
  {
    heading: 'Updates to Terms',
    body: 'These terms may be updated periodically. Continued use of the platform after updates means you accept the revised terms.',
  },
];

export default function TermsPage() {
  return <LegalDocument title="Terms and Agreement" description="The terms for using ANT PRESS and your member account." sections={sections} />;
}
