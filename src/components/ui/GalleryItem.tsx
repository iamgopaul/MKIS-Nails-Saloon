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
      className="group relative aspect-square rounded-2xl overflow-hidden bg-white border border-[#EADBD2]
                 shadow-sm hover:shadow-[0_15px_35px_-15px_rgba(26,20,16,0.2)] hover:border-[#E07898]/50
                 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E07898]/40"
    >
      <Image
        src={imageUrl}
        alt={name}
        fill
        unoptimized
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t from-[#1A1410]/85 via-[#1A1410]/20 to-transparent
                    transition-opacity duration-300 flex flex-col justify-end p-4 text-left
                    ${open ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        <p className="text-white font-medium text-sm leading-tight">{name}</p>
        {category && (
          <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-white/95 text-[#C45E7A] text-[11px] font-medium w-fit">
            {category}
          </span>
        )}
      </div>
    </button>
  );
}
