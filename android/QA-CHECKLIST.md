# QA Checklist — Android pre-Play Store

Plan de pruebas E2E en emulador (`vd_qa36`, **GPU host — nunca swiftshader**, cold boot `-no-snapshot`).
Cuenta de pruebas: `aspic.medal-3d@icloud.com` (crear/destruir por ronda — dejar 0 filas).
Cuenta free existente: la personal de Alberto. Estado premium se simula con la cuenta QA
en `trialing` (acceso completo). OTP sin leer inbox: `supabase.auth.admin.generateLink`
→ `properties.email_otp`.

Convención: ✅ pasa · ❌ falla (anotar) · ⏭️ no aplica en emulador.

---

## 0. Preparación
- [ ] `pm clear com.vectorialdata.app.debug` (device virgen)
- [ ] Red del emulador viva (`ping 8.8.8.8`), reloj correcto
- [ ] Build fresco instalado (`assembleDebug` del commit a probar)

## 1. Primera apertura — Onboarding (signed out)
- [ ] Splash → aterriza en pager de onboarding (no en login)
- [ ] 5 páginas por **swipe** Y por botón **Siguiente**; dots reflejan la página
- [ ] **Saltar** brinca a la página 5
- [ ] Página Proof carga datos REALES: rendimiento total, sparkline, filas top + al menos una pérdida, "N posiciones"
- [ ] Proof sin red → fallback "Míralo tú mismo dentro de la app" (sin spinner infinito)
- [ ] "Iniciar sesión" → AuthScreen; back físico regresa al onboarding
- [ ] "Empezar 14 días gratis" → CreateAccount; caption "$0.99/mes después"

## 2. Crear cuenta (cuenta QA)
- [ ] Email inválido ("aaa") → error inline, no request
- [ ] Email válido → paso código; el email se muestra en **bold** con espacio correcto ("code to **x@y**")
- [ ] Aviso de spam visible en el paso de código
- [ ] Back en paso código → regresa a email (no cierra el flujo)
- [ ] Código incorrecto → "Código incorrecto o vencido", no navega
- [ ] **Reenviar código** → llega email nuevo
- [ ] Código correcto → signed in → arranca first-run
- [ ] Server: fila `subscribers` con `trialing` + `trial_ends_at` a 14 días
- [ ] Idempotencia: repetir signup con cuenta ya existente → `already:true` → fluye a código sin error

## 3. Sign in (usuario que regresa)
- [ ] Magic link (`vectorialdata://auth?token_hash=…`) con app **cerrada** → sesión directa
- [ ] Magic link con app abierta en login → sesión directa
- [ ] OTP: cooldown de reenvío (30 s) cuenta hacia atrás
- [ ] Demo login (email+password del build de review)
- [ ] Botón biométrico NO aparece sin huella enrolada en el device
- [ ] ⏭️ (device real) Enroll huella → botón aparece → cancel / mismatch / éxito → 401 revocado oculta el botón

## 4. First-run setup (una sola vez por device)
- [ ] Paso trial se **salta** si la cuenta ya es trialing/subscribed o Play no puede vender (emulador hoy: siempre se salta)
- [ ] Priming: "Activar avisos" → diálogo del sistema; probar **Allow** Y **Deny** — ambos avanzan al monto
- [ ] "Ahora no" también avanza
- [ ] Monto: chips $1/$2/$5/$20 seleccionan; monto custom con decimales; toggle "Recordarme subirlo"
- [ ] Guardar → server `default_investment` correcto; Account muestra el valor
- [ ] Matar la app y reabrir → first-run NO reaparece

## 5. Coach tour
- [ ] Aparece solo tras completar first-run
- [ ] 4 pasos: fondo cambia al tab correcto EN el paso (no un paso tarde)
- [ ] Paso 2: spotlight sobre la PRIMERA pick card real (con upsell banner arriba en cuenta free)
- [ ] Spotlight de tabs alineado con los íconos
- [ ] "Saltar" en cualquier paso cierra; "¡Listo!" en el 4 cierra
- [ ] No reaparece en siguiente apertura
- [ ] Account → "Ver tutorial" lo repite desde el paso 1

