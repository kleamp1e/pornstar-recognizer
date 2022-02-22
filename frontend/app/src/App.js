import { useState, useCallback } from "react";
import Dropzone from "react-dropzone";

import { detectFace, recognizeFace } from "./lib/api";
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

const colorMap = {
  "M": "#0000CC",
  "F": "#CC0000",
};

function BoundingBoxRect({ boundingBox, ...props }) {
  const { x1, y1, x2, y2 } = boundingBox;
  return (
    <rect
        x={x1}
        y={y1}
        width={x2 - x1}
        height={y2 - y1}
        {...props} />
  );
}

/*
function offsetBoundingBox(boundingBox, offset) {
  const { x1, y1, x2, y2 } = boundingBox;
  return {
    x1: x1 - offset,
    y1: y1 - offset,
    x2: x2 + offset,
    y2: y2 + offset,
  };
}
*/

function BoundingBox({ face, selected, onClick }) {
  const color = colorMap[face.sex];
  const alpha = (selected ? "CC" : "99");
  return (
    <>
      <BoundingBoxRect
          boundingBox={face.boundingBox}
          stroke={"#FFFFFF" + alpha}
          strokeWidth={selected ? 5 : 3}
          fill="none" />
      <BoundingBoxRect
          style={{cursor: "pointer"}}
          boundingBox={face.boundingBox}
          stroke={color + alpha}
          strokeWidth={selected ? 3 : 1}
          fill="#FFFFFF00"
          onClick={onClick} />
    </>
  );
};

function Face({ face, selected, onClick }) {
  return (
    <BoundingBox
        face={face}
        selected={selected}
        onClick={onClick} />
  );
}

function Faces({ faces, selectedFaceIndex, onClick }) {
  return (
    <>
      {faces.map((face, index) => (
        <Face
            key={index}
            face={face}
            selected={index === selectedFaceIndex}
            onClick={() => onClick({ index, face })} />
      ))}
    </>
  );
}

function DetectionResultImage({ imageUrl, imageWidth, imageHeight, faces, selectedFaceIndex, onFaceClick }) {
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
      <Faces
          faces={faces}
          selectedFaceIndex={selectedFaceIndex}
          onClick={onFaceClick} />
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

function chooseFaceIndex(faces) {
  if ( faces.length <= 0 ) return null;
  for ( let index = 0; index < faces.length; index++ ) {
    if ( faces[index].sex == "F" ) {
      return index;
    }
  }
  return null;
}

export default function App() {
  const [backendUrl, setBackendUrl] = useState("http://localhost:8001");

  const [state, setState] = useState(null);

  const [face, setFace] = useState(null);
  const [recognitionResult, setRecognitionResult] = useState(null);

  const selectFace = async (detectionResult, faceIndex) => {
    setState((prev) => ({
      ...prev,
      selectedFaceIndex: faceIndex,
    }));

    const face = detectionResult.response.faces[faceIndex];
    setFace(face);
    console.log({face});
    const { embedding } = face;
    const recognitionResult = await recognizeFace({ backendUrl, embedding });
    console.log({recognitionResult});
    setRecognitionResult(recognitionResult);
  };

  const onImageDrop = useCallback(async (image) => {
    setState({ image });

    const detectionResult = await detectFace({ backendUrl, imageFile: image.file });
    setState((prev) => ({
      ...prev,
      detectionResult,
    }));

    const faceIndex = chooseFaceIndex(detectionResult.response.faces);
    if ( faceIndex != null ) {
      selectFace(detectionResult, faceIndex);
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
      {state != null && state.detectionResult != null && (
        <>
          <h1>Result</h1>
          <div>
            <DetectionResultImage
              imageUrl={state.image.dataUrl}
              imageWidth={state.detectionResult.request.imageWidth}
              imageHeight={state.detectionResult.request.imageHeight}
              faces={state.detectionResult == null ? [] : state.detectionResult.response.faces}
              selectedFaceIndex={state.selectedFaceIndex}
              onFaceClick={({ index, face }) => selectFace(state.detectionResult, index)} />
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
                          imageUrl={state.image.dataUrl}
                          imageWidth={state.detectionResult.request.imageWidth}
                          imageHeight={state.detectionResult.request.imageHeight}
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
