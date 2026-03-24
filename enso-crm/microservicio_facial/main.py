from fastapi import FastAPI, File, UploadFile, HTTPException
from deepface import DeepFace
import shutil
import os
import tempfile

app = FastAPI(title="ENSO Facial Service")

@app.get("/health")
def health():
    return {"status": "ok"}

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

        # Log para debug
        print(f"Distance: {result['distance']}, Threshold: {result['threshold']}, Verified: {result['verified']}")

        # Threshold más permisivo para entorno de desarrollo
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