## 6. Home
- [ ] Chart carga: línea Vectorial + S&P punteada, labels 0%/±, 3 fechas en eje X
- [ ] Copy "Vectorial is ±X% vs. the S&P 500" con signo y color correctos (positivo verde / negativo rojo)
- [ ] Stats: Positions / Best / Worst con datos reales
- [ ] Card "Analysis from…" (último pick) presente
- [ ] Card NOTICIAS: badge "N new" correcto + headline más reciente; tap → lista
- [ ] Market status (after hours / open) visible
- [ ] Sin red: Home muestra error propio SIN desloguear

## 7. Picks
- [ ] Free: banner upsell (solo después de cargar, sin flash en premium) + últimos 3 picks
- [ ] Trialing: feed completo, sin upsell; cuenta QA nueva ve feed VACÍO + countdown card (newcomer principle — correcto)
- [ ] Detail free/locked: TL;DR + card "Unlock" → paywall
- [ ] Detail desbloqueado: TL;DR, LO IMPORTANTE (pills), acordeones POR QUÉ / RIESGO, DIVIDENDOS si aplica, disclaimer
- [ ] "✅ Lo compré" → buy sheet: monto default precargado, editable, "guardar como default" funciona
- [ ] Confirmar → pasa a HISTORIAL "comprado a $X"; server row correcta
- [ ] "⏰ Later" / saltar → estado correcto
- [ ] "Cambiar a pendiente" revierte (server incluido)
- [ ] Decisiones persisten tras reinstalar la app
- [ ] Pull-to-refresh funciona

## 8. Portfolio
- [ ] Model: total return, positions, avg dividend; sort Top/Worst/Newest reordena
- [ ] SECTOR/REGION MIX (solo suscrito) renderiza
- [ ] Free: top-3 + fila "**+N posiciones más · Desbloquear**" → paywall
- [ ] "Mío" vacío: empty state
- [ ] Comprar un pick → "Mío" refleja la posición (invalidación por decisión)
- [ ] Position detail: header %, facts, EDITAR TU COMPRA reabre buy sheet, why-card o paywall
- [ ] Flip de suscripción (free→trial con la cuenta QA): ambos tabs se refrescan, desaparece la fila locked

## 9. Noticias v2
- [ ] Lista: chips por tema filtran (solo temas presentes); "Todo" resetea
- [ ] Rows: tag color por tema, banderas, tiempo relativo, dot no-leído, read-time, tickers
- [ ] Re-abrir la sección refetcha (no muestra solo caché)
- [ ] Dots se limpian en la siguiente visita; badge de Home baja a 0
- [ ] Detail explainer: QUÉ PASÓ / POR QUÉ IMPORTA / Y PARA TU PORTAFOLIO / CUÉNTALO ASÍ (sin comillas dobles duplicadas)
- [ ] PALABRAS CLARAS: chip → bottom sheet con definición
- [ ] Share → intent con la línea "cuéntalo así"
- [ ] "Abrir enlace" abre browser (cuando hay link)
- [ ] Noticia legacy (sin explainer) → body markdown con **bold** renderizado
- [ ] Chat free → paywall; chat trialing → abre
- [ ] Chat: 4 chips de sugerencia envían; respuesta con **bold** renderizado; historial persiste al reabrir; sin red → mensaje de error en burbuja
- [ ] Tu mezcla: carga prefs del server; toggles; radio Al momento/Diario/Sin avisos
- [ ] Guardar OK → cierra + fila del server cambia; guardar SIN red → NO cierra + error visible

