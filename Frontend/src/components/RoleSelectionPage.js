import React from "react";

export default function RoleSelectionPage({ setRole }) {
  return (
    <div className="app-container">
      <div
        className="card"
        style={{ flexDirection: "column", alignItems: "center", gap: "30px" }}
      >
        <h2>Who are you?</h2>
        <div className="button-row">
          <button onClick={() => setRole("student")}>Student</button>
          <button onClick={() => setRole("teacher")}>Teacher</button>
          <button onClick={() => setRole("admin")}>Admin</button>
        </div>
        <img src="/att_image.png" alt="Attendance" className="att-image" />
        <p className="disclaimer">
          ⚡ Make sure to follow the instructions carefully for accurate attendance.
        </p>
      </div>
    </div>
  );
}
