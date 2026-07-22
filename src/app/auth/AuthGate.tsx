import { ReactNode } from "react";
import { useAuth } from "../../firebase/AuthProvider";
import Login from "./Login";
import Denied from "./Denied";

const allowedEmails = [
  import.meta.env.VITE_OWNER_EMAIL,
  import.meta.env.VITE_PARTNER_EMAIL,
];

export default function AuthGate({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

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

  if (!allowedEmails.includes(user.email ?? "")) {
    return <Denied />;
  }

  return <>{children}</>;
}