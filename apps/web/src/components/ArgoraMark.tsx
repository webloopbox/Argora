interface ArgoraMarkProps {
  /** Rendered size in px. The geometry is drawn on a 24-unit grid and scales cleanly. */
  size?: number;
  className?: string;
}

/**
 * The Argora mark: the letter A split down its centre line. The left half
 * carries full ink, the right half 55% - a thesis and the objection answering
 * it, in one letterform.
 *
 * Each half is a single closed path that already contains its half of the
 * crossbar. Drawing the crossbar as a separate rectangle would make it overlap
 * the legs, and the 55% half would then stack opacity into a darker patch.
 *
 * Both halves paint with `currentColor`, so the mark takes the colour of the
 * element it sits in and needs no light/dark variant of its own. It is drawn
 * bare, never on a tinted tile.
 */
export function ArgoraMark({ size = 24, className }: ArgoraMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2.8 L2.4 21.2 L6.6 21.2 L8.4 17.4 L12 17.4 L12 15 L9.54 15 L12 9.8 Z" />
      <path
        d="M12 2.8 L21.6 21.2 L17.4 21.2 L15.6 17.4 L12 17.4 L12 15 L14.46 15 L12 9.8 Z"
        opacity="0.55"
      />
    </svg>
  );
}
