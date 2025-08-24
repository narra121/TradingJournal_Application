import { cn } from "lib/utils";
import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { Eye, EyeOff } from 'lucide-react'
import { awsLogin } from '@/app/awsAuthSlice'
import { toast } from "sonner";
import { Link, useNavigate } from 'react-router-dom'
import { t } from '@/i18n/strings'
import { loginSchema } from '@/validation/authSchemas'
import { z } from 'zod'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  

  // Removed deprecated Google login option

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const form = event.currentTarget as HTMLFormElement
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    try {
      const parsed = loginSchema.parse({ email, password })
  await (dispatch as any)(awsLogin(parsed)).unwrap()
  toast.success(t('auth.success.login'))
  navigate('/app')
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        toast.error(t(e.errors[0].message))
      } else {
        toast.error(e?.message || t('auth.failure.login'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isSignUp ? "Sign Up" : "Login"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Enter your email below to create your account"
              : "Enter your email below to login to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {
            <form onSubmit={handleEmailAuth}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    {!isSignUp && (
                      <Link
                        to="/forgot-password"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} required className="pr-10" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('auth.loggingIn') : t('auth.login')}
                </Button>

                <p className="text-sm text-center">{t('auth.dontHaveAccount')} <Link to="/signup" className="underline">{t('auth.signup')}</Link></p>
              </div>
            </form>
          }
        </CardContent>
      </Card>
    </div>
  );
}
