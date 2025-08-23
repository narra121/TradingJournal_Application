import { LoginForm } from "@/components/LoginForm";
import { RootState } from "./app/store";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { bootstrapFromStorage } from '@/app/awsAuthSlice'
import DashboardPage from "./dashboard/DashboardPage";

export default function Page() {
  const isLoggedIn = useSelector((state: RootState) => !!state.AwsAuth.idToken);

  const dispatch = useDispatch();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    dispatch(bootstrapFromStorage())
    setCheckingAuth(false)
  }, [dispatch])
  return (
    <>
      {checkingAuth && <div>Loading...</div>}
      {!checkingAuth && !isLoggedIn && (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      )}
      {!checkingAuth && isLoggedIn && <DashboardPage />}
    </>
  );
}
