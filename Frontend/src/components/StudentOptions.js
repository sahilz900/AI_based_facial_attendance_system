import React from "react";

export default function StudentOptions({ setRole, setStudentMode }) {
  return (
    <div className="app-container">
      <div
        className="card"
        style={{
          flexDirection: "column",
          alignItems: "center",
          gap: "15px",
          width: "60%", 
          maxWidth: "700px",
          padding: "30px 20px",
          margin: "auto",
        }}
      >

        <h2
          style={{
            color: "#ff9800",
            textAlign: "center",
            fontFamily: "Poppins, Arial, sans-serif",
            marginBottom: "10px",
          }}
        >
          ⚠️ Note for Students
        </h2>


        <div
          style={{
            width: "90%",
            fontFamily: "Poppins, Arial, sans-serif",
            textAlign: "left",
            fontSize: "15px",
            color: "white",
            lineHeight: "1.7",
            background: "transparent",
          }}
        >
          <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
            <li style={{ marginBottom: "10px" }}>
              If you are using the system for the <b>first time</b>, training your
              face may take up to <b>2 minutes</b>. Please ensure proper lighting
              and keep your face clearly visible to the camera.
            </li>

            <li style={{ marginBottom: "10px" }}>
              As the training gets completed, you’ll be able to mark your attendance instantly whenever you access the portal again.
            </li>

            <li style={{ marginBottom: "10px" }}>
              Once you have marked your attendance, make sure to <b>"Export"</b> your attendance record so that it gets saved properly in an Excel file.
            </li>

            <li>
              If you are already registered, simply click on{" "}
              <b>“Already Registered”</b> to proceed directly with attendance
              marking.
            </li>
          </ul>
        </div>


        <div className="button-row" style={{ gap: "20px", marginTop: "10px" }}>
          <button
            style={{ width: "150px" }}
            onClick={() => setStudentMode("new")}
          >
            New Candidate
          </button>
          <button
            style={{ width: "150px" }}
            onClick={() => setStudentMode("existing")}
          >
            Already Registered
          </button>
        </div>


        <button
          style={{ width: "150px", marginTop: "15px" }}
          onClick={() => setRole("")}
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
