import { useState, useCallback, useEffect } from "react";

import "./App.css";
import { detectFace, recognizeFace } from "./lib/api";
import FaceCroppedImage from "./component/FaceCroppedImage";
import FaceDetectionImage from "./component/FaceDetectionImage";
import ImageDropzone from "./component/ImageDropzone";

function chooseFaceIndex(faces) {
  if ( faces.length <= 0 ) return null;
  for ( let index = 0; index < faces.length; index++ ) {
    if ( faces[index].sex == "F" ) {
      return index;
    }
  }
  return null;
}

function splitActorNames(names) {
  const result = [];
  const types = ["ja", "jaKana", "en"];
  for ( let name of names ) {
    for ( let type of types ) {
      if ( type in name && name[type] != null ) {
        result.push({name: name[type], type});
      }
    }
  }
  return result;
}

function ActorNames({ names }) {
  const [firstName, ...restNames] = splitActorNames(names);
  return (
    <div className="actor-names">
      <span className="main-name">{firstName.name}</span>
      {restNames.length >= 1 && (
        <ul className="other-name-list">
          {restNames.map(({ name }) => (
            <li className="other-name">{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Similarity({ similarity }) {
  return (
    <div className="similarity">
      {(Math.max(0.0, Math.min(1.0, similarity)) * 100).toFixed(1)}%
    </div>
  );
}

function ActorTable({ image, recognition }) {
  return (
    <table className="actors">
      <thead>
        <tr>
          <th>No</th>
          <th>選択された顔</th>
          <th>類似する顔</th>
          <th>類似度</th>
          <th>情報</th>
        </tr>
      </thead>
      <tbody>
        {recognition.recognitions[recognition.selectedFaceIndex].actors.length <= 0 ? (
          <tr><td colSpan={5}>類似する女優が見つかりませんでした</td></tr>
        ) : (
          recognition.recognitions[recognition.selectedFaceIndex].actors.map((actor, index) => (
            <tr key={index} className={index % 2 == 0 ? "even" : "odd"}>
              <td className="number">{index + 1}</td>
              <td>
                <FaceCroppedImage
                    imageUrl={image.dataUrl}
                    imageWidth={image.width}
                    imageHeight={image.height}
                    face={recognition.faces[recognition.selectedFaceIndex]}
                    faceWidth={100}
                    faceHeight={100} />
              </td>
              <td>
                <img
                    src={actor.fanza.faceImage.url}
                    width={100}
                    height={100} />
              </td>
              <td><Similarity similarity={actor.similarity} /></td>
              <td><ActorNames names={actor.names} /></td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default function App() {
  const [backendUrl, setBackendUrl] = useState("http://localhost:8001");
  const [image, setImage] = useState(null);
  const [detection, setDetection] = useState({image: null});
  const [recognition, setRecognition] = useState({image: null});

  const onImageDrop = useCallback(async (image) => {
    setImage({
      ...image,
      settings: {
        backendUrl,
      },
    });
  }, [backendUrl]);

  const selectFace = useCallback(async (faceIndex) => {
    setRecognition((prev) => {
      let state = {
        ...prev,
        selectedFaceIndex: faceIndex,
      };
      if ( state.recognitions[faceIndex] == null ) {
        const { backendUrl } = state.image.settings;
        const { embedding } = state.faces[faceIndex];
        setTimeout(async () => {
          const recognitionResult = await recognizeFace({ backendUrl, embedding });
          setRecognition((prev) => {
            const state = {...prev}
            state.recognitions = [...prev.recognitions];
            state.recognitions[faceIndex] = recognitionResult;
            return state;
          });
        }, 100);
      }
      return state;
    });
  }, []);

  useEffect(async () => {
    if ( image == null ) return;
    if ( image == detection.image ) return;

    const detectionResult = await detectFace({ backendUrl: image.settings.backendUrl, imageFile: image.file });
    setDetection({
      image,
      faces: detectionResult.response.faces,
    });
  }, [image]);

  useEffect(() => {
    if ( detection.image == null ) return;
    if ( detection.image == recognition.image ) return;

    const selectedFaceIndex = chooseFaceIndex(detection.faces);
    setRecognition({
      ...detection,
      selectedFaceIndex,
      recognitions: [],
    });
    if ( selectedFaceIndex != null ) {
      selectFace(selectedFaceIndex);
    }
  }, [detection]);

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
      {image != null && (
        <>
          <h1>Result</h1>
          <div>
            <FaceDetectionImage
                imageUrl={image.dataUrl}
                imageWidth={image.width}
                imageHeight={image.height}
                faces={detection.image == image ? detection.faces : []}
                selectedFaceIndex={recognition.image == image ? recognition.selectedFaceIndex : null}
                onFaceClick={({ index, face }) => selectFace(index)} />
          </div>
          {recognition.image == image && (
            recognition.recognitions[recognition.selectedFaceIndex] == null ? (
              <div>検索中...</div>
            ) : (
              <ActorTable
                  image={image}
                  recognition={recognition} />
            )
          )}
        </>
      )}
    </div>
  );
}
