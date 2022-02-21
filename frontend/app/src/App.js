import { useState, useCallback } from "react";
import Dropzone from "react-dropzone";

import "./App.css";

function loadFile(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      resolve(fileReader.result);
    }, false);
    fileReader.readAsDataURL(file);
  });
}

async function detectFace({ backendUrl, imageFile }) {
  const formData = new FormData();
  formData.append("file", imageFile)
  const options = {
    method: "POST",
    body: formData,
  };
  const response = await fetch(`${backendUrl}/detect`, options);
  return await response.json();
}

async function recognizeFace({ backendUrl, embedding }) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      embedding,
    }),
  };
  const response = await fetch(`${backendUrl}/recognize`, options);
  return await response.json();
}

function ImageDropzone({ onImageDrop = () => {}, acceptableTypes = [], children = null }) {
  const onDrop = useCallback(async (acceptedFiles) => {
    if ( acceptedFiles.length < 0 ) return;
    if ( acceptableTypes.indexOf(acceptedFiles[0].type) < 0 ) return;
    const imageFile = acceptedFiles[0];
    const imageDataUrl = await loadFile(imageFile);
    onImageDrop({file: imageFile, dataUrl: imageDataUrl});
  }, [onImageDrop]);

  return (
    <Dropzone onDrop={onDrop}>
      {({getRootProps, getInputProps}) => (
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          {children}
        </div>
      )}
    </Dropzone>
  );
}

function BoundingBox({ face }) {
  const { x1, y1, x2, y2 } = face.boundingBox;
  return (
    <rect
        x={x1}
        y={y1}
        width={x2 - x1}
        height={y2 - y1}
        stroke="red"
        fill="none" />
  );
};

function Face({ face }) {
  return (
    <g>
      <BoundingBox
          face={face} />
    </g>
  );
}

function Faces({ faces }) {
  return (
    <g>
      {faces.map((face, index) => (
        <Face
            key={index}
            face={face} />
      ))}
    </g>
  );
}

function DetectionResultImage({ imageUrl, imageWidth, imageHeight, faces }) {
  return (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox={`0 0 ${imageWidth} ${imageHeight}`}
        width={imageWidth}
        height={imageHeight}>
      <image
          x={0}
          y={0}
          width={imageWidth}
          height={imageHeight}
          href={imageUrl} />
      <Faces faces={faces} />
    </svg>
  );
}

function FaceImage({ imageUrl, imageWidth, imageHeight, face, faceWidth = 200, faceHeight = 200 }) {
  const { x1, y1, x2, y2 } = face.boundingBox;
  return (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox={`${x1} ${y1} ${x2 - x1} ${y2 - y1}`}
        width={faceWidth}
        height={faceHeight}>
      <image
          x={0}
          y={0}
          width={imageWidth}
          height={imageHeight}
          href={imageUrl} />
    </svg>
  );
}
export default function App() {
  const [backendUrl, setBackendUrl] = useState("http://localhost:8001");
  const [image, setImage] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [face, setFace] = useState(null);
  const [recognitionResult, setRecognitionResult] = useState(null);

  const onImageDrop = useCallback(async (image) => {
    setImage(image);

    const detectionResult = await detectFace({ backendUrl, imageFile: image.file });
    console.log({detectionResult});
    setDetectionResult(detectionResult);

    if ( detectionResult.response.faces.length > 0 ) {
      const face = detectionResult.response.faces[1];
      setFace(face);
      console.log({face});
      const { embedding } = face;
      const recognitionResult = await recognizeFace({ backendUrl, embedding });
      console.log({recognitionResult});
      setRecognitionResult(recognitionResult);
    }
  }, [backendUrl]);

  return (
    <div className="App">
      <h1>Pornstar Recognizer</h1>
      <h1>Settings</h1>
      <label>
        Backend URL:{" "}
        <input
            type="text"
            size={50}
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)} />
      </label>
      <h1>Input</h1>
      <div
          style={{
            cursor: "pointer",
            border: "solid 1px #CCCCCC",
            padding: "5px",
            width: "400px",
          }}>
        <ImageDropzone
            onImageDrop={onImageDrop}
            acceptableTypes={["image/jpeg"]}>
          <span>ここをクリックするか、JPEG画像をドラッグ＆ドロップしてください。</span>
        </ImageDropzone>
      </div>
      {image != null && detectionResult != null && (
        <>
          <h1>Result</h1>
          <div>
            <DetectionResultImage
              imageUrl={image.dataUrl}
              imageWidth={detectionResult.request.imageWidth}
              imageHeight={detectionResult.request.imageHeight}
              faces={detectionResult == null ? [] : detectionResult.response.faces} />
          </div>
          {face != null && (
            <div>
            </div>
          )}
          {recognitionResult != null && (
            <table>
              <tbody>
                {recognitionResult.actors.map((actor, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <FaceImage
                          imageUrl={image.dataUrl}
                          imageWidth={detectionResult.request.imageWidth}
                          imageHeight={detectionResult.request.imageHeight}
                          face={face}
                          faceWidth={125}
                          faceHeight={125} />
                    </td>
                    <td>
                      <img
                        src={actor.fanza.faceImage.url}
                        width={125}
                        height={125} />
                    </td>
                    <td>{actor.similarity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
