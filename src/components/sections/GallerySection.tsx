import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import { galleryItems } from "@/data/gallery";

interface GallerySectionProps {
  id: string;
}

export default function GallerySection({ id }: GallerySectionProps) {
  return (
    <section id={id} className="py-24 bg-[#111111]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Our Gallery"
          subtitle="Each design is crafted with love and attention to detail. Swipe through our latest creations."
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {galleryItems.map((item, i) => (
            <div
              key={i}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#1C1614] border border-[#E07898]/15 shadow-sm hover:shadow-xl hover:shadow-[#E07898]/10 hover:border-[#E07898]/40 transition-all duration-300"
            >
              <Image
                src={item.src}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
              {/* Placeholder while images load */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1C1614] to-[#2A1E18] group-hover:opacity-0 transition-opacity duration-300">
                <span className="text-4xl opacity-40">💅</span>
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-[#F5EDE6] font-semibold text-sm leading-tight">{item.name}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white text-xs w-fit">
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[#9A7060] mb-4">Love what you see? Book your appointment today!</p>
          <a
            href="#booking"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white font-semibold hover:from-[#C45E7A] hover:to-[#B07A52] transition-all shadow-lg shadow-[#E07898]/25"
          >
            Book Your Set →
          </a>
        </div>
      </div>
    </section>
  );
}
