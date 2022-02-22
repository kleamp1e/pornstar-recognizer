import { useCallback } from "react";
import Dropzone from "react-dropzone";

function loadFile(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      resolve(fileReader.result);
    }, false);
    fileReader.readAsDataURL(file);
  });
}

function getImageSize(url) {
  return new Promise((resolve, reject) => {
    var image = new Image() ;
    image.addEventListener("load", () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    }, false);
    image.src = url;
  });
}

export default function ImageDropzone({ onImageDrop = () => {}, acceptableTypes = [], children = null }) {
  const onDrop = useCallback(async (acceptedFiles) => {
    if ( acceptedFiles.length < 0 ) return;
    if ( acceptableTypes.indexOf(acceptedFiles[0].type) < 0 ) return;
    const file = acceptedFiles[0];
    const dataUrl = await loadFile(file);
    const { width, height } = await getImageSize(dataUrl);
    onImageDrop({ file, dataUrl, width, height });
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
