"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Strait of Hormuz AOI — the 33 km narrows where every Gulf-bound VLCC passes.
const HORMUZ_AOI: [number, number][] = [
  [55.95, 26.35],
  [56.85, 26.05],
  [57.0, 26.25],
  [56.1, 26.65],
  [55.95, 26.35],
];

// IMO Traffic Separation Scheme — canonical inbound/outbound lanes per
// IMO Resolution A.475(XII).
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

// Esri World Imagery — deep-blue ocean, crisp coastlines. Per Robert Simmon,
// the consumer floor for "Earth from space" basemaps in 2026.
const SAT_TILE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SAT_ATTRIBUTION =
  "Imagery © Esri · Maxar · Earthstar Geographics · USDA · USGS";

// GFW tile proxy — Bearer token injected server-side. Variants:
//   ais  → public-global-presence (all AIS-broadcasting vessels)
//   sar  → public-global-sar-presence (Sentinel-1 detections, dark vessels)
const GFW_TILE = (variant: "ais" | "sar") =>
  `/api/signals/hormuz/gfw/tile/{z}/{x}/{y}?v=${variant}`;

const ACCENT_CYAN = "#00BCD4";
const DARK_MAGENTA = "#ff3df5";
const STS_RED = "#ef4444";
const PORT_AMBER = "#fbbf24";

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

