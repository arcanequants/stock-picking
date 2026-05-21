"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const GIBS_LAYER = "OMI_Nitrogen_Dioxide_Tropo_Column";
const TILE_MATRIX_SET = "GoogleMapsCompatible_Level6";
const TILE_FORMAT = "png";

// 5-day composite — stack the last 5 days of NO₂ tiles. Cloud-masked gaps in
// any single day are filled by adjacent days. Real Earth-Observation teams
// (Climate TRACE, ESA) use this technique to deliver a continuous map.
const COMPOSITE_DAYS = 5;
const PER_LAYER_BASE_OPACITY = 0.22;
const PER_LAYER_PEAK_OPACITY = 0.55;

const ACCENT_CYAN = "#00BCD4";

const VIEW = {
  center: [118.5, 33.0] as [number, number],
  zoom: 5.0,
};

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

// Satellite basemap — MODIS Terra true-color imagery for the freshest date
// MODIS has produced (T-3 to guarantee full processing).
function gibsDateBack(daysBack: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().split("T")[0];
}
const SAT_DATE = gibsDateBack(3);
const SAT_TILE = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${SAT_DATE}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg`;

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
  const rafRef = useRef<number | null>(null);

  const dates = Array.from({ length: COMPOSITE_DAYS }, (_, i) =>
    gibsDate(i + 1)
  );
  const freshestDate = dates[0];
  const oldestDate = dates[dates.length - 1];

  const [hoverCoord, setHoverCoord] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/glyphs/{fontstack}/{range}.pbf",
        sources: {
          satellite: {
            type: "raster",
            tiles: [SAT_TILE],
            tileSize: 256,
            attribution: "Imagery © NASA GIBS / MODIS",
            maxzoom: 9,
          },
        },
        layers: [
          { id: "bg", type: "background", paint: { "background-color": "#000814" } },
          {
            id: "satellite",
            type: "raster",
            source: "satellite",
            paint: {
              // Mute saturation + darken so the red NO₂ data layer dominates.
              "raster-opacity": 0.55,
              "raster-saturation": -0.6,
              "raster-contrast": -0.1,
              "raster-brightness-max": 0.7,
            },
          },
        ],
      },
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
      startTimeLapse(map, dates.length);
    });
    map.on("mousemove", (e) => {
      setHoverCoord({ lat: e.lngLat.lat, lon: e.lngLat.lng });
    });
    map.on("mouseout", () => setHoverCoord(null));

    mapRef.current = map;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Time-lapse — cycles through composite days, briefly highlighting each.
  // The composite stays as a static base (low opacity per day) and one day
  // at a time fades up to peak opacity, creating a wave of "now playing day".
  function startTimeLapse(map: MapLibreMap, count: number) {
    const dwellMs = 1400;
    let lastIdx = -1;
    const start = performance.now();

    const tick = (t: number) => {
      if (!mapRef.current) return;
      const elapsed = t - start;
      const idx = Math.floor(elapsed / dwellMs) % count;
      const localT = (elapsed % dwellMs) / dwellMs; // 0..1 within the dwell
      // Smooth cross-fade: ease-in-out
      const ease = localT < 0.5 ? 2 * localT * localT : 1 - Math.pow(-2 * localT + 2, 2) / 2;

      for (let i = 0; i < count; i++) {
        let opacity = PER_LAYER_BASE_OPACITY;
        if (i === idx) {
          opacity = PER_LAYER_BASE_OPACITY + ease * (PER_LAYER_PEAK_OPACITY - PER_LAYER_BASE_OPACITY);
        } else if (i === (idx - 1 + count) % count) {
          opacity = PER_LAYER_BASE_OPACITY + (1 - ease) * (PER_LAYER_PEAK_OPACITY - PER_LAYER_BASE_OPACITY) * 0.4;
        }
        try {
          mapRef.current.setPaintProperty(`gibs-no2-layer-${i}`, "raster-opacity", opacity);
        } catch {
          /* layer not ready yet */
        }
      }

      if (idx !== lastIdx) {
        setActiveDayIdx(idx);
        lastIdx = idx;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

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

      <div className="relative bg-[#000814]">
        <div ref={containerRef} className="h-[440px] w-full" />

        {/* HUD top-left */}
        <div className="pointer-events-none absolute top-3 left-3 max-w-[290px] rounded-md border border-cyan-400/40 bg-black/75 backdrop-blur px-3 py-2 font-mono text-[10px] leading-snug text-slate-200 shadow-lg">
          <div className="flex items-center gap-1.5 text-cyan-300 mb-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="tracking-widest">ATMOSPHERIC · NO₂ INDEX</span>
          </div>
          <div className="text-slate-400">
            BASE <span className="text-slate-200">MODIS Terra · {SAT_DATE}</span>
          </div>
          <div className="text-slate-400">
            DATA <span className="text-slate-200">NASA GIBS · OMI L3</span>
          </div>
          <div className="text-slate-400">
            COMPOSITE{" "}
            <span className="text-slate-200">
              {COMPOSITE_DAYS}d ({oldestDate} → {freshestDate})
            </span>
          </div>
          <div className="text-slate-400">
            PLAYING{" "}
            <span className="text-cyan-300">{dates[activeDayIdx]}</span>{" "}
            <span className="text-slate-500">· 1.4s/frame</span>
          </div>
          <div className="text-slate-400">
            TICK <span className="text-slate-200">{fmtUTC(now)}</span>
          </div>
        </div>

        {/* HUD bottom-right */}
        <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-slate-700/60 bg-black/60 backdrop-blur px-2 py-1 font-mono text-[10px] text-slate-300">
          {hoverCoord
            ? fmtCoord(hoverCoord.lat, hoverCoord.lon)
            : "MOVE CURSOR FOR COORDS"}
        </div>

        {/* Timeline strip bottom-center — shows which day is currently emphasized */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded border border-slate-700/60 bg-black/75 backdrop-blur px-3 py-1.5 font-mono text-[9px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="tracking-widest text-slate-400">T −</span>
            <div className="flex gap-1">
              {dates.map((_, i) => (
                <span
                  key={i}
                  className={`inline-block h-1.5 w-5 rounded-sm transition-all ${
                    i === activeDayIdx
                      ? "bg-rose-400"
                      : "bg-slate-700/80"
                  }`}
                />
              ))}
            </div>
            <span className="tracking-widest text-slate-400">freshest</span>
          </div>
        </div>

        {/* NO₂ palette legend top-center */}
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded border border-slate-700/60 bg-black/60 backdrop-blur px-3 py-1 font-mono text-[9px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="tracking-widest text-slate-400">NO₂</span>
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
    map.addLayer({
      id: layerId,
      type: "raster",
      source: sourceId,
      paint: {
        "raster-opacity": PER_LAYER_BASE_OPACITY,
        "raster-resampling": "linear",
      },
    });
  });
}

function addAnchors(map: MapLibreMap) {
  for (const a of ANCHORS) {
    const el = document.createElement("div");
    el.style.cssText = `
      width: 14px; height: 14px;
      border-radius: 50%;
      background: ${ACCENT_CYAN};
      box-shadow: 0 0 0 2px rgba(0,188,212,0.25), 0 0 16px rgba(0,188,212,0.7);
      border: 1.5px solid #000814;
      cursor: pointer;
      animation: vectorialPulse 2.4s ease-in-out infinite;
    `;
    new maplibregl.Marker({ element: el })
      .setLngLat(a.coords)
      .setPopup(
        new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
          `<div style="font-family:ui-monospace,monospace;font-size:11px;background:#020617;color:#e2e8f0;padding:6px 8px;border:1px solid ${ACCENT_CYAN};border-radius:4px"><strong style="color:${ACCENT_CYAN}">${a.name}</strong><br/><span style="color:#94a3b8">${a.note}</span></div>`
        )
      )
      .addTo(map);
  }

  // Inject the @keyframes once — MapLibre markers are real DOM nodes, so a
  // global CSS rule reaches them.
  if (typeof document !== "undefined" && !document.getElementById("vectorial-pulse-css")) {
    const style = document.createElement("style");
    style.id = "vectorial-pulse-css";
    style.textContent = `@keyframes vectorialPulse { 0%, 100% { box-shadow: 0 0 0 2px rgba(0,188,212,0.25), 0 0 16px rgba(0,188,212,0.7); } 50% { box-shadow: 0 0 0 6px rgba(0,188,212,0.08), 0 0 24px rgba(0,188,212,0.95); } }`;
    document.head.appendChild(style);
  }
}
