"use client";

import { useEffect, useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";

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

  // Submit form
  const [name, setName]         = useState("");
  const [text, setText]         = useState("");
  const [rating, setRating]     = useState(0);
  const [hover, setHover]       = useState(0);
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
      body:    JSON.stringify({ client_name: name, review: text, rating }),
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
    <section id={id} className="py-24 bg-[#0A0A0A]/85 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Client Reviews"
          subtitle="What our clients are saying about MKIS Nail Saloon."
        />

        {/* Reviews grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#1C1614] rounded-3xl p-6 border border-[#E07898]/10 animate-pulse h-40" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-[#9A7060]">
            <p className="text-sm">Be the first to leave a review!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r) => (
              <article key={r.id} className="bg-[#1C1614] rounded-3xl p-6 border border-[#E07898]/15 hover:border-[#E07898]/40 hover:shadow-xl hover:shadow-[#E07898]/10 transition-all duration-300">
                <div className="flex items-center gap-1 mb-3" aria-label={`${r.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={n <= r.rating ? "text-[#E07898]" : "text-[#9A7060]/30"}>★</span>
                  ))}
                </div>
                <p className="text-[#F5EDE6] text-sm leading-relaxed mb-4 italic">&ldquo;{r.review}&rdquo;</p>
                <div className="flex items-center justify-between pt-3 border-t border-[#E07898]/10">
                  <p className="font-[family-name:var(--font-playfair)] text-sm font-bold text-[#E07898]">— {r.client_name}</p>
                  <p className="text-xs text-[#9A7060]/60">{new Date(r.approved_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Submit form */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-[#1C1614] rounded-3xl p-8 border border-[#E07898]/20 shadow-xl shadow-[#E07898]/5">
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#F5EDE6] mb-2 text-center">
              Leave a Review
            </h3>
            <p className="text-[#9A7060] text-sm text-center mb-6">
              Share your experience! Reviews are visible after admin approval.
            </p>

            {status === "success" ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#E07898] to-[#C9956B] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[#F5EDE6] font-semibold mb-1">Thank you!</p>
                <p className="text-[#9A7060] text-sm">Your review has been submitted and will appear once approved.</p>
                <button type="button" onClick={() => setStatus("idle")}
                  className="mt-4 px-5 py-2 rounded-xl border border-[#E07898]/30 text-[#9A7060] text-sm hover:text-[#F5EDE6] hover:border-[#E07898]/60 transition-all">
                  Leave Another Review
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label htmlFor="rev-name" className="block text-sm font-medium text-[#F5EDE6] mb-2">Your Name <span className="text-[#E07898]">*</span></label>
                  <input
                    id="rev-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6] placeholder-[#9A7060]/50 focus:outline-none focus:border-[#E07898]/60 transition-colors"
                  />
                </div>

                <div>
                  <span className="block text-sm font-medium text-[#F5EDE6] mb-2">Rating <span className="text-[#E07898]">*</span></span>
                  <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHover(n)}
                        aria-label={`${n} star${n === 1 ? "" : "s"}`}
                        className={`text-3xl transition-colors ${
                          n <= (hover || rating) ? "text-[#E07898]" : "text-[#9A7060]/30 hover:text-[#E07898]/60"
                        }`}
                      >★</button>
                    ))}
                    {rating > 0 && <span className="ml-2 text-sm text-[#9A7060]">{rating}/5</span>}
                  </div>
                </div>

                <div>
                  <label htmlFor="rev-text" className="block text-sm font-medium text-[#F5EDE6] mb-2">Your Review <span className="text-[#E07898]">*</span></label>
                  <textarea
                    id="rev-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                    rows={4}
                    minLength={10}
                    maxLength={1000}
                    placeholder="Share your experience…"
                    className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#E07898]/20 text-[#F5EDE6] placeholder-[#9A7060]/50 focus:outline-none focus:border-[#E07898]/60 transition-colors resize-none"
                  />
                  <p className="text-xs text-[#9A7060]/60 mt-1 text-right">{text.length}/1000</p>
                </div>

                {status === "error" && (
                  <p className="text-red-400 text-sm text-center">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E07898] to-[#C9956B] text-white font-semibold hover:from-[#C45E7A] hover:to-[#B07A52] disabled:opacity-60 transition-all shadow-lg shadow-[#E07898]/25"
                >
                  {status === "submitting" ? "Submitting…" : "Submit Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
