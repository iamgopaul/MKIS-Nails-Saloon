"use client";

import Button from "@/components/ui/Button";

const STORAGE_KEY = "mkis:preselect-service";

/**
 * Per-card "Book Now" CTA. Stashes the service id in sessionStorage and
 * scrolls to the booking section, where BookingSection picks it up on mount
 * and pre-selects the matching option.
 */
export default function BookServiceButton({ serviceId, label = "Book Now" }: {
  serviceId: string;
  label?: string;
}) {
  return (
    <Button
      size="sm"
      onClick={() => {
        try { sessionStorage.setItem(STORAGE_KEY, serviceId); } catch { /* ignore */ }
        // Defer so sessionStorage write commits before the booking section's
        // effect reads it on hash-change navigation.
        requestAnimationFrame(() => {
          window.location.hash = "#booking";
        });
      }}
    >
      {label}
    </Button>
  );
}
