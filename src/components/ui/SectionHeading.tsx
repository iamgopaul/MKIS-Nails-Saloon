interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export default function SectionHeading({ title, subtitle, centered = true }: SectionHeadingProps) {
  return (
    <div className={`mb-12 ${centered ? "text-center" : ""}`}>
      <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl lg:text-5xl font-bold text-[#F5EDE6] mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[#9A7060] text-lg max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className={`mt-4 h-0.5 w-20 bg-gradient-to-r from-[#E07898] via-[#C9956B] to-[#E07898] rounded-full ${centered ? "mx-auto" : ""}`} />
    </div>
  );
}
