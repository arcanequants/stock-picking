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
const PER_LAYER_BASE_OPACITY = 0.45;
const PER_LAYER_PEAK_OPACITY = 0.78;

const ACCENT_CYAN = "#00BCD4";

// Mission-control basemap — Carto Dark Matter. NO₂ red dominates on pure dark
// vector base. Satellite imagery muddled the data layer in prior iteration.
const DARK_BASEMAP =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const VIEW = {
  center: [115.5, 33.5] as [number, number],
  zoom: 4.3,
};

// Cities labeled prominently so the reader registers "this is China" at first
// glance, then can locate Beijing/Shanghai/Wuhan against the NO₂ plumes.
const CITIES: { name: string; coords: [number, number]; tier: "primary" | "secondary" }[] = [
  { name: "BEIJING", coords: [116.4, 39.9], tier: "primary" },
  { name: "SHANGHAI", coords: [121.5, 31.2], tier: "primary" },
  { name: "WUHAN", coords: [114.3, 30.6], tier: "primary" },
  { name: "TIANJIN", coords: [117.2, 39.1], tier: "secondary" },
  { name: "SHIJIAZHUANG", coords: [114.5, 38.0], tier: "secondary" },
  { name: "ZHENGZHOU", coords: [113.6, 34.7], tier: "secondary" },
  { name: "NANJING", coords: [118.8, 32.0], tier: "secondary" },
  { name: "HANGZHOU", coords: [120.2, 30.3], tier: "secondary" },
  { name: "CHONGQING", coords: [106.5, 29.5], tier: "secondary" },
];

