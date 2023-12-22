import https from 'https';

export const httpsGet = (url: string, options: { isBase64?: boolean } = {}) => {
  const { isBase64 } = options;
  let resolve: (value: string) => void;
  let reject: (reason?: any) => void;
  const promise = new Promise<string>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  https
    .get(url, res => {
      const chunkList: Array<any> = [];
      let size = 0;

      res.on('data', (chunk: string) => {
        chunkList.push(chunk);
        size += chunk.length;
      });

      res.on('end', () => {
        resolve(isBase64 ? Buffer.concat(chunkList, size).toString('base64') : chunkList.join());
      });
    })
    .on('error', e => {
      reject(e);
    });

  return promise;
};
