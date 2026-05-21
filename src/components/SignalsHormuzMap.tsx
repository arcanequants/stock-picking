"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Strait of Hormuz AOI — expanded polygon covering the actual 33 km narrows
// where every Gulf-bound VLCC must pass. Wider than the previous tiny box so
// the polygon reads as a real chokepoint, not a stamp on the map.
const HORMUZ_AOI: [number, number][] = [
  [55.95, 26.35],
  [56.85, 26.05],
  [57.0, 26.25],
  [56.1, 26.65],
  [55.95, 26.35],
];

// IMO Traffic Separation Scheme for Strait of Hormuz — canonical inbound /
// outbound shipping lanes. Coordinates from IMO Resolution A.475(XII).
const TSS_OUTBOUND: [number, number][] = [
  [56.05, 26.55],
  [56.35, 26.4],
  [56.7, 26.2],
  [57.05, 26.0],
  [57.45, 25.85],
];
const TSS_INBOUND: [number, number][] = [
  [57.45, 26.2],
  [57.05, 26.35],
  [56.7, 26.55],
  [56.35, 26.75],
  [56.05, 26.9],
];

// Major ports framing the chokepoint — what makes Hormuz Hormuz.
const PORTS: { lon: number; lat: number; name: string; country: string }[] = [
  { lon: 56.276, lat: 27.196, name: "BANDAR ABBAS", country: "IR" },
  { lon: 56.341, lat: 25.119, name: "FUJAIRAH", country: "AE" },
  { lon: 56.247, lat: 26.218, name: "KHASAB", country: "OM" },
  { lon: 55.273, lat: 25.204, name: "DUBAI", country: "AE" },
];

const HORMUZ_VIEW = {
  center: [56.55, 26.45] as [number, number],
  zoom: 7.0,
};

