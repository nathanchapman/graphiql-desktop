import path from 'path';
import { rimrafSync } from 'rimraf';
import webpackPaths from '../configs/webpack.paths';

export default function deleteSourceMaps() {
  [
    path.join(webpackPaths.distMainPath, '*.js.map'),
    path.join(webpackPaths.distRendererPath, '*.js.map'),
  ].forEach((pattern) => {
    rimrafSync(pattern, { glob: true });
  });
}
