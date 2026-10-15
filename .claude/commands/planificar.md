---
description: Planifica contigo, por etapas, CÓMO construir un spec aprobado de Booker; guarda el plan junto al spec
argument-hint: <ruta o ID del spec, ej.: docs/specs/003-walk-ins/spec.md o 003>
allowed-tools: Read, Grep, Glob, Write, AskUserQuestion, Agent
---

# Planificar un spec

Spec a planificar: $ARGUMENTS

En SDD el orden es **spec → plan → código**. El spec (`/especificar`) ya definió **qué** se construye y **por qué**.
Este plan define **cómo**. Es una conversación con el usuario, no un trámite para generar un archivo:
el objetivo es que entienda y decida el diseño técnico; el archivo es el registro de lo decidido.

## Reglas
- **No tocar código.** El único archivo que se escribe es `docs/specs/<ID>/plan.md`, y solo en la etapa 5.
- **No redefinir el qué.** No cambiar requisitos, historias ni alcance del spec. Si algo del spec falta,
  es ambiguo o resulta inviable, detenerse y proponer el cambio en el spec antes de seguir.
- Avanzar **una etapa a la vez**. Al terminar cada etapa, esperar la respuesta del usuario antes de seguir.
  Si el usuario dice "sigue" o similar, pasar a la siguiente etapa.
- Respuestas cortas y concretas. Siempre dar una recomendación, no solo una lista de opciones.
- No se implementa nada hasta que el usuario apruebe el plan.

## Etapas

### 1. Leer el spec y el contexto
- Ubicar el spec: si `$ARGUMENTS` es un ID (ej.: `003`), buscarlo en `docs/specs/`. Si está vacío, listar los
  specs de `docs/specs/README.md` y preguntar cuál planificar.
- **Si no hay spec**, no planificar: sugerir ejecutar primero `/especificar`.
- **Si el spec no está "Aprobado" o tiene `[NECESITA ACLARACIÓN]` pendientes**, mostrarlas y resolverlas con
  el usuario (actualizando el spec) antes de seguir.
- Leer `docs/constitution.md`, `AGENTS.md` (stack y estructura), `MEMORY.md`, los specs de los que depende
  y el código relacionado si ya existe (`lib/db/schema.ts`, `app/`, `lib/jobs/`).
- Resumir en pocas líneas qué pide el spec (historias P1, requisitos clave, criterios de éxito) y qué partes
  técnicas toca (datos, pantallas, avisos, jobs).

### 2. Opciones técnicas
- Proponer 2–3 formas de construirlo. Para cada una: cómo funciona en una o dos líneas, pros y contras
  (complejidad, cambios en la BD, impacto en la disponibilidad o en la doble reserva, esfuerzo para un
  equipo de una persona, peso para internet lento).
- Recomendar una y explicar por qué.
- **Agente `Plan` (opcional)**: si ya hay código relacionado y vale la pena revisarlo a fondo, lanzar un solo
  agente con `subagent_type: Plan` para que analice ese código y evalúe las opciones. El agente no ve esta
  conversación: pasarle la ruta del spec, la ruta de `docs/constitution.md`, las rutas relevantes y las
  opciones. Resumir al usuario lo que encontró. Si no hay código, no usarlo.

### 3. Decidir y revisar la constitución
- Con la opción elegida por el usuario, repasar juntos cada regla de los artículos II y III de
  `docs/constitution.md` y marcarla "cumple" (cómo) o "no aplica" (por qué).
- Si el plan necesita romper una regla, no seguir: proponer una enmienda según el artículo IV.

### 4. Detalle
- Mostrar en el chat: modelo de datos y migración, pantallas y rutas, validación Zod y permisos, avisos
  (WhatsApp + email), jobs de Inngest, dependencias nuevas (con justificación), tests y pasos de
  implementación pequeños y ordenados.
- Verificar que **cada requisito funcional (RF-xxx) y cada criterio de aceptación** del spec quede cubierto
  por algún paso y por algún test.
- Pedir ajustes al usuario.

### 5. Guardar
- Escribir `docs/specs/<ID>/plan.md` con esta plantilla:

  ```markdown
  # Plan <ID>: <Nombre>

  **Spec**: [spec.md](./spec.md)
  **Estado**: Borrador | Aprobado
  **Fecha**: AAAA-MM-DD

  ## Resumen técnico
  Cómo se construye, en 3–5 líneas.

  ## Decisión
  Opción elegida y por qué. Opciones descartadas, en una línea cada una.

  ## Modelo de datos
  Tablas y columnas nuevas o modificadas, índices/constraints y la migración de Drizzle.

  ## Pantallas y rutas

  ## Validación y permisos

  ## Avisos y jobs (Inngest)

  ## Dependencias nuevas
  Cada una con su justificación, o "ninguna".

  ## Constitución
  - II.1 Multi-tenant: cumple (cómo) / no aplica (por qué)
  - ... un ítem por cada regla de los artículos II y III

  ## Cobertura del spec
  | Requisito / criterio | Paso | Test |
  |---|---|---|
  | RF-001 | 2 | Vitest: ... |

  ## Tests
  - Vitest: ...
  - Playwright: ...

  ## Pasos de implementación
  1. ...

  ## Riesgos y preguntas abiertas
  ```

- Actualizar el estado del spec en `docs/specs/README.md` si existe (ej.: "Planificado").
- Resumir el plan en pocas líneas con el link al archivo y pedir aprobación. Cuando el usuario apruebe,
  cambiar el estado del plan a "Aprobado" e indicar que el siguiente paso es `/implementar <ID>`.
- Si hubo una decisión nueva de stack o arquitectura, proponer la entrada para `MEMORY.md` (con su **Por qué**)
  y agregarla solo cuando el usuario apruebe.