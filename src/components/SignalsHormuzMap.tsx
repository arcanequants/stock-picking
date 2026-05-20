"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Strait of Hormuz AOI. The "narrow" polygon (per signal definition methodology)
// is the actual ~50 km gate vessels must cross; the "view" bbox is a wider
// frame so the user sees coastlines + ship traffic flowing toward it.
const HORMUZ_AOI: [number, number][] = [
  [56.0, 26.5],
  [56.5, 26.5],
  [56.5, 26.7],
  [56.0, 26.7],
  [56.0, 26.5],
];

const HORMUZ_VIEW = {
  center: [56.5, 26.6] as [number, number],
  zoom: 7,
};

// Carto monochrome basemaps — free for low-volume usage with attribution. No
// API key. Light + dark variants for theme parity.
const BASEMAP = {
  light:
    "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark:
    "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

type AisShip = {
  mmsi: number;
  lat: number;
  lon: number;
  cog: number; // course over ground
  shipType?: number;
  name?: string;
  lastSeen: number;
};

// AIS ship-type codes that count toward the Hormuz oil/LNG transit narrative.
// IMO codes 80-89 = tankers; 70-79 = cargo. We use a broad "tanker-or-cargo"
// filter for the visual layer (the count signal upstream filters tighter).
const RELEVANT_TYPE = (t?: number) =>
  t !== undefined && ((t >= 70 && t <= 89));

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

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [status, setStatus] = useState<
    "init" | "connecting" | "live" | "no-key" | "error"
  >("init");
  const [shipCount, setShipCount] = useState<number>(0);
  const [tankerCount, setTankerCount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const apiKey =
    process.env.NEXT_PUBLIC_AISSTREAM_API_KEY?.trim() || "";

  // Match the user's color scheme. SignalCard parents toggle via .dark class.
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

  // Initialize map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP[theme],
      center: HORMUZ_VIEW.center,
      zoom: HORMUZ_VIEW.zoom,
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // AOI polygon — the formal Hormuz gate from the signal methodology.
      map.addSource("hormuz-aoi", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [HORMUZ_AOI] },
        },
      });
      map.addLayer({
        id: "hormuz-aoi-fill",
        type: "fill",
        source: "hormuz-aoi",
        paint: {
          "fill-color": "#ef4444",
          "fill-opacity": 0.12,
        },
      });
      map.addLayer({
        id: "hormuz-aoi-line",
        type: "line",
        source: "hormuz-aoi",
        paint: {
          "line-color": "#ef4444",
          "line-width": 1.5,
          "line-dasharray": [2, 2],
        },
      });

      // Ships source (empty until WS connects).
      map.addSource("ships", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "ships-dot",
        type: "circle",
        source: "ships",
        paint: {
          "circle-radius": 3,
          "circle-color": [
            "case",
            ["==", ["get", "isTanker"], true],
            "#ef4444",
            "#94a3b8",
          ],
          "circle-stroke-width": 0.5,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap basemap style on theme change without losing layers/sources.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(BASEMAP[theme]);
    map.once("style.load", () => {
      // Re-add layers after style swap.
      if (!map.getSource("hormuz-aoi")) {
        map.addSource("hormuz-aoi", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [HORMUZ_AOI] },
          },
        });
        map.addLayer({
          id: "hormuz-aoi-fill",
          type: "fill",
          source: "hormuz-aoi",
          paint: { "fill-color": "#ef4444", "fill-opacity": 0.12 },
        });
        map.addLayer({
          id: "hormuz-aoi-line",
          type: "line",
          source: "hormuz-aoi",
          paint: {
            "line-color": "#ef4444",
            "line-width": 1.5,
            "line-dasharray": [2, 2],
          },
        });
      }
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
            "circle-radius": 3,
            "circle-color": [
              "case",
              ["==", ["get", "isTanker"], true],
              "#ef4444",
              "#94a3b8",
            ],
            "circle-stroke-width": 0.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.9,
          },
        });
      }
      renderShips();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Re-render the ships source from the in-memory map.
  function renderShips() {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("ships") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    const features = Array.from(shipsRef.current.values()).map((s) => ({
      type: "Feature" as const,
      properties: {
        mmsi: s.mmsi,
        isTanker: RELEVANT_TYPE(s.shipType),
        name: s.name ?? `MMSI ${s.mmsi}`,
        shipType: s.shipType ?? null,
      },
      geometry: { type: "Point" as const, coordinates: [s.lon, s.lat] },
    }));
    src.setData({ type: "FeatureCollection", features });
    setShipCount(features.length);
    setTankerCount(
      features.filter((f) => f.properties.isTanker).length
    );
  }

  // Connect to AISStream WebSocket when API key is available.
  useEffect(() => {
    if (!apiKey) {
      setStatus("no-key");
      return;
    }

    setStatus("connecting");
    let cancelled = false;
    let pruneTimer: ReturnType<typeof setInterval> | null = null;

    try {
      const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        // Subscribe to a wider bounding box than the AOI so the user sees
        // approaching traffic, not just vessels inside the gate.
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
        // Avoid an automatic reconnect storm — we surface the state and let
        // the user refresh. AISStream connections are persistent so a normal
        // close usually means we lost network or were rate-limited.
        if (status !== "error") setStatus("error");
      };

      // Render loop: re-paint at most every 2s, prune vessels not seen in 10min.
      const render = setInterval(renderShips, 2000);
      pruneTimer = setInterval(() => {
        const cutoff = Date.now() - 10 * 60 * 1000;
        for (const [mmsi, ship] of shipsRef.current) {
          if (ship.lastSeen < cutoff) shipsRef.current.delete(mmsi);
        }
        renderShips();
      }, 60_000);

      return () => {
        cancelled = true;
        clearInterval(render);
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
        return { dot: "bg-rose-500", label: "LIVE · AIS" };
      case "connecting":
        return { dot: "bg-amber-500", label: "Connecting…" };
      case "no-key":
        return { dot: "bg-amber-500", label: "Calibrating" };
      case "error":
        return { dot: "bg-rose-500", label: "Disconnected" };
      default:
        return { dot: "bg-slate-400", label: "Init" };
    }
  }, [status]);

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
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted whitespace-nowrap">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full ${statusPill.dot} opacity-75 animate-ping`}
            />
            <span
              className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusPill.dot}`}
            />
          </span>
          {statusPill.label}
        </span>
      </div>

      <div
        ref={containerRef}
        className="h-[360px] w-full bg-black/5 dark:bg-white/5"
      />

      <div className="grid grid-cols-3 gap-3 px-5 py-4 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-faint">
            Tankers in view
          </p>
          <p className="text-lg font-semibold tabular-nums text-rose-500 dark:text-rose-400">
            {status === "live" ? tankerCount : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-faint">
            All vessels
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {status === "live"
              ? shipCount
              : liveCountFallback !== null && liveCountFallback !== undefined
                ? liveCountFallback
                : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-faint">
            30d avg
          </p>
          <p className="text-lg font-semibold tabular-nums text-text-muted">
            {baselineCount !== null && baselineCount !== undefined
              ? Math.round(Number(baselineCount))
              : "—"}
          </p>
        </div>
      </div>

      {status === "no-key" && (
        <div className="px-5 pb-4 text-xs text-text-muted leading-relaxed border-t border-border pt-3">
          Live AIS overlay activates once <code className="text-text-strong">NEXT_PUBLIC_AISSTREAM_API_KEY</code>{" "}
          is provisioned. The AOI polygon (red dashed box) shows the formal
          Hormuz gate used by the signal upstream. Daily transit baseline above
          is read directly from <code>signal_observations</code>.
        </div>
      )}
      {status === "error" && (
        <div className="px-5 pb-4 text-xs text-rose-500 dark:text-rose-400 leading-relaxed border-t border-border pt-3">
          {errorMsg ?? "AIS feed disconnected. Refresh to retry."}
        </div>
      )}
    </div>
  );
}
