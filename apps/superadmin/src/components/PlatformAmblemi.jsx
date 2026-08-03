export default function PlatformAmblemi({ className = "" }) {
  return (
    <span className={`platform-amblem ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M24 4 40.5 13.5v19L24 42 7.5 32.5v-19L24 4Z" />
        <circle cx="24" cy="16" r="3.5" />
        <circle cx="16" cy="29" r="3.5" />
        <circle cx="32" cy="29" r="3.5" />
        <path d="m22.3 19-4.5 7M25.7 19l4.5 7M19.5 29h9" />
      </svg>
    </span>
  );
}
