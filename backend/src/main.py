from typing import List, Dict, Optional
import base64
import datetime
import hashlib
import io
import json
import os
import pathlib
import time

from pydantic import BaseModel
import cv2
import fastapi
import fastapi.middleware.cors
import insightface
import numpy as np
import onnxruntime
import pydantic


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


class ActorDatabase:
    @classmethod
    def load(cls, jsonl_path):
        with jsonl_path.open("r") as file:
            actors = [json.loads(line) for line in file]
        return cls(actors)

    def __init__(self, actors):
        self.actors = actors

    def __getitem__(self, index):
        return self.actors[index]


class FaceDatabase:
    @classmethod
    def load(cls, npy_path):
        return cls(np.load(npy_path))

    def __init__(self, array):
        self.array = array

    @property
    def id(self):
        return self.array["id"]

    @property
    def embedding(self):
        return self.array["embedding"]

    def compute_similarities(self, query_embedding):
        return np.array(
            [np.dot(query_embedding, embedding) for embedding in self.embedding]
        )


class Service(BaseModel):
    name: str
    version: str
    libraries: Dict[str, str]


class Point2D(BaseModel):
    x: float
    y: float


class RootResponse(BaseModel):
    service: Service
    timeInMilliseconds: int


class DetectResponse(BaseModel):
    class Request(BaseModel):
        fileName: str
        fileSize: int
        fileSha1: str
        imageWidth: int
        imageHeight: int

    class Response(BaseModel):
        class Face(BaseModel):
            class BoundingBox(BaseModel):
                x1: float
                y1: float
                x2: float
                y2: float

            score: float
            boundingBox: BoundingBox
            keyPoints: List[Point2D]
            sex: str
            age: int
            embedding: str

        hashTimeInNanoseconds: int
        decodeTimeInNanoseconds: int
        detectionTimeInNanoseconds: int
        faces: List[Face]

    service: Service
    timeInMilliseconds: int
    request: Request
    response: Response


class RecognizeRequest(pydantic.BaseModel):
    embedding: str


class RecognizeResponse(pydantic.BaseModel):
    class SimilarActor(pydantic.BaseModel):
        class ActorName(pydantic.BaseModel):
            ja: Optional[str]
            jaKana: Optional[str]
            en: Optional[str]

        similarity: float
        names: List[ActorName]

    service: Service
    timeInMilliseconds: int
    actors: List[SimilarActor]


def base64_encode_np(array):
    bio = io.BytesIO()
    np.save(bio, array)
    return base64.standard_b64encode(bio.getvalue()).decode("utf-8")


def base64_decode_np(text):
    bio = io.BytesIO(base64.standard_b64decode(text))
    return np.load(bio)


DB_DIR = pathlib.Path(os.environ.get("DB_DIR"))
SERVICE = {
    "name": "face-detector",
    "version": "0.2.0",
    "libraries": {
        "cv2": cv2.__version__,
        "insightface": insightface.__version__,
        "onnxruntime": onnxruntime.__version__,
    },
}

face_detector = FaceDetector()
actor_db = ActorDatabase.load(DB_DIR / "actor.jsonl")
face_db = FaceDatabase.load(DB_DIR / "actor.npy")

app = fastapi.FastAPI()
app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=RootResponse)
async def get_root():
    return {
        "service": SERVICE,
        "timeInMilliseconds": int(datetime.datetime.now().timestamp() * 1000),
    }


@app.post("/detect", response_model=DetectResponse)
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
                    "embedding": base64_encode_np(face.normed_embedding),
                }
                for face in faces
            ],
        },
    }


@app.post("/recognize", response_model=RecognizeResponse)
async def post_recognize(request: RecognizeRequest):
    embedding = base64_decode_np(request.embedding)
    similarities = face_db.compute_similarities(embedding)

    actor_table = {}
    for index, similarity in enumerate(similarities):
        if similarity < 0.3:
            continue
        actor_id = face_db.id[index]
        actor_similarities = actor_table.get(actor_id, [])
        actor_similarities.append(similarity)
        actor_table[actor_id] = actor_similarities

    actor_list = sorted(actor_table.items(), key=lambda x: max(x[1]), reverse=True)[
        0:10
    ]

    return {
        "service": SERVICE,
        "timeInMilliseconds": int(datetime.datetime.now().timestamp() * 1000),
        "actors": [
            {
                "similarity": max(actor_similarities),
                "names": actor_db[actor_id]["names"],
            }
            for actor_id, actor_similarities in actor_list
        ],
    }
