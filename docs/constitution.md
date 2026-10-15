# Constitución de Booker

**Versión 1.2.0** · Ratificada 2026-10-14 · Última enmienda 2026-10-14 (III.6: se agrega `/implementar`)

Principios y reglas no negociables del proyecto. Todo plan y todo código los respetan.
Prevalece sobre `AGENTS.md`, `MEMORY.md` y los planes de `docs/planes/`: si algo la contradice, gana la constitución.

## I. Principios de producto

1. **Simplicidad**: un mesero usa el panel sin capacitación. Mobile-first siempre.
   - **Por qué**: el staff rota mucho y trabaja de pie, con el celular en la mano y en plena hora pico.
2. **Confianza**: una reserva confirmada es real. Nunca se sobre-reserva.
   - **Por qué**: una sola mesa doble hace que el restaurante vuelva a la libreta.
3. **Web primero**: todo se usa desde el navegador, sin instalar apps (el panel es PWA).
   WhatsApp y email solo notifican; nunca son el canal para reservar.
   - **Por qué**: nadie instala una app para reservar una vez; el link funciona en Instagram, Google Maps y WhatsApp.
4. **Funciona con internet lento**: páginas livianas y pocas dependencias en el cliente.
   - **Por qué**: muchos comensales y restaurantes usan datos móviles con señal irregular.
5. **Precio justo**: el restaurante paga una suscripción mensual fija en Bs. Nunca comisión por comensal.
   - **Por qué**: los restaurantes desconfían de las comisiones y hay escasez de dólares en Bolivia.
6. **Comensal sin cuenta**: reserva con nombre + WhatsApp + email, verificando el email con un código
   de un solo uso. Nunca se le pide crear cuenta ni datos extra.
   - **Por qué**: menos fricción, y el contacto verificado basta para que la reserva sea real.

## II. Reglas técnicas

1. **Multi-tenant**: toda tabla de negocio tiene `restaurant_id` y toda consulta filtra por él.
   - **Por qué**: un restaurante nunca debe ver ni tocar datos de otro.
2. **Sin doble reserva, garantizado en la BD**: exclusion constraint sobre `tstzrange`, no solo en código.
   Los walk-ins (sin reserva) también ocupan mesa y entran en la misma constraint.
   - **Por qué**: el código puede tener carreras entre dos celulares; la BD no deja pasar el choque.
3. **Estados de reserva**: `pending_deposit → confirmed → seated → completed` | `cancelled` | `no_show` | `expired`.
   No se agregan estados ni transiciones sin enmendar esta constitución.
   - **Por qué**: disponibilidad, recordatorios, métricas y perfil del comensal dependen de estos estados.
4. **Contacto y avisos**: WhatsApp (E.164) y email son obligatorios. Cada aviso sale por ambos canales;
   si uno falla, el otro igual sale.
   - **Por qué**: el comensal vive en WhatsApp, pero el email queda como respaldo y comprobante.
5. **Fechas**: en BD siempre en UTC (`timestamptz`); se muestran en `America/La_Paz`.
   - **Por qué**: evita errores de zona horaria en recordatorios y jobs.
6. **Dinero y teléfonos**: moneda `BOB`, montos en centavos (enteros); teléfonos en E.164 (`+591...`).
   - **Por qué**: sin errores de redondeo y un solo formato para WhatsApp.
7. **Idioma**: textos de UI en español (es-BO); código, nombres de variables y commits en inglés.
   - **Por qué**: el producto es para Bolivia; el código sigue el estándar de la industria.

## III. Calidad y proceso

1. **TypeScript strict, sin `any`**. Los esquemas Zod son la fuente de verdad de los inputs, compartidos
   entre front y back.
   - **Por qué**: un solo lugar define qué datos son válidos.
2. **Todo Server Action y route handler** valida con Zod y verifica que el recurso pertenece al restaurante
   del usuario.
   - **Por qué**: la validación del cliente no protege nada; el servidor es la última barrera.
3. **Cambios de esquema solo vía migraciones de Drizzle.**
   - **Por qué**: la BD de producción debe poder reconstruirse paso a paso.
4. **Tests**: la lógica de disponibilidad con Vitest; el flujo de reserva con Playwright.
   - **Por qué**: son las dos partes donde un error rompe la confianza (principio I.2).
5. **Ninguna dependencia nueva sin justificar el porqué.**
   - **Por qué**: cada dependencia pesa en el cliente (principio I.4) y es mantenimiento para un equipo de una persona.
6. **Spec → plan → tareas → código** (Spec-Driven Development): toda funcionalidad nueva se especifica primero
   con `/especificar` (qué y por qué, en `docs/specs/<ID>/spec.md`), luego se planifica con `/planificar`
   (cómo, en `docs/specs/<ID>/plan.md`) y, solo con ambos aprobados, se implementa con `/implementar`
   (tareas en `docs/specs/<ID>/tasks.md`, una a la vez, con test primero). El código no agrega nada que no
   esté en el spec y el plan; si hace falta, primero se cambian ellos.
   - **Por qué**: no se decide cómo construir algo sin acordar antes qué debe hacer; evita retrabajo y asegura
     que el diseño respete esta constitución.

## IV. Cómo se cambia

1. **Propuesta**: una enmienda dice qué cambia, por qué, y qué código o planes afecta. La aprueba el fundador.
2. **Versión** (semántica):
   - MAYOR: se quita o redefine una regla.
   - MENOR: se agrega una regla o sección.
   - PARCHE: se aclara la redacción sin cambiar el sentido.
3. **Registro**: cada enmienda actualiza la versión y la fecha de arriba, y deja una entrada en `MEMORY.md`
   (en Decisiones y en Bitácora).
4. **Sin excepciones sueltas**: si una regla no sirve, se enmienda; no se ignora en un caso puntual.
5. **Control**: `/planificar` revisa cada plan contra los artículos II y III. Si un plan necesita romper una
   regla, primero se propone la enmienda.