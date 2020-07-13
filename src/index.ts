import { ImageEffect } from './effect';

import img_1 from '../assets/test_1.jpg';
import img_2 from '../assets/test_2.jpg';
import img_3 from '../assets/test_3.jpg';
import img_4 from '../assets/test_4.jpg';
import img_5 from '../assets/test_5.jpg';
import img_6 from '../assets/test_6.jpg';
import img_7 from '../assets/test_7.jpg';
import img_8 from '../assets/test_8.jpg';
import img_9 from '../assets/test_9.jpg';
import img_10 from '../assets/test_10.jpg';
import img_11 from '../assets/test_11.jpg';
import img_12 from '../assets/test_12.jpg';
import img_13 from '../assets/test_13.jpg';
import img_14 from '../assets/test_14.jpg';
import img_15 from '../assets/test_15.jpg';
import img_16 from '../assets/test_16.jpg';
import img_17 from '../assets/test_17.jpg';
import img_18 from '../assets/test_18.jpg';
import img_19 from '../assets/test_19.jpg';
import img_20 from '../assets/test_20.jpg';
import img_21 from '../assets/test_21.jpg';

const apps = [];


async function preloadAll(list: string[]) {
  const promises = [];
  list.forEach(src => {
    const p = new Promise(resolve => {
      const img = new Image();
      img.onload = resolve;
      img.src = src;
    });
    promises.push(p);
  });
  await Promise.all(promises);
}

async function initDemo(list: string[]) {
  await preloadAll(list);
  list.forEach(src => {
    const img = document.createElement('div');
    img.classList.add('image');
    const span = document.createElement('span');
    span.style.backgroundImage = `url(${src})`;
    img.setAttribute('data-image', src);
    img.appendChild(span);
    document.body.appendChild(img);
  });
  const effect = new ImageEffect('.image');
}

initDemo([
  img_2,
  img_1,
  img_3,
  img_4,
  img_5,
  img_6,
  img_7,
  img_8,
  img_9,
  img_10,
  img_11,
  img_12,
  img_13,
  img_14,
  img_15,
  img_16,
  img_17,
  img_18,
  img_19,
  img_20,
  img_21,
]);