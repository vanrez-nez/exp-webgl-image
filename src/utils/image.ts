import { ceilPowerOfTwo } from './math';

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(`\u26A0 while loading url:${src}`);
    img.src = src;
  });
}

export function getSizeToCover(width: number, height: number, maxWidth: number, maxHeight: number) {
  var ratio = Math.max(maxWidth / width, maxHeight / height);
  return [width * ratio, height * ratio];
}

export function getSizeToContain(width: number, height: number, maxWidth: number, maxHeight: number) {
  var ratio = Math.min(maxWidth / width, maxHeight / height);
  return [width * ratio, height * ratio];
}


// TODO: consider using Offscreen canvas to handle the resize inside workers
// https://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#Non-Power_of_Two_Texture_Support

export function resizeImage(image: HTMLImageElement, maxSize: number, toPowerOfTwo: boolean) {
  const { width: srcW, height: srcH } = image;
  let [dstW, dstH] = [srcW, srcH];

  if (toPowerOfTwo) {
    [dstW, dstH] = [ceilPowerOfTwo(srcW), ceilPowerOfTwo(srcH)];
  }

  if (srcW > maxSize || srcH > maxSize) {
    [dstW, dstH] = getSizeToContain(dstW, dstH, maxSize, maxSize);
    [dstW, dstH] = [Math.floor(dstW), Math.floor(dstH)];
  }

  if (srcW !== dstW || srcH !== dstH) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = dstW;
    canvas.height = dstH;
    context.drawImage(image, 0, 0, dstW, dstH);
    return canvas;
  }

  return image;
}