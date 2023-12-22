import { httpsGet } from '../utils/http';

export const getBingTodayImageUrl = async () => {
  const result = await httpsGet('https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN');

  const { url } = JSON.parse(result).images[0];

  return `https://cn.bing.com${url}`;
};
