import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import { MIXIN_SIGN } from './constants';
import { getBingTodayImageUrl } from './core/bing';

const genStyle = (image: string) => {
  let opacity = 0.4;
  opacity = 0.59 + (0.4 - (opacity * 4) / 10);

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

const workbenchCSSFileName: string = vscode.version >= '1.38' ? 'workbench.desktop.main.css' : 'workbench.main.css';

export async function activate(_context: vscode.ExtensionContext) {
  const p = require.main
    ? path.join(path.dirname((require.main as NodeModule).filename), 'vs', 'workbench', workbenchCSSFileName)
    : path.join(vscode.env.appRoot, 'out', 'vs', 'workbench', workbenchCSSFileName);

  const originStyle = readFileSync(p, { encoding: 'utf-8' });

  if (originStyle.includes(MIXIN_SIGN.start)) {
    const imageUrl = await getBingTodayImageUrl();
    if (originStyle.includes(imageUrl)) {
      return;
    } else {
      const style = originStyle.replace(
        /\/\* code-smart start \*\/[\s\S]*?\/\* code-smart end \*\//,
        genStyle(imageUrl)
      );

      writeFileSync(p, style, { encoding: 'utf-8' });
      vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } else {
    const imageUrl = await getBingTodayImageUrl();
    const style = originStyle + genStyle(imageUrl);

    writeFileSync(p, style, { encoding: 'utf-8' });
    vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

export function deactivate() {}
