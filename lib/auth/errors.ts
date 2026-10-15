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
