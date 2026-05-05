"use client";

import { useEffect, useState, useCallback } from "react";

interface Notification {
  id: string;
  type: "trending" | "booking" | "new" | "milestone";
  message: string;
  icon: string;
}

const typeColors: Record<Notification["type"], string> = {
  trending:  "from-[#E07898] to-[#C9956B]",
  booking:   "from-[#C9956B] to-[#D4A882]",
  new:       "from-[#E07898] to-[#D4849A]",
  milestone: "from-[#C9956B] to-[#E07898]",
};

export default function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [current, setCurrent]   = useState(0);
  const [visible, setVisible]   = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data: Notification[] = await res.json();
      if (data.length > 0) {
        setNotifications(data);
        setDismissed(false);
      }
    } catch {
      // silently fail — notifications are non-critical
    }
  }, []);

  // Initial fetch + poll every 60 s
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Show toast after a short delay
  useEffect(() => {
    if (notifications.length === 0 || dismissed) return;
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, [notifications, dismissed]);

  // Cycle through notifications every 6 s
  useEffect(() => {
    if (!visible || notifications.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % notifications.length);
    }, 6000);
    return () => clearInterval(id);
  }, [visible, notifications.length]);

  if (notifications.length === 0 || !visible || dismissed) return null;

  const n = notifications[current];

  return (
    <div
      className="fixed z-40 flex items-center gap-3 max-w-xs w-[calc(100%-2rem)]
                 left-1/2 -translate-x-1/2 top-20
                 sm:left-auto sm:translate-x-0 sm:top-auto sm:bottom-6 sm:right-6 sm:w-full
                 bg-[#1C1614] border border-[#E07898]/30 rounded-2xl px-4 py-3
                 shadow-2xl shadow-[#E07898]/15 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {/* Live pulse dot */}
      <div className="relative flex-shrink-0">
        <span className="flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E07898] opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E07898]" />
        </span>
      </div>

      <div className={`text-xl flex-shrink-0 p-1.5 rounded-lg bg-gradient-to-br ${typeColors[n.type]} bg-opacity-20`}>
        {n.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#E07898] mb-0.5">
          Live Update
        </p>
        <p className="text-[#F5EDE6] text-sm font-medium leading-snug truncate">
          {n.message}
        </p>
      </div>

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss notification"
        className="flex-shrink-0 text-[#9A7060] hover:text-[#F5EDE6] transition-colors ml-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress dots */}
      {notifications.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
          {notifications.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-1 h-1 rounded-full transition-all ${
                i === current ? "bg-[#E07898] w-3" : "bg-[#E07898]/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
