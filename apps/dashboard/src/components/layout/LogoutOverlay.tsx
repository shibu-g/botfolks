export function LogoutOverlay() {
  return (
    <div className="fixed inset-0 z-[999] flex animate-fade-in flex-col items-center justify-center gap-4 bg-bg/80 backdrop-blur-sm">
      <span className="h-9 w-9 animate-spin rounded-full border-2 border-accent/25 border-t-accent" />
      <p className="text-[14px] font-medium text-muted">Logging you out…</p>
    </div>
  );
}
