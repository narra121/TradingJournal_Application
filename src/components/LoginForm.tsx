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
import { awsLogin } from '@/app/awsAuthSlice'
import { toast } from "sonner";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isSignUp] = useState(false);

  

  const handleGoogleLogin = () => toast.error('Google sign-in removed with Firebase')

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const form = event.currentTarget as HTMLFormElement
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    try {
      await dispatch(awsLogin({ email, password }) as any)
      toast.success('Login successful')
    } catch (e: any) {
      toast.error(e.message || 'Login failed')
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    {!isSignUp && (
                      <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    )}
                  </div>
                  <Input id="password" type="password" required />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Loading...' : 'Login'}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  type='button'
                >
                  {loading ? 'Loading...' : 'Google Login Disabled'}
                </Button>
              </div>
            </form>
          }
        </CardContent>
      </Card>
    </div>
  );
}
