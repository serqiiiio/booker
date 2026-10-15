# Plan 001: Acceso del staff

**Spec**: [spec.md](./spec.md)
**Estado**: Aprobado
**Fecha**: 2026-10-14

## Resumen técnico
Es el primer código del proyecto, así que el plan arranca inicializando Next.js con TypeScript strict,
Tailwind, shadcn/ui, Drizzle, Vitest y Playwright. Better Auth maneja la identidad: email y contraseña,
sesiones de 30 días y recuperación de contraseña. El dominio (restaurantes, membresías e invitaciones) va en
tablas propias. Una sola función de servidor, `requireMember`, comprueba en cada página y Server Action que
hay sesión, que el usuario pertenece al restaurante, que tiene el rol pedido y que el restaurante no está
suspendido. Las reglas de negocio (vencimiento de invitaciones, bloqueo por intentos, último dueño y
permisos) son funciones puras que reciben `now`.

## Decisión
**Elegida: Better Auth (solo email + contraseña y sesiones) + tablas propias de restaurante, membresía e
invitación.**
- El dominio usa nombres propios (`restaurants`, `restaurant_id`), así que cada tabla de negocio de las
  specs siguientes cuelga de `restaurants` sin traducir "organization" (II.1).
- Las reglas de la spec quedan en código propio y testeable: link de un solo uso de 7 días, crear la
  contraseña desde la invitación, último dueño y suspensión.

Descartadas:
- *Better Auth con los plugins organization y admin*: ya trae miembros, roles e invitaciones, pero obliga a
  tener la cuenta antes de aceptar, impone la terminología "organization" a todo el esquema y esconde reglas
  que la spec necesita controlar.
- *Auth hecha a mano*: más código sensible de seguridad (hash, sesiones, tokens) que mantener entre una sola
  persona.

## Modelo de datos
Primera migración de Drizzle (`lib/db/schema.ts` → `drizzle/`):

- **Tablas de Better Auth** (`user`, `session`, `account`, `verification`), generadas con su CLI hacia el
  esquema Drizzle. `user.name` es obligatorio (se pide al aceptar la invitación, RF-005) y `user` suma
  `is_platform_admin boolean not null default false`.
- **`restaurants`**: `id uuid pk`, `name text not null`, `status text not null default 'active'`
  (check `active | suspended`), `created_by → user.id`, `created_at timestamptz`, `suspended_at timestamptz null`.
- **`memberships`**: `id uuid pk`, `restaurant_id → restaurants.id`, `user_id → user.id`, `role text`
  (check `owner | staff`), `created_at`. `unique (restaurant_id, user_id)`; índice por `user_id`.
- **`invitations`**: `id uuid pk`, `restaurant_id → restaurants.id`, `email text` (en minúsculas),
  `role`, `token_hash text unique` (SHA-256; el token en claro solo existe en el link, que se muestra una vez
  al crear o reenviar la invitación, RF-003), `invited_by → user.id`,
  `status text` (check `pending | accepted | cancelled`), `expires_at timestamptz`, `created_at`,
  `accepted_at null`. Índice único parcial `(restaurant_id, email) where status = 'pending'`.
  "Vencida" no se guarda: se calcula con `expires_at` y `now`.
- **`login_lockouts`**: `email text pk`, `failed_count int`, `locked_until timestamptz null`, `updated_at`.

`user`, `session`, `account`, `verification` y `login_lockouts` son de identidad, no de negocio: una persona
puede estar en varios restaurantes, por eso no llevan `restaurant_id` (ver Constitución, II.1).

## Pantallas y rutas
Mobile-first; textos en es-BO.

| Ruta | Quién | Qué hace |
|---|---|---|
| `/ingresar` | todos | Login con email y contraseña |
| `/recuperar` | todos | Pedir el link de recuperación |
| `/recuperar/nueva` | con token | Crear una contraseña nueva |
| `/invitacion/[token]` | invitado | Crear la contraseña (usuario nuevo) o unirse (usuario existente) |
| `/panel` | con sesión | 0 locales → "No perteneces a ningún restaurante"; 1 → redirige; varios → selector |
| `/panel/[restaurantId]` | miembro | Inicio del panel (placeholder hasta la spec 005) y selector de local |
| `/panel/[restaurantId]/equipo` | dueño | Invitar, listar, cambiar el rol, quitar, cancelar y reenviar |
| `/admin` | fundador | Restaurantes: crear, ver y copiar la invitación, suspender y reactivar |
| `/api/auth/[...all]` | — | Handler de Better Auth |

