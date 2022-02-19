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

function ImageDropzone({ onImageDrop = () => {}, acceptableTypes = [], children = null }) {
  const onDrop = useCallback(async (acceptedFiles) => {
    if ( acceptedFiles.length < 0 ) return;
    if ( acceptableTypes.indexOf(acceptedFiles[0].type) < 0 ) return;
    const imageFile = acceptedFiles[0];
    const imageDataUrl = await loadFile(imageFile);
    onImageDrop({file: imageFile, dataUrl: imageDataUrl});
  }, []);

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
  const [image, setImage] = useState(null);
  const onImageDrop = useCallback((image) => {
    setImage(image);
  });

  return (
    <div className="App">
      <h1>Pornstar Recognizer</h1>
      <h1>Input</h1>
      <div
          style={{
            border: "solid 1px #CCCCCC",
            padding: "5px",
          }}>
        <ImageDropzone
            onImageDrop={onImageDrop}
            acceptableTypes={["image/jpeg"]}>
          {image == null ? (
            <span>ここをクリックするか、JPEG画像をドラッグ＆ドロップしてください。</span>
          ) : (
            <img src={image.dataUrl} />
          )}
        </ImageDropzone>
      </div>
    </div>
  );
}
