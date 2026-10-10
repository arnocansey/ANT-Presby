// Month/day block used on event lists (matches the hub Home event cards).
export default function DateBadge({ date }: { date: Date }) {
  const valid = !Number.isNaN(date.getTime());
  return (
    <span
      className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground"
      aria-hidden="true"
    >
      <span className="text-[11px] font-semibold uppercase">
        {valid ? date.toLocaleDateString('en-GB', { month: 'short' }) : 'TBA'}
      </span>
      <span className="text-xl font-bold leading-none">{valid ? date.getDate() : ''}</span>
    </span>
  );
}
