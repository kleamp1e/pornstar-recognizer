import base64
import io
import os
import pathlib

import fastapi
import fastapi.middleware.cors
import insightface
import numpy as np
import PIL.Image

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

app = fastapi.FastAPI()
app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

face_detector = FaceDetector()

@app.get("/")
async def get_root():
    return {}
