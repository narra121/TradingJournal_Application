import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/card'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Button } from '@/ui/button'
import { authApi } from '@/lib/api/auth'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, RotateCcw } from 'lucide-react'
import { cn } from 'lib/utils'
import { t } from '@/i18n/strings'
import { forgotRequestSchema, forgotConfirmSchema, emailSchema, passwordSchema, codeSchema } from '@/validation/authSchemas'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1|2>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const navigate = useNavigate()

  const validateEmail = useCallback((val: string) => {
    try { emailSchema.parse(val); return null } catch (e:any){ return t(e.errors?.[0]?.message || 'auth.errors.emailInvalid') }
  },[])

  const passwordScore = useCallback((pwd: string) => {
    let score = 0
  if (pwd.length >= 6) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score // 0-4
  },[])

  const validatePassword = useCallback((pwd: string) => {
    try { passwordSchema.parse(pwd); return null } catch (e:any){ return t(e.errors?.[0]?.message || 'auth.errors.passwordMin') }
  },[])

  const validateCode = useCallback((c: string) => {
    try { codeSchema.parse(c); return null } catch (e:any){ return t(e.errors?.[0]?.message || 'auth.errors.codeShort') }
  },[])

  useEffect(()=>{
    setEmailError(validateEmail(email))
  },[email, validateEmail])
  useEffect(()=>{
    if (step===2) setPasswordError(validatePassword(newPassword))
  },[newPassword, validatePassword, step])
  useEffect(()=>{
    if (step===2) {
      if (confirmPassword) {
        setConfirmError(newPassword === confirmPassword ? null : t('auth.errors.passwordMismatch'))
      } else {
        setConfirmError(t('auth.errors.passwordRequired'))
      }
    }
  },[confirmPassword, newPassword, step])
  useEffect(()=>{
    if (step===2) setCodeError(validateCode(code))
  },[code, validateCode, step])

  useEffect(()=>{
    if (resendCooldown <= 0) return
    const t = setTimeout(()=> setResendCooldown(c=>c-1), 1000)
    return ()=> clearTimeout(t)
  },[resendCooldown])

  const MAX_RESENDS = 3
  const [resendAttempts, setResendAttempts] = useState(0)

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      forgotRequestSchema.parse({ email })
      await authApi.forgotPassword({ email })
      toast.success(t('auth.success.resetCodeSent'))
      setStep(2)
      setResendCooldown(60)
      if (resendAttempts === 0) setResendAttempts(1)
    } catch (e:any) {
      if (e?.errors) {
        toast.error(t(e.errors[0].message))
      } else {
        toast.error(e.message || t('auth.failure.sendCode'))
      }
    } finally { setLoading(false) }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      forgotConfirmSchema.parse({ email, code, newPassword })
      if (confirmError) throw new Error(t('auth.errors.passwordMismatch'))
      await authApi.confirmForgotPassword({ email, code, newPassword })
      toast.success(t('auth.success.passwordReset'))
      navigate('/login')
    } catch (e:any) {
      toast.error(e.message || t('auth.failure.resetPassword'))
    } finally { setLoading(false) }
  }

  const score = passwordScore(newPassword)
  const scoreColors = ['bg-red-500','bg-orange-500','bg-yellow-500','bg-lime-500','bg-green-600']
  const scoreLabels = [t('auth.weak'),t('auth.weak'),t('auth.fair'),t('auth.good'),t('auth.strong')]

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{step===1? t('auth.forgotPassword') : t('auth.resetPassword')}</CardTitle>
            <CardDescription>{step===1? 'Enter your email to receive a reset code' : 'Enter the code and your new password'}</CardDescription>
          </CardHeader>
          <CardContent>
            {step===1 && (
              <form onSubmit={handleRequest} className="flex flex-col gap-6" noValidate>
                <div className="grid gap-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} aria-invalid={!!emailError} />
                  {emailError && <p className="text-xs text-red-600">{emailError}</p>}
                </div>
                <Button type="submit" disabled={loading || !!emailError} className="w-full">
                  {loading? t('auth.sending') : t('auth.sendCode')}
                </Button>
                <p className="text-xs text-center text-muted-foreground">{t('auth.remembered')} <Link to="/login" className="underline">{t('auth.backToLogin')}</Link></p>
              </form>
            )}
            {step===2 && (
              <form onSubmit={handleConfirm} className="flex flex-col gap-6" noValidate>
                <div className="grid gap-2">
                  <Label htmlFor="code">{t('auth.code')}</Label>
                  <Input id="code" value={code} onChange={e=>setCode(e.target.value)} aria-invalid={!!codeError} />
                  <div className="flex items-center justify-between">
                    {codeError && <p className="text-xs text-red-600">{codeError}</p>}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={resendCooldown>0 || loading || resendAttempts >= MAX_RESENDS}
                      onClick={(ev) => {
                        if (resendAttempts >= MAX_RESENDS) return
                        handleRequest(ev)
                        setResendAttempts(a => a + 1)
                      }}
                      className="ml-auto h-6 px-2 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> {resendCooldown>0? t('auth.resendIn', resendCooldown) : resendAttempts >= MAX_RESENDS ? `${t('auth.resend')} (max)` : t('auth.resend')}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input id="newPassword" type={showPassword? 'text':'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)} aria-invalid={!!passwordError} className="pr-10" />
                    <button type="button" onClick={()=> setShowPassword(p=>!p)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                      {showPassword? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {Array.from({length:4}).map((_,i)=> <div key={i} className={cn('h-1 flex-1 rounded', i < score ? scoreColors[score] : 'bg-border')} />)}
                  </div>
                  <p className={cn('text-xs', passwordError? 'text-red-600':'text-muted-foreground')}>{passwordError || scoreLabels[score]}</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <Input id="confirmPassword" type={showPassword? 'text':'password'} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} aria-invalid={!!confirmError} />
                  {confirmError && <p className="text-xs text-red-600">{confirmError}</p>}
                </div>
                <Button type="submit" disabled={loading || !!passwordError || !!codeError || !!confirmError} className="w-full">
                  {loading? t('auth.resetting') : t('auth.resetPassword')}
                </Button>
                <p className="text-xs text-center text-muted-foreground">Wrong email? <button type="button" className="underline" onClick={()=> { setStep(1); setCode(''); setNewPassword(''); setConfirmPassword(''); setResendAttempts(0); }}> {t('auth.change')}</button></p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
