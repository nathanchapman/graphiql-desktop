import { formatShortcutForOS, KEY_MAP } from '@graphiql/react';
import type { FC, ReactNode } from 'react';
import { Fragment } from 'react';

type ShortcutRow = {
  title: string;
  keys: string;
  variant?: 'combo' | 'display';
};

const desktopShortcut = (key: string) => formatShortcutForOS(`Ctrl-${key}`);

const SHORT_KEYS: ShortcutRow[] = [
  {
    title: 'Execute query',
    keys: formatShortcutForOS(KEY_MAP.runQuery.key),
  },
  {
    title: 'Open the Command Palette (you must have focus in the editor)',
    keys: 'F1',
  },
  {
    title: 'Prettify editors',
    keys: KEY_MAP.prettify.key,
  },
  {
    title: 'Copy query',
    keys: KEY_MAP.copyQuery.key,
  },
  {
    title: 'Re-fetch schema using introspection',
    keys: KEY_MAP.refetchSchema.key,
  },
  {
    title: 'Search in documentation',
    keys: formatShortcutForOS(KEY_MAP.searchInDocs.key),
  },
  {
    title: 'Search in editor',
    keys: formatShortcutForOS(KEY_MAP.searchInEditor.key),
  },
  {
    title: 'Merge fragments definitions into operation definition',
    keys: KEY_MAP.mergeFragments.key,
  },
  {
    title: 'Show Docs',
    keys: desktopShortcut('D'),
  },
  {
    title: 'Search',
    keys: desktopShortcut('K'),
  },
  {
    title: 'Show History View',
    keys: desktopShortcut('Y'),
  },
  {
    title: 'Show Explorer View',
    keys: desktopShortcut('E'),
  },
  {
    title: 'Reload Schema',
    keys: desktopShortcut('R'),
  },
  {
    title: 'New Tab',
    keys: desktopShortcut('T'),
  },
  {
    title: 'Close Tab',
    keys: desktopShortcut('W'),
  },
  {
    title: 'Show Tab N',
    keys: `${desktopShortcut('1')} through ${desktopShortcut('9')}`,
    variant: 'display',
  },
  {
    title: 'Show Last Tab',
    keys: desktopShortcut('0'),
  },
];

function renderShortcutKeys(shortcut: ShortcutRow): ReactNode {
  if (shortcut.variant === 'display') {
    return <code className="graphiql-key">{shortcut.keys}</code>;
  }

  const seenKeys = new Map<string, number>();

  return shortcut.keys.split('-').map((key, index, array) => {
    const occurrence = seenKeys.get(key) ?? 0;
    seenKeys.set(key, occurrence + 1);

    return (
      <Fragment key={`${key}-${occurrence}`}>
        <code className="graphiql-key">{key}</code>
        {index !== array.length - 1 && ' + '}
      </Fragment>
    );
  });
}

export const ShortKeys: FC = () => (
  <div>
    <table className="graphiql-table">
      <thead>
        <tr>
          <th>Short Key</th>
          <th>Function</th>
        </tr>
      </thead>
      <tbody>
        {SHORT_KEYS.map((shortcut) => (
          <tr key={shortcut.title}>
            <td>{renderShortcutKeys(shortcut)}</td>
            <td>{shortcut.title}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <p>
      This Graph<em>i</em>QL editor uses{' '}
      <a
        href="https://code.visualstudio.com/docs/reference/default-keybindings"
        target="_blank"
        rel="noreferrer"
      >
        Monaco editor shortcuts
      </a>
      , with keybindings similar to VS Code. See the full list of shortcuts for{' '}
      <a
        href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf"
        target="_blank"
        rel="noreferrer"
      >
        macOS
      </a>{' '}
      or{' '}
      <a
        href="https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf"
        target="_blank"
        rel="noreferrer"
      >
        Windows
      </a>
      .
    </p>
  </div>
);
