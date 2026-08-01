import Image from 'next/image';
import { CLINIC } from '@/lib/content';

/**
 * The clinic's artwork, in the two shapes it is actually needed in.
 *
 * `lockup` is symbol + wordmark, for places with room to show it — the hero.
 * `mark` is the symbol alone, square. The header used to render the lockup at
 * 96 px wide, which put the wordmark at about five pixels tall: present in the
 * file, unreadable on screen. There the symbol goes next to the clinic name set
 * in real text instead.
 *
 * Both are wide-or-square images, never squares by accident: call sites pass a
 * width and the height follows the file's real ratio, so nothing can squash the
 * artwork the way a hard-coded 44×44 box once did. Keep these numbers equal to
 * the files emitted by `design/logo/build.py`.
 */
const ART = {
  lockup: { src: '/logo.png', width: 1600, height: 780 },
  mark: { src: '/logo-mark.png', width: 512, height: 512 },
} as const;

export default function ClinicLogo({
  width,
  variant = 'lockup',
  priority = false,
  className,
}: {
  width: number;
  variant?: keyof typeof ART;
  priority?: boolean;
  className?: string;
}) {
  const art = ART[variant];
  return (
    <Image
      src={art.src}
      alt={CLINIC.name}
      width={width}
      height={Math.round((width * art.height) / art.width)}
      priority={priority}
      className={className}
    />
  );
}
