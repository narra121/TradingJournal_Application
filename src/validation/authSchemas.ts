import { z } from 'zod';

// Shared Zod schemas for auth related forms

export const emailSchema = z.string().min(1, { message: 'auth.errors.emailRequired' }).email({ message: 'auth.errors.emailInvalid' });

export const passwordSchema = z.string()
  .min(6, { message: 'auth.errors.passwordMin' })
  .max(18, { message: 'auth.errors.passwordMax' })
  .refine(v => /[A-Z]/.test(v), { message: 'auth.errors.passwordUpper' })
  .refine(v => /[0-9]/.test(v), { message: 'auth.errors.passwordNumber' })
  .refine(v => /[^A-Za-z0-9]/.test(v), { message: 'auth.errors.passwordSymbol' });

export const confirmPasswordSchema = z.object({ password: passwordSchema, confirmPassword: z.string() })
  .refine(d => d.password === d.confirmPassword, { message: 'auth.errors.passwordMismatch', path: ['confirmPassword'] });

export const codeSchema = z.string().min(4, { message: 'auth.errors.codeShort' });

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, { message: 'auth.errors.passwordRequired' }) });

export const signupSchema = z.object({ email: emailSchema, password: passwordSchema, confirmPassword: z.string().min(1, { message: 'auth.errors.passwordRequired' }) })
  .refine(d => d.password === d.confirmPassword, { message: 'auth.errors.passwordMismatch', path: ['confirmPassword'] });

export const forgotRequestSchema = z.object({ email: emailSchema });
export const forgotConfirmSchema = z.object({ email: emailSchema, code: codeSchema, newPassword: passwordSchema });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ForgotRequestValues = z.infer<typeof forgotRequestSchema>;
export type ForgotConfirmValues = z.infer<typeof forgotConfirmSchema>;
