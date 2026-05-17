interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  eyebrow?: string;
}

export default function SectionHeading({
  title,
  subtitle,
  centered = true,
  eyebrow,
}: SectionHeadingProps) {
  return (
    <div className={`mb-14 ${centered ? "text-center" : ""}`}>
      {eyebrow && (
        <p className="text-[11px] font-medium tracking-[0.25em] uppercase text-[#C45E7A] mb-4">
          {eyebrow}
        </p>
      )}
      <h2 className="display text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.05] text-[#1A1410] mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[#6B5448] text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-light">
          {subtitle}
        </p>
      )}
    </div>
  );
}
