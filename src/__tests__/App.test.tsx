import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import App from '../renderer/App';

const fallbackUrl = 'https://countries.trevorblades.com/';

const mockFetcher = { type: 'fetcher' };
const mockExplorer = {
  title: 'GraphiQL Explorer',
  content: () => null,
  icon: () => null,
};
const mockGraphiQLActions = {
  addTab: jest.fn(),
  changeTab: jest.fn(),
  closeTab: jest.fn(),
  introspect: jest.fn(),
  setVisiblePlugin: jest.fn(),
};
const mockGraphiQLState = {
  activeTabIndex: 1,
  tabs: [{ id: 'tab-1' }, { id: 'tab-2' }, { id: 'tab-3' }],
};
const mockProviderProps: Record<string, unknown>[] = [];

jest.mock('@graphiql/toolkit', () => ({
  createGraphiQLFetcher: jest.fn(() => mockFetcher),
}));

jest.mock('@graphiql/plugin-explorer', () => ({
  explorerPlugin: jest.fn(() => mockExplorer),
}));

jest.mock('@graphiql/plugin-doc-explorer', () => ({
  DOC_EXPLORER_PLUGIN: {
    title: 'Documentation Explorer',
    content: () => null,
    icon: () => null,
  },
  DocExplorerStore: ({ children }: { children: ReactNode }) => (
    <div data-testid="doc-explorer-store">{children}</div>
  ),
}));

jest.mock('@graphiql/plugin-history', () => ({
  HISTORY_PLUGIN: {
    title: 'History',
    content: () => null,
    icon: () => null,
  },
  HistoryStore: ({ children }: { children: ReactNode }) => (
    <div data-testid="history-store">{children}</div>
  ),
}));

jest.mock('@graphiql/react', () => ({
  GraphiQLProvider: ({
    children,
    ...props
  }: {
    children: ReactNode;
    [key: string]: unknown;
  }) => {
    mockProviderProps.push(props);
    return <div data-testid="graphiql-provider">{children}</div>;
  },
  useGraphiQL: jest.fn((selector) => selector(mockGraphiQLState)),
  useGraphiQLActions: jest.fn(() => mockGraphiQLActions),
}));

jest.mock('graphiql', () => ({
  GraphiQL: {
    Logo: ({ children }: { children: ReactNode }) => (
      <div data-testid="graphiql-logo">{children}</div>
    ),
  },
  GraphiQLInterface: ({ children }: { children: ReactNode }) => (
    <div data-testid="graphiql-interface">{children}</div>
  ),
}));

const { createGraphiQLFetcher } = jest.requireMock('@graphiql/toolkit') as {
  createGraphiQLFetcher: jest.Mock;
};
const { explorerPlugin } = jest.requireMock('@graphiql/plugin-explorer') as {
  explorerPlugin: jest.Mock;
};
const { DOC_EXPLORER_PLUGIN: mockDocExplorerPlugin } = jest.requireMock(
  '@graphiql/plugin-doc-explorer',
) as {
  DOC_EXPLORER_PLUGIN: {
    title: string;
    content: () => null;
    icon: () => null;
  };
};
const { HISTORY_PLUGIN: mockHistoryPlugin } = jest.requireMock(
  '@graphiql/plugin-history',
) as {
  HISTORY_PLUGIN: {
    title: string;
    content: () => null;
    icon: () => null;
  };
};

function latestProviderProps() {
  return mockProviderProps[mockProviderProps.length - 1] as {
    fetcher: typeof mockFetcher;
    onTogglePluginVisibility(plugin: { title: string } | null): void;
    plugins: Array<
      | typeof mockDocExplorerPlugin
      | typeof mockExplorer
      | typeof mockHistoryPlugin
    >;
    referencePlugin: typeof mockDocExplorerPlugin;
    shouldPersistHeaders: boolean;
    visiblePlugin: string | null;
  };
}

function pressShortcut(
  code: string,
  key: string,
  overrides: KeyboardEventInit = {},
  target: EventTarget = document,
) {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    code,
    ctrlKey: true,
    key,
    ...overrides,
  });

  target.dispatchEvent(event);
  return event;
}

function createEditorTarget() {
  const editorTarget = document.createElement('textarea');
  editorTarget.addEventListener('keydown', (event) => {
    event.stopPropagation();
  });
  document.body.appendChild(editorTarget);

  return editorTarget;
}

