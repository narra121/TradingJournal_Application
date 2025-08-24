// Basic i18n strings map. Future: integrate i18next or similar.
// Accessor helper t(key) returns English fallback.
export const locales = {
  en: {
    auth: {
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      code: 'Code',
      resend: 'Resend',
      resendIn: (s: number) => `Resend (${s})`,
      login: 'Login',
      loggingIn: 'Logging in...',
      signup: 'Sign Up',
      signingUp: 'Signing up...',
      confirm: 'Confirm',
      confirming: 'Confirming...',
      forgotPassword: 'Forgot Password',
      resetPassword: 'Reset Password',
      resetting: 'Resetting...',
      sendCode: 'Send Code',
      sending: 'Sending...',
      backToLogin: 'Back to login',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      remembered: 'Remembered?',
      change: 'Change',
      weak: 'Weak',
      fair: 'Fair',
      good: 'Good',
      strong: 'Strong',
  passwordRequirements: '6-18 chars incl. uppercase, number & symbol',
      errors: {
        emailRequired: 'Email required',
        emailInvalid: 'Invalid email',
        passwordRequired: 'Password required',
  passwordMin: 'Min 6 characters',
  passwordMax: 'Max 18 characters',
        passwordUpper: 'Add uppercase letter',
        passwordNumber: 'Add a number',
        passwordSymbol: 'Add a symbol',
        passwordMismatch: 'Passwords do not match',
        codeRequired: 'Code required',
        codeShort: 'Code too short'
      },
      success: {
        login: 'Login successful',
        signupInitiated: 'Signup initiated. Check your email for the confirmation code.',
        signupConfirmed: 'Account confirmed. You can now login.',
        resetCodeSent: 'Reset code sent to email',
        passwordReset: 'Password reset. You can login now.'
      },
      failure: {
        login: 'Login failed',
        signup: 'Signup failed',
        confirm: 'Confirmation failed',
        sendCode: 'Failed to send reset code',
        resetPassword: 'Failed to reset password'
      }
    }
  },
  es: {
    auth: {
      email: 'Correo',
      password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña',
      code: 'Código',
      resend: 'Reenviar',
      resendIn: (s: number) => `Reenviar (${s})`,
      login: 'Iniciar sesión',
      loggingIn: 'Iniciando...',
      signup: 'Registrarse',
      signingUp: 'Registrando...',
      confirm: 'Confirmar',
      confirming: 'Confirmando...',
      forgotPassword: 'Olvidé mi contraseña',
      resetPassword: 'Restablecer contraseña',
      resetting: 'Restableciendo...',
      sendCode: 'Enviar código',
      sending: 'Enviando...',
      backToLogin: 'Volver a inicio',
      alreadyHaveAccount: '¿Ya tienes cuenta?',
      dontHaveAccount: '¿No tienes cuenta?',
      remembered: '¿Lo recordaste?',
      change: 'Cambiar',
      weak: 'Débil',
      fair: 'Regular',
      good: 'Buena',
      strong: 'Fuerte',
  passwordRequirements: '6-18 caracteres con mayúscula, número y símbolo',
      errors: {
        emailRequired: 'Correo requerido',
        emailInvalid: 'Correo inválido',
        passwordRequired: 'Contraseña requerida',
  passwordMin: 'Mín 6 caracteres',
  passwordMax: 'Máx 18 caracteres',
        passwordUpper: 'Agrega mayúscula',
        passwordNumber: 'Agrega un número',
        passwordSymbol: 'Agrega un símbolo',
        passwordMismatch: 'Las contraseñas no coinciden',
        codeRequired: 'Código requerido',
        codeShort: 'Código muy corto'
      },
      success: {
        login: 'Inicio de sesión exitoso',
        signupInitiated: 'Registro iniciado. Revisa tu correo.',
        signupConfirmed: 'Cuenta confirmada. Ya puedes iniciar sesión.',
        resetCodeSent: 'Código enviado al correo',
        passwordReset: 'Contraseña restablecida. Inicia sesión.'
      },
      failure: {
        login: 'Fallo al iniciar sesión',
        signup: 'Fallo en registro',
        confirm: 'Fallo al confirmar',
        sendCode: 'Fallo al enviar código',
        resetPassword: 'Fallo al restablecer la contraseña'
      }
    }
  }
} as const

export type AppLocales = keyof typeof locales
let currentLocale: AppLocales = 'en'
export function setLocale(locale: AppLocales) { if (locales[locale]) currentLocale = locale }
export function getLocale() { return currentLocale }

export function t(path: string, ...args: any[]): string {
  const parts = path.split('.')
  let cur: any = locales[currentLocale]
  for (const p of parts) {
    cur = cur?.[p]
    if (cur === undefined) return path
  }
  if (typeof cur === 'function') return cur(...args)
  return cur
}
