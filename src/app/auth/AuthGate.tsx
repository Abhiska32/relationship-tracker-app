import { ReactNode } from "react";
import { useAuth } from "../../firebase/AuthProvider";
import Login from "./Login";
import Denied from "./Denied";

const allowedEmails = [
  import.meta.env.VITE_OWNER_EMAIL,
  import.meta.env.VITE_PARTNER_EMAIL,
]
  .filter((email): email is string => Boolean(email))
  .map((email) => email.toLowerCase());

export default function AuthGate({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  console.log("[AuthGate] render", {
    loading,
    currentAuthenticatedUser: user,
    uid: user?.uid ?? null,
    email: user?.email ?? null,
    authContextUserIsNull: user === null,
  });

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "grid",
          placeItems: "center",
          fontSize: "22px",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!allowedEmails.includes(user.email?.toLowerCase() ?? "")) {
    return <Denied />;
  }

  return <>{children}</>;
}