// NASA GIBS — MODIS Terra true-color satellite imagery. Real Earth from space,
// not a vector basemap. We use a date 3 days back to guarantee the tile is
// fully composited (MODIS pipeline finishes within ~36 h of acquisition).
function gibsDateBack(daysBack: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().split("T")[0];
}
const SAT_DATE = gibsDateBack(3);
const SAT_TILE = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${SAT_DATE}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg`;

const ACCENT_CYAN = "#00BCD4";
const TANKER_RED = "#ef4444";
const PORT_AMBER = "#fbbf24";

type AisShip = {
  mmsi: number;
  lat: number;
  lon: number;
  cog: number;
  shipType?: number;
  name?: string;
  lastSeen: number;
  trail: [number, number][];
};

const IS_TANKER = (t?: number) => t !== undefined && t >= 80 && t <= 89;
const IS_VESSEL = (t?: number) => t !== undefined && t >= 70 && t <= 89;

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

// Approximate ring around a lat/lon — degrees-only (flat-earth at this zoom).
// Good enough for visual range rings; would distort near the poles.
function ringCoords(
  cx: number,
  cy: number,
  radiusDeg: number,
  segments: number
): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    out.push([cx + Math.cos(a) * radiusDeg, cy + Math.sin(a) * radiusDeg * 0.85]);
  }
  return out;
}

// Pie-slice wedge from angle a → angle b (radians), used for the sweep.
function wedgeCoords(
  cx: number,
  cy: number,
  rDeg: number,
  a: number,
  b: number,
  segments = 18
): [number, number][] {
  const pts: [number, number][] = [[cx, cy]];
  for (let i = 0; i <= segments; i++) {
    const ang = a + ((b - a) * i) / segments;
    pts.push([cx + Math.cos(ang) * rDeg, cy + Math.sin(ang) * rDeg * 0.85]);
  }
  pts.push([cx, cy]);
  return pts;
}

// Leader-line annotations — point at real geography. No synthetic content.
// Each annotation has anchor (where the line ends) and label (where text sits).
const ANNOTATIONS: { anchor: [number, number]; label: [number, number]; text: string; subtext: string }[] = [
  {
    anchor: [56.45, 26.45],
    label: [55.85, 26.95],
    text: "33 KM NARROWS",
    subtext: "Iran ↔ Oman gate",
  },
  {
    anchor: [56.65, 26.25],
    label: [57.4, 26.8],
    text: "21% SEABORNE OIL",
    subtext: "~17 Mb/d through here",
  },
  {
    anchor: [56.341, 25.119],
    label: [55.5, 24.7],
    text: "FUJAIRAH BYPASS",
    subtext: "ADCOP 1.8 Mb/d pipeline",
  },
  {
    anchor: [56.276, 27.196],
    label: [55.4, 27.5],
    text: "BANDAR ABBAS",
    subtext: "Iran's main oil port",
  },
];

export function SignalsHormuzMap({
  baselineCount,
  liveCountFallback,
}: {
  baselineCount?: number | null;
  liveCountFallback?: number | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const shipsRef = useRef<Map<number, AisShip>>(new Map());
  const rafRef = useRef<number | null>(null);
  const dashStepRef = useRef(0);

  const [status, setStatus] = useState<
    "init" | "connecting" | "live" | "no-key" | "error"
  >("init");
  const [shipCount, setShipCount] = useState(0);
  const [tankerCount, setTankerCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastTick, setLastTick] = useState<Date | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Live oil ticker — gives the map a heartbeat even while AISStream's TLS
  // is broken. Polls /api/markets/oil every 30 s; the route caches 20 s on
  // the edge so we're not hammering Yahoo.
  type Quote = {
    symbol: string;
    label: string;
    price: number | null;
    change_pct: number | null;
    observed_at: string | null;
  };
  const [brent, setBrent] = useState<Quote | null>(null);
  const [wti, setWti] = useState<Quote | null>(null);
  const [tickerPulse, setTickerPulse] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/markets/oil", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { brent: Quote; wti: Quote };
        setBrent(json.brent);
        setWti(json.wti);
        setTickerPulse((p) => p + 1);
      } catch {
        /* noop */
      }
    }
    poll();
    const t = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_AISSTREAM_API_KEY?.trim() || "";

  // Initialize map once with custom satellite-imagery style.
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
            attribution:
              "Imagery © NASA GIBS / MODIS · OpenStreetMap contributors",
            maxzoom: 9,
          },
        },
        layers: [
          { id: "bg", type: "background", paint: { "background-color": "#000814" } },
          { id: "satellite", type: "raster", source: "satellite", paint: { "raster-opacity": 0.92, "raster-saturation": -0.15, "raster-contrast": 0.08 } },
        ],
      },
      center: HORMUZ_VIEW.center,
      zoom: HORMUZ_VIEW.zoom,
      attributionControl: { compact: true },
      cooperativeGestures: true,
      maxZoom: 9,
      minZoom: 5,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 120, unit: "nautical" }),
      "bottom-left"
    );

    map.on("load", () => {
      addOperationalLayers(map);
      startAnimations(map);
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
  }, []);

  function addOperationalLayers(map: MapLibreMap) {
    // Port halos — soft cyan glow around each port location to anchor the eye.
    map.addSource("ports", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: PORTS.map((p) => ({
          type: "Feature",
          properties: { name: p.name, country: p.country },
          geometry: { type: "Point", coordinates: [p.lon, p.lat] },
        })),
      },
    });
    map.addLayer({
      id: "ports-halo",
      type: "circle",
      source: "ports",
      paint: {
        "circle-radius": 14,
        "circle-color": PORT_AMBER,
        "circle-opacity": 0.12,
        "circle-blur": 0.6,
      },
    });
    map.addLayer({
      id: "ports-dot",
      type: "circle",
      source: "ports",
      paint: {
        "circle-radius": 3.5,
        "circle-color": PORT_AMBER,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#000814",
      },
    });
    map.addLayer({
      id: "ports-label",
      type: "symbol",
      source: "ports",
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 10,
        "text-offset": [0, 1.1],
        "text-letter-spacing": 0.12,
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#fde68a",
        "text-halo-color": "#000814",
        "text-halo-width": 1.6,
      },
    });

    // TSS lanes — animated flowing dashes (set later in startAnimations).
    map.addSource("tss", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { name: "OUTBOUND · Gulf → Ocean" },
            geometry: { type: "LineString", coordinates: TSS_OUTBOUND },
          },
          {
            type: "Feature",
            properties: { name: "INBOUND · Ocean → Gulf" },
            geometry: { type: "LineString", coordinates: TSS_INBOUND },
          },
        ],
      },
    });
    // Glow layer underneath for soft cyan halo on lanes.
    map.addLayer({
      id: "tss-glow",
      type: "line",
      source: "tss",
      paint: {
        "line-color": ACCENT_CYAN,
        "line-width": 6,
        "line-opacity": 0.22,
        "line-blur": 4,
      },
    });
    map.addLayer({
      id: "tss-line",
      type: "line",
      source: "tss",
      paint: {
        "line-color": ACCENT_CYAN,
        "line-width": 1.8,
        "line-opacity": 0.95,
        "line-dasharray": [0, 4, 3],
      },
    });
    map.addLayer({
      id: "tss-label",
      type: "symbol",
      source: "tss",
      layout: {
        "symbol-placement": "line",
        "text-field": ["get", "name"],
        "text-size": 9,
        "text-letter-spacing": 0.15,
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
      },
      paint: {
        "text-color": ACCENT_CYAN,
        "text-halo-color": "#000814",
        "text-halo-width": 1.4,
        "text-opacity": 0.9,
      },
    });

    // AOI polygon — Hormuz narrows. Filled cyan with brand glow.
    map.addSource("hormuz-aoi", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: { label: "STRAIT OF HORMUZ · 21% of seaborne oil" },
        geometry: { type: "Polygon", coordinates: [HORMUZ_AOI] },
      },
    });
    map.addLayer({
      id: "hormuz-aoi-fill",
      type: "fill",
      source: "hormuz-aoi",
      paint: { "fill-color": ACCENT_CYAN, "fill-opacity": 0.1 },
    });
    map.addLayer({
      id: "hormuz-aoi-line",
      type: "line",
      source: "hormuz-aoi",
      paint: {
        "line-color": ACCENT_CYAN,
        "line-width": 1.5,
        "line-dasharray": [2, 2],
        "line-opacity": 0.85,
      },
    });
    map.addLayer({
      id: "hormuz-aoi-label",
      type: "symbol",
      source: "hormuz-aoi",
      layout: {
        "symbol-placement": "point",
        "text-field": ["get", "label"],
        "text-size": 11,
        "text-letter-spacing": 0.12,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-offset": [0, -2],
      },
      paint: {
        "text-color": ACCENT_CYAN,
        "text-halo-color": "#000814",
        "text-halo-width": 1.6,
      },
    });

    // Radar sweep — a 1°-wide arc that orbits the chokepoint every 4s.
    // Pure RAF-driven, no network needed. Gives the map a "always alive"
    // feel even when AISStream is down.
    map.addSource("radar-sweep", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [[[56.45, 26.45]]] },
      },
    });
    map.addLayer({
      id: "radar-sweep-fill",
      type: "fill",
      source: "radar-sweep",
      paint: {
        "fill-color": ACCENT_CYAN,
        "fill-opacity": 0.18,
      },
    });

    // Radar concentric range rings (static) — anchors the sweep visually.
    map.addSource("radar-rings", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [0.25, 0.45, 0.65].map((r) => ({
          type: "Feature" as const,
          properties: { radius: r },
          geometry: {
            type: "LineString" as const,
            coordinates: ringCoords(56.45, 26.45, r, 64),
          },
        })),
      },
    });
    map.addLayer({
      id: "radar-rings-line",
      type: "line",
      source: "radar-rings",
      paint: {
        "line-color": ACCENT_CYAN,
        "line-width": 0.8,
        "line-opacity": 0.25,
        "line-dasharray": [2, 3],
      },
    });

    // Chokepoint pulse — animated by startAnimations (RAF).
    map.addSource("chokepoint", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: [56.45, 26.45] },
      },
    });
    map.addLayer({
      id: "chokepoint-pulse-1",
      type: "circle",
      source: "chokepoint",
      paint: {
        "circle-radius": 8,
        "circle-color": ACCENT_CYAN,
        "circle-opacity": 0.5,
        "circle-stroke-color": ACCENT_CYAN,
        "circle-stroke-width": 1,
        "circle-stroke-opacity": 0.7,
      },
    });
    map.addLayer({
      id: "chokepoint-pulse-2",
      type: "circle",
      source: "chokepoint",
      paint: {
        "circle-radius": 8,
        "circle-color": ACCENT_CYAN,
        "circle-opacity": 0.4,
        "circle-stroke-color": ACCENT_CYAN,
        "circle-stroke-width": 1,
        "circle-stroke-opacity": 0.5,
      },
    });
    map.addLayer({
      id: "chokepoint-dot",
      type: "circle",
      source: "chokepoint",
      paint: {
        "circle-radius": 4,
        "circle-color": ACCENT_CYAN,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#000814",
      },
    });

    // Leader-line annotations — pointing at real chokepoint geography.
    map.addSource("annotations", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: ANNOTATIONS.flatMap((a, i) => [
          {
            type: "Feature" as const,
            properties: { kind: "leader", idx: i },
            geometry: {
              type: "LineString" as const,
              coordinates: [a.anchor, a.label],
            },
          },
          {
            type: "Feature" as const,
            properties: {
              kind: "label",
              text: a.text,
              subtext: a.subtext,
              idx: i,
            },
            geometry: { type: "Point" as const, coordinates: a.label },
          },
          {
            type: "Feature" as const,
            properties: { kind: "anchor", idx: i },
            geometry: { type: "Point" as const, coordinates: a.anchor },
          },
        ]),
      },
    });
    map.addLayer({
      id: "annotations-leader",
      type: "line",
      source: "annotations",
      filter: ["==", ["get", "kind"], "leader"],
      paint: {
        "line-color": "#e2e8f0",
        "line-width": 0.8,
        "line-opacity": 0.6,
      },
    });
    map.addLayer({
      id: "annotations-anchor",
      type: "circle",
      source: "annotations",
      filter: ["==", ["get", "kind"], "anchor"],
      paint: {
        "circle-radius": 3,
        "circle-color": "#e2e8f0",
        "circle-stroke-color": "#000814",
        "circle-stroke-width": 1,
      },
    });
    map.addLayer({
      id: "annotations-label",
      type: "symbol",
      source: "annotations",
      filter: ["==", ["get", "kind"], "label"],
      layout: {
        "text-field": ["get", "text"],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 11,
        "text-letter-spacing": 0.12,
        "text-anchor": "left",
        "text-offset": [0.4, 0],
      },
      paint: {
        "text-color": "#f1f5f9",
        "text-halo-color": "#000814",
        "text-halo-width": 2,
      },
    });
    map.addLayer({
      id: "annotations-sublabel",
      type: "symbol",
      source: "annotations",
      filter: ["==", ["get", "kind"], "label"],
      layout: {
        "text-field": ["get", "subtext"],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": 9,
        "text-letter-spacing": 0.06,
        "text-anchor": "left",
        "text-offset": [0.4, 1.1],
      },
      paint: {
        "text-color": "#94a3b8",
        "text-halo-color": "#000814",
        "text-halo-width": 1.5,
      },
    });

    // Ship trails (drawn beneath dots).
    map.addSource("ship-trails", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: "ship-trails-line",
      type: "line",
      source: "ship-trails",
      paint: {
        "line-color": [
          "case",
          ["==", ["get", "isTanker"], true],
          TANKER_RED,
          "#94a3b8",
        ],
        "line-width": 1.2,
        "line-opacity": 0.55,
      },
    });

    // Ships source (live AIS + demo overlap-safe).
    map.addSource("ships", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    // Glow halo for tankers.
    map.addLayer({
      id: "ships-glow",
      type: "circle",
      source: "ships",
      paint: {
        "circle-radius": [
          "case",
          ["==", ["get", "isTanker"], true],
          11,
          6,
        ],
        "circle-color": [
          "case",
          ["==", ["get", "isTanker"], true],
          TANKER_RED,
          "#94a3b8",
        ],
        "circle-opacity": 0.18,
        "circle-blur": 0.8,
      },
    });
    map.addLayer({
      id: "ships-dot",
      type: "circle",
      source: "ships",
      paint: {
        "circle-radius": [
          "case",
          ["==", ["get", "isTanker"], true],
          5,
          3,
        ],
        "circle-color": [
          "case",
          ["==", ["get", "isTanker"], true],
          TANKER_RED,
          "#cbd5e1",
        ],
        "circle-stroke-width": 1,
        "circle-stroke-color": "#000814",
        "circle-opacity": 0.98,
      },
    });

    map.on("click", "ships-dot", (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const props = f.properties as Record<string, unknown>;
      const name = String(props.name ?? "Unknown vessel");
      const mmsi = String(props.mmsi ?? "");
      const isDemo = props.demo === true || props.demo === "true";
      const tanker = props.isTanker === true || props.isTanker === "true";
      const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
      new maplibregl.Popup({ offset: 10, closeButton: false })
        .setLngLat(coords)
        .setHTML(
          `<div style="font-family:ui-monospace,monospace;font-size:11px;color:#e2e8f0;background:#020617;padding:6px 8px;border:1px solid ${tanker ? TANKER_RED : ACCENT_CYAN};border-radius:4px">
            <strong style="color:${tanker ? TANKER_RED : "#cbd5e1"}">${name}</strong><br/>
            ${isDemo ? '<span style="color:#94a3b8">DEMO · synthetic TSS body</span>' : `MMSI ${mmsi}`}${tanker && !isDemo ? " · TANKER" : ""}
          </div>`
        )
        .addTo(map);
    });
  }

  // Master RAF loop — animates flowing dashes, pulsing chokepoint, and (when
  // AIS is unavailable) synthetic demo vessels moving along TSS lanes.
  function startAnimations(map: MapLibreMap) {
    let lastDashChange = 0;
    const dashSequence = [
      [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
      [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5],
      [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5],
      [0, 3, 3, 1], [0, 3.5, 3, 0.5],
    ];

    const start = performance.now();
    const tick = (now: number) => {
      if (!mapRef.current) return;
      const m = mapRef.current;
      const elapsed = now - start;

      // 1. Flowing TSS dashes — change pattern every 90ms.
      if (now - lastDashChange > 90) {
        dashStepRef.current = (dashStepRef.current + 1) % dashSequence.length;
        try {
          m.setPaintProperty(
            "tss-line",
            "line-dasharray",
            dashSequence[dashStepRef.current] as unknown as number[]
          );
        } catch {
          /* layer may not exist mid-teardown */
        }
        lastDashChange = now;
      }

      // 2. Chokepoint pulses — two staggered rings expanding then fading.
      const period = 2400;
      const phase1 = (elapsed % period) / period;
      const phase2 = ((elapsed + period / 2) % period) / period;
      try {
        m.setPaintProperty("chokepoint-pulse-1", "circle-radius", 8 + phase1 * 36);
        m.setPaintProperty("chokepoint-pulse-1", "circle-opacity", 0.45 * (1 - phase1));
        m.setPaintProperty("chokepoint-pulse-1", "circle-stroke-opacity", 0.7 * (1 - phase1));
        m.setPaintProperty("chokepoint-pulse-2", "circle-radius", 8 + phase2 * 36);
        m.setPaintProperty("chokepoint-pulse-2", "circle-opacity", 0.45 * (1 - phase2));
        m.setPaintProperty("chokepoint-pulse-2", "circle-stroke-opacity", 0.7 * (1 - phase2));
      } catch {
        /* noop */
      }

      // 3. Radar sweep — wedge rotates 360° every 4 s. We update geometry
      // by rewriting the geojson source. Cheaper than rebuilding layers.
      const sweepPeriod = 4000;
      const sweepPhase = (elapsed % sweepPeriod) / sweepPeriod;
      const angle = sweepPhase * Math.PI * 2 - Math.PI / 2;
      const wedgeWidth = Math.PI / 6; // 30°
      try {
        const src = m.getSource("radar-sweep") as
          | maplibregl.GeoJSONSource
          | undefined;
        if (src) {
          src.setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [
                wedgeCoords(56.45, 26.45, 0.65, angle - wedgeWidth, angle),
              ],
            },
          });
        }
      } catch {
        /* noop */
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }

  function renderShips() {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("ships") as maplibregl.GeoJSONSource | undefined;
    const trailsSrc = map.getSource("ship-trails") as maplibregl.GeoJSONSource | undefined;
    if (!src || !trailsSrc) return;
    const features = Array.from(shipsRef.current.values())
      .filter((s) => IS_VESSEL(s.shipType) || s.shipType === undefined)
      .map((s) => ({
        type: "Feature" as const,
        properties: {
          mmsi: s.mmsi,
          isTanker: IS_TANKER(s.shipType),
          name: s.name ?? `MMSI ${s.mmsi}`,
          shipType: s.shipType ?? null,
        },
        geometry: { type: "Point" as const, coordinates: [s.lon, s.lat] },
      }));
    src.setData({ type: "FeatureCollection", features });

    // Trail features: only ships with ≥2 positions.
    const trailFeatures = Array.from(shipsRef.current.values())
      .filter((s) => s.trail.length >= 2)
      .map((s) => ({
        type: "Feature" as const,
        properties: { isTanker: IS_TANKER(s.shipType) },
        geometry: { type: "LineString" as const, coordinates: s.trail },
      }));
    trailsSrc.setData({ type: "FeatureCollection", features: trailFeatures });

    setShipCount(features.length);
    setTankerCount(features.filter((f) => f.properties.isTanker).length);
  }

  // AISStream WebSocket.
  useEffect(() => {
    if (!apiKey) {
      setStatus("no-key");
      return;
    }
    setStatus("connecting");
    let cancelled = false;
    let pruneTimer: ReturnType<typeof setInterval> | null = null;
    let renderTimer: ReturnType<typeof setInterval> | null = null;

    try {
      const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        ws.send(
          JSON.stringify({
            APIKey: apiKey,
            BoundingBoxes: [[[26.0, 55.5], [27.5, 57.5]]],
            FilterMessageTypes: ["PositionReport", "ShipStaticData"],
          })
        );
        setStatus("live");
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          const meta = msg?.MetaData;
          if (!meta) return;
          const mmsi = Number(meta.MMSI);
          if (!mmsi) return;
          setLastTick(new Date());

          if (msg.MessageType === "PositionReport") {
            const r = msg.Message?.PositionReport;
            if (!r) return;
            const lat = Number(r.Latitude);
            const lon = Number(r.Longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
            const existing = shipsRef.current.get(mmsi);
            const newTrail: [number, number][] = existing ? [...existing.trail, [lon, lat]] : [[lon, lat]];
            // Keep last 10 positions for the trail.
            if (newTrail.length > 10) newTrail.shift();
            shipsRef.current.set(mmsi, {
              mmsi,
              lat,
              lon,
              cog: Number(r.Cog ?? 0),
              shipType: existing?.shipType,
              name: existing?.name ?? meta.ShipName?.trim() ?? undefined,
              lastSeen: Date.now(),
              trail: newTrail,
            });
          } else if (msg.MessageType === "ShipStaticData") {
            const r = msg.Message?.ShipStaticData;
            if (!r) return;
            const existing = shipsRef.current.get(mmsi);
            if (existing) {
              shipsRef.current.set(mmsi, {
                ...existing,
                shipType: Number(r.Type ?? existing.shipType),
                name: r.Name?.trim() || existing.name,
              });
            }
          }
        } catch {
          /* ignore malformed frames */
        }
      };

      ws.onerror = () => {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg("AIS provider unreachable — synthetic demo routes shown.");
      };
      ws.onclose = () => {
        if (cancelled) return;
        if (status !== "error") setStatus("error");
      };

      renderTimer = setInterval(renderShips, 2000);
      pruneTimer = setInterval(() => {
        const cutoff = Date.now() - 10 * 60 * 1000;
        for (const [mmsi, ship] of shipsRef.current) {
          if (ship.lastSeen < cutoff) shipsRef.current.delete(mmsi);
        }
        renderShips();
      }, 60_000);

      return () => {
        cancelled = true;
        if (renderTimer) clearInterval(renderTimer);
        if (pruneTimer) clearInterval(pruneTimer);
        try {
          ws.close();
        } catch {
          /* noop */
        }
      };
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const statusPill = useMemo(() => {
    switch (status) {
      case "live":
        return { dot: "bg-emerald-400", label: "LIVE · AIS + GEOSPATIAL", solid: true };
      case "connecting":
        return { dot: "bg-amber-400", label: "HANDSHAKING…", solid: false };
      case "no-key":
        return { dot: "bg-cyan-400", label: "LIVE · GEOSPATIAL", solid: true };
      case "error":
        return { dot: "bg-cyan-400", label: "LIVE · GEOSPATIAL", solid: true };
      default:
        return { dot: "bg-slate-400", label: "INIT", solid: false };
    }
  }, [status]);

  const baselineDisplay =
    baselineCount !== null && baselineCount !== undefined
      ? Math.round(Number(baselineCount))
      : null;
  const allVesselsDisplay =
    status === "live"
      ? shipCount
      : liveCountFallback !== null && liveCountFallback !== undefined
        ? Math.round(Number(liveCountFallback))
        : null;
  const tankerDisplay = status === "live" ? tankerCount : null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-faint">
            Maritime · Strait of Hormuz
          </p>
          <h3 className="text-base font-semibold mt-0.5">
            Tankers passing the world&apos;s most sensitive oil chokepoint
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-text-muted whitespace-nowrap tracking-widest">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full ${statusPill.dot} opacity-75 ${statusPill.solid ? "animate-ping" : ""}`}
            />
            <span
              className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusPill.dot}`}
            />
          </span>
          {statusPill.label}
        </span>
      </div>

      {/* Live ticker tape — Brent + WTI quotes refreshing every 30 s.
          Sits ABOVE the map so it's always legible regardless of basemap. */}
      <div className="border-y border-border bg-black/95 overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-2 font-mono text-[11px] text-slate-200 whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-cyan-300/90">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-300" />
            </span>
            LIVE · 30s
          </span>
          <QuoteCell label="BRENT" symbol="BZ=F" q={brent} pulse={tickerPulse} />
          <span className="text-slate-700">·</span>
          <QuoteCell label="WTI" symbol="CL=F" q={wti} pulse={tickerPulse} />
          <span className="text-slate-700 hidden sm:inline">·</span>
          <span className="hidden sm:inline text-[10px] text-slate-500">
            ~17 Mb/d transits this strait — every $1 swing = $17M/day in flows.
          </span>
        </div>
      </div>

      {/* Map shell — mission-control black surface, fixed dark even in light mode */}
      <div className="relative bg-[#000814]">
        <div ref={containerRef} className="h-[440px] w-full" />

        {/* HUD top-left — data lineage */}
        <div className="pointer-events-none absolute top-3 left-3 max-w-[280px] rounded-md border border-cyan-400/40 bg-black/75 backdrop-blur px-3 py-2 font-mono text-[10px] leading-snug text-slate-200 shadow-lg">
          <div className="flex items-center gap-1.5 text-cyan-300 mb-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
            <span className="tracking-widest">MARITIME · HORMUZ TSS</span>
          </div>
          <div className="text-slate-400">
            BASE <span className="text-slate-200">MODIS Terra · {SAT_DATE}</span>
          </div>
          <div className="text-slate-400">
            VESSELS{" "}
            <span className="text-slate-200">
              {status === "live" ? `AISStream WS · ${shipCount} tracked` : "AIS feed pending"}
            </span>
          </div>
          <div className="text-slate-400">
            BBOX <span className="text-slate-200">55.5–57.5°E · 26.0–27.5°N</span>
          </div>
          <div className="text-slate-400">
            TICK{" "}
            <span className="text-slate-200">
              {lastTick ? fmtUTC(lastTick) : fmtUTC(now)}
            </span>
          </div>
        </div>

        {/* HUD bottom-right — coordinate readout on hover */}
        <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-slate-700/60 bg-black/60 backdrop-blur px-2 py-1 font-mono text-[10px] text-slate-300">
          {hoverCoord
            ? fmtCoord(hoverCoord.lat, hoverCoord.lon)
            : "MOVE CURSOR FOR COORDS"}
        </div>

        {/* Legend bottom-left aligned above scale bar */}
        <div className="pointer-events-none absolute bottom-12 left-3 rounded border border-slate-700/60 bg-black/60 backdrop-blur px-2 py-1.5 font-mono text-[9px] text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-rose-500" /> TANKER (IMO 80-89)</div>
          <div className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-slate-300" /> VESSEL (IMO 70-79)</div>
          <div className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-amber-300" /> MAJOR PORT</div>
          <div className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: ACCENT_CYAN }} /> IMO TSS LANE</div>
        </div>

        {/* Vectorial corner watermark */}
        <div className="pointer-events-none absolute top-3 right-16 font-mono text-[9px] tracking-[0.25em] text-cyan-400/70">
          VECTORIAL · SIGNALS
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3 px-5 py-4 text-sm bg-card border-t border-border">
        <Stat
          label="Tankers in view"
          value={tankerDisplay}
          tone="red"
          subtle={status === "live" ? "live · AIS" : "AIS feed pending"}
        />
        <Stat
          label="All vessels"
          value={allVesselsDisplay}
          tone="cyan"
          subtle={status === "live" ? "live · AIS" : "last baseline"}
        />
        <Stat
          label="30d transit avg"
          value={baselineDisplay}
          tone="muted"
          subtle="from signal baseline"
        />
      </div>

      {(status === "no-key" || status === "error") && (
        <div className="px-5 pb-4 text-[11px] text-text-muted leading-relaxed border-t border-border pt-3 font-mono">
          <span className="text-cyan-400">●</span> Live geospatial layer: MODIS Terra imagery ({SAT_DATE}), IMO Traffic Separation Scheme lanes, AOI per signal methodology. Vessel overlay activates when AIS feed reconnects.
        </div>
      )}
    </div>
  );
}

function QuoteCell({
  label,
  symbol,
  q,
  pulse,
}: {
  label: string;
  symbol: string;
  q: {
    price: number | null;
    change_pct: number | null;
  } | null;
  pulse: number;
}) {
  const up = q?.change_pct != null && q.change_pct >= 0;
  return (
    <span
      key={pulse}
      className="inline-flex items-baseline gap-1.5 transition-opacity duration-300"
      title={symbol}
    >
      <span className="text-[10px] text-slate-500 tracking-widest">{label}</span>
      <span className="text-slate-100 tabular-nums">
        {q?.price != null ? `$${q.price.toFixed(2)}` : "—"}
      </span>
      {q?.change_pct != null && (
        <span
          className={`tabular-nums text-[10px] ${
            up ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {up ? "▲" : "▼"} {up ? "+" : ""}
          {q.change_pct.toFixed(2)}%
        </span>
      )}
    </span>
  );
}

function Stat({
  label,
  value,
  tone,
  subtle,
}: {
  label: string;
  value: number | null;
  tone: "red" | "cyan" | "muted";
  subtle?: string;
}) {
  const colorClass =
    tone === "red"
      ? "text-rose-500 dark:text-rose-400"
      : tone === "cyan"
        ? "text-cyan-600 dark:text-cyan-400"
        : "text-text-muted";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-faint">
        {label}
      </p>
      <p
        key={value ?? "empty"}
        className={`text-xl font-semibold tabular-nums ${colorClass} font-mono transition-opacity`}
      >
        {value !== null ? value : "—"}
      </p>
      {subtle && (
        <p className="text-[9px] uppercase tracking-widest text-text-faint mt-0.5">
          {subtle}
        </p>
      )}
    </div>
  );
}
