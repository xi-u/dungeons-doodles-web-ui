// Load an image from the given URL and return a Promise that resolves to the Image object.
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the portrait or paper texture."));
    image.src = src;
  });
}

// Export a portrait with the given paper texture.
// The portrait is drawn on top of the paper, and the result is returned as a base64-encoded PNG data URL.
export async function exportPortraitWithPaper(portrait, paperUrl) {
  const [drawing, paper] = await Promise.all([loadImage(portrait), loadImage(paperUrl)]);
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the portrait.");

  // Draw the paper texture centered and cropped to a square, then draw the portrait on top of it.
  const side = Math.min(paper.naturalWidth, paper.naturalHeight);
  context.drawImage(paper, (paper.naturalWidth - side) / 2, (paper.naturalHeight - side) / 2,
    side, side, 0, 0, canvas.width, canvas.height);
  context.drawImage(drawing, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}
