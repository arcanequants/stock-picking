"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Strait of Hormuz AOI — the formal ~50 km gate vessels must cross. Wider view
// bbox so the user sees inbound + outbound traffic, not just vessels inside.
const HORMUZ_AOI: [number, number][] = [
  [56.0, 26.5],
  [56.5, 26.5],
  [56.5, 26.7],
  [56.0, 26.7],
  [56.0, 26.5],
];

// IMO Traffic Separation Scheme for Strait of Hormuz — the canonical inbound
// (Persian Gulf → Indian Ocean) and outbound (Indian Ocean → Persian Gulf)
// shipping lanes. Drawn as cyan dashed lines so users see the route every
// VLCC takes, even when live AIS hasn't connected yet.
const TSS_OUTBOUND: [number, number][] = [
  [56.05, 26.6],
  [56.4, 26.45],
  [56.75, 26.25],
  [57.1, 26.1],
  [57.45, 25.95],
];
const TSS_INBOUND: [number, number][] = [
  [57.45, 26.25],
  [57.1, 26.4],
  [56.75, 26.55],
  [56.4, 26.7],
  [56.05, 26.8],
];

const HORMUZ_VIEW = {
  center: [56.6, 26.45] as [number, number],
  zoom: 7.2,
};

// Mission-control basemap: Carto Dark Matter. Pure black-on-black, no API key,
// CORS-enabled. The data layer (red tankers, cyan TSS lanes) pops against it.
const DARK_BASEMAP =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// Vectorial Signals brand cyan — used for AOI, lanes, equity anchors.
const ACCENT_CYAN = "#00BCD4";
const TANKER_RED = "#ef4444";

type AisShip = {
  mmsi: number;
  lat: number;
  lon: number;
  cog: number;
  shipType?: number;
  name?: string;
  lastSeen: number;
};

