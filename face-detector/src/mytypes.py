from pydantic import BaseModel
from typing import List, Dict


class Service(BaseModel):
    name: str
    version: str
    computingDevice: str
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
