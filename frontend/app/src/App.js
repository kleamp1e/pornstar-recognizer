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
  const param = {
    method: "POST",
    body: formData,
  };
  const response = await fetch(`${backendUrl}/detect`, param);
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

export default function App() {
  const [backendUrl, setBackendUrl] = useState("http://localhost:8001");
  const [image, setImage] = useState(null);

  const onImageDrop = useCallback(async (image) => {
    setImage(image);

    const detectionResult = await detectFace({ backendUrl, imageFile: image.file });
    console.log({detectionResult});
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
      {image != null && (
        <>
          <h1>Result</h1>
          <img src={image.dataUrl} />
        </>
      )}
    </div>
  );
}
