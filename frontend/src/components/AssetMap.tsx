"use client";

import dynamic from "next/dynamic";
import type { AssetMapPoint } from "./AssetMapInner";

const AssetMapInner = dynamic(() => import("./AssetMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      Loading map…
    </div>
  ),
});

export function AssetMap({ points }: { points: AssetMapPoint[] }) {
  return (
    <div className="h-80 w-full overflow-hidden rounded-xl border border-slate-200">
      <AssetMapInner points={points} />
    </div>
  );
}

export type { AssetMapPoint };
