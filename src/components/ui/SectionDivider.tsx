export default function SectionDivider() {
  return (
    <div
      aria-hidden="true"
      className="reveal relative w-full flex items-center justify-center py-8"
    >
      <div className="w-full max-w-md flex items-center gap-4 px-6">
        <span className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D89AAE]/50 to-[#D89AAE]/70" />
        <span className="relative flex items-center justify-center">
          <span className="absolute w-10 h-10 rounded-full bg-[#D89AAE]/15 blur-md" />
          {/* Tulip mark from the MKIS Nails Salon wordmark — three teardrop
              petals fanning out from a single base point. */}
          <svg
            viewBox="0 0 24 24"
            className="relative w-6 h-6 text-[#D89AAE]"
            fill="currentColor"
          >
            {/* Center petal (tallest) */}
            <path d="M12 4c1.4 1.6 1.4 4.6 1.4 7.4 0 1.6-.6 2.6-1.4 2.6s-1.4-1-1.4-2.6c0-2.8 0-5.8 1.4-7.4z" />
            {/* Left petal */}
            <path d="M6.8 8.2c1.7.6 3.2 2.7 4 5 .4 1.2.1 2.1-.5 2.3-.6.2-1.5-.3-2.1-1.4-1.2-2.1-2.1-4.4-1.4-5.9z" />
            {/* Right petal */}
            <path d="M17.2 8.2c-1.7.6-3.2 2.7-4 5-.4 1.2-.1 2.1.5 2.3.6.2 1.5-.3 2.1-1.4 1.2-2.1 2.1-4.4 1.4-5.9z" />
            {/* Base point */}
            <circle cx="12" cy="15" r="0.7" />
          </svg>
        </span>
        <span className="flex-1 h-px bg-gradient-to-l from-transparent via-[#D89AAE]/50 to-[#D89AAE]/70" />
      </div>
    </div>
  );
}
