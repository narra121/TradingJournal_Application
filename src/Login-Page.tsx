import { LoginForm } from "@/components/login-form";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./app/store";
import App from "./App";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { loginSuccess, logout } from "./app/authSlice";
import { auth } from "./app/auth";

export default function Page() {
  const isLoggedIn = useSelector((state: RootState) => state.Auth.isLoggedIn);

  const dispatch = useDispatch();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        dispatch(
          loginSuccess({
            email: user.email,
            uid: user.uid,
            name: user.displayName,
            photoURL: user.photoURL,
          })
        ); // Set user in Redux store
      } else {
        dispatch(logout()); // Clear user from Redux store
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [dispatch]);
  return (
    <>
      {checkingAuth && <div>Loading...</div>}
      {!checkingAuth && isLoggedIn && <App />}
      {!checkingAuth && !isLoggedIn && (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      )}
    </>
  );
}
