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