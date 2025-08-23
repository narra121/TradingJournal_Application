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
import {
  signInWithGoogle,
  signInWithEmailPassword,
  registerWithEmailPassword,
  sendEmailVerification,
  auth,
} from "@/app/auth";
import { User, UserCredential } from "firebase/auth";
import { loginSuccess } from "@/app/authSlice";
import { toast } from "sonner";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false); // Track if verification email sent
  const [user, setUser] = useState<User | null>(null); // Store the user object

  

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user: User = await signInWithGoogle();
      dispatch(
        loginSuccess({
          email: user.email,
          uid: user.uid,
          name: user.displayName,
          photoURL: user.photoURL,
        })
      );
    } catch (err: any) {
      toast.error(`Login Failed: ${err.message}`);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    // setError(null); // No 'error' state defined, commenting out
    setLoading(true);
    setVerificationSent(false); // Reset verification status

    const form = event.currentTarget as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    try {
      if (isSignUp) {
        // Registration
        const newUserCredential: UserCredential =
          await registerWithEmailPassword(email, password);
        const newUser = newUserCredential.user;
        setUser(newUser); // Store user object
        await sendEmailVerification(newUser); // Send verification email
        setVerificationSent(true);
        toast.success("Registration successful! Please verify your email.");

        // Don't automatically log in; wait for email verification
      } else {
        // Login
        const userCredential: UserCredential = await signInWithEmailPassword(
          email,
          password
        );
        const user = userCredential.user;
        setUser(user);

        if (!user.emailVerified) {
          await sendEmailVerification(user); // Re-send verification if needed
          setVerificationSent(true);
          toast.info(
            "Please verify your email. A verification link has been sent to your inbox."
          );
        } else {
          // User is logged in AND email is verified.  Dispatch loginSuccess.
          dispatch(
            loginSuccess({
              email: user.email,
              uid: user.uid,
              name: user.displayName || "",
              photoURL: user.photoURL || "",
            })
          );
          toast.success("Login successful!");
        }
      }
    } catch (err: any) {
      if (!isSignUp && err.code === "auth/user-not-found") {
        toast.error("No account found with that email. Please sign up.");
      } else if (isSignUp && err.code === "auth/email-already-in-use") {
        toast.error("An account with this email already exists. Please log in.");
      } else if (!isSignUp && err.code === "auth/wrong-password") {
        toast.error("Incorrect password. Please try again.");
      } else {
        toast.error(`Authentication error: ${err.message}`);
        console.error("Authentication error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        setVerificationSent(true);
        toast.success("Verification email resent. Please check your inbox.");
      } catch (error: any) {
        toast.error("Failed to resend verification email: " + error.message);
      }
    } else {
      toast.error("No user to verify. Please try logging in again.");
    }
  };
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
          {verificationSent ? (
            <>
              <p className="text-green-600">
                A verification email has been sent to your email address. Please
                check your inbox (and spam folder) and click the verification
                link.
              </p>
              <Button onClick={handleResendVerification} disabled={loading}>
                {loading ? "Sending..." : "Resend Verification Email"}
              </Button>
            </>
          ) : (
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
                  {loading ? "Loading..." : isSignUp ? "Sign Up" : "Login"}
                </Button>

                {/* Conditionally render the Google login button */}
                {!isSignUp && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Login with Google"}
                  </Button>
                )}
              </div>
              <div className="mt-4 text-center text-sm">
                {isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <a
                      href="#"
                      className="underline underline-offset-4"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsSignUp(false);
                        setVerificationSent(false); // Reset verification status
                      }}
                    >
                      Login
                    </a>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <a
                      href="#"
                      className="underline underline-offset-4"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsSignUp(true);
                        setVerificationSent(false);
                      }}
                    >
                      Sign up
                    </a>
                  </>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
