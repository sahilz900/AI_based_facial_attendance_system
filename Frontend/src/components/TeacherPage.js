import React, { useState } from "react";
import axios from "axios";
import "./Teacher.css";

export default function TeacherPage({ setRole }) {
  const [mode, setMode] = useState("");
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [message, setMessage] = useState("");
  const [attendance, setAttendance] = useState(null);
  const [columns, setColumns] = useState([]);
  const [filterDate, setFilterDate] = useState(""); 
  const [loggedInTeacher, setLoggedInTeacher] = useState(null);

  const handleCreatePin = () => {
    if (!name || !teacherId || !newPin) {
      return setMessage("❌ Enter Name, Teacher ID and PIN");
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("teacher_id", teacherId);
    formData.append("pin", newPin);

    axios.post("http://127.0.0.1:8000/teacher/create", formData)
      .then(res => setMessage(res.data.status))
      .catch(() => setMessage("❌ Error creating PIN"));

    setNewPin("");
  };

  const fetchAttendance = (date = "") => {
    if (!loggedInTeacher) return;

    const formData = new FormData();
    formData.append("teacher_id", loggedInTeacher);
    formData.append("date", date);

    axios.post("http://127.0.0.1:8000/teacher/attendance", formData)
      .then(res => {
        setMessage(res.data.status);
        if (res.data.attendance) {
          setAttendance(res.data.attendance);
          setColumns(res.data.columns);
        } else {
          setAttendance(null);
          setColumns([]);
        }
      })
      .catch(() => setMessage("❌ Error fetching attendance"));
  };

  const handleLogin = () => {
    if (!teacherId || !pin) return setMessage("❌ Enter Teacher ID and PIN");

    const formData = new FormData();
    formData.append("teacher_id", teacherId);
    formData.append("pin", pin);

    axios.post("http://127.0.0.1:8000/teacher/login", formData)
      .then(res => {
        if (res.data.status.startsWith("✅")) {
          setMessage(res.data.status);
          setLoggedInTeacher(res.data.teacher_id);
          fetchAttendance();
        } else {
          setMessage(res.data.status);
        }
      })
      .catch(() => setMessage("❌ Error logging in"));
  };

  const handleFilterAttendance = () => {
    if (!filterDate) return setMessage("❌ Please select a date");
    fetchAttendance(filterDate);
  };

  return (
    <div className="teacher-container">
      {message && <p className="top-message">{message}</p>}

      {!mode && !loggedInTeacher && (
        <div className="teacher-card">
          <h2>Teacher Panel</h2>
          <div className="button-row">
            <button onClick={() => setMode("create")}>Create PIN</button>
            <button onClick={() => setMode("login")}>Login with PIN</button>
          </div>
          <button className="back-btn" onClick={() => setRole("")}>Back to Menu</button>
        </div>
      )}

      {mode === "create" && (
        <div className="teacher-card">
          <h2>Create PIN</h2>
          <div className="input-group">
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              placeholder="Teacher ID"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            />
            <input
              placeholder="Create PIN"
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
            />
            <button onClick={handleCreatePin}>Save PIN</button>
            <button className="back-btn" onClick={() => setMode("")}>Back</button>
          </div>
        </div>
      )}

      {mode === "login" && !loggedInTeacher && (
        <div className="teacher-card">
          <h2>Login with PIN</h2>
          <div className="input-group">
            <input
              placeholder="Teacher ID"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            />
            <input
              placeholder="Enter PIN"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
            <button className="back-btn" onClick={() => setMode("")}>Back</button>
          </div>
        </div>
      )}

      {loggedInTeacher && (
        <div className="teacher-card">
          <h2>Attendance Panel</h2>

          <div className="input-group">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <button onClick={handleFilterAttendance}>Filter Attendance</button>
            <button className="back-btn" onClick={() => {
              setLoggedInTeacher(null);
              setAttendance(null);
              setColumns([]);
              setMode("");
              setMessage("");
            }}>Logout</button>
          </div>

          {attendance && (
            <div className="excel-preview">
              <h3>Attendance Data</h3>
              <table>
                <thead>
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((row, idx) => (
                    <tr key={idx}>
                      {columns.map((col, cidx) => (
                        <td key={cidx}>{row[col] || ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
