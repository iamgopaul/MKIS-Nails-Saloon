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
      <div className={`relative rounded-full p-[3px] bg-gradient-to-br from-[#E07898] to-[#C9956B] ${sizeClass}`}>
        <div className="rounded-full bg-white w-full h-full overflow-hidden">
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
            <div className="w-full h-full flex items-center justify-center display-md text-4xl text-[#A89484]">
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
      <section id={id} className="py-24 bg-[#F5EDE6]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionHeading
            eyebrow="The team"
            title={content["about_title"] ?? "Meet our team"}
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
    <section id={id} className="py-24 bg-[#F5EDE6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow="The team"
          title={content["about_title"] ?? "Meet our team"}
          subtitle={content["about_subtitle"] ?? "Talented artists who are passionate about making you feel beautiful."}
        />

        <div className="flex justify-center mb-14">
          <div className="bg-white rounded-3xl p-10 border border-[#EADBD2]
                          shadow-[0_20px_50px_-25px_rgba(26,20,16,0.18)]
                          flex flex-col items-center text-center max-w-sm w-full">
            <MemberPhoto member={featured} large />
            <h3 className="display-md text-2xl text-[#1A1410] mt-6 mb-2">
              {featured.name}
            </h3>
            <span className="inline-block px-3 py-1 rounded-full bg-[#FCE7EE]
                             text-[#C45E7A] text-[11px] font-medium mb-5 tracking-wide">
              {featured.role}
            </span>
            <p className="text-[#6B5448] text-sm leading-relaxed font-light">{featured.bio}</p>
          </div>
        </div>

        {restForScroller.length > 0 && (
          <>
            <p className="text-center text-[11px] font-medium uppercase tracking-[0.22em] text-[#A89484] mb-8">
              Our Team
            </p>
            <TeamScroller members={restForScroller} />
          </>
        )}
      </div>
    </section>
  );
}