## Validación y permisos
- **Zod** en `lib/schemas/auth.ts`: `emailSchema` (trim + minúsculas), `passwordSchema` (mín. 8),
  `inviteSchema` (email, rol), `acceptInvitationSchema` (nombre, contraseña), `changeRoleSchema`
  (miembro, rol), `createRestaurantSchema` (nombre, email del dueño), `restaurantIdSchema` (uuid).
  Los usan los formularios y las Server Actions.
- **`lib/auth/guard.ts`**:
  - `requireSession()`;
  - `requireMember(restaurantId, role?)`: sesión, membresía, rol y restaurante activo. Lanza
    `NotMember`, `Forbidden` o `Suspended`, y la página muestra el texto de la spec;
  - `requirePlatformAdmin()`.
  Cada consulta lee la membresía en la BD, sin caché, así que quitar a alguien o suspender un restaurante
  tiene efecto en su siguiente acción (RF-015, RF-024).
- **`lib/permissions.ts`**: `can(role, action)` con las acciones `team.manage`, `settings.manage` y
  `panel.operate`.
- **Último dueño sin carreras** (RF-017): quitar a un miembro o cambiar su rol se hace en una transacción
  que bloquea las membresías de dueño del restaurante (`SELECT … FOR UPDATE`), cuenta los dueños que
  quedarían y recién entonces aplica el cambio.
- **Administración** (RF-027): `/admin` y sus acciones llaman a `requirePlatformAdmin()`.
- **Sin conexión** (RF-026): los formularios conservan sus valores en el cliente; si el envío falla por red,
  muestran el mensaje de la spec sin limpiar los campos (la contraseña incluida, porque no sale del celular).
- **Signup público desactivado**: el usuario solo se crea dentro de la acción que acepta una invitación
  válida (RF-001).
- **Bloqueo por intentos**: un hook `before` de Better Auth en `/sign-in/email` consulta `login_lockouts`
  y un hook `after` cuenta el fallo o reinicia el contador (RF-010).

## Avisos y jobs (Inngest)
- Esta spec no tiene avisos al comensal ni jobs.
- Emails al staff (invitación y recuperación) con `lib/email.ts`. Hay dos transportes:
  - `resend` en producción;
  - `file` en desarrollo y tests: escribe cada email como JSON en `.emails/` para que Playwright lea el link.

## Dependencias nuevas
Todas son del stack aprobado en `AGENTS.md`.
- `next`, `react`, `react-dom`, `typescript`: la base del stack.
- `tailwindcss` + shadcn/ui (los componentes se copian al repo; solo suma Radix para los que se usen):
  la UI del stack.
- `drizzle-orm`, `drizzle-kit`, `postgres` (postgres.js): ORM y migraciones (III.3). Un solo driver TCP
  sirve para Postgres local y para Neon.
- `better-auth`: auth del staff, decidida en el stack.
- `zod`: validación compartida (III.1).
- `resend`: emails, como figura en el stack.
- `vitest`, `@playwright/test`: tests (III.4).
- `tsx` (dev): correr el script `admin:create`.

Inngest, Sentry y PostHog no se instalan todavía: se agregan con la primera spec que los necesite.

## Constitución
- **II.1 Multi-tenant**: cumple. `memberships` e `invitations` llevan `restaurant_id` y todo acceso pasa
  por `requireMember`. Las tablas de identidad no lo llevan porque no son de negocio y una persona puede
  estar en varios locales.
- **II.2 Sin doble reserva**: no aplica; esta spec no tiene reservas.
- **II.3 Estados de reserva**: no aplica.
- **II.4 Avisos por ambos canales**: no aplica; los emails son para el staff, no para el comensal (ya
  aclarado en la spec).
- **II.5 Fechas**: cumple. `expires_at`, `locked_until` y las sesiones se guardan en `timestamptz` UTC; la
  UI las muestra en `America/La_Paz`.
- **II.6 Dinero y teléfonos**: no aplica.
- **II.7 Idioma**: cumple. UI en es-BO; código y commits en inglés.
- **III.1 TS strict y Zod**: cumple. `strict: true` y la regla de ESLint `no-explicit-any`; esquemas en
  `lib/schemas/`.
- **III.2 Validación y pertenencia**: cumple. Toda Server Action valida con Zod y llama a `requireMember`
  o `requirePlatformAdmin`.
