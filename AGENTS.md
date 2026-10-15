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
(Completar al inicializar el proyecto: pnpm dev, pnpm test, pnpm test:e2e, pnpm db:migrate, pnpm lint)

## Memoria del proyecto
Las decisiones y su porqué están en `MEMORY.md`. Léelo antes de proponer cambios de stack o de producto,
y agrega una entrada cuando se tome una decisión nueva.