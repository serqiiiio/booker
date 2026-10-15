# MEMORY.md — Booker

Memoria del proyecto: decisiones, contexto y aprendizajes. Lo más reciente va arriba en cada sección.

## Estado actual (2026-10-14)
- Fase: **construcción del MVP web (Fase 1)**. Aún sin código.
- Próximo paso: inicializar el proyecto Next.js y modelar el esquema (restaurantes, mesas, reservas, comensales).

## Decisiones

### 2026-10-14 — Constitución del proyecto en `docs/constitution.md`
- Principios de producto, reglas técnicas, calidad/proceso y cómo se enmienda (versión semántica).
- Las reglas salieron de `AGENTS.md`, que ahora apunta a la constitución; prevalece sobre todo lo demás.
- **Por qué**: cada regla en un solo lugar, con su porqué y un proceso claro para cambiarla.

### 2026-10-14 — Planificar cada funcionalidad antes de codear (`/planificar`)
- Comando de Claude Code en `.claude/commands/planificar.md`.
- Actualizado el 2026-10-14 (constitución v1.1.0): se aplica SDD, spec → plan → código. `/especificar` define
  el qué y el porqué (`docs/specs/<ID>/spec.md`); `/planificar` parte de un spec aprobado y define solo el cómo
  (`docs/specs/<ID>/plan.md`).
- El plan revisa las reglas de dominio (multi-tenant, sin doble reserva, estados, zonas horarias, avisos por
  ambos canales) y se implementa solo tras aprobarlo.
- **Por qué**: evita retrabajo y protege las reglas de dominio en un equipo de una persona.

### 2026-10-14 — Panel de mesas: plano + línea de tiempo
- Plano del salón con mesas por color: libre / reservada pronto / ocupada / por liberar.
- Vista de línea de tiempo (mesas × horas) para ver huecos del día.
- El mesero cambia estados con un toque (`confirmed → seated → completed`) y registra walk-ins en dos toques.
- Duración estimada por tamaño de grupo (configurable); alerta si una mesa reservada sigue ocupada.
- Sincronización entre celulares del staff con polling liviano o SSE, sin dependencias pesadas.
- **Por qué**: la disponibilidad online refleja la realidad del salón y nunca se sobre-reserva.

### 2026-10-14 — WhatsApp solo para notificaciones (confirmación + recordatorio)
- Se piden WhatsApp y email, ambos obligatorios. La confirmación y el recordatorio salen por los dos a la vez.
- Una sola vía: plantillas aprobadas de Meta; sin chat ni webhook de respuestas en esta fase.
- **Por qué**: en Bolivia el comensal vive en WhatsApp (el email puede no leerse) y el recordatorio por WhatsApp
  es lo que más reduce no-shows; el email queda como respaldo y comprobante.

### 2026-10-14 — Identidad del comensal: email verificado con código + WhatsApp
- Sin cuenta: nombre + WhatsApp + email (obligatorios). Se envía un código de 6 dígitos al email para verificarlo.
- Confirmación por WhatsApp y email con link para ver/cancelar la reserva; recordatorios por WhatsApp y email
  (24 h y 2 h antes).
- Perfil por comensal y restaurante: visitas, no-shows, cancelaciones, notas del staff (alergias, VIP, mesa preferida).
- Anticipo por QR como filtro extra en fechas pico y grupos grandes.
- **Por qué**: es barato, verifica que el contacto es real y no agrega la fricción de crear cuenta.

### 2026-10-14 — Se omite la validación de mercado; se construye directo el MVP
- **Por qué**: decisión del fundador de priorizar tener el producto para mostrarlo a restaurantes.

### 2026-10-12 — Mercado inicial: La Paz, Bolivia
- **Por qué**: el fundador vive en La Paz; al inicio se vende en persona, local por local.
- Zonas foco: Zona Sur (Calacoto, San Miguel, Achumani) y Sopocachi; turístico como segmento secundario.

### 2026-10-12 — Estrategia: herramienta primero, marketplace después
- **Por qué**: resuelve el problema del huevo y la gallina (como hizo OpenTable). El software es útil
  para el restaurante aunque no haya comensales en la red.

### 2026-10-12 — Modelo de cobro: suscripción fija en Bs, sin comisión por comensal
- **Por qué**: los restaurantes desconfían de las comisiones (es la queja principal contra OpenTable);
  hay escasez de dólares en Bolivia.

### 2026-10-12 — WhatsApp como canal principal (ajustada el 2026-10-14: WhatsApp solo para notificaciones)
- **Por qué**: en Bolivia las reservas ya ocurren por WhatsApp/Instagram/llamada, no por email ni apps.

### 2026-10-12 — Pagos por QR, no Stripe
- **Por qué**: Stripe no opera en Bolivia; el QR interbancario es el medio de pago digital dominante.
- MVP: QR estático + comprobante aprobado manualmente. Fase 2: API de QR dinámico con un banco.

### 2026-10-12 — Stack TypeScript full-stack (Next.js)
- **Por qué**: el frontend es TS de todos modos. TS en el backend da un solo repo/despliegue, tipos y
  validación (Zod) compartidos, y menos mantenimiento para un equipo de una persona.
- Alternativa considerada: Python/Django (admin incluido, mejor para ML futuro). Descartada por la simplicidad
  operativa, no por ser inferior.

### 2026-10-12 — Comensal sin cuenta
- **Por qué**: menos fricción; se identifica por su email verificado y su número de WhatsApp.

