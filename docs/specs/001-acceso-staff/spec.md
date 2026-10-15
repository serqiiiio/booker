# Spec 001: Acceso del staff

**Estado**: Aprobado
**Fecha**: 2026-10-14
**Depende de**: ninguno

## Resumen
Para que un restaurante use Booker, alguien tiene que crearlo y su gente tiene que poder entrar al panel.
Los restaurantes se venden en persona, uno por uno, y pagan una suscripción que se cobra a mano. Por eso
solo el fundador da de alta restaurantes: no hay registro libre. El fundador invita al dueño, el dueño
invita a su staff y cada persona entra con su propio email y su propia contraseña. Así nadie usa Booker
sin haber pagado, nadie conoce la contraseña de otro y se sabe quién hizo cada cambio.

## Actores
- **Fundador**: administra Booker. Da de alta los restaurantes, invita a su primer dueño y los suspende si
  dejan de pagar.
- **Dueño**: administra su restaurante. Invita y quita staff y ve todo lo de su restaurante.
- **Staff** (mesero/anfitrión): opera el panel del día. No toca la configuración ni el equipo.

## Historias de usuario

### HU-1 (P1): Dar de alta un restaurante
Como fundador, quiero crear un restaurante e invitar a su dueño por email, para que solo usen Booker los
restaurantes que contraté.
**Por qué esta prioridad**: sin restaurante creado no existe nada más en el producto.
**Prueba independiente**: el fundador crea "La Casona" con el email del dueño y ese email recibe la
invitación.
**Criterios de aceptación**:
1. Dado que soy el fundador, cuando creo un restaurante con su nombre y el email del dueño, entonces el
   restaurante queda creado y al dueño le llega un email de invitación.
2. Dado un restaurante recién creado, cuando se crea la invitación, entonces veo el link y puedo copiarlo
   para mandarlo también por WhatsApp. Si necesito copiarlo otra vez, reenvío la invitación y obtengo un
   link nuevo.
3. Dado que soy dueño o staff, cuando intento entrar a la administración del fundador, entonces no tengo
   acceso.

### HU-2 (P1): Aceptar una invitación
Como dueño o staff invitado, quiero abrir el link de la invitación, poner mi nombre y elegir mi contraseña,
para entrar al panel sin que nadie más la conozca.
**Por qué esta prioridad**: es la única forma de entrar a Booker.
**Prueba independiente**: un invitado abre el link, pone su nombre, crea su contraseña y llega al panel de su
restaurante.
**Criterios de aceptación**:
1. Dado un link de invitación vigente, cuando lo abro, pongo mi nombre y creo una contraseña válida,
   entonces mi cuenta queda activa y entro al panel del restaurante con el rol de la invitación.
2. Dado un link vencido o ya usado, cuando lo abro, entonces veo un mensaje que me pide una invitación
   nueva y no se crea ninguna cuenta.
3. Dado que ya tengo cuenta en Booker con ese email, cuando acepto la invitación de otro restaurante,
   entonces ese restaurante se agrega a mi cuenta sin crear otra contraseña.

### HU-3 (P1): Iniciar y cerrar sesión
Como dueño o staff, quiero entrar con mi email y mi contraseña y que la sesión quede abierta en mi
celular, para no escribirlos en plena hora pico.
**Por qué esta prioridad**: el staff trabaja de pie y con el celular en la mano (I.1).
**Prueba independiente**: un mesero entra, cierra el navegador, lo vuelve a abrir al día siguiente y sigue
dentro.
**Criterios de aceptación**:
1. Dado un email y una contraseña correctos, cuando inicio sesión, entonces entro al panel de mi
   restaurante.
2. Dado un email o una contraseña incorrectos, cuando inicio sesión, entonces veo un mensaje que no dice
   cuál de los dos está mal.
3. Dada una sesión abierta, cuando vuelvo a abrir Booker dentro de los 30 días siguientes a mi último uso,
   entonces sigo dentro sin volver a escribir la contraseña.
4. Dada una sesión abierta, cuando toco "Cerrar sesión", entonces salgo y para volver tengo que iniciar
   sesión de nuevo.

### HU-4 (P1): Invitar y quitar staff
Como dueño, quiero invitar a una persona y quitarle el acceso cuando deja de trabajar conmigo, sin tener que
pedírselo al fundador.
**Por qué esta prioridad**: el staff rota mucho y el dueño tiene que poder resolverlo solo.
**Prueba independiente**: el dueño invita a un mesero, el mesero entra; el dueño lo quita y el mesero ya no
puede ver nada del restaurante.
**Criterios de aceptación**:
1. Dado que soy dueño, cuando invito un email con el rol staff o dueño, entonces a esa persona le llega la
   invitación y yo puedo copiar el link para mandarlo por WhatsApp.
