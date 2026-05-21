"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// NASA GIBS — Global Imagery Browse Services. Public, no auth, CORS-enabled.
// Layer is OMI tropospheric NO₂ (long-running daily archive since 2004).
const GIBS_LAYER = "OMI_Nitrogen_Dioxide_Tropo_Column";
const TILE_MATRIX_SET = "GoogleMapsCompatible_Level6";
const TILE_FORMAT = "png";

// Composite window — stack the last N days of GIBS tiles so cloudy single days
// don't leave a blank map. Each layer carries a fraction of the total opacity;
// the visual sums into a 5-day rolling NO₂ density. Real Earth Observation
// teams (Climate TRACE, ESA) use this exact technique.
const COMPOSITE_DAYS = 5;
const PER_LAYER_OPACITY = 0.28;

// Mission-control basemap — Carto Dark Matter. NO₂ red pops dramatically vs
// the previous light Positron basemap.
const DARK_BASEMAP =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const ACCENT_CYAN = "#00BCD4";

// Center on Bohai Bay / Yangtze Delta — the dense Hebei → Shanghai industrial
// corridor where NO₂ plumes are reliably visible.
const VIEW = {
  center: [118.5, 33.0] as [number, number],
  zoom: 5.0,
};

// Equity anchors — workers' "narrative layer" so the wow image ties to a
// concrete decision, not a postcard. Cyan brand instead of red so the red is
// reserved for the data layer (NO₂ plumes).
const ANCHORS = [
  {
    name: "Beijing / Hebei",
    coords: [116.4, 39.9] as [number, number],
    note: "BABA logistics hub",
  },
  {
    name: "Shanghai / Yangtze Delta",
    coords: [121.5, 31.2] as [number, number],
    note: "JD fulfillment cluster",
  },
  {
    name: "Shenzhen",
    coords: [114.1, 22.5] as [number, number],
    note: "PDD merchant base",
  },
];

