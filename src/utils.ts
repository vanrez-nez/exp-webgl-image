export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(`\u26A0 while loading url:${src}`);
    img.src = src;
  });
}

export function padLeft(str: string, length: number, pad: string) {
  return (pad.repeat(length) + str).slice(-length);
}