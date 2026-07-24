import Image from 'next/image';

/**
 * public/logo.png is 1408×768 — a wide image, not a square. Every call site used
 * to hand next/image a square box (44×44, 340×340), which squashed the artwork.
 * Take a width and derive the height from the real aspect ratio so it can never
 * drift again.
 */
const LOGO_WIDTH = 1408;
const LOGO_HEIGHT = 768;

export default function ClinicLogo({
  width,
  priority = false,
  className,
}: {
  width: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Galactic Dent"
      width={width}
      height={Math.round((width * LOGO_HEIGHT) / LOGO_WIDTH)}
      priority={priority}
      className={className}
    />
  );
}
