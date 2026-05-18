interface SectionHeadingProps {
  /** Full section title. The last word is automatically italicized in rose
      unless `accent` is provided to override that behavior. */
  title: string;
  /** Override which trailing word is italicized. Pass empty string to disable. */
  accent?: string;
  subtitle?: string;
  centered?: boolean;
  eyebrow?: string;
}

function splitTitle(title: string, accent: string | undefined): [string, string] {
  if (accent === "") return [title, ""];
  if (accent) {
    // Strip trailing accent (case-insensitive) so we don't render it twice
    const re = new RegExp(`\\s*${accent}\\s*$`, "i");
    const head = title.replace(re, "").trim();
    return [head, accent];
  }
  const idx = title.trim().lastIndexOf(" ");
  if (idx < 0) return ["", title.trim()];
  return [title.slice(0, idx).trim(), title.slice(idx + 1).trim()];
}

export default function SectionHeading({
  title,
  subtitle,
  centered = true,
  eyebrow,
  accent,
}: SectionHeadingProps) {
  const [head, tail] = splitTitle(title, accent);

  return (
    <div className={`mb-16 reveal ${centered ? "text-center" : ""}`}>
      {eyebrow && (
        <p className="text-[11px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.28em] uppercase text-[#D89AAE] mb-5">
          {eyebrow}
        </p>
      )}
      <h2 className="font-[family-name:var(--font-cormorant)] font-light text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.05] text-[#F0E4D8] mb-6">
        {head}
        {tail && (
          <>
            {head ? " " : ""}
            <span className="italic text-[#D89AAE]">{tail}</span>
          </>
        )}
      </h2>
      {subtitle && (
        <p className="text-[#B8A89A] text-base md:text-lg max-w-xl mx-auto leading-relaxed font-light">
          {subtitle}
        </p>
      )}
    </div>
  );
}
