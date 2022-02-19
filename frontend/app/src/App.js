import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import "./App.css";

function MyDropzone() {
  const onDrop = useCallback((acceptedFiles) => {
    // Do something with the files
    console.log({acceptedFiles});
  }, [])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({ onDrop });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Drop the files here ...</p> :
          <p>Drag "n" drop some files here, or click to select files</p>
      }
    </div>
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
