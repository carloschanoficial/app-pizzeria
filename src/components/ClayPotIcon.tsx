interface ClayPotIconProps {
  className?: string;
}

export function ClayPotIcon({ className }: ClayPotIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="clay-pot-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E0793A" />
          <stop offset="1" stopColor="#9A3412" />
        </linearGradient>
        <radialGradient id="clay-pot-coin" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FEF3C7" />
          <stop offset="0.5" stopColor="#FCD34D" />
          <stop offset="1" stopColor="#B45309" />
        </radialGradient>
      </defs>
      <ellipse cx="7.5" cy="6.4" rx="2.4" ry="1.1" fill="url(#clay-pot-coin)" />
      <ellipse cx="12" cy="4.9" rx="2.4" ry="1.1" fill="url(#clay-pot-coin)" />
      <ellipse cx="16.5" cy="6.4" rx="2.4" ry="1.1" fill="url(#clay-pot-coin)" />
      <ellipse cx="10" cy="3.2" rx="2" ry="0.9" fill="url(#clay-pot-coin)" />
      <ellipse cx="14.2" cy="3.0" rx="2" ry="0.9" fill="url(#clay-pot-coin)" />
      <ellipse cx="8.4" cy="1.4" rx="1.6" ry="0.75" fill="url(#clay-pot-coin)" />
      <ellipse cx="17.6" cy="1.6" rx="1.6" ry="0.75" fill="url(#clay-pot-coin)" />
      <path
        d="M4.2 9.2h15.6c.7 0 1.1.6 1 1.3C20.4 16.6 17 21.2 12 21.2S3.6 16.6 3.2 10.5c-.1-.7.3-1.3 1-1.3z"
        fill="url(#clay-pot-body)"
      />
      <rect x="2.6" y="8" width="18.8" height="2.4" rx="1.2" fill="#C2410C" />
      <path d="M6.2 13.2c.4 2.4 1.6 4.2 3.2 5.2" stroke="#FDBA74" strokeOpacity="0.55" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="9" cy="2.6" r="0.45" fill="#FFFBEB" />
      <circle cx="15.4" cy="2.4" r="0.4" fill="#FFFBEB" />
    </svg>
  );
}
