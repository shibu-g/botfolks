export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse-soft rounded-md bg-white/[.06] ${className}`} aria-hidden="true" />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-surface p-5 sm:p-7">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-7 w-16" />
    </div>
  );
}

export function BotCardSkeleton() {
  return (
    <div className="flex h-[250px] w-[250px] flex-col rounded-lg border border-line bg-surface p-5">
      <Skeleton className="h-11 w-11 rounded-md" />
      <Skeleton className="mt-4 h-4 w-4/5" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <div className="mt-auto flex flex-col gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
