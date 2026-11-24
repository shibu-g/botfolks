export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="logo-mark">
      <defs>
        <linearGradient id="logoGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c3b7ff" />
          <stop offset="100%" stopColor="#7a6bff" />
        </linearGradient>
      </defs>
      <path d="M16 2C8.3 2 2 7.6 2 14.5c0 3.6 1.8 6.8 4.7 9.1L5.5 29l6.2-2.8c1.3.3 2.8.5 4.3.5 7.7 0 14-5.6 14-12.5S23.7 2 16 2Z" fill="url(#logoGrad)" />
      <path d="M10.5 15l2.6 2.6 5.4-5.8" stroke="#1a1333" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M22 7.3l.6-1.4.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6z" fill="#fff" opacity=".9" />
    </svg>
  );
}
