from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import os
import pickle
import cv2
import pandas as pd
from deepface import DeepFace
from datetime import datetime
import numpy as np
import re
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------- Paths / Files -------------------
BASE_DIR = os.path.join(os.getcwd(), "images")
os.makedirs(BASE_DIR, exist_ok=True)

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
TEACHER_FILE = os.path.join(BASE_PATH, "teacher_record.csv")
STUDENT_FILE = os.path.join(BASE_PATH, "attendance_report.csv")
ENROLLMENTS_XLSX = os.path.join(BASE_PATH, "enrollment_data.xlsx")
ATTENDANCE_XLSX = os.path.join(BASE_PATH, "attendance.xlsx")
MODELS_DIR = os.path.join(BASE_PATH, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

ADMIN_FILE = os.path.join(BASE_PATH, "admins.csv")

def safe_folder_name_for(name: str, enroll_id: str) -> str:
    first_name = name.strip().split()[0].lower()
    parts = re.split(r"[/\-\s]", enroll_id.strip())
    parts = [p.lower() for p in parts if p]
    safe = "_".join([first_name] + parts)
    safe = re.sub(r"[^a-z0-9_]", "", safe)
    return safe

def ensure_teacher_file():
    if not os.path.exists(TEACHER_FILE):
        pd.DataFrame([{"id": 1, "Teacher_ID": "T001", "Name": "Demo", "PIN": "1234"}]).to_csv(TEACHER_FILE, index=False)

def ensure_student_file():
    if not os.path.exists(STUDENT_FILE):
        pd.DataFrame(columns=["id", "Name", "Enrollment_ID", "Date", "Time"]).to_csv(STUDENT_FILE, index=False)

def read_teacher_df():
    ensure_teacher_file()
    df = pd.read_csv(TEACHER_FILE, dtype=str).fillna("")
    df = df[["id", "Teacher_ID", "Name", "PIN"]]
    return df

def read_student_df():
    ensure_student_file()
    df = pd.read_csv(STUDENT_FILE, dtype=str).fillna("")
    if "id" not in df.columns:
        df.insert(0, "id", range(1, len(df) + 1))
    return df

# ------------------- Admin Login -------------------
@app.post("/admin/login")
def admin_login(username: str = Form(...), password: str = Form(...)):
    if not os.path.exists(ADMIN_FILE):
        return {"status": "❌ Admin file not found"}

    df = pd.read_csv(ADMIN_FILE, dtype=str).fillna("")
    match = df[(df["username"] == username) & (df["password"] == password)]
    if not match.empty:
        return {"status": "✅ Login successful"}
    return {"status": "❌ Invalid credentials"}

# ------------------- Students / Teachers list -------------------
@app.get("/students")
def get_students():
    df = read_student_df()
    return df.to_dict(orient="records") if not df.empty else []

@app.get("/teachers")
def get_teachers():
    df = read_teacher_df()
    return df.to_dict(orient="records") if not df.empty else []

# ------------------- Teacher management -------------------
@app.post("/teacher/create")
def create_teacher(teacher_id: str = Form(...), name: str = Form(...), pin: str = Form(...)):
    df = read_teacher_df()
    new_id = int(df["id"].astype(int).max()) + 1 if not df.empty else 1
    new_row = {"id": new_id, "Teacher_ID": teacher_id, "Name": name, "PIN": pin}
    df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
    df.to_csv(TEACHER_FILE, index=False)
    return {"status": "✅ Teacher created successfully!"}

@app.post("/teacher/login")
def teacher_login(teacher_id: str = Form(...), pin: str = Form(...)):
    df = read_teacher_df()
    teacher = df[(df["Teacher_ID"] == teacher_id) & (df["PIN"] == pin)]
    if teacher.empty:
        return {"status": "❌ Invalid ID or PIN"}
    return {"status": f"✅ Welcome {teacher.iloc[0]['Name']}!", "teacher_id": teacher_id}

@app.delete("/delete_teacher/{teacher_id}")
def delete_teacher(teacher_id: str):
    df = read_teacher_df()
    df = df[df["Teacher_ID"] != teacher_id]
    df.to_csv(TEACHER_FILE, index=False)
    return {"status": "✅ Teacher deleted"}

@app.put("/update_teacher/{id}")
def update_teacher(id: int, name: str = Form(...), teacherId: str = Form(...), pin: str = Form(...)):
    df = read_teacher_df()
    if id in df["id"].astype(int).values:
        df.loc[df["id"].astype(int) == id, ["Name", "Teacher_ID", "PIN"]] = [name, teacherId, pin]
        df.to_csv(TEACHER_FILE, index=False)
        return {"status": "✅ Teacher updated"}
    return {"status": "❌ Teacher not found"}

# ------------------- Student management -------------------
@app.delete("/delete_student/{enroll_id}")
def delete_student(enroll_id: str):
    df = read_student_df()
    df = df[df["Enrollment_ID"] != enroll_id]
    df.to_csv(STUDENT_FILE, index=False)
    return {"message": "✅ Student deleted successfully"}

@app.put("/update_student/{id}")
def update_student(id: int, name: str = Form(...), enrollId: str = Form(...)):
    df = read_student_df()
    if id in df["id"].astype(int).values:
        df.loc[df["id"].astype(int) == id, ["Name", "Enrollment_ID"]] = [name, enrollId]
        df.to_csv(STUDENT_FILE, index=False)
        return {"status": "✅ Student updated"}
    return {"status": "❌ Student not found"}

# ------------------- Create folder (Student registration) -------------------
@app.post("/create_folder")
def create_folder(name: str = Form(...), enroll_id: str = Form(...)):
    safe_folder = safe_folder_name_for(name, enroll_id)
    folder_path = os.path.join(BASE_DIR, safe_folder)
    os.makedirs(folder_path, exist_ok=True)

    if os.path.exists(ENROLLMENTS_XLSX):
        df = pd.read_excel(ENROLLMENTS_XLSX, dtype=str)
    else:
        df = pd.DataFrame(columns=["Enrollment_ID", "Name"])

    if not ((df["Name"] == name) & (df["Enrollment_ID"] == enroll_id)).any():
        df = pd.concat([df, pd.DataFrame([[enroll_id, name]], columns=["Enrollment_ID", "Name"])], ignore_index=True)
        df.to_excel(ENROLLMENTS_XLSX, index=False)

    return {"status": f"✅ Folder created: {safe_folder}", "folder": safe_folder}

# ------------------- Capture multiple images -------------------
@app.post("/capture_multiple")
async def capture_multiple(folder: str = Form(...), file: UploadFile = File(...)):
    folder_path = os.path.join(BASE_DIR, folder)
    os.makedirs(folder_path, exist_ok=True)
    img_path = os.path.join(folder_path, file.filename)
    contents = await file.read()
    with open(img_path, "wb") as f:
        f.write(contents)
    return {"status": f"✅ Image saved: {file.filename}"}

# ------------------- Train & Recognize Face -------------------
@app.get("/train")
def train_model():
    known_encodings = []
    known_names = []

    for person_folder in os.listdir(BASE_DIR):
        person_path = os.path.join(BASE_DIR, person_folder)
        if os.path.isdir(person_path):
            for filename in os.listdir(person_path):
                if filename.lower().endswith((".jpg", ".jpeg", ".png")):
                    img_path = os.path.join(person_path, filename)
                    try:
                        rep = DeepFace.represent(img_path, model_name="VGG-Face", enforce_detection=True)
                        if isinstance(rep, list) and len(rep) > 0:
                            if isinstance(rep[0], dict) and "embedding" in rep[0]:
                                emb = np.array(rep[0]["embedding"])
                            else:
                                emb = np.array(rep).flatten()
                            known_encodings.append(emb)
                            known_names.append(person_folder)
                    except Exception as e:
                        print(f"Skipping {img_path}: {e}")

    if known_encodings:
        data = {"encodings": known_encodings, "names": known_names}
        with open(os.path.join(MODELS_DIR, "face_encodings.pickle"), "wb") as f:
            pickle.dump(data, f)
        return {"status": "✅ Model trained successfully!"}
    else:
        return {"status": "❌ No valid images found. Training failed."}

@app.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    enc_path = os.path.join(MODELS_DIR, "face_encodings.pickle")
    if not os.path.exists(enc_path):
        return {"status": "❌ Model not trained"}

    data = pickle.load(open(enc_path, "rb"))
    known_encodings = [np.array(e) for e in data.get("encodings", [])]
    known_names = data.get("names", [])

    contents = await file.read()
    temp_path = os.path.join(BASE_DIR, file.filename)
    with open(temp_path, "wb") as f:
        f.write(contents)

    try:
        rep = DeepFace.represent(temp_path, model_name="VGG-Face", enforce_detection=False)
        if isinstance(rep, list) and len(rep) > 0:
            test_enc = np.array(rep[0]["embedding"]) if isinstance(rep[0], dict) else np.array(rep).flatten()
        else:
            return {"status": "❌ Could not extract embedding"}

        best_match = "Unknown"
        min_dist = float("inf")
        for known_enc, name in zip(known_encodings, known_names):
            dist = np.linalg.norm(test_enc - known_enc)
            if dist < min_dist and dist < 0.9:
                min_dist = dist
                best_match = name

        if best_match != "Unknown":
            now = datetime.now()
            date_str = now.strftime("%Y-%m-%d")
            time_str = now.strftime("%H:%M:%S")

            df = read_student_df()
            new_id = int(df["id"].astype(int).max()) + 1 if not df.empty else 1
            df = pd.concat([df, pd.DataFrame([[new_id, best_match, best_match, date_str, time_str]], 
                        columns=["id","Name","Enrollment_ID","Date","Time"])], ignore_index=True)
            df.to_csv(STUDENT_FILE, index=False)

            return {"status": "success", "name": best_match, "time": time_str}

        else:
            return {"status": "❌ Face not recognized"}

    except Exception as e:
        return {"status": f"❌ Recognition failed: {str(e)}"}

# ------------------- Export attendance -------------------
@app.get("/export")
def export_attendance():
    if not os.path.exists(STUDENT_FILE):
        return {"status": "❌ No attendance recorded yet"}
    
    return FileResponse(
        STUDENT_FILE,
        filename="attendance_report.csv",
        media_type="text/csv"
    )

# ------------------- Teacher Attendance View -------------------
@app.post("/teacher/attendance")
def teacher_attendance(teacher_id: str = Form(...), date: Optional[str] = Form("")):
    if not os.path.exists(STUDENT_FILE):
        return {"status": "❌ Attendance file not found", "attendance": [], "columns": []}

    df = pd.read_csv(STUDENT_FILE, dtype=str).fillna("")
    if date:
        df = df[df["Date"] == date]

    if df.empty:
        return {"status": "✅ No attendance found for selected date", "attendance": [], "columns": ["Name","Enrollment_ID","Date","Time"]}

    df["Time"] = pd.to_datetime(df["Time"], format="%H:%M:%S", errors="coerce")
    df_sorted = df.sort_values(["Date", "Enrollment_ID", "Time"])
    df_earliest = df_sorted.groupby(["Date", "Enrollment_ID"], as_index=False).first()


    df_earliest["Time"] = df_earliest["Time"].dt.strftime("%H:%M:%S")

    attendance_list = df_earliest[["Name", "Enrollment_ID", "Date", "Time"]].to_dict(orient="records")
    columns = ["Name", "Enrollment_ID", "Date", "Time"]

    return {"status": "✅ Attendance fetched successfully", "attendance": attendance_list, "columns": columns}