- **III.3 Migraciones de Drizzle**: cumple. Los cambios de esquema van con `pnpm db:generate` +
  `pnpm db:migrate`.
- **III.4 Tests**: cumple. Lógica con Vitest y flujos con Playwright. La disponibilidad no se toca aquí.
- **III.5 Dependencias justificadas**: cumple (ver "Dependencias nuevas").
- **III.6 SDD**: cumple. Spec aprobada, este plan y luego `tasks.md`.

## Cobertura del spec
| Requisito / criterio | Tarea | Test |
|---|---|---|
| RF-001, RF-002, RF-003, RF-027, HU-1 | T4, T6 | Vitest (T4): signup público rechazado; Playwright `admin.spec.ts` |
| RF-004, RF-007 | T3, T7 | Vitest `invitations.test.ts`; Playwright link vencido/usado/cancelado |
| RF-005, RF-006, HU-2 | T7 | Playwright `invitation.spec.ts` (usuario nuevo y existente) |
| RF-008, RF-009, RF-012, HU-3 | T4 | Playwright `login.spec.ts` |
| RF-011 | T4 | Vitest: configuración de sesión (30 días, deslizante); Playwright: sigue al recargar |
| RF-026 | T4, T7, T8 | Playwright con la red apagada: mensaje y campos conservados |
| RF-010 | T3, T4 | Vitest `lockout.test.ts`; Playwright 5 fallos, también con un email inexistente |
| RF-013, RF-014, RF-016, RF-025, RF-028, HU-4 | T8 | Playwright `team.spec.ts` |
| RF-015 | T5, T8 | Vitest `guard.test.ts`; Playwright quitar con sesión abierta |
| RF-017, caso "dos dueños a la vez" | T3, T8 | Vitest `team-rules.test.ts`; Vitest de integración: dos bajas simultáneas |
| RF-018 | T3, T5 | Vitest `permissions.test.ts`, `guard.test.ts` |
| RF-019, RF-020, HU-5 | T9 | Playwright `password-reset.spec.ts` (el vencimiento se fuerza en la BD de test) |
| RF-021, HU-6 | T5 | Playwright selector de local; Vitest guard por local |
| RF-022 | T5 | Vitest `guard.test.ts` (otro restaurante); Playwright URL ajena |
| RF-023, RF-024, HU-7, caso "invitación de un suspendido" | T5, T6, T7 | Vitest guard `Suspended`; Playwright suspender/reactivar |

## Tests
- **Vitest (unitarios)**: `invitations`, `lockout`, `team-rules`, `permissions` y los esquemas Zod. Son
  funciones puras con `now` como parámetro.
- **Vitest (integración con BD)**: `guard.test.ts` contra un Postgres de test que se migra antes de la
  suite. Prueba otro restaurante, rol insuficiente, miembro quitado y local suspendido; y `team.test.ts`
  con dos bajas de dueño simultáneas.
- **Vitest (configuración)**: duración de la sesión y vencimiento del link de recuperación, sin esperar al
  reloj.
- **Playwright** (móvil, viewport 390×844): login, invitación, equipo, recuperación, admin y un flujo de
  punta a punta. Los emails se leen desde `.emails/`.

## Pasos de implementación
Ver [tasks.md](./tasks.md) (T1–T10).

## Riesgos y preguntas abiertas
- **Postgres para desarrollo y tests**: recomiendo Postgres local en Docker (un `docker-compose.yml` con
  Postgres 16) y Neon solo en producción. Si no usas Docker, la alternativa es una rama de Neon para
  desarrollo. Hay que confirmarlo antes de T2.
- **Crear un usuario con el signup desactivado**: hay que confirmar en T4 qué API de Better Auth crea el
  usuario desde el servidor con `disableSignUp`. Plan B: dejar el signup activo y rechazarlo en un hook
  `before` salvo que venga de la acción de invitación.
- **Hook `after` de Better Auth en un login fallido**: falta comprobar que corre cuando el login falla. Se
  prueba en T4; plan B: contar el fallo dentro del hook `before`, verificando la contraseña ahí.
- **Bloqueo como molestia**: cualquiera puede bloquear 15 minutos a un mesero con 5 intentos. Se acepta en
  el MVP; si pasa, se agrega un límite por IP.
- **Conexiones desde Vercel**: con postgres.js hay que usar la URL **pooled** de Neon en producción.
- **Resend necesita un dominio verificado** para enviar a cualquier email. Mientras no lo tengas, se usa el
  link copiado por WhatsApp (RF-003) y el transporte `file`.
