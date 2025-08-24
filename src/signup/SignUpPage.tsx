import { useState, useCallback } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/card'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Button } from '@/ui/button'
import { authApi } from '@/lib/api/auth'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { t } from '@/i18n/strings'
import { signupSchema, passwordSchema } from '@/validation/authSchemas'
import { z } from 'zod'
import { cn } from 'lib/utils'

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const [confirmMode, setConfirmMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const passwordScore = useCallback((pwd: string) => {
    let score = 0
  if (pwd.length >= 6) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  },[])
  const navigate = useNavigate()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const parsed = signupSchema.parse({ email, password, confirmPassword })
      await authApi.signup({ email: parsed.email, password: parsed.password })
      toast.success(t('auth.success.signupInitiated'))
      setConfirmMode(true)
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error(t(err.errors[0].message))
      } else {
        toast.error(err.message || t('auth.failure.signup'))
      }
    } finally { setLoading(false) }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.confirmSignup({ email, code })
      toast.success(t('auth.success.signupConfirmed'))
      navigate('/login')
    } catch (err: any) {
      toast.error(err.message || t('auth.failure.confirm'))
    } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{confirmMode ? t('auth.confirm') : t('auth.signup')}</CardTitle>
            <CardDescription>
              {confirmMode ? 'Enter the code sent to your email' : 'Create a new account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={confirmMode ? handleConfirm : handleSignup} className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              {!confirmMode && (
                <div className="grid gap-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e=>{
                      const v = e.target.value; setPassword(v)
                      try { passwordSchema.parse(v); setPasswordError(null) } catch (err:any){ setPasswordError(t(err.errors?.[0]?.message || 'auth.errors.passwordMin')) }
                      if (confirmPassword) setConfirmError(v === confirmPassword ? null : t('auth.errors.passwordMismatch'))
                    }} className="pr-10" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {Array.from({length:4}).map((_,i)=> <div key={i} className={cn('h-1 flex-1 rounded', i < passwordScore(password) ? ['bg-red-500','bg-orange-500','bg-yellow-500','bg-lime-500','bg-green-600'][passwordScore(password)] : 'bg-border')} />)}
                  </div>
                  {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
                </div>
              )}
              {!confirmMode && (
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <Input id="confirmPassword" type={showPassword ? 'text':'password'} required value={confirmPassword} onChange={e=>{
                    const v = e.target.value; setConfirmPassword(v)
                    setConfirmError(v === password ? null : t('auth.errors.passwordMismatch'))
                  }} />
                  {confirmError && <p className="text-xs text-red-600">{confirmError}</p>}
                </div>
              )}
              {confirmMode && (
                <div className="grid gap-2">
                  <Label htmlFor="code">{t('auth.code')}</Label>
                  <Input id="code" required value={code} onChange={e=>setCode(e.target.value)} />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading || (!!passwordError) || (!!confirmError)}>{loading ? (confirmMode ? t('auth.confirming') : t('auth.signingUp')) : (confirmMode ? t('auth.confirm') : t('auth.signup'))}</Button>
              {!confirmMode && <p className="text-sm text-center">{t('auth.alreadyHaveAccount')} <Link to="/login" className="underline">{t('auth.login')}</Link></p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
