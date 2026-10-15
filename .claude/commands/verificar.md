---
description: Verifica un spec de Booker (SDD) en la etapa en que esté (spec, plan, tareas o código) y entrega un informe sin modificar nada
argument-hint: <ID o ruta del spec, ej.: 003 o docs/specs/003-walk-ins>
allowed-tools: Read, Grep, Glob, Bash, AskUserQuestion
---

# Verificar un spec

Spec a verificar: $ARGUMENTS

Actúa como revisor de QA independiente. Tu trabajo es **encontrar problemas**, no confirmar que todo está bien.
Cada hallazgo debe apoyarse en evidencia concreta (archivo y línea, requisito, resultado de un test).

## Reglas
- **Solo lectura.** No editar archivos ni arreglar nada. El resultado es un informe; los arreglos se hacen
  después con `/especificar`, `/planificar` o `/implementar`, según dónde esté el problema.
- Con Bash solo se ejecutan comandos que no modifican nada: tests, lint, typecheck (ver "Comandos" en
  `AGENTS.md`). Nada de migraciones, instalaciones, borrados ni commits.
- No inventar: si algo no se puede comprobar, decirlo como "no verificado" y por qué.
- Informar resultados reales de los tests, con la salida relevante si fallan.

## 1. Ubicar el spec y su etapa
- Si `$ARGUMENTS` es un ID (ej.: `003`), buscar la carpeta en `docs/specs/`. Si está vacío, listar los specs
  de `docs/specs/README.md` y preguntar cuál verificar.
- Leer `docs/constitution.md`, `AGENTS.md`, `MEMORY.md` y los archivos de la carpeta del spec.
- Según los archivos que existan, verificar todas las etapas que correspondan (cada una incluye las anteriores):
  - solo `spec.md` → A
  - + `plan.md` → A y B
  - + `tasks.md` y código → A, B y C

## A. Spec (`spec.md`)
- Sin detalles de implementación (tecnologías, tablas, APIs, código).
- Cada historia tiene prioridad, prueba independiente y criterios Dado/Cuando/Entonces.
- Cada requisito funcional es verificable y no ambiguo (nada de "rápido" o "fácil" sin medida).
- Criterios de éxito medibles y sin tecnología.
- Casos borde cubiertos (sin internet, datos inválidos, dos usuarios a la vez, cancelaciones tardías).
- `[NECESITA ACLARACIÓN]` pendientes.
- No contradice la constitución, `MEMORY.md` ni otros specs de `docs/specs/`.

## B. Plan (`plan.md`)
- Cada requisito (RF-xxx) y criterio de aceptación del spec aparece en la tabla "Cobertura del spec",
  con paso y test.
- El plan no agrega funcionalidades que el spec no pide.
- Cada regla de los artículos II y III de la constitución está marcada "cumple" (cómo) o "no aplica" (por qué),
  y la justificación es correcta.
- Dependencias nuevas justificadas; el stack coincide con `AGENTS.md`.

## C. Tareas y código
- `tasks.md`: tareas pendientes (`[ ]`) y tareas marcadas `[x]` cuyo código o test no existe.
- Cada requisito y criterio de aceptación tiene código que lo implementa y un test que lo verifica.
  Buscarlos en el código; no basta con que `tasks.md` diga que está hecho.
- No hay código que haga algo que el spec y el plan no piden.
- Constitución en el código nuevo, revisando el código real:
  - toda tabla nueva tiene `restaurant_id` y toda consulta filtra por él;
  - la exclusion constraint de `tstzrange` existe en la migración y cubre walk-ins;
  - solo se usan los estados y transiciones permitidos;
  - fechas `timestamptz` en UTC y mostradas en `America/La_Paz`;
  - montos en centavos enteros de `BOB`; teléfonos en E.164;
  - cada aviso sale por WhatsApp y email, y la falla de uno no impide el otro;
  - Server Actions / route handlers validan con Zod y verifican pertenencia al restaurante;
  - sin `any`; cambios de esquema solo por migraciones de Drizzle;
  - textos de UI en es-BO.
- Ejecutar tests (Vitest y Playwright), lint y typecheck, e informar el resultado.

## 2. Informe
Entregar en el chat:

```markdown
# Verificación <ID>: <Nombre> — <fecha>

**Etapa verificada**: spec | spec + plan | spec + plan + código
**Resultado**: ✅ Listo para <siguiente paso> | ⚠️ Listo con observaciones | ❌ Bloqueado

## Hallazgos
| # | Severidad | Etapa | Dónde | Problema | Cómo arreglarlo |
|---|---|---|---|---|---|
| 1 | Crítico | C | lib/... :42 | ... | `/implementar 003`: ... |

Severidad: **Crítico** (rompe la constitución o un requisito P1, o hay tests fallando) · **Mayor** (requisito
sin cubrir, ambigüedad que cambia el alcance) · **Menor** (redacción, mejora).

## Cobertura
| Requisito / criterio | Código | Test | Estado |
|---|---|---|---|

## Tests
Resultado de Vitest, Playwright, lint y typecheck (o "no aplica todavía").

## No verificado
Lo que no se pudo comprobar y por qué.
```

Ordenar los hallazgos de más a menos severo. Si no hay hallazgos críticos ni mayores, decirlo claramente
e indicar el siguiente paso (`/planificar`, `/implementar` o marcar el spec como "Implementado").