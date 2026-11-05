export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--ink)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-2 border-[color:var(--hairline)] border-t-[color:var(--ember)] rounded-full animate-spin" />
        <p className="muted text-[13.5px]">Loading</p>
      </div>
    </div>
  );
}
