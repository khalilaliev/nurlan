// Brand icon SVGs that aren't in our installed lucide-react version
// (it's an old major). Each accepts a `className` so it can be sized and
// coloured by the parent's `text-*` and `h-*` / `w-*` classes — matching
// the API surface of the Lucide React icons used elsewhere.

type IconProps = {
  className?: string;
};

export function TwitchIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M2.149 0L.537 4.119v17.81h6.131V24h3.224l2.687-2.071h4.836L24 14.756V0H2.149zm2.687 1.612h17.025v12.337l-3.762 3.762h-5.91l-2.687 2.071v-2.071H4.836V1.612zM9.673 12.881h2.151V6.749H9.673v6.132zm5.91 0h2.151V6.749h-2.151v6.132z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