const ANCHORS = [
  {
    name: "BEIJING / HEBEI",
    coords: [116.4, 39.9] as [number, number],
    note: "BABA logistics hub",
  },
  {
    name: "YANGTZE DELTA",
    coords: [121.5, 31.2] as [number, number],
    note: "JD fulfillment cluster",
  },
  {
    name: "SHENZHEN",
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

type DensityClass = "low" | "med" | "high" | "extreme" | "n/a";

function classifyDensity(r: number, g: number, b: number, a: number): DensityClass {
  if (a < 16) return "n/a";
  // GIBS NO₂ palette: low → blue/green/yellow/orange/red → extreme red/purple.
  // Heuristic based on RGB; tested against the legend colors.
  if (r > 200 && g < 80) return "extreme";
  if (r > 220 && g > 120 && g < 200) return "high";
  if (g > 180 && r < 200 && b < 120) return "med";
  if (b > 120 && r < 150) return "low";
  if (r > 180 && g > 180) return "med"; // yellow band
  return "low";
}

const DENSITY_LABEL: Record<DensityClass, { text: string; color: string }> = {
  "n/a": { text: "NO DATA", color: "text-slate-500" },
  low: { text: "LOW · clean air", color: "text-blue-300" },
  med: { text: "MED · moderate", color: "text-emerald-300" },
  high: { text: "HIGH · busy industry", color: "text-orange-300" },
  extreme: { text: "EXTREME · super-emitter", color: "text-rose-400" },
};

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
  const [density, setDensity] = useState<DensityClass>("n/a");
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
      style: DARK_BASEMAP,
      center: VIEW.center,
      zoom: VIEW.zoom,
      attributionControl: { compact: true },
      cooperativeGestures: true,
      maxZoom: 9,
      minZoom: 3,
      // Required to sample pixel colors back from the WebGL canvas on hover.
      canvasContextAttributes: { preserveDrawingBuffer: true },
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
      addCityLabels(map);
      addAnchors(map);
      startTimeLapse(map, dates.length);
      startOrbitalSweep(map);
    });
    map.on("mousemove", (e) => {
      setHoverCoord({ lat: e.lngLat.lat, lon: e.lngLat.lng });
      // Sample the canvas pixel under the cursor to read NO₂ palette color.
      try {
        const canvas = map.getCanvas();
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.point.x / rect.width) * canvas.width);
        const y = Math.floor((e.point.y / rect.height) * canvas.height);
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        if (gl) {
          const pixel = new Uint8Array(4);
          gl.readPixels(
            x,
            canvas.height - y, // WebGL origin is bottom-left
            1,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixel
          );
          setDensity(classifyDensity(pixel[0], pixel[1], pixel[2], pixel[3]));
        }
        void dpr;
      } catch {
        /* canvas not ready */
      }
    });
    map.on("mouseout", () => {
      setHoverCoord(null);
      setDensity("n/a");
    });

    mapRef.current = map;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Orbital sweep — animates a diagonal "satellite pass" line moving E→W
  // across the map every 8 s, mimicking Aura's ~98° polar orbit. The line
  // draws + fades so it doesn't dominate the data. Trailing dot marks the
  // satellite sub-point.
  function startOrbitalSweep(map: MapLibreMap) {
    map.addSource("orbital-pass", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
    map.addLayer({
      id: "orbital-pass-line",
      type: "line",
      source: "orbital-pass",
      filter: ["==", ["get", "kind"], "track"],
      paint: {
        "line-color": "#67e8f9",
        "line-width": 1.5,
        "line-opacity": 0.55,
        "line-blur": 0.5,
        "line-dasharray": [3, 2],
      },
    });
    map.addLayer({
      id: "orbital-pass-glow",
      type: "line",
      source: "orbital-pass",
      filter: ["==", ["get", "kind"], "track"],
      paint: {
        "line-color": "#67e8f9",
        "line-width": 8,
        "line-opacity": 0.12,
        "line-blur": 6,
      },
    });
    map.addLayer({
      id: "orbital-pass-sub",
      type: "circle",
      source: "orbital-pass",
      filter: ["==", ["get", "kind"], "sub"],
      paint: {
        "circle-radius": 5,
        "circle-color": "#67e8f9",
        "circle-stroke-color": "#000814",
        "circle-stroke-width": 1.5,
      },
    });
    map.addLayer({
      id: "orbital-pass-sub-halo",
      type: "circle",
      source: "orbital-pass",
      filter: ["==", ["get", "kind"], "sub"],
      paint: {
        "circle-radius": 14,
        "circle-color": "#67e8f9",
        "circle-opacity": 0.18,
        "circle-blur": 0.8,
      },
    });
    map.addLayer({
      id: "orbital-pass-label",
      type: "symbol",
      source: "orbital-pass",
      filter: ["==", ["get", "kind"], "sub"],
      layout: {
        "text-field": "AURA · OMI",
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 9,
        "text-offset": [1.2, 0],
        "text-anchor": "left",
        "text-letter-spacing": 0.15,
      },
      paint: {
        "text-color": "#67e8f9",
        "text-halo-color": "#000814",
        "text-halo-width": 1.6,
      },
    });
  }

  // Time-lapse — cycles emphasis across composite days. Base composite stays
  // visible at moderate opacity; one day at a time fades up to peak, creating
  // a "now playing" wave so the user sees the data refreshing.
  function startTimeLapse(map: MapLibreMap, count: number) {
    const dwellMs = 1400;
    let lastIdx = -1;
    const start = performance.now();

    const tick = (t: number) => {
      if (!mapRef.current) return;
      const elapsed = t - start;
      const idx = Math.floor(elapsed / dwellMs) % count;
      const localT = (elapsed % dwellMs) / dwellMs;
      const ease = localT < 0.5 ? 2 * localT * localT : 1 - Math.pow(-2 * localT + 2, 2) / 2;

      for (let i = 0; i < count; i++) {
        let opacity = PER_LAYER_BASE_OPACITY;
        if (i === idx) {
          opacity = PER_LAYER_BASE_OPACITY + ease * (PER_LAYER_PEAK_OPACITY - PER_LAYER_BASE_OPACITY);
        } else if (i === (idx - 1 + count) % count) {
          opacity = PER_LAYER_BASE_OPACITY + (1 - ease) * (PER_LAYER_PEAK_OPACITY - PER_LAYER_BASE_OPACITY) * 0.45;
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

      // Orbital pass — diagonal NE→SW line crossing the map every 8 s.
      // Position along the orbit (subPhase ∈ [0,1]) drives the sub-point.
      const orbitPeriod = 8000;
      const subPhase = (elapsed % orbitPeriod) / orbitPeriod;
      // Track endpoints — angled to mimic Aura's polar orbit at this latitude.
      const startLon = 90 + subPhase * 50;
      const endLon = 145 + subPhase * 50;
      const startLat = 50;
      const endLat = 18;
      // Sub-point sits 30% along the track for a leading-edge feel.
      const subLon = startLon + (endLon - startLon) * 0.3;
      const subLat = startLat + (endLat - startLat) * 0.3;
      try {
        const src = mapRef.current.getSource("orbital-pass") as
          | maplibregl.GeoJSONSource
          | undefined;
        if (src) {
          src.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { kind: "track" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [startLon, startLat],
                    [endLon, endLat],
                  ],
                },
              },
              {
                type: "Feature",
                properties: { kind: "sub" },
                geometry: { type: "Point", coordinates: [subLon, subLat] },
              },
            ],
          });
        }
      } catch {
        /* noop */
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
        <div ref={containerRef} className="h-[460px] w-full" />

        {/* HUD top-left */}
        <div className="pointer-events-none absolute top-3 left-3 max-w-[300px] rounded-md border border-cyan-400/40 bg-black/80 backdrop-blur px-3 py-2 font-mono text-[10px] leading-snug text-slate-200 shadow-lg">
          <div className="flex items-center gap-1.5 text-cyan-300 mb-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="tracking-widest">ATMOSPHERIC · CHINA NO₂</span>
          </div>
          <div className="text-slate-400">
            SAT <span className="text-slate-200">Aura · OMI · L3 daily</span>
          </div>
          <div className="text-slate-400">
            RESOLUTION <span className="text-slate-200">~14 km / pixel</span>
          </div>
          <div className="text-slate-400">
            COMPOSITE{" "}
            <span className="text-slate-200">
              {COMPOSITE_DAYS}d ({oldestDate} → {freshestDate})
            </span>
          </div>
          <div className="text-slate-400">
            PLAYING{" "}
            <span className="text-rose-300">{dates[activeDayIdx]}</span>{" "}
            <span className="text-slate-500">· 1.4 s/frame</span>
          </div>
          <div className="text-slate-400">
            TICK <span className="text-slate-200">{fmtUTC(now)}</span>
          </div>
        </div>

        {/* Reader caption — explicit at-glance brief, top-center under controls */}
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 max-w-[420px] rounded-md border border-rose-500/30 bg-black/80 backdrop-blur px-3 py-1.5 font-mono text-[10px] text-slate-200 text-center">
          <span className="text-rose-400 font-semibold">RED</span> = active
          factories &amp; diesel trucks emitting NO₂ ·{" "}
          <span className="text-slate-400">darker red = denser industry</span>
        </div>

        {/* HUD bottom-right — coord + sampled NO₂ density */}
        <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-slate-700/60 bg-black/80 backdrop-blur px-2 py-1.5 font-mono text-[10px] text-slate-300 space-y-0.5 min-w-[180px]">
          <div>
            <span className="text-slate-500">COORD </span>
            {hoverCoord ? fmtCoord(hoverCoord.lat, hoverCoord.lon) : "—"}
          </div>
          <div>
            <span className="text-slate-500">NO₂ </span>
            <span className={DENSITY_LABEL[density].color}>
              {DENSITY_LABEL[density].text}
            </span>
          </div>
        </div>

        {/* Timeline strip + legend bottom-center, stacked */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
          <div className="rounded border border-slate-700/60 bg-black/80 backdrop-blur px-3 py-1.5 font-mono text-[9px] text-slate-300">
            <div className="flex items-center gap-2">
              <span className="tracking-widest text-slate-400">NO₂ DENSITY</span>
              <div className="flex h-2 w-40">
                <span className="flex-1 bg-slate-700" />
                <span className="flex-1 bg-blue-600" />
                <span className="flex-1 bg-emerald-500" />
                <span className="flex-1 bg-yellow-400" />
                <span className="flex-1 bg-orange-500" />
                <span className="flex-1 bg-rose-600" />
              </div>
              <span className="tracking-widest text-slate-400">low → high</span>
            </div>
          </div>
          <div className="rounded border border-slate-700/60 bg-black/80 backdrop-blur px-3 py-1.5 font-mono text-[9px] text-slate-300">
            <div className="flex items-center gap-2">
              <span className="tracking-widest text-slate-400">T −</span>
              <div className="flex gap-1">
                {dates.map((_, i) => (
                  <span
                    key={i}
                    className={`inline-block h-1.5 w-6 rounded-sm transition-all ${
                      i === activeDayIdx ? "bg-rose-400" : "bg-slate-700/80"
                    }`}
                  />
                ))}
              </div>
              <span className="tracking-widest text-slate-400">freshest</span>
            </div>
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
  // Place raster BELOW Carto's label layers so city names stay readable.
  const styleLayers = map.getStyle().layers ?? [];
  const firstSymbolId = styleLayers.find((l) => l.type === "symbol")?.id;

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
          "raster-opacity": PER_LAYER_BASE_OPACITY,
          "raster-resampling": "linear",
          "raster-saturation": 0.4,
          "raster-contrast": 0.2,
        },
      },
      firstSymbolId
    );
  });
}

