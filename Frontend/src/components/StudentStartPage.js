import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
// @ts-ignore
import axios from "axios";

export default function StudentStartPage({ setRole, setStudentMode, mode }) {
  const webcamRef = useRef(null);
  const [name, setName] = useState("");
  const [enrollId, setEnrollId] = useState("");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [folder, setFolder] = useState("");
  const [training, setTraining] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const totalImages = 50;
  const BASE_URL = "http://127.0.0.1:8000";


  const handleCreateFolder = async () => {
    if (!name || !enrollId)
      return setMessage("❌ Enter Name and Enrollment ID");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("enroll_id", enrollId);

      const res = await axios.post(`${BASE_URL}/create_folder`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data.status);
      setFolder(res.data.folder);
    } catch {
      setMessage("❌ Error creating folder");
    }
  };

  const handleCaptureFaces = async (e) => {
    e.preventDefault();
    if (!folder) return setMessage("❌ Please create folder first");
    if (!cameraOpen) return setMessage("❌ Open the camera first");

    setCapturing(true);
    setMessage("📷 Capturing images...");
    setProgress(0);

    for (let i = 0; i < totalImages; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const imageSrc = webcamRef.current.getScreenshot();
      const blob = await (await fetch(imageSrc)).blob();

      const formData = new FormData();
      formData.append("folder", folder);
      formData.append(
        "file",
        new File([blob], `${folder}_${i}.jpg`, { type: "image/jpeg" })
      );

      try {
        await axios.post(`${BASE_URL}/capture_multiple`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setProgress(i + 1);
      } catch {
        setMessage(`❌ Error saving image ${i + 1}`);
        setCapturing(false);
        return;
      }
    }

    setMessage(`✅ ${totalImages} images saved for ${name}`);
    setCapturing(false);
  };

  const handleTrain = async () => {
    setTraining(true);
    setProgress(0);
    try {
      const res = await axios.get(`${BASE_URL}/train`);
      setMessage(res.data.status);
      setProgress(100);
    } catch {
      setMessage("❌ Error training model");
    }
    setTraining(false);
  };

  const capture = useCallback(async () => {
    if (!cameraOpen) return setMessage("❌ Please open the camera first");

    setAttendanceLoading(true);
    setProgress(0);

    const imageSrc = webcamRef.current.getScreenshot();
    const blob = await (await fetch(imageSrc)).blob();

    const formData = new FormData();
    formData.append("file", new File([blob], "capture.jpg", { type: "image/jpeg" }));

    try {
      const res = await axios.post(`${BASE_URL}/recognize`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(
        res.data.status === "success"
          ? `✅ ${res.data.name} marked at ${res.data.time}`
          : "❌ Face not recognized"
      );
      setProgress(100);
    } catch {
      setMessage("❌ Error in recognition");
    }

    setAttendanceLoading(false);
  }, [cameraOpen]);


  const handleExport = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/export`);
      setMessage(res.data.status || "✅ Attendance exported successfully!");
    } catch {
      setMessage("❌ Error exporting attendance");
    }
  };

  return (
    <div className="app-container">
      {message && <p className="top-message">{message}</p>}

      <div className="card">

        <div className="left-column">
          <h2>⚡ Student Panel</h2>

          {mode === "new" ? (
            <form onSubmit={handleCaptureFaces}>
              <div className="input-group">
                <input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  placeholder="Enrollment ID"
                  value={enrollId}
                  onChange={(e) => setEnrollId(e.target.value)}
                  required
                />
              </div>

              {cameraOpen && (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={300}
                  height={200}
                  className="webcam"
                />
              )}

              <div
                className="button-row"
                style={{ display: "flex", gap: "10px", marginTop: "10px" }}
              >
                <button type="button" onClick={handleCreateFolder} disabled={capturing}>
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setCameraOpen(!cameraOpen)}
                  disabled={capturing || training}
                >
                  {cameraOpen ? "Close Camera" : "Open Camera"}
                </button>
                <button type="submit" disabled={!folder || capturing}>
                  {capturing ? `Capturing ${progress}/${totalImages}` : "Capture Faces"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {cameraOpen && (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={300}
                  height={200}
                  className="webcam"
                />
              )}
              <div
                className="button-row"
                style={{ display: "flex", gap: "10px", marginTop: "10px" }}
              >
                <button
                  type="button"
                  onClick={() => setCameraOpen(!cameraOpen)}
                  disabled={attendanceLoading}
                >
                  {cameraOpen ? "Close Camera" : "Open Camera"}
                </button>
                <button
                  type="button"
                  onClick={() => setMessage("✅ Ready for attendance")}
                >
                  Save
                </button>
              </div>
            </>
          )}
        </div>

        <div className="right-column">
          <h2>⚡ Actions</h2>

          {mode === "new" && (
            <button onClick={handleTrain} disabled={training || capturing}>
              {training ? "⏳ Training..." : "Train Model"}
            </button>
          )}

          <button
            onClick={capture}
            disabled={attendanceLoading || capturing || training}
          >
            {attendanceLoading ? "⏳ Marking..." : "Mark Attendance"}
          </button>

          <button onClick={handleExport} disabled={training || capturing}>
            Export Attendance
          </button>

          <button
            type="button"
            onClick={() => {
              setStudentMode(""); 
              setMessage("");     
            }}
          >
            Back
          </button>

        </div>
      </div>
    </div>
  );
}
