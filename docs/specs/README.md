# Specs de Booker

Índice de specs (SDD). Flujo: `/especificar` → `/planificar` → `/implementar` (constitución III.6).

| ID | Nombre | Estado | Depende de | Prioridad |
|---|---|---|---|---|
| 001 | [Acceso del staff](001-acceso-staff/spec.md) | Planificado (T1–T4 hechas) | — | P1 |

## Mapa de la Fase 1 (aprobado 2026-10-14)
Orden de implementación; las specs se escriben una a la vez.

| ID | Nombre | Depende de | Prioridad |
|---|---|---|---|
| 001 | acceso-staff | — | P1 |
| 002 | configuracion-restaurante | 001 | P1 |
| 003 | mesas | 002 | P1 |
| 004 | reserva-publica | 002, 003 | P1 |
| 005 | panel-del-dia | 004 | P1 |
| 006 | avisos-reserva | 004 | P1 |
| 007 | ver-cancelar-reserva | 004, 006 | P1 |
| 008 | walk-ins-y-reservas-manuales | 005 | P1 |
| 009 | plano-del-salon | 003, 005 | P2 |
| 010 | anticipos-qr | 004, 005, 006 | P2 |
| 011 | ficha-cliente | 005 | P2 |
| 012 | metricas-semanales | 005, 008, 011 | P3 |
