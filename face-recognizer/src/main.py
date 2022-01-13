from typing import List, Optional
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


class Service(pydantic.BaseModel):
    name: str
    version: str


class RootResponse(pydantic.BaseModel):
    service: Service
    timeInMilliseconds: int


class RecognizeRequest(pydantic.BaseModel):
    embedding: str


class ActorName(pydantic.BaseModel):
    ja: Optional[str]
    jaKana: Optional[str]
    en: Optional[str]


class SimilarActor(pydantic.BaseModel):
    similarity: float
    names: List[ActorName]


class RecognizeResponse(pydantic.BaseModel):
    service: Service
    timeInMilliseconds: int
    actors: List[SimilarActor]


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
