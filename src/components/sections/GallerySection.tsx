import SectionHeading from "@/components/ui/SectionHeading";
import GalleryItem from "@/components/ui/GalleryItem";
import { getGallery } from "@/lib/db";

interface GallerySectionProps { id: string; }

export default async function GallerySection({ id }: GallerySectionProps) {
  const items = await getGallery().catch(() => []);

  return (
    <section id={id} className="py-24 bg-[#111111]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Our Gallery"
          subtitle="Each design is crafted with love and attention to detail."
        />

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full bg-[#1C1614] border border-[#E07898]/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#E07898]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[#9A7060] text-sm">Photos coming soon — check back after your first visit!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {items.map((item) => (
              <GalleryItem
                key={item.id}
                name={item.name}
                category={item.category}
                imageUrl={item.image_url}
              />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-[#9A7060] mb-4">Love what you see? Book your appointment today!</p>
          <a
            href="#booking"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-[#E07898] to-[#C9956B]
                       text-white font-semibold hover:from-[#C45E7A] hover:to-[#B07A52] transition-all shadow-lg shadow-[#E07898]/25"
          >
            Book Your Set →
          </a>
        </div>
      </div>
    </section>
  );
}
