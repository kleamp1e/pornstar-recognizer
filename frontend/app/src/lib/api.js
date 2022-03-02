export async function detectFace({ backendUrl, imageFile }) {
  const formData = new FormData();
  formData.append("file", imageFile)
  const options = {
    method: "POST",
    body: formData,
  };
  const response = await fetch(`${backendUrl}/detect`, options);
  return await response.json();
}

export async function recognizeFace({ backendUrl, embedding }) {
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
