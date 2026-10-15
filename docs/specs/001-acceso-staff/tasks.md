# Tareas 001: Acceso del staff

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)
**Estado**: Aprobado

## Base
- [x] T1 Inicializar el proyecto: Next.js (App Router) + TS strict + Tailwind + shadcn/ui + ESLint (sin `any`)
  + Vitest + Playwright (móvil); scripts `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`; completar
  "Comandos" en `AGENTS.md`. — RF: base
  Hecho cuando: `pnpm lint`, `pnpm typecheck`, `pnpm test` (1 test de humo) y `pnpm test:e2e` (la home carga
  en 390×844) pasan en verde.
- [x] T2 Base de datos: Drizzle + postgres.js, Postgres de desarrollo y de test, esquema de Better Auth +
  `restaurants`, `memberships`, `invitations`, `login_lockouts`; primera migración; scripts `db:generate` y
  `db:migrate`. — RF: base (RF-004, RF-017, RF-022)
  Hecho cuando: `pnpm db:migrate` crea todo en una BD vacía y un test de Vitest comprueba los `unique` de
  membresía y de invitación pendiente.
- [x] T3 Lógica pura y Zod: `lib/invitations.ts`, `lib/lockout.ts`, `lib/team-rules.ts`,
  `lib/permissions.ts`, `lib/schemas/auth.ts`. — RF: RF-004, RF-007, RF-010, RF-017, RF-018, RF-025
  Hecho cuando: Vitest de vencimiento a los 7 días, uso único, bloqueo al 5º fallo y liberación a los
  15 min, último dueño y permisos por rol, todos en verde.

## HU-3 (P1): Iniciar y cerrar sesión
- [ ] T4 Better Auth: email y contraseña, signup público desactivado, sesión de 30 días deslizante, hooks de
  bloqueo, `/ingresar`, cerrar sesión, aviso sin conexión y script `pnpm admin:create <email>`.
  — RF: RF-001, RF-008 a RF-012, RF-026
  Hecho cuando: Vitest (signup público rechazado; sesión de 30 días deslizante) y Playwright `login.spec.ts`
  (correcto, incorrecto con mensaje único, bloqueo al 5º intento también con un email inexistente, la
  sesión sigue al recargar, el logout la cierra y sin red se conserva lo escrito) en verde.

## HU-6 / HU-7: Acceso por local (va antes de las P1 porque construye la protección multi-tenant, RF-022)
- [ ] T5 Guard multi-tenant: `requireSession`, `requireMember`, `requirePlatformAdmin`; `/panel` con
  selector de local, `/panel/[restaurantId]` como placeholder y pantallas de "sin acceso" y "suspendido".
  — RF: RF-015, RF-018, RF-021, RF-022, RF-024
  Hecho cuando: Vitest `guard.test.ts` (no miembro, staff en acción de dueño, miembro quitado y suspendido)
  y Playwright (URL de otro restaurante → sin acceso; dos locales → selector) en verde.

## HU-1 (P1): Dar de alta un restaurante
- [ ] T6 `lib/email.ts` (transportes `resend` y `file`) y `/admin`: crear restaurante + invitación al dueño,
  link copiable al crear o reenviar, suspender y reactivar. — RF: RF-001, RF-002, RF-003, RF-023, RF-027
  Hecho cuando: Playwright `admin.spec.ts` (crear → email en `.emails/` → link copiable; suspender → el
  staff ve "Cuenta suspendida"; reactivar → vuelve; un dueño no entra a `/admin`) en verde.

## HU-2 (P1): Aceptar una invitación
- [ ] T7 `/invitacion/[token]`: usuario nuevo pone su nombre y crea su contraseña; usuario existente se une
  sin contraseña nueva; link vencido, usado o cancelado → mensaje; restaurante suspendido → pantalla de
  suspendido. — RF: RF-005, RF-006, RF-007, RF-024
  Hecho cuando: Playwright `invitation.spec.ts` cubre los 3 criterios de HU-2 y el caso del suspendido.

## HU-4 (P1): Invitar y quitar staff
- [ ] T8 `/panel/[restaurantId]/equipo`: invitar (dueño/staff), listar con estado, cambiar el rol, quitar,
  cancelar, reenviar, email ya miembro y regla de último dueño en transacción.
  — RF: RF-013 a RF-017, RF-025, RF-028
  Hecho cuando: Playwright `team.spec.ts` (invitar → aceptar → quitar con la sesión abierta → "Ya no tienes
  acceso"; reenviar invalida el link viejo; el último dueño no puede quitarse; el staff no ve el equipo)
  en verde; Vitest de integración: dos dueños que se quitan a la vez dejan al menos un dueño.

## HU-5 (P2): Recuperar la contraseña
- [ ] T9 `/recuperar` y `/recuperar/nueva`: mismo mensaje exista o no la cuenta, link de 1 h y de un solo
  uso, y cierre de las otras sesiones. — RF: RF-019, RF-020
  Hecho cuando: Playwright `password-reset.spec.ts` (link vencido rechazado; tras el cambio, la otra sesión
  queda cerrada) en verde.

## Cierre
- [ ] T10 Test de punta a punta (fundador crea → dueño acepta → invita mesero → mesero entra → dueño lo
  quita) y verificación final: suite completa, lint, typecheck, cobertura RF por RF, revisión de la
  constitución y README en "Implementado".
  Hecho cuando: todo en verde y la tabla "Cobertura del spec" del plan sin huecos.
