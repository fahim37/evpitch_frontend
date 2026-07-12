// cropImage.ts
export type Area = { x: number; y: number; width: number; height: number };

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function getRadianAngle(degree: number) {
  return (degree * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

/**
 * Returns a high-quality Blob of the cropped image.
 * - outputHeight defaults to 300 (cover banner).
 * - Handles rotation via a temp canvas, then crops, then scales using devicePixelRatio.
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  outputHeight = 300,
  mime: "image/jpeg" | "image/png" = "image/jpeg",
  quality = 0.92
): Promise<Blob> {
  if (!pixelCrop || pixelCrop.width <= 0 || pixelCrop.height <= 0) {
    throw new Error("Invalid crop area");
  }

  const image = await createImage(imageSrc);
  const rad = getRadianAngle(rotation);

  // 1) Draw rotated image to a temp canvas
  const { width: boxW, height: boxH } = rotateSize(
    image.width,
    image.height,
    rotation
  );
  const temp = document.createElement("canvas");
  temp.width = boxW;
  temp.height = boxH;
  const tctx = temp.getContext("2d");
  if (!tctx) throw new Error("Canvas context not available");

  tctx.translate(boxW / 2, boxH / 2);
  tctx.rotate(rad);
  tctx.drawImage(image, -image.width / 2, -image.height / 2);

  // 2) Create output canvas: fixed height, width scaled
  const scale = outputHeight / pixelCrop.height;
  const outW = Math.round(pixelCrop.width * scale);
  const outH = Math.round(outputHeight);

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const out = document.createElement("canvas");
  out.width = Math.round(outW * dpr);
  out.height = Math.round(outH * dpr);
  out.style.width = `${outW}px`;
  out.style.height = `${outH}px`;

  const octx = out.getContext("2d");
  if (!octx) throw new Error("Output canvas context not available");
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
  octx.imageSmoothingQuality = "high";

  // 3) Crop the rotated temp canvas into the output canvas
  octx.drawImage(
    temp,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH
  );

  // 4) Export
  const blob = await new Promise<Blob>((resolve, reject) => {
    out.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to create blob"))),
      mime,
      quality
    );
  });

  return blob;
}
