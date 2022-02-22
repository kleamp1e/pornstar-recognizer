const colorMap = {
  "M": "#0000CC",
  "F": "#CC0000",
};

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

export default function FaceDetectionImage({ imageUrl, imageWidth, imageHeight, faces, selectedFaceIndex, onFaceClick }) {
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
