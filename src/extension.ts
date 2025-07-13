import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import { MIXIN_SIGN } from './constants';
import { getBingTodayImageUrl } from './core/bing';
import { imageUrlToBase64 } from './utils/image';

const genStyle = (image: string) => {
  const opacity = 0.4;

  return `
/* ${MIXIN_SIGN.start} */
  body {
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    opacity: ${opacity};
    background-image: url('${image}');
  }
/* ${MIXIN_SIGN.end} */
`;
};

const genJsCode = (imageBase64: string) => {
  const opacity = 0.4;

  return `/* ${MIXIN_SIGN.start} */
    const style = document.createElement('style');
    style.textContent = \`
		body::before{
			content: "";
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			position: absolute;
			background-size: cover;
			background-repeat: no-repeat;
			background-position: center;
			opacity:${opacity};
			background-image:url('${imageBase64}');
			z-index: 2;
			pointer-events: none;
			filter: blur(0px);
			mix-blend-mode: lighten;
		}
		\`;
    document.head.appendChild(style);
/* ${MIXIN_SIGN.end} */`;
};

const workbenchCSSFileName: string = vscode.version >= '1.38' ? 'workbench.desktop.main.css' : 'workbench.main.css';

export async function activate(_context: vscode.ExtensionContext) {
  const cssPath = require.main
    ? path.join(path.dirname((require.main as NodeModule).filename), 'vs', 'workbench', workbenchCSSFileName)
    : path.join(vscode.env.appRoot, 'out', 'vs', 'workbench', workbenchCSSFileName);

  const jsPath = require.main
    ? path.join(path.dirname((require.main as NodeModule).filename), 'vs', 'workbench', 'workbench.desktop.main.js')
    : path.join(vscode.env.appRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js');

  try {
    const jsFile = readFileSync(jsPath, { encoding: 'utf-8' });

    // 检查是否需要处理 JS 文件
    if (jsFile.includes(MIXIN_SIGN.start)) {
      const imageUrl = await getBingTodayImageUrl();
      const imageBase64 = await imageUrlToBase64(imageUrl);

      if (jsFile.includes(imageBase64)) {
        return; // 图片已经是最新的，无需更新
      } else {
        // 替换现有的注入代码
        const updatedJsFile = jsFile.replace(
          new RegExp(`/\\* ${MIXIN_SIGN.start} \\*/[\\s\\S]*?/\\* ${MIXIN_SIGN.end} \\*/`, 'g'),
          genJsCode(imageBase64)
        );

        writeFileSync(jsPath, updatedJsFile, { encoding: 'utf-8' });
        vscode.commands.executeCommand('workbench.action.reloadWindow');
        return;
      }
    } else {
      // JS 文件中没有注入代码，添加注入代码
      const imageUrl = await getBingTodayImageUrl();
      const imageBase64 = await imageUrlToBase64(imageUrl);
      const updatedJsFile = jsFile + '\n' + genJsCode(imageBase64);

      writeFileSync(jsPath, updatedJsFile, { encoding: 'utf-8' });
      vscode.commands.executeCommand('workbench.action.reloadWindow');
      return;
    }
  } catch (error) {
    console.log('JS file processing failed, falling back to CSS method:', error);
    // 如果 JS 文件处理失败，继续使用原有的 CSS 方法
  }

  // 原有的 CSS 处理逻辑
  const originStyle = readFileSync(cssPath, { encoding: 'utf-8' });

  if (originStyle.includes(MIXIN_SIGN.start)) {
    const imageUrl = await getBingTodayImageUrl();
    if (originStyle.includes(imageUrl)) {
      return;
    } else {
      const style = originStyle.replace(
        /\/\* code-smart start \*\/[\s\S]*?\/\* code-smart end \*\//,
        genStyle(imageUrl)
      );

      writeFileSync(cssPath, style, { encoding: 'utf-8' });
      vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } else {
    const imageUrl = await getBingTodayImageUrl();
    const style = originStyle + genStyle(imageUrl);

    writeFileSync(cssPath, style, { encoding: 'utf-8' });
    vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

export function deactivate() {}