2. Dado que soy dueño, cuando veo mi equipo, entonces veo a cada persona con su nombre, email, rol y si su
   invitación está pendiente.
3. Dado un miembro del equipo, cuando lo quito, entonces pierde el acceso a mi restaurante en su siguiente
   acción, aunque tenga la sesión abierta.
4. Dada una invitación pendiente, cuando la cancelo o la reenvío, entonces el link anterior deja de
   funcionar.
5. Dado que soy staff, cuando intento ver o cambiar el equipo, entonces no tengo acceso.
6. Dado un miembro del equipo, cuando cambio su rol entre dueño y staff, entonces en su siguiente acción
   tiene los permisos del rol nuevo.

### HU-5 (P2): Recuperar la contraseña
Como dueño o staff, quiero recuperar mi contraseña por email, para no depender del fundador ni del dueño.
**Por qué esta prioridad**: pasa seguido, pero hay alternativa (que el dueño reenvíe una invitación).
**Prueba independiente**: alguien pide recuperar su contraseña, recibe el email, crea una nueva y entra con
ella.
**Criterios de aceptación**:
1. Dado un email registrado, cuando pido recuperar la contraseña, entonces llega un link que sirve una sola
   vez durante 1 hora.
2. Dado cualquier email, registrado o no, cuando pido recuperar la contraseña, entonces veo el mismo
   mensaje, para no revelar quién tiene cuenta.
3. Dado que cambié mi contraseña, cuando termino, entonces se cierran mis sesiones abiertas en otros
   dispositivos.

### HU-6 (P2): Elegir local
Como dueño con varios restaurantes, quiero usar una sola cuenta y cambiar de local, para no manejar varios
emails.
**Por qué esta prioridad**: pocos clientes al inicio tendrán más de un local.
**Prueba independiente**: un dueño con dos locales entra, ve los dos y cambia de uno a otro.
**Criterios de aceptación**:
1. Dado que pertenezco a varios restaurantes, cuando entro, entonces elijo el local; si pertenezco a uno
   solo, entro directo a él.
2. Dado que estoy en un local, cuando cambio a otro, entonces solo veo datos del local elegido (II.1).
3. Dado que soy dueño en un local y staff en otro, cuando cambio de local, entonces mis permisos son los
   del rol en ese local.

### HU-7 (P2): Suspender un restaurante
Como fundador, quiero suspender y reactivar un restaurante, para cortarle el acceso si deja de pagar sin
borrar sus datos.
**Por qué esta prioridad**: el cobro es manual y esta es la única forma de hacerlo cumplir; al inicio habrá
pocos casos.
**Prueba independiente**: el fundador suspende "La Casona"; su staff ya no entra al panel. La reactiva y todo
vuelve como estaba.
**Criterios de aceptación**:
1. Dado un restaurante activo, cuando lo suspendo, entonces su dueño y su staff ven "Cuenta suspendida,
   contacta a Booker" y no pueden usar su panel, ni siquiera con la sesión abierta.
2. Dado un restaurante suspendido, cuando lo reactivo, entonces su equipo vuelve a entrar y sus datos
   siguen iguales.
3. Dada una persona que pertenece a un local suspendido y a otro activo, cuando entra, entonces puede seguir
   usando el local activo.

## Casos borde
- **Email ya invitado al mismo restaurante**: no se duplica; se ofrece reenviar la invitación.
- **Último dueño**: un restaurante siempre tiene al menos un dueño; el último no puede quitarse ni bajar su
  rol a staff.
- **Intentos fallidos**: después de 5 contraseñas incorrectas seguidas para el mismo email, ese email no
  puede intentar de nuevo durante 15 minutos.
- **Persona quitada con el panel abierto**: en su siguiente acción ve "Ya no tienes acceso a este
  restaurante".
- **Persona quitada de su único restaurante**: puede iniciar sesión, pero ve que no pertenece a ningún
  restaurante.
- **Email que ya es parte del equipo**: no se crea invitación; se avisa que esa persona ya es parte del
  equipo.
- **Dos dueños a la vez**: si dos dueños se quitan o se bajan el rol entre sí al mismo tiempo, solo una de
  las dos acciones se aplica y el restaurante nunca queda sin dueño.
