export default function EarthIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" fill="#1a3a5c" stroke="#22d3ee" strokeWidth="1.2" />
      <path d="M4.5 9.5 C6 8 8 9 9 8 C10 7 10 5 11 5 C12 5 12 6 13 6.5 C14 7 15 6 16 7 C17 8 16.5 10 17 11 C17.5 12 19 12.5 19.5 13" stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M3 13 C4 12.5 5 13.5 6 13 C7 12.5 7 11 8 11.5 C9 12 9.5 13.5 11 13 C12.5 12.5 13 14 14 14.5 C15 15 16 14 17 14.5 C18 15 18.5 16.5 20 16" stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M9 8 C9.5 9.5 9 11 9.5 12 C10 13 11 13 11 14 C11 15 10 16 10.5 17 C11 18 12 18 12 19" stroke="#4f9cf9" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M14 6.5 C14.5 8 14 9.5 15 10.5 C16 11.5 17 11 17 12" stroke="#4f9cf9" strokeWidth="0.6" strokeLinecap="round" fill="none" opacity="0.6" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="#22d3ee" strokeWidth="1.2" opacity="0.7" />
    </svg>
  );
}
