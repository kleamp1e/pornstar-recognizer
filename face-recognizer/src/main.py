import datetime

import fastapi
import fastapi.middleware.cors
import pydantic

class Service(pydantic.BaseModel):
    name: str
    version: str

class RootResponse(pydantic.BaseModel):
    service: Service
    timeInMilliseconds: int

SERVICE = {
    "name": "face-recognizer",
    "version": "0.1.0",
}


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