function addCityLabels(map: MapLibreMap) {
  map.addSource("cities", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: CITIES.map((c) => ({
        type: "Feature",
        properties: { name: c.name, tier: c.tier },
        geometry: { type: "Point", coordinates: c.coords },
      })),
    },
  });
  map.addLayer({
    id: "cities-dot",
    type: "circle",
    source: "cities",
    paint: {
      "circle-radius": [
        "case",
        ["==", ["get", "tier"], "primary"],
        3.5,
        2,
      ],
      "circle-color": "#f8fafc",
      "circle-stroke-color": "#000814",
      "circle-stroke-width": 1.2,
    },
  });
  map.addLayer({
    id: "cities-label",
    type: "symbol",
    source: "cities",
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      "text-size": [
        "case",
        ["==", ["get", "tier"], "primary"],
        13,
        10,
      ],
      "text-letter-spacing": 0.12,
      "text-offset": [0, 1.0],
      "text-anchor": "top",
    },
    paint: {
      "text-color": [
        "case",
        ["==", ["get", "tier"], "primary"],
        "#f8fafc",
        "#cbd5e1",
      ],
      "text-halo-color": "#000814",
      "text-halo-width": 2,
    },
  });
}

function addAnchors(map: MapLibreMap) {
  for (const a of ANCHORS) {
    const el = document.createElement("div");
    el.style.cssText = `
      width: 16px; height: 16px;
      border-radius: 50%;
      background: ${ACCENT_CYAN};
      box-shadow: 0 0 0 2px rgba(0,188,212,0.25), 0 0 18px rgba(0,188,212,0.75);
      border: 1.5px solid #000814;
      cursor: pointer;
      animation: vectorialPulse 2.4s ease-in-out infinite;
    `;
    new maplibregl.Marker({ element: el })
      .setLngLat(a.coords)
      .setPopup(
        new maplibregl.Popup({ offset: 16, closeButton: false }).setHTML(
          `<div style="font-family:ui-monospace,monospace;font-size:11px;background:#020617;color:#e2e8f0;padding:6px 8px;border:1px solid ${ACCENT_CYAN};border-radius:4px"><strong style="color:${ACCENT_CYAN}">${a.name}</strong><br/><span style="color:#94a3b8">${a.note}</span></div>`
        )
      )
      .addTo(map);
  }

  if (typeof document !== "undefined" && !document.getElementById("vectorial-pulse-css")) {
    const style = document.createElement("style");
    style.id = "vectorial-pulse-css";
    style.textContent = `@keyframes vectorialPulse { 0%, 100% { box-shadow: 0 0 0 2px rgba(0,188,212,0.25), 0 0 18px rgba(0,188,212,0.75); } 50% { box-shadow: 0 0 0 6px rgba(0,188,212,0.08), 0 0 26px rgba(0,188,212,1); } }`;
    document.head.appendChild(style);
  }
}
