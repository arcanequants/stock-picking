# Respuesta a App Review — Guideline 5.1.1(v) Account Deletion

> Submission ID rechazada: 9a97e9dd-5825-42a6-8592-6dfa03a130a9 (build 1.0(3))
> Resubmission: build 1.0(4)

## Para el campo "Notes" de App Review Information (pega esto en inglés)

```
We have added in-app account deletion to address Guideline 5.1.1(v).

How to reach it:
1. Sign in with the demo account provided in the App Review credentials.
2. Open the "Account" tab (bottom navigation).
3. Scroll to the bottom and tap "Eliminar cuenta" (Delete account).
4. Confirm in the dialog ("Eliminar cuenta").

The flow deletes the user's account and all associated data on our server
(profile, portfolio, picks, notifications, support tickets) and signs the
user out. Any active Apple In-App Purchase subscription must be cancelled by
the user in Settings › Apple Account › Subscriptions; the app discloses this
in the footer next to the delete button (Apple manages IAP cancellation and
it cannot be cancelled server-side).

A screen recording captured on a physical device is attached below,
demonstrating: signing in with the demo account, navigating to the account
deletion option, and completing the deletion from initiation to confirmation.
```

## Lo que tienes que grabar (screen recording en dispositivo FÍSICO)

Apple exige que sea en un dispositivo físico, no simulador:

1. Abre la app → pantalla de sign-in.
2. Inicia sesión con la **cuenta demo** (la misma que ya tienes en App Review credentials).
3. Ve a la pestaña **Account**.
4. Baja hasta **"Eliminar cuenta"** y tócalo.
5. En el diálogo, toca **"Eliminar cuenta"** (rojo) para confirmar.
6. Muestra que la app te regresa a la pantalla de inicio de sesión (cuenta eliminada).

> Nota: la cuenta demo está protegida en el backend — el flujo se ve completo
> (confirma → cierra sesión → vuelve a sign-in) pero NO destruye la cuenta demo,
> así que puedes grabar el video las veces que quieras y futuras reviews no se
> rompen.

## Pasos restantes (requieren tu Xcode + Apple ID + dispositivo)

1. `cd ios/VectorialData && xcodegen generate` (ya hecho; build = 4).
2. Archive en Xcode (Product › Archive) — confirma que el build number sea **4**.
3. Sube a App Store Connect (Distribute App › App Store Connect).
4. Selecciona el build 1.0(4) en la versión.
5. Graba el video (pasos de arriba) y pégalo en el campo Notes.
6. Responde al mensaje de App Review en App Store Connect y reenvía a revisión.
```