const ANNOTATIONS: {
  anchor: [number, number];
  label: [number, number];
  text: string;
  subtext: string;
}[] = [
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

type GfwEvent = {
  id: string;
  type: string;
  start: string;
  end: string;
  position: { lat: number; lon: number };
  vessel: { name: string | null; flag: string | null; type: string | null } | null;
  counterparty?: { name: string | null; flag: string | null } | null;
  port?: { name: string; flag: string } | null;
};

type GfwEventsResponse = {
  type: string;
  window: { start: string; end: string };
  total_global: number;
  total_hormuz: number;
  events: GfwEvent[];
  fetched_at: string;
};

type EventBundle = {
  gaps: GfwEventsResponse | null;
  encounters: GfwEventsResponse | null;
};

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export function SignalsHormuzMap({
  baselineCount,
  liveCountFallback,
}: {
  baselineCount?: number | null;
  liveCountFallback?: number | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const rafRef = useRef<number | null>(null);
  const dashStepRef = useRef(0);

  const [bundle, setBundle] = useState<EventBundle>({
    gaps: null,
    encounters: null,
  });
  const [bundleStatus, setBundleStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [hoverCoord, setHoverCoord] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [layerToggles, setLayerToggles] = useState({
    ais: true,
    sar: true,
    events: true,
  });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Live oil ticker — Brent + WTI quotes via existing /api/markets/oil edge route.
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

  // GFW event bundle — three parallel fetches, cached 6h on the edge.
  useEffect(() => {
    let cancelled = false;
    async function loadBundle() {
      setBundleStatus("loading");
      try {
        // Only gaps + encounters are paginable under the edge budget. loitering
        // and port-visits are 600k–1.9M events / 30d globally on the free tier
        // and walking them server-side blows the 90s limit. Surface those in
        // a later iteration via a nightly cron + cache.
        const [gaps, encounters] = await Promise.all([
          fetch("/api/signals/hormuz/gfw/events?type=gaps").then((r) =>
            r.ok ? (r.json() as Promise<GfwEventsResponse>) : null
          ),
          fetch("/api/signals/hormuz/gfw/events?type=encounters").then((r) =>
            r.ok ? (r.json() as Promise<GfwEventsResponse>) : null
          ),
        ]);
        if (cancelled) return;
        setBundle({ gaps, encounters });
        setBundleStatus(gaps || encounters ? "ready" : "error");
      } catch {
        if (!cancelled) setBundleStatus("error");
      }
    }
    loadBundle();
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize map.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs:
          "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/glyphs/{fontstack}/{range}.pbf",
        sources: {
          satellite: {
            type: "raster",
            tiles: [SAT_TILE],
            tileSize: 256,
            attribution: SAT_ATTRIBUTION,
            maxzoom: 18,
          },
          "gfw-ais": {
            type: "vector",
            tiles: [GFW_TILE("ais")],
            attribution:
              'AIS heat © <a href="https://globalfishingwatch.org/">Global Fishing Watch</a> (CC BY-SA 4.0)',
            minzoom: 0,
            maxzoom: 9,
          },
          "gfw-sar": {
            type: "vector",
            tiles: [GFW_TILE("sar")],
            attribution:
              'SAR detections © Global Fishing Watch / Sentinel-1 (CC BY-SA 4.0)',
            minzoom: 0,
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
              "raster-opacity": 1.0,
              "raster-resampling": "linear",
              "raster-saturation": 0.15,
              "raster-contrast": 0.1,
              "raster-brightness-min": 0.02,
            },
          },
          {
            id: "gfw-ais-layer",
            type: "fill",
            source: "gfw-ais",
            "source-layer": "main",
            paint: {
              "fill-color": ACCENT_CYAN,
              "fill-opacity": 0.32,
              "fill-outline-color": ACCENT_CYAN,
            },
          },
          {
            id: "gfw-sar-layer",
            type: "fill",
            source: "gfw-sar",
            "source-layer": "main",
            paint: {
              "fill-color": DARK_MAGENTA,
              "fill-opacity": 0.55,
              "fill-outline-color": DARK_MAGENTA,
            },
          },
        ],
      },
      center: HORMUZ_VIEW.center,
      zoom: HORMUZ_VIEW.zoom,
      attributionControl: { compact: true },
      cooperativeGestures: true,
      maxZoom: 12,
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

  // Toggle GFW raster layers when checkboxes flip.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    try {
      if (map.getLayer("gfw-ais-layer")) {
        map.setLayoutProperty(
          "gfw-ais-layer",
          "visibility",
          layerToggles.ais ? "visible" : "none"
        );
      }
      if (map.getLayer("gfw-sar-layer")) {
        map.setLayoutProperty(
          "gfw-sar-layer",
          "visibility",
          layerToggles.sar ? "visible" : "none"
        );
      }
      const eventLayers = [
        "gaps-glow",
        "gaps-dot",
        "encounters-glow",
        "encounters-dot",
        "encounters-label",
      ];
      for (const id of eventLayers) {
        if (map.getLayer(id)) {
          map.setLayoutProperty(
            id,
            "visibility",
            layerToggles.events ? "visible" : "none"
          );
        }
      }
    } catch {
      /* noop */
    }
  }, [layerToggles]);

  // When the GFW event bundle resolves, push features into the existing sources.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const push = (sourceId: string, events: GfwEvent[]) => {
      const src = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData({
        type: "FeatureCollection",
        features: events.map((e) => ({
          type: "Feature",
          properties: {
            id: e.id,
            vesselName: e.vessel?.name ?? "",
            vesselFlag: e.vessel?.flag ?? "",
            vesselType: e.vessel?.type ?? "",
            counterpartyName: e.counterparty?.name ?? "",
            counterpartyFlag: e.counterparty?.flag ?? "",
            portName: e.port?.name ?? "",
            start: e.start,
            end: e.end,
          },
          geometry: {
            type: "Point",
            coordinates: [e.position.lon, e.position.lat],
          },
        })),
      });
    };
    const apply = () => {
      push("gaps", bundle.gaps?.events ?? []);
      push("encounters", bundle.encounters?.events ?? []);
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [bundle]);

  function addOperationalLayers(map: MapLibreMap) {
    // Port anchors — soft amber halos at the four framing ports.
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

    // TSS lanes — animated flowing dashes (driven from startAnimations).
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

    // AOI polygon — Hormuz narrows.
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

    // Radar sweep + concentric range rings — always-alive scanning feel.
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
      paint: { "fill-color": ACCENT_CYAN, "fill-opacity": 0.18 },
    });

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

    // Chokepoint pulse — RAF-animated double ping.
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

    // GFW event sources — initially empty, populated by bundle effect.
    map.addSource("gaps", { type: "geojson", data: EMPTY_FC });
    map.addSource("encounters", { type: "geojson", data: EMPTY_FC });

    // Encounters — red double-ring + center dot. The smoking-gun layer.
    map.addLayer({
      id: "encounters-glow",
      type: "circle",
      source: "encounters",
      paint: {
        "circle-radius": 14,
        "circle-color": STS_RED,
        "circle-opacity": 0.15,
        "circle-blur": 0.7,
      },
    });
    map.addLayer({
      id: "encounters-dot",
      type: "circle",
      source: "encounters",
      paint: {
        "circle-radius": 5,
        "circle-color": STS_RED,
        "circle-stroke-color": "#000814",
        "circle-stroke-width": 1.2,
        "circle-opacity": 0.95,
      },
    });
    map.addLayer({
      id: "encounters-label",
      type: "symbol",
      source: "encounters",
      minzoom: 7,
      layout: {
        "text-field": ["concat", ["get", "vesselFlag"], "↔", ["get", "counterpartyFlag"]],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 9,
        "text-offset": [0, 1.1],
        "text-letter-spacing": 0.1,
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#fecaca",
        "text-halo-color": "#000814",
        "text-halo-width": 1.4,
      },
    });

    // AIS gaps (dark transits) — magenta glow rings. These are vessels who
    // stopped broadcasting AIS while inside the Hormuz frame — the canonical
    // "dark vessel" signal that geopolitical analysts watch for sanctions
    // evasion and grey-fleet activity.
    map.addLayer({
      id: "gaps-glow",
      type: "circle",
      source: "gaps",
      paint: {
        "circle-radius": 16,
        "circle-color": DARK_MAGENTA,
        "circle-opacity": 0.18,
        "circle-blur": 0.8,
      },
    });
    map.addLayer({
      id: "gaps-dot",
      type: "circle",
      source: "gaps",
      paint: {
        "circle-radius": 4,
        "circle-color": DARK_MAGENTA,
        "circle-stroke-color": "#000814",
        "circle-stroke-width": 1,
        "circle-opacity": 0.95,
      },
    });

    // Leader-line annotations — point at real geography.
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

    // Click handlers on event markers — show vessel identity popup.
    const popupForVessel = (
      layerId: string,
      color: string,
      label: string
    ) => {
      map.on("click", layerId, (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const props = f.properties as Record<string, unknown>;
        const vesselName = String(props.vesselName ?? "Unknown");
        const vesselFlag = String(props.vesselFlag ?? "");
        const vesselType = String(props.vesselType ?? "");
        const portName = String(props.portName ?? "");
        const counterparty = String(props.counterpartyName ?? "");
        const start = String(props.start ?? "").slice(0, 10);
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        const extra = portName
          ? `Port: ${portName}`
          : counterparty
            ? `↔ ${counterparty} (${String(props.counterpartyFlag ?? "")})`
            : vesselType;
        new maplibregl.Popup({ offset: 12, closeButton: false })
          .setLngLat(coords)
          .setHTML(
            `<div style="font-family:ui-monospace,monospace;font-size:11px;color:#e2e8f0;background:#020617;padding:8px 10px;border:1px solid ${color};border-radius:4px;min-width:180px">
              <div style="font-size:9px;letter-spacing:0.15em;color:${color};margin-bottom:4px">${label}</div>
              <strong style="color:#f1f5f9">${vesselName}</strong>${vesselFlag ? ` <span style="color:#94a3b8">· ${vesselFlag}</span>` : ""}<br/>
              <span style="color:#94a3b8">${extra}</span><br/>
              <span style="color:#64748b;font-size:9px">${start}</span>
            </div>`
          )
          .addTo(map);
      });
      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
      });
    };
    popupForVessel("encounters-dot", STS_RED, "STS ENCOUNTER");
    popupForVessel("gaps-dot", DARK_MAGENTA, "DARK TRANSIT · AIS GAP");
  }

  function startAnimations(map: MapLibreMap) {
    let lastDashChange = 0;
    const dashSequence = [
      [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
      [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5],
      [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5],
      [0, 3, 3, 1], [0, 3.5, 3, 0.5],
    ];

    const start = performance.now();
    const tick = (t: number) => {
      if (!mapRef.current) return;
      const m = mapRef.current;
      const elapsed = t - start;

      if (t - lastDashChange > 90) {
        dashStepRef.current = (dashStepRef.current + 1) % dashSequence.length;
        try {
          m.setPaintProperty(
            "tss-line",
            "line-dasharray",
            dashSequence[dashStepRef.current] as unknown as number[]
          );
        } catch {
          /* noop */
        }
        lastDashChange = t;
      }

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

      const sweepPeriod = 4000;
      const sweepPhase = (elapsed % sweepPeriod) / sweepPeriod;
      const angle = sweepPhase * Math.PI * 2 - Math.PI / 2;
      const wedgeWidth = Math.PI / 6;
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

  const totals = useMemo(() => {
    return {
      gaps: bundle.gaps?.total_hormuz ?? null,
      encounters: bundle.encounters?.total_hormuz ?? null,
      gapsGlobal: bundle.gaps?.total_global ?? null,
      encountersGlobal: bundle.encounters?.total_global ?? null,
      window: bundle.gaps?.window ?? bundle.encounters?.window ?? null,
      fetched: bundle.gaps?.fetched_at ?? bundle.encounters?.fetched_at ?? null,
    };
  }, [bundle]);

  const statusPill = useMemo(() => {
    if (bundleStatus === "loading")
      return { dot: "bg-amber-400", label: "FETCHING SATELLITE…", solid: false };
    if (bundleStatus === "error")
      return { dot: "bg-slate-400", label: "RECONNECTING", solid: false };
    return { dot: "bg-emerald-400", label: "LIVE · GFW T-4d", solid: true };
  }, [bundleStatus]);

  const _baselineDisplay =
    baselineCount !== null && baselineCount !== undefined
      ? Math.round(Number(baselineCount))
      : liveCountFallback !== null && liveCountFallback !== undefined
        ? Math.round(Number(liveCountFallback))
        : null;
  void _baselineDisplay;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-faint">
            Maritime · Strait of Hormuz · Anomaly Console
          </p>
          <h3 className="text-base font-semibold mt-0.5">
            Dark transits, STS encounters, port-calls — satellite-derived
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

      {/* Oil ticker — Brent + WTI live, sits above the map so it's always legible. */}
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

      {/* Map surface — dark mission-control */}
      <div className="relative bg-[#000814]">
        <div ref={containerRef} className="h-[440px] w-full" />

        {/* HUD top-left — data lineage */}
        <div className="pointer-events-none absolute top-3 left-3 max-w-[300px] rounded-md border border-cyan-400/40 bg-black/75 backdrop-blur px-3 py-2 font-mono text-[10px] leading-snug text-slate-200 shadow-lg">
          <div className="flex items-center gap-1.5 text-cyan-300 mb-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
            <span className="tracking-widest">HORMUZ · ANOMALY CONSOLE</span>
          </div>
          <div className="text-slate-400">
            BASE <span className="text-slate-200">Esri World Imagery</span>
          </div>
          <div className="text-slate-400">
            HEAT{" "}
            <span className="text-slate-200">
              GFW 4Wings · AIS + SAR · 30d composite
            </span>
          </div>
          <div className="text-slate-400">
            EVENTS{" "}
            <span className="text-slate-200">
              {bundleStatus === "ready"
                ? `${totals.gaps ?? 0} AIS gaps · ${totals.encounters ?? 0} STS`
                : bundleStatus === "loading"
                  ? "fetching…"
                  : "unavailable"}
            </span>
          </div>
          <div className="text-slate-400">
            WINDOW{" "}
            <span className="text-slate-200">
              {totals.window
                ? `${totals.window.start} → ${totals.window.end}`
                : "—"}
            </span>
          </div>
          <div className="text-slate-400">
            TICK <span className="text-slate-200">{fmtUTC(now)}</span>
          </div>
        </div>

        {/* Layer toggles — top-right just below nav */}
        <div className="absolute top-3 right-16 flex flex-col gap-1 font-mono text-[9px] tracking-widest">
          <LayerToggle
            checked={layerToggles.ais}
            color="#7DD3FC"
            label="AIS HEAT"
            onChange={(v) => setLayerToggles((s) => ({ ...s, ais: v }))}
          />
          <LayerToggle
            checked={layerToggles.sar}
            color="#FFFFFF"
            label="SAR DETECT"
            onChange={(v) => setLayerToggles((s) => ({ ...s, sar: v }))}
          />
          <LayerToggle
            checked={layerToggles.events}
            color={DARK_MAGENTA}
            label="EVENTS"
            onChange={(v) => setLayerToggles((s) => ({ ...s, events: v }))}
          />
        </div>

        {/* Coord readout — bottom-right */}
        <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-slate-700/60 bg-black/60 backdrop-blur px-2 py-1 font-mono text-[10px] text-slate-300">
          {hoverCoord
            ? fmtCoord(hoverCoord.lat, hoverCoord.lon)
            : "MOVE CURSOR FOR COORDS"}
        </div>

        {/* Legend — bottom-left above scale bar */}
        <div className="pointer-events-none absolute bottom-12 left-3 rounded border border-slate-700/60 bg-black/60 backdrop-blur px-2 py-1.5 font-mono text-[9px] text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: DARK_MAGENTA }}
            />{" "}
            DARK TRANSIT (AIS gap)
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: STS_RED }}
            />{" "}
            STS ENCOUNTER
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: PORT_AMBER }}
            />{" "}
            GATEWAY PORT
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: ACCENT_CYAN }}
            />{" "}
            IMO TSS LANE
          </div>
        </div>

        {/* Vectorial corner watermark */}
        <div className="pointer-events-none absolute top-3 right-44 font-mono text-[9px] tracking-[0.25em] text-cyan-400/70">
          VECTORIAL · SIGNALS
        </div>
      </div>

      {/* Stat strip — three telemetry numbers from the GFW bundle. When data
          is still loading or unavailable, show chokepoint facts so the strip
          is never a wall of em-dashes. */}
      <div className="grid grid-cols-3 gap-3 px-5 py-4 text-sm bg-card border-t border-border">
        {bundleStatus === "ready" ? (
          <>
            <Stat
              label="STS encounters (30d)"
              value={totals.encounters != null ? String(totals.encounters) : "—"}
              tone="red"
              subtle="ship-to-ship transfers in AOI"
            />
            <Stat
              label="AIS gaps (30d)"
              value={totals.gaps != null ? String(totals.gaps) : "—"}
              tone="magenta"
              subtle="dark transit events in AOI"
            />
            <Stat
              label="Daily transit"
              value="~17"
              suffix="Mb/d"
              tone="amber"
              subtle="EIA · 2024 avg"
            />
          </>
        ) : (
          <>
            <Stat
              label="Daily transit"
              value="~17"
              suffix="Mb/d"
              tone="red"
              subtle="EIA · 2024 avg"
            />
            <Stat
              label="Of seaborne oil"
              value="21"
              suffix="%"
              tone="cyan"
              subtle="passes this strait"
            />
            <Stat
              label="Chokepoint width"
              value="33"
              suffix="km"
              tone="muted"
              subtle="Iran ↔ Oman narrows"
            />
          </>
        )}
      </div>

      <div className="px-5 pb-4 text-[11px] text-text-muted leading-relaxed border-t border-border pt-3 font-mono">
        <span className="text-cyan-400">●</span> Satellite-derived intelligence —
        Esri World Imagery basemap, Global Fishing Watch 4Wings (AIS + Sentinel-1
        SAR) heat layer, plus 30-day rolling events: dark transits, ship-to-ship
        encounters, and port-calls. Updated every 6 h, lag T-96h (AIS) / T-5d
        (SAR). GFW data: <em>non-commercial research use, CC BY-SA 4.0</em>.
      </div>
    </div>
  );
}

