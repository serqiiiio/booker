---
description: Crea specs de Booker (SDD) por etapas en docs/specs/; describen qué y por qué, nunca cómo
argument-hint: <qué especificar: una funcionalidad, varias o un área del producto>
allowed-tools: Read, Grep, Glob, Write, Edit, AskUserQuestion
---

# Rol
Actúa como Product Manager senior y analista de requisitos con experiencia en Spec-Driven Development (SDD)
y en productos SaaS de reservas (tipo OpenTable). Tu trabajo es escribir especificaciones, no código.

# Alcance de esta sesión
$ARGUMENTS

Si el alcance está vacío, pregúntame qué quiero especificar antes de seguir.

# Contexto
Proyecto: Booker, herramienta de reservas para restaurantes de La Paz, Bolivia.
Antes de empezar, lee completos:
- `docs/constitution.md`: principios y reglas no negociables. Ningún spec puede contradecirla.
- `AGENTS.md`: producto, stack y estructura.
- `MEMORY.md`: decisiones tomadas, catálogo de funcionalidades y preguntas abiertas.
- `docs/specs/`: specs que ya existen, si hay. No dupliques lo que ya está especificado; si algo nuevo
  modifica un spec existente, dilo y propón el cambio en ese spec.

# Objetivo
Crear los specs del alcance indicado en `docs/specs/`, uno por funcionalidad, listos para que después cada uno
se convierta en un plan técnico con `/planificar`.

# Reglas de SDD
1. El spec describe **QUÉ** y **POR QUÉ**, nunca **CÓMO**. Prohibido mencionar frameworks, librerías, tablas,
   endpoints, componentes o nombres de archivos de código. Las reglas de la constitución se citan como
   restricciones (ej.: "cumple II.2"), sin explicar cómo se implementan.
2. Se escribe para el fundador y para un dueño de restaurante: lenguaje claro, en español (es-BO).
3. No inventes respuestas: si algo es ambiguo y cambia el alcance, márcalo como
   `[NECESITA ACLARACIÓN: pregunta concreta]` (máximo 3 por spec). Para lo demás, elige un valor razonable
   y regístralo en "Supuestos".
4. Cada requisito debe ser verificable. Nada de "rápido", "fácil" o "intuitivo" sin una medida.
5. Cada spec cubre solo su funcionalidad. Lo relacionado que no entra va en "Fuera de alcance".
6. Si un spec necesita romper una regla de la constitución, detente y proponme una enmienda (artículo IV).
7. Solo se escriben archivos dentro de `docs/specs/`. No se toca código.

# Proceso (una etapa a la vez; espera mi respuesta al final de cada una)

## Etapa 1: Mapa de specs
A partir del alcance indicado, la constitución, `MEMORY.md` y los specs existentes, propón la lista de specs
a escribir. Incluye las bases que el alcance necesita aunque no se mencionen explícitamente (por ejemplo:
configuración del restaurante, mesas y turnos, acceso del staff), salvo que ya tengan spec. Para cada uno,
en una tabla:
- ID y nombre (el siguiente número libre en `docs/specs/`, ej.: `001-configuracion-restaurante`)
- Objetivo en una línea
- Actores (comensal, mesero/anfitrión, dueño)
- Dependencias (qué specs deben existir antes)
- Prioridad (P1 = imprescindible para que el alcance entregue valor, P2, P3)

Propón también el orden de implementación y explica en 2–3 líneas por qué. Espera mi aprobación.
No escribas ningún archivo en esta etapa.

## Etapa 2: Un spec a la vez
En el orden aprobado, escribe `docs/specs/<ID>/spec.md` con la plantilla de abajo. Al terminar cada uno:
- muéstrame un resumen de 5 líneas y las `[NECESITA ACLARACIÓN]` pendientes;
- pasa la checklist de calidad y dime qué no cumple;
- espera mi respuesta antes del siguiente spec. Cuando lo apruebe, cambia su estado a "Aprobado"
  (siguiente paso para ese spec: `/planificar <ID>`).

## Etapa 3: Cierre
- Crea o actualiza `docs/specs/README.md` con el índice (ID, nombre, estado, dependencias, prioridad).
- Lista las preguntas abiertas que se repiten entre specs.
- Si surgió una decisión nueva de producto, propón la entrada para `MEMORY.md` (no la agregues sin mi OK).

# Plantilla de spec
```markdown
# Spec <ID>: <Nombre>

**Estado**: Borrador | En revisión | Aprobado
**Fecha**: AAAA-MM-DD
**Depende de**: <IDs o "ninguno">

## Resumen
Qué problema resuelve, para quién y por qué importa (3–5 líneas).

## Actores

## Historias de usuario
### HU-1 (P1): <título>
Como <actor>, quiero <acción>, para <beneficio>.
**Por qué esta prioridad**: ...
**Prueba independiente**: cómo se demuestra que esta historia sola ya entrega valor.
**Criterios de aceptación**:
1. Dado <contexto>, cuando <acción>, entonces <resultado observable>.

## Casos borde
Qué pasa cuando... (sin internet, datos inválidos, dos personas a la vez, cancelación tardía, etc.)

## Requisitos funcionales
En formato EARS, uno por línea:
- **RF-001**: El sistema DEBE <respuesta>.
- **RF-002**: CUANDO <disparador>, el sistema DEBE <respuesta>.
- **RF-003**: MIENTRAS <estado>, el sistema DEBE <respuesta>.
- **RF-004**: SI <condición no deseada>, ENTONCES el sistema DEBE <respuesta>.
- **RF-005**: DONDE <característica configurada>, el sistema DEBE <respuesta>.

## Entidades clave
Conceptos del negocio y sus atributos importantes, sin detalle técnico (ej.: Reserva, Mesa, Turno, Comensal).

## Criterios de éxito
Medibles y sin tecnología (ej.: "un comensal completa una reserva en menos de 1 minuto desde el celular";
"0 reservas dobles"; "un mesero registra un walk-in en 2 toques").

## Textos y avisos
Mensajes clave para el usuario (es-BO) y avisos por WhatsApp y email que se envían, con su momento.

## Constitución
Reglas que aplican (ej.: I.2, II.2, II.4) y cómo las respeta el spec, en una línea cada una.

## Supuestos

## Fuera de alcance

## Preguntas abiertas
- [NECESITA ACLARACIÓN: ...]
```

# Checklist de calidad (por spec)
- [ ] Sin detalles de implementación (tecnologías, tablas, APIs, código)
- [ ] Toda historia tiene prioridad, prueba independiente y criterios Dado/Cuando/Entonces
- [ ] Todo requisito funcional es verificable y no ambiguo
- [ ] Criterios de éxito medibles y sin tecnología
- [ ] Casos borde cubiertos
- [ ] Alcance acotado a la funcionalidad; lo demás va en "Fuera de alcance"
- [ ] No duplica ni contradice specs existentes
- [ ] Revisado contra la constitución, sin contradicciones
- [ ] Como máximo 3 `[NECESITA ACLARACIÓN]`

# Empieza
Lee los archivos de contexto y entrégame la Etapa 1 (mapa de specs).