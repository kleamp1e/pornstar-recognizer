import { useCallback } from "react";
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

function MyDropzone() {
  const onDrop = useCallback(async (acceptedFiles) => {
    // console.log({acceptedFiles});
    if ( acceptedFiles.length < 0 ) return;
    if ( acceptedFiles[0].type != "image/jpeg" ) return;
    const imageFile = acceptedFiles[0];
    const imageDataUrl = await loadFile(imageFile);
    console.log({imageDataUrl});
  }, []);

  return (
    <Dropzone onDrop={onDrop}>
      {({getRootProps, getInputProps}) => (
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop some files here, or click to select files</p>
        </div>
      )}
    </Dropzone>
  )
}

export default function App() {
  return (
    <div className="App">
      <h1>Pornstar Recognizer</h1>
      <h1>Input</h1>
      <MyDropzone />
    </div>
  );
}
