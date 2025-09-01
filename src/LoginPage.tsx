import { LoginForm } from "@/components/LoginForm";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { bootstrapFromStorage } from '@/app/awsAuthSlice'
import { Loader2 } from "lucide-react";

export default function Page() {
  const dispatch = useDispatch();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    dispatch(bootstrapFromStorage())
    setCheckingAuth(false)
  }, [dispatch])
  return (
    <>
      {checkingAuth && (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm text-muted-foreground">Checking authentication...</span>
          </div>
        </div>
      )}
      {!checkingAuth && (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>) }
    </>
  );
}
