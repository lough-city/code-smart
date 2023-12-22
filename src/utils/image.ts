import path from 'path';
import { httpsGet } from './http';

export const imageUrlToBase64 = async (imageUrl: string) => {
  const imageBase64 = await httpsGet(imageUrl, { isBase64: true });
  const imageType = path.extname(imageUrl).split('&')[0].replaceAll('.', '') || 'png';
  return `data:image/${imageType};base64,${imageBase64}`;
};
