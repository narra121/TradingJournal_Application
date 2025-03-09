import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch } from "react-redux";
import { useState, useEffect } from "react"; // Import useEffect
import {
  signInWithGoogle,
  signInWithEmailPassword,
  registerWithEmailPassword,
  sendEmailVerification, // Import the new function
  auth,
} from "@/app/auth";
import { User, UserCredential } from "firebase/auth";
import { loginSuccess } from "@/app/authSlice"; // Import logoutSuccess

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false); // Track if verification email sent
  const [user, setUser] = useState<User | null>(null); // Store the user object

  // // Listen for auth state changes (for email verification)
  // useEffect(() => {
  //   const unsubscribe = auth.onAuthStateChanged((currentUser) => {
  //     // Correctly access auth
  //     setUser(currentUser);
  //     if (currentUser && currentUser.emailVerified) {
  //       // User is logged in AND email is verified
  //       dispatch(
  //         loginSuccess({
  //           email: currentUser.email,
  //           uid: currentUser.uid,
  //           name: currentUser.displayName || "",
  //           photoURL: currentUser.photoURL || "",
  //         })
  //       );
  //     }
  //     // No need for else, Redux state will handle logged-out state
  //   });

  //   return () => unsubscribe(); // Cleanup on unmount
  // }, [dispatch]);

  const handleGoogleLogin = async () => {
    setError(null);
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
      setError(err.message);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
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
          setError(
            "Please verify your email.  A verification link has been sent to your inbox."
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
        }
      }
    } catch (err: any) {
      if (!isSignUp && err.code === "auth/user-not-found") {
        setError("No account found with that email. Please sign up.");
      } else if (isSignUp && err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please log in.");
      } else if (!isSignUp && err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else {
        setError(err.message);
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
        setError("Verification email resent. Please check your inbox.");
      } catch (error: any) {
        setError("Failed to resend verification email: " + error.message);
      }
    } else {
      setError("No user to verify. Please try logging in again.");
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

                {error && <p className="text-red-500">{error}</p>}
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
                        setError(null); // Clear error when switching modes
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
                        setError(null);
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
