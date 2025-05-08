from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import base64
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Adiciona o middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Carrega o classificador de rosto do OpenCV
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    # Lê a imagem enviada
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Detecta rostos
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    recognized = len(faces) > 0

    if recognized:
        # Pega o primeiro rosto detectado
        x, y, w, h = faces[0]
        face_img = img[y:y+h, x:x+w]
        # Codifica o rosto recortado para base64
        _, buffer = cv2.imencode('.jpg', face_img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
    else:
        img_base64 = ""

    return JSONResponse(content={
        "recognized": recognized,
        "image": img_base64
    })