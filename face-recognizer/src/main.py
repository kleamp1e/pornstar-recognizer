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

SERVICE = {
    "name": "face-recognizer",
    "version": "0.1.0",
}

DB_DIR = pathlib.Path(os.environ.get("DB_DIR"))

actor_db = ActorDatabase.load(DB_DIR / "actor.jsonl")
print(len(actor_db.actors))

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