function LayerToggle({
  checked,
  color,
  label,
  onChange,
}: {
  checked: boolean;
  color: string;
  label: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 backdrop-blur transition-colors ${
        checked
          ? "border-cyan-400/60 bg-black/75 text-slate-100"
          : "border-slate-700/60 bg-black/45 text-slate-500"
      }`}
    >
      <span
        className="inline-block h-2 w-2 rounded-sm"
        style={{ background: checked ? color : "transparent", border: `1px solid ${color}` }}
      />
      {label}
    </button>
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
  suffix,
  tone,
  subtle,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone: "red" | "cyan" | "muted" | "amber" | "magenta";
  subtle?: string;
}) {
  const colorClass =
    tone === "red"
      ? "text-rose-500 dark:text-rose-400"
      : tone === "cyan"
        ? "text-cyan-600 dark:text-cyan-400"
        : tone === "amber"
          ? "text-amber-600 dark:text-amber-400"
          : tone === "magenta"
            ? "text-fuchsia-500 dark:text-fuchsia-400"
            : "text-text-muted";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-faint">
        {label}
      </p>
      <p
        key={value}
        className={`text-xl font-semibold tabular-nums ${colorClass} font-mono transition-opacity`}
      >
        {value}
        {suffix && (
          <span className="text-[10px] font-normal text-text-faint ml-1">
            {suffix}
          </span>
        )}
      </p>
      {subtle && (
        <p className="text-[9px] uppercase tracking-widest text-text-faint mt-0.5">
          {subtle}
        </p>
      )}
    </div>
  );
}
