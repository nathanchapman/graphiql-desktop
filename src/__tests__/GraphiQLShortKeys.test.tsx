import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { ShortKeys } from '../renderer/GraphiQLShortKeys';

jest.mock('@graphiql/react', () => ({
  KEY_MAP: {
    copyQuery: { key: 'Shift-Ctrl-C' },
    mergeFragments: { key: 'Shift-Ctrl-M' },
    prettify: { key: 'Shift-Ctrl-P' },
    refetchSchema: { key: 'Shift-Ctrl-R' },
    runQuery: { key: 'Ctrl-Enter' },
    searchInDocs: { key: 'Ctrl-Alt-K' },
    searchInEditor: { key: 'Ctrl-F' },
  },
  formatShortcutForOS: (key: string) => key.replace('Ctrl', 'Cmd'),
}));

function rowFor(title: string) {
  const label = screen.getByText(title);
  const row = label.closest('tr');

  if (!row) {
    throw new Error(`No shortcut row found for ${title}`);
  }

  return row;
}

describe('GraphiQLShortKeys', () => {
  it('keeps the default GraphiQL shortcut rows', () => {
    render(<ShortKeys />);

    expect(rowFor('Execute query')).toHaveTextContent('Cmd + Enter');
    expect(screen.getByText('Prettify editors')).toBeInTheDocument();
    expect(screen.getByText('Copy query')).toBeInTheDocument();
    expect(screen.getByText('Search in documentation')).toBeInTheDocument();
  });

  it('adds the GraphiQL Desktop shortcut rows from the README', () => {
    render(<ShortKeys />);

    const expectedShortcuts = new Map([
      ['Show Docs', 'Cmd + D'],
      ['Search', 'Cmd + K'],
      ['Show History View', 'Cmd + Y'],
      ['Show Explorer View', 'Cmd + E'],
      ['Reload Schema', 'Cmd + R'],
      ['New Tab', 'Cmd + T'],
      ['Close Tab', 'Cmd + W'],
      ['Show Last Tab', 'Cmd + 0'],
    ]);

    for (const [title, keys] of expectedShortcuts) {
      expect(rowFor(title)).toHaveTextContent(keys);
    }

    expect(rowFor('Show Tab N')).toHaveTextContent('Cmd-1 through Cmd-9');
  });

  it('keeps the default GraphiQL rows before the Desktop rows', () => {
    render(<ShortKeys />);

    const rowTitles = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[1].textContent);

    expect(rowTitles).toEqual([
      'Execute query',
      'Open the Command Palette (you must have focus in the editor)',
      'Prettify editors',
      'Copy query',
      'Re-fetch schema using introspection',
      'Search in documentation',
      'Search in editor',
      'Merge fragments definitions into operation definition',
      'Show Docs',
      'Search',
      'Show History View',
      'Show Explorer View',
      'Reload Schema',
      'New Tab',
      'Close Tab',
      'Show Tab N',
      'Show Last Tab',
    ]);
  });

  it('renders each shortcut key segment with GraphiQL key styling', () => {
    render(<ShortKeys />);

    const showDocsKeys = within(rowFor('Show Docs')).getAllByText(/^(Cmd|D)$/);

    expect(showDocsKeys).toHaveLength(2);
    for (const key of showDocsKeys) {
      expect(key).toHaveClass('graphiql-key');
    }
  });

  it('preserves the Monaco shortcut reference links from GraphiQL', () => {
    render(<ShortKeys />);

    expect(screen.getByText('Monaco editor shortcuts')).toHaveAttribute(
      'href',
      'https://code.visualstudio.com/docs/reference/default-keybindings',
    );
    expect(screen.getByText('macOS')).toHaveAttribute(
      'href',
      'https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf',
    );
    expect(screen.getByText('Windows')).toHaveAttribute(
      'href',
      'https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf',
    );
  });
});