function gibsDate(offsetDays: number): string {
  const d = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function gibsTileTemplate(date: string): string {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${GIBS_LAYER}/default/${date}/${TILE_MATRIX_SET}/{z}/{y}/{x}.${TILE_FORMAT}`;
}

function fmtUTC(d: Date) {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss} UTC`;
}

function fmtCoord(lat: number, lon: number) {
  const latStr = `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? "N" : "S"}`;
  const lonStr = `${Math.abs(lon).toFixed(3)}°${lon >= 0 ? "E" : "W"}`;
  return `${latStr} · ${lonStr}`;
}

export function SignalsTropomiMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  // Composite dates: T-1 (yesterday) is freshest, T-5 is the rolling tail.
  // GIBS publishes T-1 for OMI daily, so we always skip "today".
  const dates = Array.from({ length: COMPOSITE_DAYS }, (_, i) =>
    gibsDate(i + 1)
  );
  const freshestDate = dates[0];
  const oldestDate = dates[dates.length - 1];

  const [hoverCoord, setHoverCoord] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_BASEMAP,
      center: VIEW.center,
      zoom: VIEW.zoom,
      attributionControl: { compact: true },
      cooperativeGestures: true,
      maxZoom: 9,
      minZoom: 3,
    });
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }),
      "bottom-left"
    );

    map.on("load", () => {
      addCompositeLayers(map, dates);
      addAnchors(map);
    });
    map.on("mousemove", (e) => {
      setHoverCoord({ lat: e.lngLat.lat, lon: e.lngLat.lng });
    });
    map.on("mouseout", () => setHoverCoord(null));

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-faint">
            Atmospheric · China industrial corridor
          </p>
          <h3 className="text-base font-semibold mt-0.5">
            Factory activity, seen from 700 km up
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-text-muted whitespace-nowrap tracking-widest">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
          </span>
          LIVE · NASA GIBS
        </span>
      </div>

      {/* Map shell — mission-control dark surface */}
      <div className="relative bg-[#0a0a0a]">
        <div ref={containerRef} className="h-[420px] w-full" />

        {/* HUD top-left — data lineage */}
        <div className="pointer-events-none absolute top-3 left-3 max-w-[280px] rounded-md border border-cyan-400/30 bg-black/70 backdrop-blur px-3 py-2 font-mono text-[10px] leading-snug text-slate-200 shadow-lg">
          <div className="flex items-center gap-1.5 text-cyan-300 mb-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="tracking-widest">ATMOSPHERIC · NO₂ INDEX</span>
          </div>
          <div className="text-slate-400">
            SRC <span className="text-slate-200">NASA GIBS · OMI L3</span>
          </div>
          <div className="text-slate-400">
            COMPOSITE{" "}
            <span className="text-slate-200">
              {COMPOSITE_DAYS}d ({oldestDate} → {freshestDate})
            </span>
          </div>
          <div className="text-slate-400">
            TICK <span className="text-slate-200">{fmtUTC(now)}</span>
          </div>
        </div>

        {/* HUD bottom-right — coordinate readout on hover */}
        <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-slate-700/60 bg-black/60 backdrop-blur px-2 py-1 font-mono text-[10px] text-slate-300">
          {hoverCoord
            ? fmtCoord(hoverCoord.lat, hoverCoord.lon)
            : "MOVE CURSOR FOR COORDS"}
        </div>

        {/* NO₂ legend (discrete colorbar) bottom-center */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded border border-slate-700/60 bg-black/70 backdrop-blur px-3 py-1.5 font-mono text-[9px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="tracking-widest text-slate-400">NO₂ COLUMN</span>
            <div className="flex h-2 w-32">
              <span className="flex-1 bg-blue-600" />
              <span className="flex-1 bg-emerald-500" />
              <span className="flex-1 bg-yellow-400" />
              <span className="flex-1 bg-orange-500" />
              <span className="flex-1 bg-rose-600" />
            </div>
            <span className="tracking-widest text-slate-400">low → high</span>
          </div>
        </div>

        {/* Vectorial corner watermark */}
        <div className="pointer-events-none absolute top-3 right-16 font-mono text-[9px] tracking-[0.25em] text-cyan-400/70">
          VECTORIAL · SIGNALS
        </div>
      </div>

      <div className="px-5 py-4 space-y-3 text-sm bg-card border-t border-border">
        <p className="text-text-muted leading-relaxed">
          Red plumes = tropospheric NO₂ — the gas factories and diesel trucks
          emit. More red = more industry running. The same signal that flagged
          Wuhan&apos;s slowdown two weeks before official data in Jan 2020.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-faint">
          <span>
            Composite:{" "}
            <strong className="text-text-muted">{COMPOSITE_DAYS}d rolling</strong>{" "}
            · {oldestDate} → {freshestDate}
          </span>
          <span>·</span>
          <span>
            Equity anchors:{" "}
            <strong className="text-text-muted">BABA · JD · PDD</strong>
          </span>
          <span>·</span>
          <span>
            Source:{" "}
            <a
              className="underline hover:text-signals-accent-hover"
              href="https://gibs.earthdata.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
            >
              NASA Earthdata GIBS
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

function addCompositeLayers(map: MapLibreMap, dates: string[]) {
  // Find the first symbol (label) layer so raster goes BENEATH labels —
  // city names stay readable over the heatmap.
  const styleLayers = map.getStyle().layers ?? [];
  const firstSymbolId = styleLayers.find((l) => l.type === "symbol")?.id;

  // Stack one raster source per composite day, freshest on top so newer data
  // visually wins when present, older days fill cloud gaps below.
  dates.forEach((date, idx) => {
    const sourceId = `gibs-no2-${idx}`;
    const layerId = `gibs-no2-layer-${idx}`;
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    map.addSource(sourceId, {
      type: "raster",
      tiles: [gibsTileTemplate(date)],
      tileSize: 256,
      attribution:
        idx === 0
          ? 'NO₂ imagery: <a href="https://gibs.earthdata.nasa.gov/" target="_blank" rel="noopener">NASA GIBS / OMI</a>'
          : undefined,
    });
    map.addLayer(
      {
        id: layerId,
        type: "raster",
        source: sourceId,
        paint: {
          "raster-opacity": PER_LAYER_OPACITY,
          "raster-resampling": "linear",
        },
      },
      firstSymbolId
    );
  });
}

function addAnchors(map: MapLibreMap) {
  // Cyan anchor markers — brand-consistent and visually distinct from the
  // red NO₂ data layer (so the eye doesn't confuse "this is data" vs
  // "this is a city we care about").
  for (const a of ANCHORS) {
    const el = document.createElement("div");
    el.style.cssText = `
      width: 14px; height: 14px;
      border-radius: 50%;
      background: ${ACCENT_CYAN};
      box-shadow: 0 0 0 2px rgba(0,188,212,0.25), 0 0 12px rgba(0,188,212,0.6);
      border: 1.5px solid #001619;
      cursor: pointer;
    `;
    new maplibregl.Marker({ element: el })
      .setLngLat(a.coords)
      .setPopup(
        new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
          `<div style="font-family:ui-monospace,monospace;font-size:11px;background:#0a0a0a;color:#e2e8f0;padding:6px 8px;border:1px solid ${ACCENT_CYAN}44;border-radius:4px"><strong style="color:${ACCENT_CYAN}">${a.name}</strong><br/><span style="color:#94a3b8">${a.note}</span></div>`
        )
      )
      .addTo(map);
  }
}
