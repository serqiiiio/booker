// Error codes the sign-in endpoint can return, and the es-BO texts the UI
// shows for them (spec 001, "Textos y avisos").
export const ACCOUNT_LOCKED_CODE = "ACCOUNT_LOCKED";
export const INVALID_CREDENTIALS_CODE = "INVALID_EMAIL_OR_PASSWORD";

export const authMessages = {
  invalidCredentials: "El email o la contraseña no son correctos.",
  locked: "Demasiados intentos. Vuelve a intentar en 15 minutos.",
  offline: "Sin conexión. Revisa tu internet e intenta de nuevo.",
  unexpected: "Algo salió mal. Intenta de nuevo.",
} as const;

export const invitationMessages = {
  invalid: "Esta invitación ya no es válida. Pide una nueva a quien te invitó.",
  hasAccount: "Ya tienes una cuenta con este email. Recarga la página para unirte con tu contraseña.",
  wrongUser: "Esta invitación es para otro email.",
} as const;

export const accessMessages = {
  notMember: "Ya no tienes acceso a este restaurante.",
  forbidden: "Solo el dueño puede hacer esto.",
  suspended: "Cuenta suspendida, contacta a Booker.",
  noRestaurants: "No perteneces a ningún restaurante.",
} as const;

export const teamMessages = {
  lastOwner: "El restaurante necesita al menos un dueño.",
  alreadyMember: "Esta persona ya es parte de tu equipo.",
  alreadyInvited: "Ya hay una invitación pendiente para este email. Reenvíala desde la lista.",
  notFound: "Esta persona ya no está en el equipo.",
  invitationGone: "Esta invitación ya no está pendiente.",
} as const;

export const passwordResetMessages = {
  requested:
    "Si el email tiene una cuenta en Booker, te enviamos un link para crear una contraseña nueva. Revisa tu correo: el link vence en 1 hora.",
  invalidLink: "Este link ya no es válido. Pide uno nuevo.",
  changed: "Tu contraseña se cambió. Ingresa con la nueva.",
} as const;