describe('App', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    jest.clearAllMocks();
    mockProviderProps.length = 0;
    mockGraphiQLState.activeTabIndex = 1;
    mockGraphiQLState.tabs = [
      { id: 'tab-1' },
      { id: 'tab-2' },
      { id: 'tab-3' },
    ];
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders GraphiQL with the default endpoint and sidebar plugins', () => {
    render(<App />);

    expect(screen.getByPlaceholderText('Endpoint URL')).toHaveValue('');
    expect(screen.getByTestId('graphiql-provider')).toBeInTheDocument();
    expect(screen.getByTestId('history-store')).toBeInTheDocument();
    expect(screen.getByTestId('doc-explorer-store')).toBeInTheDocument();
    expect(screen.getByTestId('graphiql-interface')).toBeInTheDocument();
    expect(screen.getByTestId('graphiql-logo')).toBeEmptyDOMElement();
    expect(createGraphiQLFetcher).toHaveBeenLastCalledWith({
      url: fallbackUrl,
    });
    expect(explorerPlugin).toHaveBeenLastCalledWith({
      showAttribution: false,
    });
    expect(latestProviderProps()).toMatchObject({
      fetcher: mockFetcher,
      plugins: [mockDocExplorerPlugin, mockHistoryPlugin, mockExplorer],
      referencePlugin: mockDocExplorerPlugin,
      shouldPersistHeaders: true,
      visiblePlugin: null,
    });
  });

  it('hydrates the endpoint and visible plugin from localStorage', () => {
    localStorage.setItem(
      'graphiql-desktop:url',
      'https://api.example.test/gql',
    );
    localStorage.setItem('graphiql-desktop:lastVisiblePlugin', 'History');

    render(<App />);

    expect(screen.getByPlaceholderText('Endpoint URL')).toHaveValue(
      'https://api.example.test/gql',
    );
    expect(createGraphiQLFetcher).toHaveBeenLastCalledWith({
      url: 'https://api.example.test/gql',
    });
    expect(latestProviderProps().visiblePlugin).toBe('History');
  });

  it('debounces endpoint edits before persisting and rebuilding the fetcher', () => {
    localStorage.setItem(
      'graphiql-desktop:url',
      'https://old.example.test/gql',
    );
    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('Endpoint URL'), {
      target: { value: 'https://new.example.test/gql' },
    });

    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(localStorage.getItem('graphiql-desktop:url')).toBe(
      'https://old.example.test/gql',
    );

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(localStorage.getItem('graphiql-desktop:url')).toBe(
      'https://new.example.test/gql',
    );
    expect(createGraphiQLFetcher).toHaveBeenLastCalledWith({
      url: 'https://new.example.test/gql',
    });
  });

  it('removes the persisted endpoint when the input is cleared', () => {
    localStorage.setItem(
      'graphiql-desktop:url',
      'https://api.example.test/gql',
    );
    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('Endpoint URL'), {
      target: { value: '' },
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(localStorage.getItem('graphiql-desktop:url')).toBeNull();
    expect(createGraphiQLFetcher).toHaveBeenLastCalledWith({
      url: fallbackUrl,
    });
  });

  it('does not persist incomplete endpoint edits while the user is typing', () => {
    localStorage.setItem(
      'graphiql-desktop:url',
      'https://old.example.test/gql',
    );
    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('Endpoint URL'), {
      target: { value: 'https://' },
    });
    expect(screen.getByPlaceholderText('Endpoint URL')).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(localStorage.getItem('graphiql-desktop:url')).toBe(
      'https://old.example.test/gql',
    );
    expect(createGraphiQLFetcher).toHaveBeenLastCalledWith({
      url: 'https://old.example.test/gql',
    });
  });

  it('rejects unsupported endpoint protocols without replacing the active fetcher', () => {
    localStorage.setItem(
      'graphiql-desktop:url',
      'https://old.example.test/gql',
    );
    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('Endpoint URL'), {
      target: { value: 'ftp://api.example.test/gql' },
    });

    expect(screen.getByPlaceholderText('Endpoint URL')).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(localStorage.getItem('graphiql-desktop:url')).toBe(
      'https://old.example.test/gql',
    );
    expect(createGraphiQLFetcher).toHaveBeenLastCalledWith({
      url: 'https://old.example.test/gql',
    });
  });

  it('persists plugin visibility changes from GraphiQLProvider', () => {
    render(<App />);

    act(() => {
      latestProviderProps().onTogglePluginVisibility({ title: 'History' });
    });
    expect(localStorage.getItem('graphiql-desktop:lastVisiblePlugin')).toBe(
      'History',
    );

    act(() => {
      latestProviderProps().onTogglePluginVisibility(null);
    });
    expect(
      localStorage.getItem('graphiql-desktop:lastVisiblePlugin'),
    ).toBeNull();
  });

  it('maps command shortcuts to GraphiQL actions', () => {
    render(<App />);

    expect(pressShortcut('Digit2', '2').defaultPrevented).toBe(true);
    expect(mockGraphiQLActions.changeTab).toHaveBeenLastCalledWith(1);

    expect(pressShortcut('Digit0', '0').defaultPrevented).toBe(true);
    expect(mockGraphiQLActions.changeTab).toHaveBeenLastCalledWith(2);

    expect(pressShortcut('Digit9', '9').defaultPrevented).toBe(true);
    expect(mockGraphiQLActions.changeTab).toHaveBeenLastCalledWith(2);

    expect(pressShortcut('KeyR', 'r').defaultPrevented).toBe(true);
    expect(mockGraphiQLActions.introspect).toHaveBeenCalledTimes(1);

    expect(pressShortcut('KeyD', 'd').defaultPrevented).toBe(true);
    expect(mockGraphiQLActions.setVisiblePlugin).toHaveBeenLastCalledWith(
      'Documentation Explorer',
    );

    pressShortcut('KeyK', 'k');
    expect(mockGraphiQLActions.setVisiblePlugin).toHaveBeenLastCalledWith(
      'Documentation Explorer',
    );

    expect(pressShortcut('KeyK', 'k').defaultPrevented).toBe(true);
    expect(mockGraphiQLActions.setVisiblePlugin).toHaveBeenLastCalledWith(
      'Documentation Explorer',
    );

    expect(pressShortcut('KeyY', 'y').defaultPrevented).toBe(true);
    expect(mockGraphiQLActions.setVisiblePlugin).toHaveBeenLastCalledWith(
      'History',
    );

    expect(pressShortcut('KeyE', 'e').defaultPrevented).toBe(true);
    expect(mockGraphiQLActions.setVisiblePlugin).toHaveBeenLastCalledWith(
      'GraphiQL Explorer',
    );

    expect(pressShortcut('KeyT', 't').defaultPrevented).toBe(true);
    expect(mockGraphiQLActions.addTab).toHaveBeenCalledTimes(1);

    expect(pressShortcut('KeyW', 'w').defaultPrevented).toBe(true);
    expect(mockGraphiQLActions.closeTab).toHaveBeenLastCalledWith(1);
  });

  it('uses meta shortcuts and ignores non-command key presses', () => {
    render(<App />);

    pressShortcut('KeyT', 't', { ctrlKey: false });
    expect(mockGraphiQLActions.addTab).not.toHaveBeenCalled();

    pressShortcut('KeyT', 't', { ctrlKey: false, metaKey: true });
    expect(mockGraphiQLActions.addTab).toHaveBeenCalledTimes(1);
  });

  it('handles every README shortcut before editor key handlers can stop propagation', () => {
    render(<App />);
    const editorTarget = createEditorTarget();

    const shortcutExpectations = [
      {
        code: 'KeyD',
        key: 'd',
        assert: () =>
          expect(mockGraphiQLActions.setVisiblePlugin).toHaveBeenLastCalledWith(
            'Documentation Explorer',
          ),
      },
      {
        code: 'KeyK',
        key: 'k',
        assert: () =>
          expect(mockGraphiQLActions.setVisiblePlugin).toHaveBeenLastCalledWith(
            'Documentation Explorer',
          ),
      },
      {
        code: 'KeyY',
        key: 'y',
        assert: () =>
          expect(mockGraphiQLActions.setVisiblePlugin).toHaveBeenLastCalledWith(
            'History',
          ),
      },
      {
        code: 'KeyE',
        key: 'e',
        assert: () =>
          expect(mockGraphiQLActions.setVisiblePlugin).toHaveBeenLastCalledWith(
            'GraphiQL Explorer',
          ),
      },
      {
        code: 'KeyR',
        key: 'r',
        assert: () =>
          expect(mockGraphiQLActions.introspect).toHaveBeenCalledTimes(1),
      },
      {
        code: 'KeyT',
        key: 't',
        assert: () =>
          expect(mockGraphiQLActions.addTab).toHaveBeenCalledTimes(1),
      },
      {
        code: 'KeyW',
        key: 'w',
        assert: () =>
          expect(mockGraphiQLActions.closeTab).toHaveBeenLastCalledWith(1),
      },
      {
        code: 'Digit1',
        key: '1',
        assert: () =>
          expect(mockGraphiQLActions.changeTab).toHaveBeenLastCalledWith(0),
      },
      {
        code: 'Digit0',
        key: '0',
        assert: () =>
          expect(mockGraphiQLActions.changeTab).toHaveBeenLastCalledWith(2),
      },
    ];

    for (const shortcut of shortcutExpectations) {
      const event = pressShortcut(
        shortcut.code,
        shortcut.key,
        {},
        editorTarget,
      );

      expect(event.defaultPrevented).toBe(true);
      shortcut.assert();
    }

    editorTarget.remove();
  });

  it('does not consume GraphiQL editor shortcuts it does not own', () => {
    render(<App />);
    const editorTarget = document.createElement('textarea');
    const bubbleListener = jest.fn();
    editorTarget.addEventListener('keydown', bubbleListener);
    document.body.appendChild(editorTarget);

    const event = pressShortcut('Enter', 'Enter', {}, editorTarget);

    expect(event.defaultPrevented).toBe(false);
    expect(bubbleListener).toHaveBeenCalledTimes(1);

    editorTarget.remove();
  });

  it('removes the keyboard listener on unmount', () => {
    const { unmount } = render(<App />);
    unmount();

    pressShortcut('KeyT', 't');

    expect(mockGraphiQLActions.addTab).not.toHaveBeenCalled();
  });
});
