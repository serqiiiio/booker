---
description: Implementa un spec de Booker (SDD) a partir de su plan aprobado; genera tasks.md y avanza tarea por tarea con tests
argument-hint: <ID o ruta del spec, ej.: 003 o docs/specs/003-walk-ins>
---

# Implementar un spec

Spec a implementar: $ARGUMENTS

En SDD el orden es **spec → plan → tareas → código**. El spec (`spec.md`) define el qué y el por qué; el plan
(`plan.md`) define el cómo. Aquí se parte el plan en tareas (`tasks.md`) y se escribe el código, una tarea a la vez.

## Reglas
- **El spec y el plan mandan.** No agregar funcionalidades, pantallas ni dependencias que no estén en ellos.
  Si al implementar algo resulta ambiguo, falta o no funciona como se planificó, detenerse y proponer el cambio
  en `spec.md` o `plan.md` antes de seguir. No improvisar.
- **La constitución manda sobre todo** (`docs/constitution.md`). Si una tarea la rompería, detenerse.
- **Test primero**: para cada tarea con lógica, escribir el test, verlo fallar, implementar y verlo pasar.
- Avanzar **una tarea a la vez** y reportar al terminar cada una. El usuario puede decir "sigue" para
  continuar o pedir que se hagan varias seguidas.
- No hacer commits salvo que el usuario lo pida. Los mensajes de commit van en inglés.

## Etapas

### 1. Verificar que se puede implementar
- Ubicar la carpeta del spec: si `$ARGUMENTS` es un ID (ej.: `003`), buscarla en `docs/specs/`. Si está vacío,
  listar los specs de `docs/specs/README.md` y preguntar cuál.
- Debe existir `spec.md` con estado "Aprobado" y sin `[NECESITA ACLARACIÓN]`, y `plan.md` con estado "Aprobado".
  Si falta algo, no implementar: indicar qué falta y sugerir `/especificar` o `/planificar`.
- Verificar que los specs de los que depende (`Depende de`) ya estén implementados. Si no, avisar.
- Leer `docs/constitution.md`, `AGENTS.md` (stack, estructura y **Comandos**), `spec.md`, `plan.md`
  y el código relacionado.
- Si la sección "Comandos" de `AGENTS.md` está incompleta (cómo correr tests, lint, typecheck, migraciones),
  proponer los comandos y completarla con el OK del usuario antes de empezar.

### 2. Tareas (`tasks.md`)
- Si `docs/specs/<ID>/tasks.md` no existe, crearlo a partir de "Pasos de implementación" y "Cobertura del spec"
  del plan, con esta plantilla:

  ```markdown
  # Tareas <ID>: <Nombre>

  **Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

  ## Base (datos y migraciones)
  - [ ] T001 <tarea> — cubre: RF-00x · test: <qué test>

  ## HU-1 (P1): <título>
  - [ ] T002 Test: <criterio de aceptación que verifica>
  - [ ] T003 <implementación> — cubre: RF-00x

  ## HU-2 (P2): <título>
  - [ ] ...

  ## Cierre
  - [ ] T0xx Test de punta a punta (Playwright) del flujo principal
  - [ ] T0xx Verificación final (etapa 4)
  ```

  Reglas de las tareas: pequeñas (una sesión corta cada una), ordenadas por dependencia, agrupadas por
  historia de usuario en orden de prioridad (así cada historia queda funcionando antes de la siguiente),
  y cada una indica qué requisito cubre y con qué test se verifica.
- Mostrar las tareas y esperar la aprobación del usuario.
- Si `tasks.md` ya existe, retomar desde la primera tarea sin marcar.

### 3. Implementar tarea por tarea
Para cada tarea:
1. Decir qué tarea se hace y qué archivos se tocan.
2. Escribir el test (si aplica) y comprobar que falla.
3. Implementar lo mínimo para que pase, siguiendo el plan y la estructura de `AGENTS.md`.
4. Correr tests, lint y typecheck. Si algo falla, arreglarlo antes de seguir; no marcar la tarea como hecha
   con tests rotos.
5. Marcar la tarea `[x]` en `tasks.md`.
6. Reportar en 2–3 líneas: qué se hizo, resultado de los tests y la siguiente tarea.

Al terminar cada historia de usuario, decirle al usuario cómo probarla a mano (qué abrir y qué hacer).

### 4. Verificación final
- Correr toda la suite de tests (Vitest y Playwright), lint y typecheck, y mostrar el resultado real.
- Revisar la tabla "Cobertura del spec" del plan: cada requisito y criterio de aceptación tiene código y test.
  Listar lo que no quedó cubierto.
- Revisar el código nuevo contra los artículos II y III de la constitución (multi-tenant, constraint de doble
  reserva, estados, fechas, dinero, avisos por ambos canales, Zod, migraciones).
- Revisar los criterios de éxito del spec e indicar cuáles se pueden medir ya y cuáles en producción.
- Actualizar el estado en `docs/specs/README.md` a "Implementado".
- Si durante la implementación se tomó una decisión nueva de stack o arquitectura, proponer la entrada para
  `MEMORY.md` (con su **Por qué**) y agregarla solo con el OK del usuario.