## 10. Push (FCM) — usar `GET /api/admin/test-push?email=…`
- [ ] Al login: token en `device_tokens` (android, is_active) — query directa
- [ ] Push con app en background → notificación en canal `vd_default`
- [ ] Push con app en foreground → render manual visible
- [ ] Tap routing: `new_pick` (+pick_number) → detalle del pick
- [ ] `weekly_digest` → recap semanal
- [ ] `news` (+news_id) → detalle de la noticia
- [ ] `dividend_paid` → detalle del pick
- [ ] `trial_end` → tab Account
- [ ] `raise_amount` → sheet de monto
- [ ] Tap con app **cerrada** (no force-stopped) → abre y rutea igual
- [ ] Account: Desactivadas→Activar→dialog→Activadas; deep link a settings si fue denegado
- [ ] Sign out → token DELETE en server (query)

## 11. Account
- [ ] Email + label: Free / "Trial gratis · termina el X" / Premium según cuenta
- [ ] Free: "Subscribe" → paywall (hoy: checkout web); suscrito: "Manage subscription" → Play subscriptions
- [ ] Monto por compra: muestra valor actual; abre editor; guardar actualiza
- [ ] Filosofía: pager de 5 páginas navegable
- [ ] Ver tutorial: repite el tour
- [ ] Sign out → onboarding; **cambiar de cuenta** → CERO datos de la cuenta anterior (picks, noticias, portfolio, badge)
- [ ] Delete account: confirm dialog → borra → onboarding; server 0 filas (query directa)

## 12. Billing (emulador = solo fallback)
- [ ] TODOS los CTAs de paywall (pick detail, upsell picks, position detail, Account, news chat) → checkout web mientras Play no venda
- [ ] ⏭️ (con listing) Sheet nativo: precio real, trial elegible, compra sandbox, verify-play, Restore, "ya suscrito"

## 13. i18n (es / en / pt)
Por locale (`setprop persist.sys.locale` + restart zygote, o Settings):
- [ ] Onboarding + create account + first-run + tour completos en el idioma
- [ ] Tabs, Home, Picks, Portfolio, Noticias (incl. Tu mezcla, chat), Account, paywall
- [ ] Research/noticias llegan localizados (Accept-Language)
- [ ] Fechas largas y relativas en el idioma; plurales correctos
- [ ] Sin strings con espacios comidos en bordes (gotcha XML)

## 14. Resiliencia
- [ ] Modo avión + abrir app con sesión → sigue logueado, errores por pantalla, sin logout
- [ ] Volver la red → pull-refresh recupera todo
- [ ] Access token viejo → refresh-and-replay transparente (dejar la app 1h+ o invalidar manual)
- [ ] Refresh token revocado (revocar en server) → logout limpio a onboarding, sin loop ni crash

## 15. Sistema Android
- [ ] Rotación en: onboarding, create account (paso código conserva email/código), tour, buy sheet, chat, Tu mezcla → sin crash
- [ ] "Don't keep activities" ON → navegar toda la app → sin crashes
- [ ] Back físico consistente en todos los niveles (detail→lista→tab, sheets cierran)
- [ ] Notificación + app matada por sistema → tap restaura bien
- [ ] Sin ANRs (con GPU host)

## 16. Release build (obligatorio antes de subir — los crashes de R8 solo salen aquí)
- [ ] `assembleRelease` firmado (keystore de Alberto) instala y arranca
- [ ] Smoke COMPLETO del happy path en release: login → tabs → pick detail → decisión → noticias → push → account
- [ ] kotlinx.serialization funciona minificado (decode de /api/picks, /api/news — si crashea: reglas proguard)
- [ ] Billing + biometric + WorkManager no rompen con minify
- [ ] versionCode/versionName correctos; `applicationId com.vectorialdata.app` (sin .debug)
- [ ] Permisos del manifest = solo los esperados (POST_NOTIFICATIONS, INTERNET, USE_BIOMETRIC…)

## Fuera del alcance del emulador (checklist de device físico)
1. Compra Play real/sandbox (necesita listing + `GOOGLE_PLAY_SERVICE_ACCOUNT`)
2. Biometría E2E (prompt, mismatch, re-enrolamiento invalida credencial)
3. Push con Doze/battery optimization real
4. Recordatorios locales día-12 / raise (esperas de días — validar con delay corto en build de prueba)
5. Pre-launch report de Play Console (corre en devices reales de Google)
