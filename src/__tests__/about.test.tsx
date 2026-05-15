import graphiqlPackage from 'graphiql/package.json';
import appPackage from '../../package.json';
import { buildAboutPanelOptions } from '../main/about';

describe('buildAboutPanelOptions', () => {
  it('uses the app package version by default', () => {
    expect(buildAboutPanelOptions().applicationVersion).toBe(
      appPackage.version,
    );
  });

  it('includes the app release version and GraphiQL version', () => {
    const options = buildAboutPanelOptions('1.2.3');

    expect(options).toMatchObject({
      applicationName: 'GraphiQL Desktop',
      applicationVersion: '1.2.3',
      version: `GraphiQL ${graphiqlPackage.version}`,
    });
    expect(options.credits).toBeUndefined();
  });

  it('does not add duplicate app version detail lines', () => {
    const options = buildAboutPanelOptions('1.2.3');

    expect(Object.keys(options).sort()).toEqual([
      'applicationName',
      'applicationVersion',
      'version',
    ]);
  });
});
