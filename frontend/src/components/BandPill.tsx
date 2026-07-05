import { BAND_COLOR, BAND_EMOJI } from "@/lib/health";
import type { HealthBand } from "@/lib/types";

export function BandPill({ band }: { band: HealthBand }) {
  const style = { backgroundColor: BAND_COLOR[band] };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
      style={style}
    >
      <span aria-hidden>{BAND_EMOJI[band]}</span>
      {band}
    </span>
  );
}
