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
      className="group relative aspect-square rounded-lg overflow-hidden bg-[#2A1F18] border border-[#3A2E26]/60
                 hover:border-[#D89AAE]/40 transition-colors duration-300 cursor-pointer
                 focus:outline-none focus:ring-2 focus:ring-[#D89AAE]/40"
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
        <p className="font-[family-name:var(--font-cormorant)] text-white text-base leading-tight">{name}</p>
        {category && (
          <span className="inline-block mt-1.5 text-[#D89AAE] text-[10px] font-[family-name:var(--font-montserrat)] tracking-[0.18em] uppercase w-fit">
            {category}
          </span>
        )}
      </div>
    </button>
  );
}
