import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/ui/page-header';

export type LegalSection = { heading: string; body: string };

// Shared layout for Privacy and Terms: numbered sections in one readable column.
export default function LegalDocument({
  title,
  description,
  sections,
}: {
  title: string;
  description?: string;
  sections: LegalSection[];
}) {
  return (
    <div className="container-max py-10 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <PageHeader title={title} description={description} breadcrumb={[{ label: 'About', href: '/about' }, { label: title }]} />
        <Card>
          <CardContent className="space-y-6 p-6 sm:p-8">
            {sections.map((section, index) => (
              <section key={section.heading} className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {index + 1}. {section.heading}
                </h2>
                <p className="leading-relaxed text-foreground/85">{section.body}</p>
              </section>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
