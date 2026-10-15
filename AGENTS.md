  # AGENTS.md — Booker

## Producto
Booker es una herramienta de reservas para restaurantes de **La Paz, Bolivia** (luego Santa Cruz y Cochabamba).
Inspiración: OpenTable, adaptado al mercado boliviano.
- **Fase 1 (actual): herramienta web para el restaurante.** Link público de reservas (web), panel móvil del día,
  confirmaciones/recordatorios por WhatsApp y email, anticipos por QR.
- **Fase 2: marketplace.** Guía pública de restaurantes con reseñas verificadas.

Cliente que paga: el restaurante (suscripción mensual fija en Bs, sin comisión por comensal).
Usuario final: el comensal (gratis, **sin cuenta**: reserva con nombre + WhatsApp + email; ambos obligatorios, email verificado con código).

## Constitución
Los principios de producto, las reglas de dominio y las convenciones están en `docs/constitution.md`.
Léela antes de especificar, planificar o escribir código; prevalece sobre este archivo.
Flujo de trabajo (SDD): `/especificar` → `/planificar` → `/implementar`; `/verificar` revisa un spec en
cualquier etapa. Alternativa con agentes: `claude --agent coordinator` (`.claude/agents/coordinator.md`)
solo coordina y delega: `planner` escribe spec, plan y tareas; `implementer` el código; `reviewer` revisa.

## Stack
- Next.js (App Router) + TypeScript (strict), full-stack en un solo repo
- Tailwind CSS + shadcn/ui; PWA para el panel
- PostgreSQL (Neon) + Drizzle ORM; Zod para validación compartida front/back
- Better Auth (solo staff de restaurantes)
- Email transaccional (p. ej. Resend) para códigos de verificación, confirmaciones y recordatorios
- WhatsApp Business Cloud API (Meta): solo plantillas salientes de confirmación y recordatorio
- Inngest para jobs (recordatorios por WhatsApp y email, expiración de anticipos, no-shows)
- Pagos: QR del restaurante + comprobante (MVP); API QR de banco boliviano (fase 2). **Stripe no opera en Bolivia.**
- Vercel (hosting), Sentry, PostHog; Vitest + Playwright; pnpm

## Estructura
```
app/r/[slug]/                link público de reservas
app/r/[slug]/reserva/[id]/   ver/cancelar reserva (link del email)
app/panel/                   panel del restaurante
lib/db/schema.ts             esquema Drizzle
lib/availability.ts          cálculo de disponibilidad
lib/email.ts                 envío de emails
lib/whatsapp.ts              envío de plantillas de WhatsApp
lib/notify.ts                envía cada aviso por WhatsApp y email
lib/jobs/                    funciones Inngest
```

## Comandos
Requisitos: Node 24+, pnpm (`corepack enable pnpm`) y Docker. La primera vez: `pnpm install`,
`pnpm exec playwright install chromium`, `cp .env.example .env.local` (y completar `BETTER_AUTH_SECRET`),
`pnpm db:up` y `pnpm db:migrate`.

| Qué | Comando |
|---|---|
| Servidor de desarrollo (http://localhost:3000) | `pnpm dev` |
| Build de producción | `pnpm build` |
| Lint (ESLint, sin `any`) | `pnpm lint` |
| Typecheck (genera los tipos de rutas + `tsc`) | `pnpm typecheck` |
| Tests de lógica (Vitest: proyectos `unit` y `db`; `db` necesita `pnpm db:up`) | `pnpm test` |
| Solo un proyecto de Vitest | `pnpm test --project unit` / `pnpm test --project db` |
| Un archivo de Vitest / un test por nombre | `pnpm test lib/utils.test.ts` / `pnpm test -t "merges conflicting"` |
| Vitest en modo watch | `pnpm test:watch` |
| Tests de flujo (Playwright, móvil 390×844; levanta `pnpm dev` solo) | `pnpm test:e2e` |
| Un archivo de Playwright / un test por nombre | `pnpm test:e2e e2e/home.spec.ts` / `pnpm test:e2e -g "home loads"` |
| Levantar Postgres local (Docker; BDs `booker` y `booker_test`) | `pnpm db:up` |
| Crear una migración tras cambiar `lib/db/schema.ts` | `pnpm db:generate --name <nombre>` |
| Aplicar migraciones a la BD de `DATABASE_URL` | `pnpm db:migrate` |

Los tests de Vitest van junto al código: `lib/x.test.ts` (sin BD) o `lib/x.db.test.ts` (contra `booker_test`,
que se borra y se migra de cero al empezar la suite). Los de Playwright, en `e2e/`.

## Memoria del proyecto
Las decisiones y su porqué están en `MEMORY.md`. Léelo antes de proponer cambios de stack o de producto,
y agrega una entrada cuando se tome una decisión nueva.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
