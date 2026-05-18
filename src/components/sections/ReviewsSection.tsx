"use client";

import { useEffect, useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";

interface Review {
  id:           string;
  client_name:  string;
  review:       string;
  rating:       number;
  approved_at:  string;
}

interface ReviewsSectionProps { id: string; }

export default function ReviewsSection({ id }: ReviewsSectionProps) {
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [loading, setLoading]   = useState(true);

  const [name, setName]         = useState("");
  const [text, setText]         = useState("");
  const [rating, setRating]     = useState(0);
  const [hover, setHover]       = useState(0);
  const [website, setWebsite]   = useState("");
  const [status, setStatus]     = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting"); setErrorMsg("");
    const res = await fetch("/api/reviews", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ client_name: name, review: text, rating, website }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("error");
      setErrorMsg(data.error ?? "Failed to submit review.");
      return;
    }
    setStatus("success");
    setName(""); setText(""); setRating(0);
  }

  return (
    <section id={id} className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeading
          eyebrow="Testimonials"
          title="Words from our"
          accent="clients"
          subtitle="What clients are saying about MKIS Nails."
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#2A1F18] rounded-lg p-6 border border-[#3A2E26] animate-pulse h-40" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-[#B8A89A] font-light">
            <p className="text-sm">Be the first to leave a review.</p>
          </div>
        ) : (
          <div className="reveal-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r) => (
              <article key={r.id} className="bg-[#2A1F18] rounded-lg p-7 border border-[#3A2E26]/60 hover:border-[#D89AAE]/40 transition-colors duration-300">
                <div className="flex items-center gap-1 mb-4 text-base" aria-label={`${r.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={n <= r.rating ? "text-[#D89AAE]" : "text-[#EADBD2]"}>★</span>
                  ))}
                </div>
                <p className="text-[#F0E4D8] text-[15px] leading-relaxed mb-5 font-light">&ldquo;{r.review}&rdquo;</p>
                <div className="flex items-center justify-between pt-4 border-t border-[#3A2E26]/60">
                  <p className="font-[family-name:var(--font-cormorant)] italic text-base text-[#D89AAE]">— {r.client_name}</p>
                  <p className="text-[11px] text-[#7A6657] tracking-wide">{new Date(r.approved_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-[#2A1F18] rounded-lg p-10 border border-[#3A2E26]/60">
            <h3 className="font-[family-name:var(--font-cormorant)] font-light text-3xl text-[#F0E4D8] mb-2 text-center">
              Leave a <span className="italic text-[#D89AAE]">review</span>
            </h3>
            <p className="text-[#B8A89A] text-sm text-center mb-8 font-light">
              Share your experience — reviews are visible after admin approval.
            </p>

            {status === "success" ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#D89AAE] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1A1410]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[#F0E4D8] font-medium mb-1">Thank you</p>
                <p className="text-[#B8A89A] text-sm font-light">Your review has been submitted and will appear once approved.</p>
                <button type="button" onClick={() => setStatus("idle")}
                  className="mt-5 px-5 py-2 rounded-full border border-[#3A2E26] text-[#B8A89A] text-sm hover:text-[#D89AAE] hover:border-[#D89AAE] transition-all">
                  Leave another review
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div aria-hidden="true" className="hidden">
                  <label htmlFor="rev-website">Website (leave blank)</label>
                  <input
                    id="rev-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="rev-name" className="block text-[13px] font-medium text-[#F0E4D8] mb-1.5">Your name <span className="text-[#D89AAE]">*</span></label>
                  <input
                    id="rev-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Bella Boss"
                    className="w-full px-4 py-3 rounded-lg bg-[#1A1410] border border-[#3A2E26]/60 text-[#F0E4D8] placeholder:text-[#7A6657] focus:outline-none focus:ring-2 focus:ring-[#D89AAE]/30 focus:border-[#D89AAE] transition"
                  />
                </div>

                <div>
                  <span className="block text-[13px] font-medium text-[#F0E4D8] mb-1.5">Rating <span className="text-[#D89AAE]">*</span></span>
                  <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHover(n)}
                        aria-label={`${n} star${n === 1 ? "" : "s"}`}
                        className={`text-3xl transition-colors ${
                          n <= (hover || rating) ? "text-[#D89AAE]" : "text-[#EADBD2] hover:text-[#D89AAE]/60"
                        }`}
                      >★</button>
                    ))}
                    {rating > 0 && <span className="ml-2 text-sm text-[#B8A89A] font-light">{rating}/5</span>}
                  </div>
                </div>

                <div>
                  <label htmlFor="rev-text" className="block text-[13px] font-medium text-[#F0E4D8] mb-1.5">Your review <span className="text-[#D89AAE]">*</span></label>
                  <textarea
                    id="rev-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                    rows={4}
                    minLength={10}
                    maxLength={1000}
                    placeholder="Share your experience…"
                    className="w-full px-4 py-3 rounded-lg bg-[#1A1410] border border-[#3A2E26]/60 text-[#F0E4D8] placeholder:text-[#7A6657] focus:outline-none focus:ring-2 focus:ring-[#D89AAE]/30 focus:border-[#D89AAE] transition resize-none"
                  />
                  <p className="text-xs text-[#7A6657] mt-1 text-right">{text.length}/1000</p>
                </div>

                {status === "error" && (
                  <p className="text-red-400 text-sm text-center">{errorMsg}</p>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={status === "submitting"}>
                  {status === "submitting" ? "Submitting…" : "Submit Review"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
