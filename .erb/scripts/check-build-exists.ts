// Check if the renderer and main bundles are built

import fs from 'fs';
import path from 'path';
import webpackPaths from '../configs/webpack.paths';

const mainPath = path.join(webpackPaths.distMainPath, 'main.js');
const rendererPath = path.join(webpackPaths.distRendererPath, 'renderer.js');

if (!fs.existsSync(mainPath)) {
  throw new Error(
    'The main process is not built yet. Build it by running "npm run build:main"',
  );
}

if (!fs.existsSync(rendererPath)) {
  throw new Error(
    'The renderer process is not built yet. Build it by running "npm run build:renderer"',
  );
}
