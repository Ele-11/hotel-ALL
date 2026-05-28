type FeatureCardProps = {
  description: string;
  title: string;
};

export function FeatureCard({ description, title }: FeatureCardProps) {
  return (
    <article className="rounded-[24px] border border-[#efe5d6] bg-[#faf5ec] p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}
