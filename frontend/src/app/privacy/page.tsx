import LegalDocument, { type LegalSection } from '@/components/site/LegalDocument';

const sections: LegalSection[] = [
  {
    heading: 'Information We Collect',
    body: 'We collect account details you provide (name, email, phone), plus activity data related to events, prayer requests, and donations.',
  },
  {
    heading: 'How We Use Information',
    body: 'Your information is used for church communication, member support, event coordination, and secure platform operations.',
  },
  {
    heading: 'Data Protection',
    body: 'We apply reasonable security measures to protect personal data and limit access to authorized administrators and system processes.',
  },
  {
    heading: 'Sharing',
    body: 'We do not sell personal data. Information is only shared where required for payment processing, legal obligations, or trusted service operation.',
  },
  {
    heading: 'Contact',
    body: 'If you have questions about your privacy or data usage, contact the church admin team through the Contact page.',
  },
];

export default function PrivacyPage() {
  return <LegalDocument title="Privacy Policy" description="How ANT PRESS collects, uses and protects your information." sections={sections} />;
}
