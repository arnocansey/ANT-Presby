import Image from 'next/image';
import { cn } from '@/lib/utils';

// The church crest (built from branding/pcglogo.png by scripts/build-brand-assets.mjs).
// Its white areas are filled, so it reads correctly on light and dark backgrounds.
export default function Crest({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/crest.png"
      alt=""
      width={31}
      height={40}
      priority
      className={cn('h-10 w-auto shrink-0', className)}
    />
  );
}
