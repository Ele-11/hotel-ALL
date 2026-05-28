type RoleCardProps = {
  description: string;
  title: string;
};

export function RoleCard({ description, title }: RoleCardProps) {
  return (
    <div className="rounded-[22px] border border-[#efe5d6] bg-[#faf5ec] p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