## Contexto de mercado
- Restaurantes gestionan reservas con libreta, Excel o WhatsApp.
- Apps fuertes en Bolivia son de delivery (PedidosYa, Yaigo); no se identificó un líder en reservas (verificar).
- Fechas pico: San Valentín, Día de la Madre, fin de año, Carnaval.
- Hora buena para visitar restaurantes: 15:00–17:30.

## Catálogo de servicios para restaurantes (referencia: OpenTable, 2026-10-14)
OpenTable ofrece: reservas, perfil público, base de clientes con notas, marketing, reseñas, experiencias,
encuestas post-visita, plano de mesas, lista de espera, control de cupos, integración POS, campañas de email,
perfiles 360, evaluación del staff, depósitos, reportes con IA y reservas por voz.
Sus métricas: cubiertos, no-show, rotación de mesa, ocupación por turno, gasto por cliente (POS).

### MVP (Fase 1)
- Link de reservas propio (Instagram, Google Maps, web) con cupos por turno y anticipación mínima.
- Confirmación + recordatorio por WhatsApp y email; link para cancelar.
- Panel del día: plano de mesas y línea de tiempo; walk-ins.
- Anticipos por QR en fechas pico / grupos grandes; política de cancelación.
- Ficha del cliente: visitas, no-shows, cancelaciones, notas y etiquetas (VIP, alergias).
- Métricas básicas (dashboard semanal):
  - Reservas y cubiertos por día/turno; ocupación por turno (% de mesas usadas).
  - Tasa de no-show y Bs perdidos estimados (no-shows × ticket promedio que define el restaurante).
  - Cancelaciones y con cuánta anticipación.
  - Origen de la reserva (Instagram, Google, web, walk-in, manual).
  - Tamaño promedio de grupo; horas y días pico.
  - Clientes nuevos vs. recurrentes.

### Fase 1.5
- Lista de espera digital (aviso por WhatsApp cuando se libera mesa).
- Tiempo de rotación real por tamaño de grupo (de `seated` a `completed`).
- Encuesta post-visita (1 pregunta + comentario) y puntaje del restaurante.
- Eventos/experiencias con cupo y pago anticipado (San Valentín, Día de la Madre, Año Nuevo).
- Reporte mensual automático por email/WhatsApp al dueño.
- Desempeño por mesero/anfitrión (mesas atendidas, rotación).

### Fase 2+
- Marketplace y reseñas verificadas; campañas (cumpleaños, clientes inactivos); integración POS para gasto
  por cliente; QR dinámico con banco; comparativas anónimas con restaurantes de la zona.

**Diferencia frente a OpenTable**: todas las métricas básicas incluidas desde el inicio, sin repartirlas por plan.

## Preguntas abiertas
- ¿Cuánto pagaría un restaurante al mes (Bs)?
- ¿Qué banco boliviano ofrece API de QR para comercios y en qué condiciones?
- ¿Qué proveedor de email usar y qué tan buena es la entregabilidad a correos bolivianos (Gmail/Hotmail)?
- Costo por mensaje de plantillas de WhatsApp (utility) para Bolivia y tiempo de aprobación de Meta.

## Bitácora
- 2026-10-14: subagente `reviewer` (clarificación de specs y validación RF por RF, sin modificar nada).
  Equipo SDD completo: `coordinator` → `planner`, `implementer`, `reviewer`.
- 2026-10-14: subagente `implementer` (una tarea por llamada, test primero, verificación visual en móvil).
  Pendiente: `reviewer`.
- 2026-10-14: `coordinator` pasa a solo coordinar (no edita nada); nuevo subagente `planner` (spec, plan y
  tareas; solo escribe en `docs/specs/`); requisitos en formato EARS. Pendientes: `implementer` y `reviewer`.
- 2026-10-14: agente primario `coordinator` (solo lee, edita specs y delega); subagentes `planner`,
  `implementer` y `reviewer` pendientes de crear.
- 2026-10-14: comando `/verificar` (solo lectura) revisa spec, plan, tareas y código contra el spec y la
  constitución, y entrega un informe con hallazgos por severidad.
- 2026-10-14: constitución v1.2.0; comando `/implementar` (tasks.md + una tarea a la vez, test primero)
  completa el flujo SDD: `/especificar` → `/planificar` → `/implementar`.
- 2026-10-14: constitución v1.1.0 (III.6: spec → plan → código); `/planificar` ahora parte de un spec y guarda
  el plan en `docs/specs/<ID>/plan.md`.
- 2026-10-14: comando `/especificar` para crear specs (SDD) en `docs/specs/` antes de planificar.
- 2026-10-14: constitución v1.0.0 (`docs/constitution.md`); reglas movidas desde `AGENTS.md`.
- 2026-10-14: comando `/planificar` para planificar funcionalidades antes de escribir código.
- 2026-10-14: catálogo de servicios y métricas para restaurantes, con OpenTable como referencia.
- 2026-10-14: WhatsApp vuelve solo como canal de notificaciones (confirmación + recordatorio), junto al email;
  ambos datos obligatorios al reservar.
- 2026-10-14: se omite la validación de mercado; MVP solo web con email verificado; WhatsApp pospuesto;
  definido panel de mesas (plano + línea de tiempo).
- 2026-10-12: definida propuesta de valor, mercado, estrategia y stack. Creados AGENTS.md y MEMORY.md.