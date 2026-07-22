import { signInWithGoogle } from "../../firebase/auth";

export default function Login() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f2ed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "white",
          borderRadius: 24,
          padding: 40,
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,.08)",
        }}
      >
        <h1
          style={{
            fontSize: 42,
            marginBottom: 10,
          }}
        >
          ❤️
        </h1>

        <h2
          style={{
            fontSize: 32,
            marginBottom: 12,
          }}
        >
          Our Space
        </h2>

        <p
          style={{
            color: "#666",
            marginBottom: 32,
          }}
        >
          A private place just for us.
        </p>

        <button
          onClick={signInWithGoogle}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            background: "#9b3f67",
            color: "white",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}