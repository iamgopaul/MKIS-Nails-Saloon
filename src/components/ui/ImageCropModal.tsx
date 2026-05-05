"use client";

import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";

interface ImageCropModalProps {
  src: string;
  aspect?: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

/**
 * Crop a Blob from an image src + pixel crop area.
 * Uses canvas to produce a square (or arbitrary aspect) cropped output.
 */
async function getCroppedBlob(src: string, area: Area): Promise<Blob> {
  const img = await loadImage(src);

  const canvas = document.createElement("canvas");
  canvas.width  = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    img,
    area.x, area.y, area.width, area.height,
    0, 0, area.width, area.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Crop failed"))), "image/jpeg", 0.92);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src     = src;
  });
}

export default function ImageCropModal({ src, aspect = 1, onCancel, onConfirm }: ImageCropModalProps) {
  const [crop, setCrop]       = useState({ x: 0, y: 0 });
  const [zoom, setZoom]       = useState(1);
  const [pixelArea, setPixelArea] = useState<Area | null>(null);
  const [busy, setBusy]       = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setPixelArea(pixels);
  }, []);

  async function confirm() {
    if (!pixelArea) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(src, pixelArea);
      onConfirm(blob);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1C1614] rounded-3xl border border-[#E07898]/30 shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 pt-6 pb-3 flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[#F5EDE6]">
            Adjust your photo
          </h3>
          <button type="button" aria-label="Close" onClick={onCancel}
            className="w-8 h-8 rounded-full text-[#9A7060] hover:text-[#E07898] hover:bg-[#E07898]/10 flex items-center justify-center">
            ✕
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full h-80 bg-[#0A0A0A]">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom + actions */}
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="zoom-range" className="block text-xs font-semibold text-[#9A7060] uppercase tracking-wider mb-2">
              Zoom
            </label>
            <input
              id="zoom-range"
              type="range"
              min={1} max={3} step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#E07898]"
            />
          </div>
          <p className="text-xs text-[#9A7060]/70">Drag to reposition · pinch or use the slider to zoom.</p>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-[#E07898]/25 text-[#9A7060] text-sm hover:text-[#F5EDE6] transition-colors">
              Cancel
            </button>
            <button type="button" onClick={confirm} disabled={busy || !pixelArea}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white text-sm font-semibold hover:from-[#C45E7A] hover:to-[#B07A52] disabled:opacity-50 transition-all">
              {busy ? "Saving…" : "Use this photo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
