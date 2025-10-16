import React, { useState } from "react";
import RoleSelectionPage from "./components/RoleSelectionPage";
import StudentOptions from "./components/StudentOptions";
import StudentStartPage from "./components/StudentStartPage";
import TeacherPage from "./components/TeacherPage";
import AdminPage from "./components/AdminPage";
import "./App.css";

function App() {
  const [role, setRole] = useState("");
  const [studentMode, setStudentMode] = useState("");

  return (
    <>
      {/* Main Role Selection */}
      {role === "" && <RoleSelectionPage setRole={setRole} />}

      {/* Student Portal */}
      {role === "student" && studentMode === "" && (
        <StudentOptions setRole={setRole} setStudentMode={setStudentMode} />
      )}
      {role === "student" && studentMode === "new" && (
        <StudentStartPage setRole={setRole} setStudentMode={setStudentMode} mode="new" />
      )}
      {role === "student" && studentMode === "existing" && (
        <StudentStartPage setRole={setRole} setStudentMode={setStudentMode} mode="existing" />
      )}

      {/* Teacher Portal */}
      {role === "teacher" && <TeacherPage setRole={setRole} />}

      {/* Admin Portal */}
      {role === "admin" && <AdminPage setRole={setRole} />}
    </>
  );
}

export default App;