// IMO ship-type codes 70-89 = cargo + tankers. Tankers (80-89) get the red
// "this is the signal" treatment; other vessels are dim grey.
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
  // Tick once per second so the LAST-TICK display refreshes even between AIS
  // bursts. Without it the timestamp would freeze and feel dead.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_AISSTREAM_API_KEY?.trim() || "";

  // Initialize map once with dark mission-control basemap.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_BASEMAP,
      center: HORMUZ_VIEW.center,
      zoom: HORMUZ_VIEW.zoom,
      attributionControl: { compact: true },
      cooperativeGestures: true,
      maxZoom: 11,
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
  }, []);

  function addOperationalLayers(map: MapLibreMap) {
    // Find the first symbol (label) layer so we can insert data BENEATH labels —
    // city names should never be eclipsed by AOI fills or ship dots.
    const styleLayers = map.getStyle().layers ?? [];
    const firstSymbolId = styleLayers.find((l) => l.type === "symbol")?.id;

    // TSS lanes — the canonical shipping channels through Hormuz.
    if (!map.getSource("tss")) {
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
      map.addLayer(
        {
          id: "tss-line",
          type: "line",
          source: "tss",
          paint: {
            "line-color": ACCENT_CYAN,
            "line-width": 1.5,
            "line-opacity": 0.55,
            "line-dasharray": [3, 2],
          },
        },
        firstSymbolId
      );
      map.addLayer(
        {
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
            "text-halo-color": "#000000",
            "text-halo-width": 1.2,
            "text-opacity": 0.85,
          },
        }
      );
    }

    // AOI polygon — Hormuz gate per signal methodology. Cyan brand.
    if (!map.getSource("hormuz-aoi")) {
      map.addSource("hormuz-aoi", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [HORMUZ_AOI] },
        },
      });
      map.addLayer(
        {
          id: "hormuz-aoi-fill",
          type: "fill",
          source: "hormuz-aoi",
          paint: {
            "fill-color": ACCENT_CYAN,
            "fill-opacity": 0.08,
          },
        },
        firstSymbolId
      );
      map.addLayer(
        {
          id: "hormuz-aoi-line",
          type: "line",
          source: "hormuz-aoi",
          paint: {
            "line-color": ACCENT_CYAN,
            "line-width": 1.5,
            "line-dasharray": [2, 2],
          },
        },
        firstSymbolId
      );
    }

    // Pulsing chokepoint marker at AOI center — visual heartbeat so users see
    // the system is watching, even before AIS connects.
    if (!map.getSource("chokepoint")) {
      map.addSource("chokepoint", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: [56.25, 26.6] },
        },
      });
      map.addLayer({
        id: "chokepoint-pulse",
        type: "circle",
        source: "chokepoint",
        paint: {
          "circle-radius": 12,
          "circle-color": ACCENT_CYAN,
          "circle-opacity": 0.18,
          "circle-stroke-color": ACCENT_CYAN,
          "circle-stroke-width": 1,
          "circle-stroke-opacity": 0.6,
        },
      });
      map.addLayer({
        id: "chokepoint-dot",
        type: "circle",
        source: "chokepoint",
        paint: {
          "circle-radius": 3,
          "circle-color": ACCENT_CYAN,
        },
      });
    }

    // Ships source (empty until WS connects).
    if (!map.getSource("ships")) {
      map.addSource("ships", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "ships-dot",
        type: "circle",
        source: "ships",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "isTanker"], true],
            4,
            2.5,
          ],
          "circle-color": [
            "case",
            ["==", ["get", "isTanker"], true],
            TANKER_RED,
            "#94a3b8",
          ],
          "circle-stroke-width": 0.5,
          "circle-stroke-color": "#000000",
          "circle-opacity": 0.95,
        },
      });

      map.on("click", "ships-dot", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const props = f.properties as Record<string, unknown>;
        const name = String(props.name ?? "Unknown vessel");
        const mmsi = String(props.mmsi ?? "");
        const tanker = props.isTanker === true || props.isTanker === "true";
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        new maplibregl.Popup({ offset: 10, closeButton: false })
          .setLngLat(coords)
          .setHTML(
            `<div style="font-family:ui-monospace,monospace;font-size:11px;color:#e2e8f0;background:#0a0a0a;padding:6px 8px;border:1px solid #334155;border-radius:4px"><strong style="color:${tanker ? TANKER_RED : "#94a3b8"}">${name}</strong><br/>MMSI ${mmsi}${tanker ? " · TANKER" : ""}</div>`
          )
          .addTo(map);
      });
    }
  }

  function renderShips() {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("ships") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
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
    setShipCount(features.length);
    setTankerCount(features.filter((f) => f.properties.isTanker).length);
  }

  // AISStream WebSocket — bounded box covers approaches + AOI.
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
            shipsRef.current.set(mmsi, {
              mmsi,
              lat,
              lon,
              cog: Number(r.Cog ?? 0),
              shipType: existing?.shipType,
              name: existing?.name ?? meta.ShipName?.trim() ?? undefined,
              lastSeen: Date.now(),
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
          // ignore malformed frames
        }
      };

      ws.onerror = () => {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg("WebSocket error — check AISStream key or network.");
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
        return { dot: "bg-rose-500", label: "LIVE · AISStream", solid: true };
      case "connecting":
        return { dot: "bg-amber-400", label: "CONNECTING…", solid: false };
      case "no-key":
        return { dot: "bg-cyan-400", label: "AWAITING AIS FEED", solid: false };
      case "error":
        return { dot: "bg-rose-500", label: "DISCONNECTED", solid: true };
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

      {/* Map shell — mission-control black surface, fixed dark even in light mode */}
      <div className="relative bg-[#0a0a0a]">
        <div ref={containerRef} className="h-[420px] w-full" />

        {/* HUD top-left — data lineage, the part Bloomberg/Palantir always show */}
        <div className="pointer-events-none absolute top-3 left-3 max-w-[260px] rounded-md border border-cyan-400/30 bg-black/70 backdrop-blur px-3 py-2 font-mono text-[10px] leading-snug text-slate-200 shadow-lg">
          <div className="flex items-center gap-1.5 text-cyan-300 mb-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
            <span className="tracking-widest">MARITIME · HORMUZ TSS</span>
          </div>
          <div className="text-slate-400">
            SRC <span className="text-slate-200">AISStream WS</span>
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

        {/* Vectorial corner watermark */}
        <div className="pointer-events-none absolute top-3 right-16 font-mono text-[9px] tracking-[0.25em] text-cyan-400/70">
          VECTORIAL · SIGNALS
        </div>
      </div>

      {/* Stat strip — dark, tabular, with brand cyan accents */}
      <div className="grid grid-cols-3 gap-3 px-5 py-4 text-sm bg-card border-t border-border">
        <Stat
          label="Tankers in view"
          value={tankerDisplay}
          tone="red"
          subtle={status !== "live" ? "awaiting feed" : "live · AIS"}
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

      {status === "no-key" && (
        <div className="px-5 pb-4 text-[11px] text-text-muted leading-relaxed border-t border-border pt-3 font-mono">
          <span className="text-cyan-500 dark:text-cyan-400">●</span> Cyan AOI +
          TSS lanes shown above are the formal Hormuz gate + IMO shipping
          channels. Live vessel overlay activates the moment{" "}
          <code className="text-text-strong bg-slate-100 dark:bg-slate-800 px-1 rounded">
            NEXT_PUBLIC_AISSTREAM_API_KEY
          </code>{" "}
          is provisioned in Vercel.
        </div>
      )}
      {status === "error" && (
        <div className="px-5 pb-4 text-[11px] text-rose-500 dark:text-rose-400 leading-relaxed border-t border-border pt-3 font-mono">
          {errorMsg ?? "AIS feed disconnected. Refresh to retry."}
        </div>
      )}
    </div>
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
