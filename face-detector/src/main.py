import base64
import datetime
import hashlib
import io
import time

import cv2
import fastapi
import fastapi.middleware.cors
import insightface
import numpy as np
import onnxruntime

import mytypes


class FaceDetector:
    def __init__(self):
        self.face_analysis = insightface.app.FaceAnalysis(
            allowed_modules=["detection", "genderage", "recognition"]
        )
        self.face_analysis.prepare(ctx_id=0, det_size=(640, 640))

    def detect(self, image):
        height, width = image.shape[:2]
        if width < 640 and height < 640:
            new_image = np.zeros((640, 640, 3), dtype=np.uint8)
            new_image[0:height, 0:width] = image
            image = new_image
        return self.face_analysis.get(image)


def base64_encode_np(array):
    bio = io.BytesIO()
    np.save(bio, array)
    return base64.standard_b64encode(bio.getvalue()).decode("utf-8")


SERVICE = {
    "name": "face-detector",
    "version": "0.1.0",
    "computingDevice": onnxruntime.get_device(),
    "libraries": {
        "cv2": cv2.__version__,
        "insightface": insightface.__version__,
        "onnxruntime": onnxruntime.__version__,
    },
}

app = fastapi.FastAPI()
app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

face_detector = FaceDetector()


@app.get("/", response_model=mytypes.RootResponse)
async def get_root():
    return {
        "service": SERVICE,
        "timeInMilliseconds": int(datetime.datetime.now().timestamp() * 1000),
    }


@app.post("/detect", response_model=mytypes.DetectResponse)
async def post_detect(file: fastapi.UploadFile = fastapi.File(...)):
    image_bin = file.file.read()
    start_time_ns = time.perf_counter_ns()
    sha1_hash = hashlib.sha1(image_bin).hexdigest()
    hash_time_ns = time.perf_counter_ns() - start_time_ns
    file_size = len(image_bin)

    start_time_ns = time.perf_counter_ns()
    if file.content_type == "image/jpeg" or file.content_type == "image/png":
        image_array = np.asarray(bytearray(image_bin), dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    elif file.content_type == "application/octet-stream":
        image_io = io.BytesIO(image_bin)
        image = np.load(image_io)
    else:
        raise fastapi.HTTPException(status_code=415)
    decode_time_ns = time.perf_counter_ns() - start_time_ns

    start_time_ns = time.perf_counter_ns()
    faces = face_detector.detect(image)
    detection_time_ns = time.perf_counter_ns() - start_time_ns

    return {
        "service": SERVICE,
        "timeInMilliseconds": int(datetime.datetime.now().timestamp() * 1000),
        "request": {
            "fileName": file.filename,
            "fileSize": file_size,
            "fileSha1": sha1_hash,
            "imageWidth": image.shape[1],
            "imageHeight": image.shape[0],
        },
        "response": {
            "hashTimeInNanoseconds": hash_time_ns,
            "decodeTimeInNanoseconds": decode_time_ns,
            "detectionTimeInNanoseconds": detection_time_ns,
            "faces": [
                {
                    "score": round(float(face.det_score), 4),
                    "boundingBox": {
                        "x1": round(float(face.bbox[0]), 2),
                        "y1": round(float(face.bbox[1]), 2),
                        "x2": round(float(face.bbox[2]), 2),
                        "y2": round(float(face.bbox[3]), 2),
                    },
                    "keyPoints": [
                        {"x": round(float(xy[0]), 2), "y": round(float(xy[1]), 2)}
                        for xy in face.kps
                    ],
                    "sex": str(face.sex),
                    "age": int(face.age),
                    "embedding": base64_encode_np(face.embedding),
                }
                for face in faces
            ],
        },
    }
