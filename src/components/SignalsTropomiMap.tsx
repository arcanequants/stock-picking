"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// NASA GIBS — Global Imagery Browse Services. Public, no auth, CORS-enabled.
// Layer is OMI tropospheric NO₂ (long-running, daily, global). TROPOMI is also
// available but with shorter archive depth + occasional outages; OMI is the
// retail-safe default.
const GIBS_LAYER = "OMI_Nitrogen_Dioxide_Tropo_Column";
const TILE_MATRIX_SET = "GoogleMapsCompatible_Level6";
const TILE_FORMAT = "png";

// GIBS publishes T-1 day for daily layers. Round to UTC midnight then back off
// 1 day so we always hit a published tile set.
function gibsDate(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function gibsTileTemplate(date: string): string {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${GIBS_LAYER}/default/${date}/${TILE_MATRIX_SET}/{z}/{y}/{x}.${TILE_FORMAT}`;
}

const BASEMAP = {
  light:
    "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark:
    "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

// Center on the eastern China industrial corridor (Hebei → Jiangsu).
const VIEW = {
  center: [117.5, 33.5] as [number, number],
  zoom: 4,
};

// Equity anchors — workers' "narrative layer" so the wow image is tied to a
// decision, not just a postcard.
const ANCHORS = [
  { name: "Beijing/Hebei", coords: [116.4, 39.9] as [number, number], note: "BABA logistics hub" },
  { name: "Shanghai/Jiangsu", coords: [121.5, 31.2] as [number, number], note: "JD fulfillment cluster" },
  { name: "Shenzhen", coords: [114.1, 22.5] as [number, number], note: "PDD merchant base" },
];

export function SignalsTropomiMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const date = gibsDate();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const root = document.documentElement;
    const compute = () =>
      root.classList.contains("dark") || mq.matches ? "dark" : "light";
    setTheme(compute());
    const onChange = () => setTheme(compute());
    mq.addEventListener("change", onChange);
    const obs = new MutationObserver(onChange);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => {
      mq.removeEventListener("change", onChange);
      obs.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP[theme],
      center: VIEW.center,
      zoom: VIEW.zoom,
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      addTropomiLayer(map, date);
      addAnchors(map);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(BASEMAP[theme]);
    map.once("style.load", () => {
      addTropomiLayer(map, date);
      addAnchors(map);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

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
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted whitespace-nowrap">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
          </span>
          LIVE · NASA GIBS
        </span>
      </div>

      <div
        ref={containerRef}
        className="h-[360px] w-full bg-black/5 dark:bg-white/5"
      />

      <div className="px-5 py-4 space-y-3 text-sm">
        <p className="text-text-muted leading-relaxed">
          Red plumes = tropospheric NO₂ — the gas factories and diesel trucks
          emit. More red = more industry running. The same signal that flagged
          Wuhan&apos;s slowdown two weeks before official data in Jan 2020.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-faint">
          <span>
            Image: <strong className="text-text-muted">{date}</strong> · OMI L3
            daily
          </span>
          <span>·</span>
          <span>
            Equity hooks: <strong className="text-text-muted">BABA, JD, PDD</strong>
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

function addTropomiLayer(map: MapLibreMap, date: string) {
  if (map.getLayer("gibs-no2")) map.removeLayer("gibs-no2");
  if (map.getSource("gibs-no2")) map.removeSource("gibs-no2");

  map.addSource("gibs-no2", {
    type: "raster",
    tiles: [gibsTileTemplate(date)],
    tileSize: 256,
    attribution:
      'NO₂ imagery: <a href="https://gibs.earthdata.nasa.gov/" target="_blank" rel="noopener">NASA GIBS</a>',
  });
  map.addLayer({
    id: "gibs-no2",
    type: "raster",
    source: "gibs-no2",
    paint: {
      "raster-opacity": 0.72,
    },
  });
}

function addAnchors(map: MapLibreMap) {
  for (const a of ANCHORS) {
    new maplibregl.Marker({
      color: "#ef4444",
      scale: 0.6,
    })
      .setLngLat(a.coords)
      .setPopup(
        new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
          `<div style="font-family:system-ui;font-size:12px"><strong>${a.name}</strong><br/><span style="color:#6b7280">${a.note}</span></div>`
        )
      )
      .addTo(map);
  }
}
