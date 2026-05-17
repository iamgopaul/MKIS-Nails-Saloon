import SectionHeading from "@/components/ui/SectionHeading";
import GalleryItem from "@/components/ui/GalleryItem";
import Button from "@/components/ui/Button";
import { getGallery } from "@/lib/db";

interface GallerySectionProps { id: string; }

export default async function GallerySection({ id }: GallerySectionProps) {
  const items = await getGallery().catch(() => []);

  return (
    <section id={id} className="py-24 bg-[#F5EDE6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <SectionHeading
          eyebrow="Portfolio"
          title="Our gallery"
          subtitle="Each design is crafted with love and attention to detail."
        />

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full bg-white border border-[#EADBD2] flex items-center justify-center">
              <svg className="w-7 h-7 text-[#E07898]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[#6B5448] text-sm font-light">Photos coming soon — check back after your first visit.</p>
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

        <div className="mt-14 text-center">
          <p className="text-[#6B5448] mb-4 font-light">Love what you see?</p>
          <a href="#booking">
            <Button size="lg">Book Your Set</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