- **Invitación de un restaurante suspendido**: el invitado puede crear su cuenta, pero ve "Cuenta
  suspendida, contacta a Booker" hasta que el restaurante se reactive.
- **Invitación a un email mal escrito**: el dueño la cancela y envía otra; la primera deja de funcionar.
- **Sin internet al iniciar sesión**: aparece un mensaje claro y no se pierde lo que estaba escrito.

## Requisitos funcionales
- **RF-001**: El sistema DEBE permitir que solo el fundador cree restaurantes; no existe el registro libre.
- **RF-002**: CUANDO el fundador crea un restaurante, el sistema DEBE crear una invitación con rol dueño para
  el email indicado y enviarla por email.
- **RF-003**: CUANDO se crea o se reenvía una invitación, el sistema DEBE mostrar a quien invita el link,
  para copiarlo.
- **RF-004**: Una invitación DEBE servir una sola vez y vencer 7 días después de enviada.
- **RF-005**: CUANDO un invitado abre un link vigente, pone su nombre y crea una contraseña de al menos
  8 caracteres, el sistema DEBE activar su cuenta y darle acceso al restaurante con el rol de la invitación.
- **RF-006**: SI el email invitado ya tiene cuenta, ENTONCES el sistema DEBE agregarle el restaurante sin
  pedirle una contraseña nueva.
- **RF-007**: SI la invitación está vencida, usada o cancelada, ENTONCES el sistema DEBE rechazarla y pedir
  una invitación nueva.
- **RF-008**: CUANDO alguien inicia sesión con email y contraseña correctos, el sistema DEBE darle acceso a
  sus restaurantes.
- **RF-009**: SI el email o la contraseña son incorrectos, ENTONCES el sistema DEBE mostrar un mismo mensaje
  que no indique cuál falló.
- **RF-010**: SI un email acumula 5 intentos fallidos seguidos, ENTONCES el sistema DEBE bloquear nuevos
  intentos para ese email durante 15 minutos.
- **RF-011**: MIENTRAS no pasen 30 días desde el último uso, el sistema DEBE mantener la sesión abierta en
  ese dispositivo.
- **RF-012**: CUANDO alguien cierra sesión, el sistema DEBE terminar su sesión en ese dispositivo.
- **RF-013**: El sistema DEBE permitir que el dueño invite personas con rol dueño o staff a su restaurante.
- **RF-014**: El sistema DEBE mostrar al dueño su equipo: nombre, email, rol y estado de la invitación.
- **RF-015**: CUANDO el dueño quita a un miembro, el sistema DEBE negarle el acceso a ese restaurante desde
  su siguiente acción, aunque tenga una sesión abierta.
- **RF-016**: CUANDO el dueño cancela o reenvía una invitación, el sistema DEBE invalidar el link anterior.
- **RF-017**: SI una acción dejaría al restaurante sin dueños, ENTONCES el sistema DEBE impedirla y explicar
  por qué.
- **RF-018**: El sistema DEBE permitir solo al dueño gestionar el equipo y la configuración del restaurante;
  el staff solo opera el panel del día.
- **RF-019**: CUANDO alguien pide recuperar su contraseña, el sistema DEBE mostrar el mismo mensaje exista o
  no la cuenta y, si existe, enviar un link de un solo uso que vence en 1 hora.
- **RF-020**: CUANDO alguien cambia su contraseña, el sistema DEBE cerrar sus otras sesiones abiertas.
- **RF-021**: DONDE una persona pertenece a varios restaurantes, el sistema DEBE dejarle elegir el local y
  mostrarle solo los datos del local elegido, con el rol que tiene en él.
- **RF-022**: El sistema DEBE impedir que alguien vea o cambie datos de un restaurante al que no pertenece,
  aunque conozca su dirección web.
- **RF-023**: El sistema DEBE permitir solo al fundador suspender y reactivar un restaurante, sin borrar sus
  datos.
- **RF-024**: MIENTRAS un restaurante está suspendido, el sistema DEBE negar a su dueño y su staff el acceso a
  su panel y mostrar "Cuenta suspendida, contacta a Booker".
- **RF-025**: El sistema DEBE permitir que el dueño cambie el rol de un miembro entre dueño y staff, con
  efecto desde la siguiente acción de ese miembro.
- **RF-026**: SI no hay conexión al enviar un formulario, ENTONCES el sistema DEBE mostrar "Sin conexión.
  Revisa tu internet e intenta de nuevo." y conservar lo escrito.
- **RF-027**: El sistema DEBE permitir solo al fundador entrar a la administración de Booker.
- **RF-028**: SI se invita un email que ya es parte del equipo, ENTONCES el sistema DEBE avisarlo y no
  crear la invitación.

