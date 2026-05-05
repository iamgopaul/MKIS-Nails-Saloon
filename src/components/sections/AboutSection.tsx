import SectionHeading from "@/components/ui/SectionHeading";
import TeamScroller from "@/components/ui/TeamScroller";
import { getTeam, getContent, type TeamMember } from "@/lib/db";
import Image from "next/image";

interface AboutSectionProps { id: string; }

function MemberPhoto({ member, large }: { member: TeamMember; large?: boolean }) {
  const sizeClass = large ? "w-40 h-40" : "w-24 h-24";
  const imgSize   = large ? 160 : 96;
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E07898] to-[#C9956B] blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
      <div className={`relative rounded-full p-[3px] bg-gradient-to-br from-[#E07898] via-[#C9956B] to-[#D4A882] ${sizeClass}`}>
        <div className="rounded-full bg-[#1C1614] w-full h-full overflow-hidden">
          {member.photo_url ? (
            <Image
              src={member.photo_url}
              alt={member.name}
              width={imgSize}
              height={imgSize}
              unoptimized
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-[#9A7060]">
              {member.name.charAt(0) || "N"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function AboutSection({ id }: AboutSectionProps) {
  const [team, content] = await Promise.all([getTeam(), getContent()]);

  if (team.length === 0) {
    return (
      <section id={id} className="py-24 bg-[#0A0A0A]/85 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionHeading
            title={content["about_title"] ?? "Meet Our Team"}
            subtitle={content["about_subtitle"] ?? "Our talented artists are coming soon."}
          />
        </div>
      </section>
    );
  }

  const ownerIndex = team.findIndex((m) => m.role.toLowerCase().includes("owner"));
  const featured = team[ownerIndex !== -1 ? ownerIndex : 0];
  const rest = team.filter((m) => m.id !== featured.id);

  // Adapt for TeamScroller's existing prop shape
  const restForScroller = rest.map((m) => ({
    id: m.id, name: m.name, role: m.role, bio: m.bio, photoUrl: m.photo_url,
  }));

  return (
    <section id={id} className="py-24 bg-[#0A0A0A]/85 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={content["about_title"] ?? "Meet Our Team"}
          subtitle={content["about_subtitle"] ?? "Talented artists who are passionate about making you feel beautiful."}
        />

        <div className="flex justify-center mb-12">
          <div className="group bg-[#1C1614] rounded-3xl p-10 border border-[#E07898]/30
                          hover:border-[#E07898]/60 hover:shadow-2xl hover:shadow-[#E07898]/10
                          transition-all duration-300 flex flex-col items-center text-center max-w-sm w-full">
            <MemberPhoto member={featured} large />
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#F5EDE6] mt-6 mb-2">
              {featured.name}
            </h3>
            <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-[#E07898]/20 to-[#C9956B]/20
                             border border-[#E07898]/40 text-[#E07898] text-xs font-semibold mb-5 tracking-wide">
              {featured.role}
            </span>
            <p className="text-[#9A7060] text-sm leading-relaxed">{featured.bio}</p>
          </div>
        </div>

        {restForScroller.length > 0 && (
          <>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#9A7060]/60 mb-8">
              Our Team
            </p>
            <TeamScroller members={restForScroller} />
          </>
        )}
      </div>
    </section>
  );
}
