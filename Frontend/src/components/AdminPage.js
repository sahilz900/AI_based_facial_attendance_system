import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Admin.css";

export default function AdminPage({ setRole }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [studentFilter, setStudentFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");

  useEffect(() => {
    if (loggedIn) fetchData();
  }, [loggedIn]);


  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/admin/login",
        new URLSearchParams({ username, password })
      );
      if (res.data.status === "✅ Login successful") {
        setLoggedIn(true);
        setMessage("");
      } else {
        setMessage("❌ Invalid credentials");
      }
    } catch {
      setMessage("❌ Login failed");
    }
  };

  const fetchData = async () => {
    try {
      const studentsRes = await axios.get("http://127.0.0.1:8000/students");
      const teachersRes = await axios.get("http://127.0.0.1:8000/teachers");
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
      setMessage("");
    } catch {
      setMessage("❌ Error fetching data");
    }
  };

  const handleDeleteStudent = async (enrollId) => {
    if (!enrollId) return setMessage("❌ Invalid Enrollment ID");
    try {
      await axios.delete(
        `http://127.0.0.1:8000/delete_student/${encodeURIComponent(enrollId)}`
      );
      setMessage("✅ Student deleted");
      fetchData();
    } catch {
      setMessage("❌ Error deleting student");
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!teacherId) return setMessage("❌ Invalid Teacher ID");
    try {
      await axios.delete(
        `http://127.0.0.1:8000/delete_teacher/${encodeURIComponent(teacherId)}`
      );
      setMessage("✅ Teacher deleted");
      fetchData();
    } catch {
      setMessage("❌ Error deleting teacher");
    }
  };

  const uniqueStudents = Array.from(
    new Map(students.map((s) => [s.Enrollment_ID, s])).values()
  ).filter((s) =>
    s.Enrollment_ID.toLowerCase().includes(studentFilter.toLowerCase())
  );

  const uniqueTeachers = Array.from(
    new Map(teachers.map((t) => [t.Teacher_ID, t])).values()
  ).filter((t) =>
    t.Teacher_ID.toLowerCase().includes(teacherFilter.toLowerCase())
  );

  if (!loggedIn) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <h2>Admin Login</h2>
          {message && <p className="top-message">{message}</p>}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          <button onClick={handleLogin}>Login</button>
          <button className="back-btn" onClick={() => setRole("")}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {message && <p className="top-message">{message}</p>}
      <div className="admin-card">
        <h2>Admin Panel</h2>
        <div className="button-row">
          <button onClick={() => setMode("student")}>Manage Students</button>
          <button onClick={() => setMode("teacher")}>Manage Teachers</button>
          <button className="back-btn" onClick={() => setLoggedIn(false)}>
            Logout
          </button>
        </div>

        {mode === "student" && (
          <div className="input-group">
            <h3>Student List</h3>
            <input
              type="text"
              placeholder="Filter by Enrollment ID"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="input-group"
            />
            {uniqueStudents.length > 0 ? (
              uniqueStudents.map((s, index) => (
                <div key={index} className="list-item">
                  {s.Enrollment_ID}
                  <button
                    onClick={() => handleDeleteStudent(s.Enrollment_ID)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <p>No students found.</p>
            )}
          </div>
        )}

        {mode === "teacher" && (
          <div className="input-group">
            <h3>Teacher List</h3>
            <input
              type="text"
              placeholder="Filter by Teacher ID"
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="input-group"
            />
            {uniqueTeachers.length > 0 ? (
              uniqueTeachers.map((t, index) => (
                <div key={index} className="list-item">
                  <div>
                    <strong>{t.Name}</strong> - {t.Teacher_ID} - 
                    <span style={{ marginLeft: "10px", color: "green" }}>
                      Password: {t.PIN}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteTeacher(t.Teacher_ID)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <p>No teachers found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
