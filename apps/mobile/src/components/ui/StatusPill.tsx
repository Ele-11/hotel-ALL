type StatusPillProps = {
  label: string;
};

export function StatusPill({ label }: StatusPillProps) {
  return (
    <span className="rounded-full border border-[#ddd1bd] bg-[#fffdf8] px-3 py-1 text-xs font-semibold text-slate-700">
      {label}
    </span>
  );
}
