"use client";

import "leaflet/dist/leaflet.css";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import { useRouter } from "next/navigation";
import { BAND_COLOR, bandForShi } from "@/lib/health";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/config";
import type { Asset } from "@/lib/types";

export interface AssetMapPoint {
  asset: Asset;
  shi: number | null;
}

// Leaflet tile template uses single-brace {s}/{z}/{x}/{y} placeholders.
const TILE_URL = "https://" + "{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = "&copy; OpenStreetMap contributors";

export default function AssetMapInner({ points }: { points: AssetMapPoint[] }) {
  const router = useRouter();
  const center: [number, number] = points.length
    ? [points[0].asset.location.lat, points[0].asset.location.lng]
    : DEFAULT_MAP_CENTER;
  const containerStyle = { height: "100%", width: "100%" };

  return (
    <MapContainer
      center={center}
      zoom={points.length ? 11 : DEFAULT_MAP_ZOOM}
      style={containerStyle}
      scrollWheelZoom
    >
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      {points.map(({ asset, shi }) => {
        const color = shi === null ? "#94a3b8" : BAND_COLOR[bandForShi(shi)];
        const pathOptions = { color, fillColor: color, fillOpacity: 0.85 };
        const position: [number, number] = [
          asset.location.lat,
          asset.location.lng,
        ];
        const handlers = { click: () => router.push(`/assets/${asset.id}`) };
        return (
          <CircleMarker
            key={asset.id}
            center={position}
            radius={9}
            pathOptions={pathOptions}
            eventHandlers={handlers}
          >
            <Tooltip>
              {asset.name}
              {shi === null ? "" : ` · SHI ${Math.round(shi)}`}
            </Tooltip>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{asset.name}</p>
                <p className="capitalize text-slate-500">{asset.assetType}</p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
