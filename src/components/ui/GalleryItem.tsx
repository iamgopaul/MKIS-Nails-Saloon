"use client";

import Image from "next/image";
import { useState } from "react";

interface GalleryItemProps {
  name:     string;
  category: string;
  imageUrl: string;
}

export default function GalleryItem({ name, category, imageUrl }: GalleryItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-label={`${name}${category ? `, ${category}` : ""}`}
      className="group relative aspect-square rounded-2xl overflow-hidden bg-[#1C1614] border border-[#E07898]/15
                 shadow-sm hover:shadow-xl hover:shadow-[#E07898]/10 hover:border-[#E07898]/40
                 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E07898]/50"
    >
      <Image
        src={imageUrl}
        alt={name}
        fill
        unoptimized
        className="object-cover group-hover:scale-110 transition-transform duration-500"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-transparent to-transparent
                    transition-opacity duration-300 flex flex-col justify-end p-4 text-left
                    ${open ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        <p className="text-[#F5EDE6] font-semibold text-sm leading-tight">{name}</p>
        {category && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white text-xs w-fit">
            {category}
          </span>
        )}
      </div>
    </button>
  );
}
