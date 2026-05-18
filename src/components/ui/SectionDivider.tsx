export default function SectionDivider() {
  return (
    <div
      aria-hidden="true"
      className="reveal relative w-full flex items-center justify-center py-8"
    >
      <div className="w-full max-w-md flex items-center gap-4 px-6">
        <span className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D89AAE]/50 to-[#D89AAE]/70" />
        <span className="relative flex items-center justify-center">
          <span className="absolute w-6 h-6 rounded-full bg-[#D89AAE]/15 blur-md" />
          <svg
            viewBox="0 0 24 24"
            className="relative w-3.5 h-3.5 text-[#D89AAE]"
            fill="currentColor"
          >
            <path d="M12 2c1.5 2.2 3.3 3.5 5.5 4-2.2.5-4 1.8-5.5 4-1.5-2.2-3.3-3.5-5.5-4 2.2-.5 4-1.8 5.5-4zM12 14c1.5 2.2 3.3 3.5 5.5 4-2.2.5-4 1.8-5.5 4-1.5-2.2-3.3-3.5-5.5-4 2.2-.5 4-1.8 5.5-4z" />
          </svg>
        </span>
        <span className="flex-1 h-px bg-gradient-to-l from-transparent via-[#D89AAE]/50 to-[#D89AAE]/70" />
      </div>
    </div>
  );
}
