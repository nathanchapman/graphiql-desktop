import graphiqlPackage from 'graphiql/package.json';
import appPackage from '../../package.json';

const appName = 'GraphiQL Desktop';
const appVersion = appPackage.version;
const graphiqlVersion = graphiqlPackage.version;

export function buildAboutPanelOptions(
  appReleaseVersion = appVersion,
): Electron.AboutPanelOptionsOptions {
  return {
    applicationName: appName,
    applicationVersion: appReleaseVersion,
    version: `GraphiQL ${graphiqlVersion}`,
  };
}