## Entidades clave
- **Restaurante**: nombre; estado (activo o suspendido); quién y cuándo lo dio de alta.
- **Usuario**: nombre (lo pone al aceptar su primera invitación), email (único), contraseña; puede
  pertenecer a varios restaurantes.
- **Membresía**: un usuario en un restaurante, con un rol (dueño o staff).
- **Invitación**: email, restaurante, rol, quién invitó, vencimiento y estado (pendiente, aceptada, vencida,
  cancelada).
- **Sesión**: un usuario en un dispositivo, con su último uso.

## Criterios de éxito
- Un dueño invitado activa su cuenta y llega a su panel en menos de 2 minutos desde el celular.
- Un dueño invita a un mesero en menos de 1 minuto.
- Una persona quitada del equipo no puede hacer ninguna acción más en ese restaurante.
- 0 casos de una persona viendo datos de un restaurante al que no pertenece.
- Ni el fundador ni el dueño conocen la contraseña de otra persona.

## Textos y avisos
- **Email de invitación** (al invitar): "Te invitaron a {restaurante} en Booker", con el botón "Crear mi
  contraseña" y el aviso de que el link vence en 7 días.
- **Email de recuperación** (al pedirla): "Cambia tu contraseña de Booker", con el botón "Crear nueva
  contraseña" y el aviso de que el link vence en 1 hora.
- **Login incorrecto**: "El email o la contraseña no son correctos."
- **Bloqueo**: "Demasiados intentos. Vuelve a intentar en 15 minutos."
- **Invitación inválida**: "Esta invitación ya no es válida. Pide una nueva a quien te invitó."
- **Acceso quitado**: "Ya no tienes acceso a este restaurante."
- **Último dueño**: "El restaurante necesita al menos un dueño."
- **Restaurante suspendido**: "Cuenta suspendida, contacta a Booker."
- **Ya es parte del equipo**: "Esta persona ya es parte de tu equipo."
- **Sin conexión**: "Sin conexión. Revisa tu internet e intenta de nuevo."

Estos emails son para el staff, no para el comensal, así que solo salen por email; no les aplica II.4.

## Constitución
- **I.1**: invitar, entrar y cambiar de local funcionan desde el celular y sin capacitación.
- **I.3**: se usa desde el navegador; no hay que instalar nada.
- **I.6**: esta spec es solo para el staff; el comensal sigue sin cuenta.
- **II.1**: cada persona solo ve los restaurantes a los que pertenece (RF-021, RF-022).
- **II.7**: los textos están en español (es-BO).
- **III.2**: el servidor comprueba la pertenencia y el rol en cada acción (RF-015, RF-018, RF-022).

## Supuestos
- Todo el staff tiene un email propio (la mayoría usa Gmail en su celular Android).
- El fundador entra con una cuenta de administrador que se crea al instalar Booker, no desde la web.
- Contraseña mínima de 8 caracteres, sin más reglas de complejidad, para no frenar al staff.
- La invitación vence a los 7 días: alcanza para que el dueño la abra sin dejar links vivos para siempre.

## Fuera de alcance
- Registro libre de restaurantes y cobro de la suscripción dentro de Booker.
- Iniciar sesión con Google, por código o con verificación en dos pasos.
- Roles intermedios (encargado) y permisos a medida.
- Configuración del restaurante: link, horarios, turnos y políticas (spec 002).
- Historial detallado de quién hizo cada cambio (cada spec que cambie datos guarda su autor).
- Qué pasa con el link público de reservas de un restaurante suspendido (spec 004).

## Preguntas abiertas
Ninguna. La suspensión se resolvió el 2026-10-14: sí (HU-7, RF-023, RF-024).

## Historial de cambios
- **2026-10-14**: cambios de la verificación (`/verificar 001`), aprobados por el fundador.
  - Se pide el nombre al aceptar la invitación (HU-2, RF-005), que RF-014 necesita mostrar.
  - El link se muestra al crear o reenviar la invitación; para copiarlo otra vez se reenvía (HU-1, RF-003).
    Así el link no queda guardado y es más seguro.
  - Se agregan cambiar el rol de un miembro (HU-4 criterio 6, RF-025), el aviso sin conexión (RF-026), el
    acceso exclusivo del fundador a la administración (RF-027) y el email que ya es miembro (RF-028).
  - Nuevos casos borde: dos dueños a la vez, invitación de un restaurante suspendido y email ya miembro.
