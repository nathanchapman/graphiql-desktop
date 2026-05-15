import path from 'path';
import {
  createGraphiQLShortKeysReplacementPlugin,
  replaceGraphiQLShortKeysRequest,
} from '../../.erb/configs/graphiql-short-keys-plugin';

describe('GraphiQL short keys replacement plugin', () => {
  it('replaces only GraphiQL sidebar short key imports', () => {
    const resource = {
      context: path.join('project', 'node_modules', 'graphiql', 'dist', 'ui'),
      request: './short-keys.js',
    };

    replaceGraphiQLShortKeysRequest(resource);

    expect(resource.request).toBe(
      path.join(process.cwd(), 'src', 'renderer', 'GraphiQLShortKeys.tsx'),
    );
  });

  it('leaves unrelated short key imports alone', () => {
    const resource = {
      context: path.join('project', 'src', 'renderer'),
      request: './short-keys.js',
    };

    replaceGraphiQLShortKeysRequest(resource);

    expect(resource.request).toBe('./short-keys.js');
  });

  it('uses webpack NormalModuleReplacementPlugin with the expected request pattern', () => {
    const plugin = createGraphiQLShortKeysReplacementPlugin();

    expect(plugin).toHaveProperty('apply');
    expect(String(plugin.resourceRegExp)).toBe(String(/\.\/short-keys\.js$/));
  });
});
