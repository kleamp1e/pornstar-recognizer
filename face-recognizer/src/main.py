import base64
import datetime
import io
import json
import os
import pathlib

import fastapi
import fastapi.middleware.cors
import numpy as np
import pydantic


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


class Service(pydantic.BaseModel):
    name: str
    version: str


class RootResponse(pydantic.BaseModel):
    service: Service
    timeInMilliseconds: int


class RecognizeRequest(pydantic.BaseModel):
    embedding: str


class RecognizeResponse(pydantic.BaseModel):
    service: Service
    timeInMilliseconds: int


def base64_decode_np(text):
    bio = io.BytesIO(base64.standard_b64decode(text))
    return np.load(bio)


DB_DIR = pathlib.Path(os.environ.get("DB_DIR"))
SERVICE = {
    "name": "face-recognizer",
    "version": "0.1.0",
}


actor_db = ActorDatabase.load(DB_DIR / "actor.jsonl")
face_db = FaceDatabase.load(DB_DIR / "actor.npy")

embedding = face_db.array["embedding"]
embedding = embedding / np.linalg.norm(embedding, axis=1).reshape((-1, 1))

f1 = embedding[0]
f2 = embedding[1]
f3 = embedding[-1]
print(np.linalg.norm(f1))
print(np.linalg.norm(f2))
print(np.dot(f1, f1))
print(np.dot(f1, f2))
print(np.dot(f1, f3))
# print(embedding / np.linalg.norm(embedding, axis=1).reshape((-1, 1)))

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


@app.post("/recognize", response_model=RecognizeResponse)
async def post_recognize(request: RecognizeRequest):
    embedding = base64_decode_np(request.embedding)
    print(embedding)
    return {
        "service": SERVICE,
        "timeInMilliseconds": int(datetime.datetime.now().timestamp() * 1000),
    }
