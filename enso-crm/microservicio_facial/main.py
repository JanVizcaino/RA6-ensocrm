from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
import shutil
import os
import tempfile
import logging
from datetime import datetime, timezone
from pythonjsonlogger import jsonlogger

# Configuración del logger estructurado JSON
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter('%(asctime)s %(name)s %(levelname)s %(message)s')
logHandler.setFormatter(formatter)
logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

app = FastAPI(title="ENSO Facial Service", version="1.0.0")

# Configuración segura de CORS
origins = [
    "https://enso-lite.duckdns.org",
    # "http://localhost:3000",  # Descomentar solo en desarrollo local
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    max_age=3600,
)

@app.get("/")
def root():
    return {
        "service": "ENSO Facial Service",
        "status": "running",
        "version": app.version,
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": app.version
    }

@app.get("/ready")
def ready():
    return {"status": "ready"}

@app.post("/verify")
async def verify(
    img1: UploadFile = File(...),
    img2: UploadFile = File(...)
):
    tmp1 = None
    tmp2 = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as f1:
            shutil.copyfileobj(img1.file, f1)
            tmp1 = f1.name

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as f2:
            shutil.copyfileobj(img2.file, f2)
            tmp2 = f2.name

        result = DeepFace.verify(
            img1_path=tmp1,
            img2_path=tmp2,
            model_name="VGG-Face",
            detector_backend="opencv",
            enforce_detection=True,
            distance_metric="cosine"
        )

        logger.info("Verification completed", extra={
            "endpoint": "/verify",
            "method": "POST",
            "distance": float(result["distance"]),
            "threshold": float(result["threshold"]),
            "verified": result["verified"]
        })

        verified = result["distance"] < 0.5

        return {
            "verified":  verified,
            "distance":  float(result["distance"]),
            "threshold": float(result["threshold"]),
            "model":     result["model"]
        }

    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"No se detectó un rostro válido: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el procesado: {str(e)}")
    finally:
        if tmp1 and os.path.exists(tmp1): os.remove(tmp1)
        if tmp2 and os.path.exists(tmp2): os.remove(tmp2)