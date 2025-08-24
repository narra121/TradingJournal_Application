import { apiPost } from './client'
import { AuthLoginResponse } from '@/app/types'

export interface SignupRequest { email: string; password: string }
export interface ConfirmSignupRequest { email: string; code: string }
export interface LoginRequest { email: string; password: string }
export interface RefreshRequest { refreshToken: string }
export interface ForgotPasswordRequest { email: string }
export interface ConfirmForgotPasswordRequest { email: string; code: string; newPassword: string }

export const authApi = {
  signup: (body: SignupRequest) => apiPost<any>('/auth/signup', body),
  confirmSignup: (body: ConfirmSignupRequest) => apiPost<any>('/auth/confirm-signup', body),
  login: (body: LoginRequest) => apiPost<AuthLoginResponse>('/auth/login', body),
  refresh: (body: RefreshRequest) => apiPost<Omit<AuthLoginResponse,'RefreshToken'>>('/auth/refresh', body),
  forgotPassword: (body: ForgotPasswordRequest) => apiPost<any>('/auth/forgot-password', body),
  confirmForgotPassword: (body: ConfirmForgotPasswordRequest) => apiPost<any>('/auth/confirm-forgot-password', body),
  logoutAll: () => apiPost<any>('/auth/logout-all', {}),
}
