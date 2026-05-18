import SectionHeading from "@/components/ui/SectionHeading";
import TeamScroller from "@/components/ui/TeamScroller";
import { getTeam, getContent, type TeamMember } from "@/lib/db";
import Image from "next/image";

interface AboutSectionProps { id: string; }

function MemberPhoto({ member, large }: { member: TeamMember; large?: boolean }) {
  const sizeClass = large ? "w-40 h-40" : "w-24 h-24";
  const imgSize   = large ? 160 : 96;
  return (
    <div className={`relative rounded-lg overflow-hidden border border-[#3A2E26] bg-[#2A1F18] ${sizeClass}`}>
      {member.photo_url ? (
        <Image
          src={member.photo_url}
          alt={member.name}
          width={imgSize}
          height={imgSize}
          unoptimized
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-[family-name:var(--font-cormorant)] text-4xl text-[#7A6657]">
          {member.name.charAt(0) || "N"}
        </div>
      )}
    </div>
  );
}

export default async function AboutSection({ id }: AboutSectionProps) {
  const [team, content] = await Promise.all([getTeam(), getContent()]);

  if (team.length === 0) {
    return (
      <section id={id} className="py-24 lg:py-32">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <SectionHeading
            eyebrow="The Team"
            title={content["about_title"] ?? "Meet our"}
            accent="team"
            subtitle={content["about_subtitle"] ?? "Our talented artists are coming soon."}
          />
        </div>
      </section>
    );
  }

  const ownerIndex = team.findIndex((m) => m.role.toLowerCase().includes("owner"));
  const featured = team[ownerIndex !== -1 ? ownerIndex : 0];
  const rest = team.filter((m) => m.id !== featured.id);

  const restForScroller = rest.map((m) => ({
    id: m.id, name: m.name, role: m.role, bio: m.bio, photoUrl: m.photo_url,
  }));

  return (
    <section id={id} className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Team"
          title={content["about_title"] ?? "Meet our"}
          accent="team"
          subtitle={content["about_subtitle"] ?? "Talented artists who are passionate about making you feel beautiful."}
        />

        <div className="reveal flex justify-center mb-16">
          <div className="bg-[#2A1F18] border border-[#3A2E26]/60 rounded-lg p-10
                          flex flex-col items-center text-center max-w-sm w-full">
            <MemberPhoto member={featured} large />
            <h3 className="font-[family-name:var(--font-cormorant)] font-light text-3xl text-[#F0E4D8] mt-6 mb-2">
              {featured.name}
            </h3>
            <span className="inline-block text-[#D89AAE] text-[10px] font-[family-name:var(--font-montserrat)] font-medium tracking-[0.22em] uppercase mb-5">
              {featured.role}
            </span>
            <p className="text-[#B8A89A] text-sm leading-relaxed font-light">{featured.bio}</p>
          </div>
        </div>

        {restForScroller.length > 0 && (
          <>
            <p className="text-center text-[11px] font-[family-name:var(--font-montserrat)] font-medium uppercase tracking-[0.22em] text-[#B8A89A] mb-8">
              Our Team
            </p>
            <TeamScroller members={restForScroller} />
          </>
        )}
      </div>
    </section>
  );
}
