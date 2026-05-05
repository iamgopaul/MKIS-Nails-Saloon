import SectionHeading from "@/components/ui/SectionHeading";
import TeamScroller from "@/components/ui/TeamScroller";
import { getTeam, getContent, type TeamMember } from "@/lib/airtableAdmin";
import Image from "next/image";

interface AboutSectionProps {
  id: string;
}

function MemberPhoto({ member, large }: { member: TeamMember; large?: boolean }) {
  const sizeClass = large ? "w-40 h-40" : "w-24 h-24";
  const imgSize   = large ? 160 : 96;
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E07898] to-[#C9956B] blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
      <div className={`relative rounded-full p-[3px] bg-gradient-to-br from-[#E07898] via-[#C9956B] to-[#D4A882] ${sizeClass}`}>
        <div className="rounded-full bg-[#1C1614] w-full h-full overflow-hidden">
          {member.photoUrl ? (
            <Image
              src={member.photoUrl}
              alt={member.name}
              width={imgSize}
              height={imgSize}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-[#9A7060]">
              N
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function AboutSection({ id }: AboutSectionProps) {
  const [team, content] = await Promise.all([getTeam(), getContent()]);

  const displayTeam: TeamMember[] = team.length === 0 ? [
    { id: "p1", name: "Kristin Harricharan", role: "Owner — Head Nail Technician", bio: "Founder of MKIS Nails Saloon and lead artist. Bringing precision, creativity, and passion to every set.", photoUrl: "", order: 1, active: true },
    { id: "p2", name: "Ashley Monroe",       role: "Senior Nail Technician",        bio: "Specialises in gel extensions and intricate nail art with over 5 years of experience.", photoUrl: "", order: 2, active: true },
    { id: "p3", name: "Tiana Joseph",        role: "Nail Technician",               bio: "Known for flawless acrylics and a warm touch that keeps clients coming back.", photoUrl: "", order: 3, active: true },
    { id: "p4", name: "Renée Baptiste",      role: "Nail Artist",                   bio: "Freehand nail art specialist with a passion for bold colour and unique designs.", photoUrl: "", order: 4, active: true },
    { id: "p5", name: "Camille Torres",      role: "Nail Technician",               bio: "Pedicure and nail care expert dedicated to making every client feel pampered.", photoUrl: "", order: 5, active: true },
    { id: "p6", name: "Jade Williams",       role: "Junior Nail Technician",        bio: "Fresh talent with an eye for detail and a love for all things nail art.", photoUrl: "", order: 6, active: true },
  ] : team;

  // Owner = first member or whoever has "owner" in their role (case-insensitive)
  const ownerIndex = displayTeam.findIndex((m) =>
    m.role.toLowerCase().includes("owner")
  );
  const featured = displayTeam[ownerIndex !== -1 ? ownerIndex : 0];
  const rest = displayTeam.filter((m) => m.id !== featured.id);

  return (
    <section id={id} className="py-24 bg-[#0A0A0A]/85 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={content["about_title"] ?? "Meet Our Team"}
          subtitle={content["about_subtitle"] ?? "Talented artists who are passionate about making you feel beautiful."}
        />

        {/* ── Featured owner card ────────────────────────────────────────── */}
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

        {/* ── Auto-sliding team carousel ─────────────────────────────────── */}
        {rest.length > 0 && (
          <>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#9A7060]/60 mb-8">
              Our Team
            </p>
            <TeamScroller members={rest} />
          </>
        )}
      </div>
    </section>
  );
}
