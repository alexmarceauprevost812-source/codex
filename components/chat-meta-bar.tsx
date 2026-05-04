export function ChatMetaBar({
  branch,
  added,
  removed,
}: {
  branch: string | null;
  added: number;
  removed: number;
}) {
  return (
    <div className="flex items-center justify-between px-3 pb-1.5 text-[11px] text-[var(--fg-45)]">
      <div className="flex min-w-0 items-center gap-1.5">
        <BranchIcon />
        <span className="truncate font-mono">
          {branch ?? "non connecté"}
        </span>
      </div>
      <div className="flex items-center gap-2 font-mono tabular-nums">
        <span className="text-emerald-500">+{added}</span>
        <span className="text-red-500">−{removed}</span>
      </div>
    </div>
  );
}

function BranchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}
