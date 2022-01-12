from pydantic import BaseModel
from typing import List, Dict


class ServiceResponse(BaseModel):
    name: str
    version: str
    computingDevice: str
    libraries: Dict[str, str]


class RootResponse(BaseModel):
    service: ServiceResponse
    timeInMilliseconds: int


class Point2D(BaseModel):
    x: float
    y: float


class Point3D(BaseModel):
    x: float
    y: float
    z: float


class DetectResponse(BaseModel):
    class Request(BaseModel):
        class File(BaseModel):
            name: str
            size: int
            sha1: str

        file: File

    class Response(BaseModel):
        class Face(BaseModel):
            class BoundingBox(BaseModel):
                x1: float
                y1: float
                x2: float
                y2: float

            class Attributes(BaseModel):
                sex: str
                age: int

            score: float
            boundingBox: BoundingBox
            keyPoints: List[Point2D]
            landmarks3d68: List[Point3D]
            landmarks2d106: List[Point2D]
            attributes: Attributes
            embedding: str

        hashTimeInNanoseconds: int
        decodeTimeInNanoseconds: int
        detectionTimeInNanoseconds: int
        width: int
        height: int
        numberOfFaces: int
        faces: List[Face]

    service: ServiceResponse
    timeInMilliseconds: int
    request: Request
    response: Response


class CompareRequest(BaseModel):
    class Pair(BaseModel):
        index1: int
        index2: int

    embeddings: List[str]
    pairs: List[Pair]


class CompareResponse(BaseModel):
    class Request(BaseModel):
        class Pair(BaseModel):
            index1: int
            index2: int

        embeddings: List[str]
        pairs: List[Pair]

    class Response(BaseModel):
        class Pair(BaseModel):
            index1: int
            index2: int
            similarity: float

        comparisonTimeInNanoseconds: int
        pairs: List[Pair]

    service: ServiceResponse
    timeInMilliseconds: int
    request: Request
    response: Response
