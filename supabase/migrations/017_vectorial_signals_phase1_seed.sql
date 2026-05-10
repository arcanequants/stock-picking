-- Vectorial Signals — Phase 1 seed: 6 signal_definitions + RLS public-read policies.
-- Companion to 016_vectorial_signals.sql.

-- ─── RLS: public-read on definitions and observations (free preview is the SEO/B2AI honeypot) ───
-- Service-role bypasses RLS, so writes from cron + admin remain unrestricted.
DROP POLICY IF EXISTS "definitions_public_read" ON public.signal_definitions;
CREATE POLICY "definitions_public_read"
  ON public.signal_definitions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "observations_public_read" ON public.signal_observations;
CREATE POLICY "observations_public_read"
  ON public.signal_observations FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "ic_history_public_read" ON public.signal_ic_history;
CREATE POLICY "ic_history_public_read"
  ON public.signal_ic_history FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─── Phase 1 signal definitions ───
-- Six signals across energy (3), maritime (1), atmospheric (1), agricultural (1).
-- All ship in Casual (es/en) + Pro (es/en); AI brief and Machine tiers derive server-side.

INSERT INTO signal_definitions (
  id, domain, name, unit, display_decimals,
  copy, methodology, backtest, status,
  source_url, license
) VALUES
-- ─────────────────────────────────────────────────────────────
-- 1. EIA Weekly Petroleum Status dashboard
-- ─────────────────────────────────────────────────────────────
(
  'eia-weekly-petroleum',
  'energy',
  'EIA Weekly Petroleum Status',
  'Mbbl',
  1,
  jsonb_build_object(
    'casual', jsonb_build_object(
      'es', jsonb_build_object(
        'title', 'Inventarios de petróleo EE.UU.',
        'tagline', 'Cuánto petróleo crudo guarda Estados Unidos esta semana, vs el promedio de 5 años.',
        'translation', 'Los *inventarios de crudo* — el petróleo que las refinerías y terminales tienen guardado — se publican cada miércoles. Si suben más rápido que el promedio, sobra oferta y el Brent suele bajar. Si bajan, escasea y el Brent sube.',
        'alert', 'Inventarios EE.UU. se desviaron del promedio 5y por más de 5%.'
      ),
      'en', jsonb_build_object(
        'title', 'US petroleum inventories',
        'tagline', 'How much crude oil the US is sitting on this week, vs the 5-year average.',
        'translation', '*Crude inventories* — oil sitting in US refineries and terminals — publish every Wednesday. Builds above the 5y average mean oversupply (Brent drops). Draws below mean tightness (Brent rises).',
        'alert', 'US inventories diverged from 5y average by more than 5%.'
      )
    ),
    'pro', jsonb_build_object(
      'es', jsonb_build_object(
        'one_liner', 'EIA WPSR crude stocks vs 5y same-week mean. Builds → contango pressure on Brent prompt; draws → backwardation. Refinery utilization + SPR Δ tracked separately.'
      ),
      'en', jsonb_build_object(
        'one_liner', 'EIA WPSR crude stocks vs 5y same-week mean. Builds → contango pressure on Brent prompt; draws → backwardation. Refinery utilization + SPR Δ tracked separately.'
      )
    )
  ),
  jsonb_build_object(
    'source', 'US Energy Information Administration (EIA)',
    'baseline_method', '5-year same-week mean',
    'cadence', 'Weekly (Wed 10:30 ET)',
    'sensors_or_apis', jsonb_build_array('EIA API v2 — petroleum/stoc/wstk'),
    'uncertainty_note', 'EIA preliminary; revised in subsequent weeks',
    'known_biases', jsonb_build_array(
      'Hurricane disruptions distort weekly readings',
      'SPR releases bias commercial-stock framing'
    )
  ),
  NULL,
  'live',
  'https://www.eia.gov/petroleum/supply/weekly/',
  'US Government — public domain'
),
-- ─────────────────────────────────────────────────────────────
-- 2. Crack spread 3-2-1 monitor
-- ─────────────────────────────────────────────────────────────
(
  'crack-spread-321',
  'energy',
  'Crack spread 3-2-1',
  'USD/bbl',
  2,
  jsonb_build_object(
    'casual', jsonb_build_object(
      'es', jsonb_build_object(
        'title', 'Margen de refinación 3-2-1',
        'tagline', 'Cuánto gana una refinería convirtiendo crudo en gasolina y diésel.',
        'translation', 'El *margen de refinación 3-2-1* — la ganancia teórica de procesar 3 barriles de crudo en 2 de gasolina y 1 de diésel — mide qué tan apretadas están las refinerías. Margen alto = refinerías ganan dinero (alcista para refinadores tipo VLO, MPC). Margen bajo = aprietan turnos.',
        'alert', 'El margen 3-2-1 cruzó tu umbral en una desviación grande.'
      ),
      'en', jsonb_build_object(
        'title', 'Refining margin 3-2-1',
        'tagline', 'How much a refinery makes turning crude into gasoline and diesel.',
        'translation', 'The *3-2-1 crack spread* — theoretical profit from processing 3 barrels of crude into 2 gasoline + 1 diesel — measures refinery margin. Wide = refiners minting money (bullish for VLO, MPC). Tight = throughput cuts loom.',
        'alert', 'The 3-2-1 crack moved through your threshold.'
      )
    ),
    'pro', jsonb_build_object(
      'es', jsonb_build_object(
        'one_liner', '3·WTI − (2·RBOB + 1·HO), USD/bbl. Daily. Add gasoil-Brent (NWE) + Singapore Mogas-Dubai for global refinery posture.'
      ),
      'en', jsonb_build_object(
        'one_liner', '3·WTI − (2·RBOB + 1·HO), USD/bbl. Daily. Add gasoil-Brent (NWE) + Singapore Mogas-Dubai for global refinery posture.'
      )
    )
  ),
  jsonb_build_object(
    'source', 'CME settlements (WTI, RBOB, ULSD) via EIA price series',
    'baseline_method', 'Trailing 90-day mean',
    'cadence', 'Daily',
    'sensors_or_apis', jsonb_build_array('EIA Petroleum Spot Prices', 'CME settlements'),
    'uncertainty_note', 'Settlement-to-settlement; intraday slippage not captured',
    'known_biases', jsonb_build_array(
      'US-centric (RBOB, HO) — not the only refining benchmark',
      'Doesn''t price scheduled turnarounds'
    )
  ),
  NULL,
  'live',
  'https://www.eia.gov/petroleum/gasdiesel/',
  'US Government — public domain'
),
-- ─────────────────────────────────────────────────────────────
-- 3. LNG arbitrage screen (HH / TTF / JKM)
-- ─────────────────────────────────────────────────────────────
(
  'lng-arbitrage',
  'energy',
  'LNG arbitrage HH / TTF / JKM',
  'USD/mmbtu',
  2,
  jsonb_build_object(
    'casual', jsonb_build_object(
      'es', jsonb_build_object(
        'title', 'Arbitraje de gas natural global',
        'tagline', 'Diferencia de precio entre EE.UU., Europa y Asia. Los barcos siguen el spread.',
        'translation', 'El *arbitraje LNG* compara el gas en EE.UU. (Henry Hub), Europa (TTF) y Asia (JKM). Cuando Asia paga más que Europa, los cargueros desvían rumbo. El spread JKM-TTF predice la dirección de los barcos antes de que zarpen.',
        'alert', 'El spread JKM-TTF cruzó tu umbral.'
      ),
      'en', jsonb_build_object(
        'title', 'Global LNG arbitrage',
        'tagline', 'Price gap between the US, Europe, and Asia. Cargoes follow the spread.',
        'translation', 'LNG *arbitrage* compares US gas (Henry Hub), European gas (TTF), and Asian gas (JKM). When Asia pays more than Europe, cargoes redirect mid-voyage. JKM-TTF spread leads the direction of LNG flows before ships sail.',
        'alert', 'JKM-TTF spread moved through your threshold.'
      )
    ),
    'pro', jsonb_build_object(
      'es', jsonb_build_object(
        'one_liner', 'HH·M+1, TTF·M+1, JKM·M+1 (USD/mmBtu). Spreads JKM-TTF + TTF-HH net of liquefaction (~$2.5) + freight (~$0.5-1.0). Cargo-redirection threshold ~$1/mmBtu.'
      ),
      'en', jsonb_build_object(
        'one_liner', 'HH·M+1, TTF·M+1, JKM·M+1 (USD/mmBtu). Spreads JKM-TTF + TTF-HH net of liquefaction (~$2.5) + freight (~$0.5-1.0). Cargo-redirection threshold ~$1/mmBtu.'
      )
    )
  ),
  jsonb_build_object(
    'source', 'EIA (Henry Hub) + ICE/CME settlements (TTF, JKM)',
    'baseline_method', 'Trailing 90-day mean spread',
    'cadence', 'Daily',
    'sensors_or_apis', jsonb_build_array('EIA NG.RNGWHHD.D', 'ICE Endex public settlements', 'CME JKM proxy'),
    'uncertainty_note', 'JKM is a published assessment, not a cleared market — thinly traded versus TTF',
    'known_biases', jsonb_build_array(
      'Liquefaction + freight costs vary by route — flat assumption oversimplifies',
      'Long-term contracts indexed to oil distort spot signals'
    )
  ),
  NULL,
  'live',
  'https://www.eia.gov/dnav/ng/ng_pri_fut_s1_d.htm',
  'EIA public domain + ICE/CME public settlements'
),
-- ─────────────────────────────────────────────────────────────
-- 4. Hormuz Strait daily transit count
-- ─────────────────────────────────────────────────────────────
(
  'hormuz-transit',
  'maritime',
  'Hormuz Strait transits',
  'vessels/day',
  0,
  jsonb_build_object(
    'casual', jsonb_build_object(
      'es', jsonb_build_object(
        'title', 'Tránsitos del Estrecho de Ormuz',
        'tagline', 'Cuántos barcos pasan por el cuello de botella petrolero más sensible del mundo.',
        'translation', 'El *Estrecho de Ormuz* — corredor entre Irán y Omán — mueve ~20% del petróleo del mundo cada día. Caídas bruscas en tránsitos suelen indicar tensión geopolítica antes de que aparezca en la prensa. Datos del *AIS* — el sistema público que cada barco transmite con su posición.',
        'alert', 'Tránsitos en Ormuz cayeron más de 15% vs promedio 30d.'
      ),
      'en', jsonb_build_object(
        'title', 'Hormuz Strait transits',
        'tagline', 'How many ships are passing through the world''s most sensitive oil chokepoint.',
        'translation', 'The *Strait of Hormuz* — corridor between Iran and Oman — carries ~20% of global oil daily. Sharp drops in transits often signal geopolitical tension before it hits the news. Data from *AIS* — the public broadcast every ship transmits with its position.',
        'alert', 'Hormuz transits dropped more than 15% vs 30d mean.'
      )
    ),
    'pro', jsonb_build_object(
      'es', jsonb_build_object(
        'one_liner', 'AIS position reports filtered to vessels crossing the Hormuz polygon (26.5°N–26.7°N, 56.0°E–56.5°E) within 24h. Direction split (W ↔ E), cargo-type filter (IMO 84/85/86 = tanker; 89 = LNG/LPG).'
      ),
      'en', jsonb_build_object(
        'one_liner', 'AIS position reports filtered to vessels crossing the Hormuz polygon (26.5°N–26.7°N, 56.0°E–56.5°E) within 24h. Direction split (W ↔ E), cargo-type filter (IMO 84/85/86 = tanker; 89 = LNG/LPG).'
      )
    )
  ),
  jsonb_build_object(
    'source', 'AISStream.io (Phase 1: sample-only via Vercel cron)',
    'baseline_method', 'Trailing 30-day mean',
    'cadence', 'Daily',
    'sensors_or_apis', jsonb_build_array('AISStream WebSocket (sample-poll Phase 1)'),
    'geo_aoi', 'Strait of Hormuz polygon — 26.5°N to 26.7°N, 56.0°E to 56.5°E',
    'uncertainty_note', 'Phase 1 sample-only ingest = ±10% count fidelity vs persistent WebSocket',
    'known_biases', jsonb_build_array(
      'AIS class-B receivers spotty in the Gulf',
      'Sanctioned vessels often spoof or disable AIS'
    )
  ),
  NULL,
  'live',
  'https://aisstream.io/',
  'AIS data CC-BY-4.0 derived statistics'
),
-- ─────────────────────────────────────────────────────────────
-- 5. TROPOMI NO₂ economic-activity index (top 20 industrial regions)
-- ─────────────────────────────────────────────────────────────
(
  'tropomi-no2-economic',
  'atmospheric',
  'TROPOMI NO₂ economic activity',
  'µmol/m²',
  1,
  jsonb_build_object(
    'casual', jsonb_build_object(
      'es', jsonb_build_object(
        'title', 'Actividad industrial vista desde el espacio',
        'tagline', 'El dióxido de nitrógeno (NO₂) en la atmósfera mide cuánto están operando las fábricas y el tráfico.',
        'translation', 'El satélite *TROPOMI* — Sentinel-5P de la ESA — mide *NO₂*, un gas que sale de motores y termoeléctricas. Más NO₂ sobre una región industrial = más actividad económica. Es el indicador que detectó el frenón en Wuhan dos semanas antes que las cifras oficiales de enero 2020.',
        'alert', 'NO₂ sobre tu región objetivo cayó más de 20% vs baseline 90d.'
      ),
      'en', jsonb_build_object(
        'title', 'Industrial activity from space',
        'tagline', 'Atmospheric NO₂ measures how hard factories and traffic are running.',
        'translation', 'The *TROPOMI* satellite — ESA''s Sentinel-5P — measures *NO₂*, a gas emitted by engines and power plants. More NO₂ over an industrial region = more economic activity. It''s the signal that flagged Wuhan''s slowdown two weeks before official data in January 2020.',
        'alert', 'NO₂ over your target region dropped more than 20% vs 90d baseline.'
      )
    ),
    'pro', jsonb_build_object(
      'es', jsonb_build_object(
        'one_liner', 'Sentinel-5P TROPOMI NO₂ tropospheric column density (mol/m²·1e-6). Weekly aggregate over 20 industrial AOIs. Cloud-fraction <30% gating; 7-day rolling vs same-week 3y baseline.'
      ),
      'en', jsonb_build_object(
        'one_liner', 'Sentinel-5P TROPOMI NO₂ tropospheric column density (mol/m²·1e-6). Weekly aggregate over 20 industrial AOIs. Cloud-fraction <30% gating; 7-day rolling vs same-week 3y baseline.'
      )
    )
  ),
  jsonb_build_object(
    'source', 'ESA Sentinel-5P TROPOMI via Sentinel Hub Statistical API',
    'baseline_method', 'Same-week 3-year mean (cloud-filtered)',
    'cadence', 'Weekly',
    'sensors_or_apis', jsonb_build_array('Sentinel Hub Statistical API', 'TROPOMI NO₂ L2 product'),
    'geo_aoi', '20 industrial AOIs (Wuhan, Shanghai, Detroit, LA, Houston, Antwerp, Mumbai, etc.) — pre-defined GeoJSON polygons',
    'uncertainty_note', 'Cloud cover gates the signal — clouded weeks publish "no signal" rather than fake reads',
    'known_biases', jsonb_build_array(
      'TROPOMI revisit gap: 1-2 days at mid-latitudes',
      'Weather (wind speed, boundary-layer height) modulates NO₂ residence time',
      'Diesel-truck traffic confounds factory-only attribution'
    )
  ),
  NULL,
  'live',
  'https://sentinel.esa.int/web/sentinel/missions/sentinel-5p',
  'Modified Copernicus Licence'
),
-- ─────────────────────────────────────────────────────────────
-- 6. Iowa corn yield model (Phase 1 — Iowa state only)
-- ─────────────────────────────────────────────────────────────
(
  'iowa-corn-yield',
  'agricultural',
  'Iowa corn yield model',
  'bu/ac',
  1,
  jsonb_build_object(
    'casual', jsonb_build_object(
      'es', jsonb_build_object(
        'title', 'Cosecha de maíz en Iowa',
        'tagline', 'Cuántas fanegas por acre proyecta nuestro modelo satelital, vs el USDA.',
        'translation', 'Iowa produce ~17% del maíz de EE.UU. Nuestro modelo combina *NDVI* — el verdor de los cultivos visto por satélite — con humedad del suelo (SMAP) y lluvia (CHIRPS). Comparamos contra el reporte oficial del *USDA WASDE*. Cuando nuestro número difiere por más de 3 fanegas/acre, hay sorpresa para los futuros del maíz (CME ZC).',
        'alert', 'Modelo Iowa diverge del USDA WASDE por más de 3 bu/ac.'
      ),
      'en', jsonb_build_object(
        'title', 'Iowa corn yield model',
        'tagline', 'How many bushels per acre our satellite model projects, vs the USDA.',
        'translation', 'Iowa grows ~17% of US corn. Our model combines *NDVI* — crop greenness seen from satellite — with soil moisture (SMAP) and rainfall (CHIRPS). We compare against the official *USDA WASDE* report. When our number diverges by more than 3 bu/ac, expect a surprise on CME corn futures (ZC).',
        'alert', 'Iowa model diverged from USDA WASDE by more than 3 bu/ac.'
      )
    ),
    'pro', jsonb_build_object(
      'es', jsonb_build_object(
        'one_liner', 'Phenology-weighted ensemble: NDVI 40% + SMAP 9km L3 30% + CHIRPS 0.05° 20% + LST 10% during reproductive phase (V12-R3). USDA NASS CDL cropland mask. Walk-forward backtest 2018-2025; target RMSE <3 bu/ac state-level.'
      ),
      'en', jsonb_build_object(
        'one_liner', 'Phenology-weighted ensemble: NDVI 40% + SMAP 9km L3 30% + CHIRPS 0.05° 20% + LST 10% during reproductive phase (V12-R3). USDA NASS CDL cropland mask. Walk-forward backtest 2018-2025; target RMSE <3 bu/ac state-level.'
      )
    )
  ),
  jsonb_build_object(
    'source', 'Sentinel-2 NDVI + NASA SMAP + CHIRPS + USDA NASS CDL',
    'baseline_method', 'USDA WASDE state-level forecast',
    'cadence', 'Weekly during growing season (May–Oct)',
    'sensors_or_apis', jsonb_build_array(
      'Sentinel Hub Statistical API (NDVI)',
      'NASA Earthdata SMAP L3',
      'CHIRPS daily 0.05°',
      'USDA NASS CDL cropland mask'
    ),
    'geo_aoi', 'Iowa state polygon, masked to corn pixels (USDA NASS CDL class 1)',
    'uncertainty_note', 'Phase 1 reports state-level only; county disaggregation in Phase 2',
    'known_biases', jsonb_build_array(
      'NDVI saturates at canopy closure — V12-R3 phenology window matters more than season-mean',
      'Late-season heat stress underweighted vs reproductive-phase moisture',
      'CDL mask refreshed annually — small acreage shifts within season undetected'
    )
  ),
  NULL,
  'live',
  'https://nassgeodata.gmu.edu/CropScape/',
  'NASA + USDA + ESA — public domain + Modified Copernicus Licence (mixed)'
)
ON CONFLICT (id) DO UPDATE SET
  domain = EXCLUDED.domain,
  name = EXCLUDED.name,
  unit = EXCLUDED.unit,
  display_decimals = EXCLUDED.display_decimals,
  copy = EXCLUDED.copy,
  methodology = EXCLUDED.methodology,
  backtest = EXCLUDED.backtest,
  status = EXCLUDED.status,
  source_url = EXCLUDED.source_url,
  license = EXCLUDED.license,
  updated_at = NOW();
