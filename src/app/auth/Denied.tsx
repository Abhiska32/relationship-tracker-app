export default function Denied() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8f2ed",
        textAlign: "center",
      }}
    >
      <div>
        <h1>💔</h1>

        <h2>This app is private.</h2>

        <p>
          Only invited partners can enter.
        </p>
      </div>
    </div>
  );
}