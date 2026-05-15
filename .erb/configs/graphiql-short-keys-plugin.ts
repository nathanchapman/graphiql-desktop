import path from 'path';
import webpack from 'webpack';
import webpackPaths from './webpack.paths';

type ReplacementResource = {
  context?: string;
  request: string;
};

export function replaceGraphiQLShortKeysRequest(resource: ReplacementResource) {
  if (resource.context?.includes(path.join('graphiql', 'dist', 'ui'))) {
    resource.request = path.join(
      webpackPaths.srcRendererPath,
      'GraphiQLShortKeys.tsx',
    );
  }
}

export function createGraphiQLShortKeysReplacementPlugin() {
  return new webpack.NormalModuleReplacementPlugin(
    /\.\/short-keys\.js$/,
    replaceGraphiQLShortKeysRequest,
  );
}
