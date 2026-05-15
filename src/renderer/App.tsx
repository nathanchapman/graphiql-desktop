import {
  DOC_EXPLORER_PLUGIN,
  DocExplorerStore,
} from '@graphiql/plugin-doc-explorer';
import { explorerPlugin } from '@graphiql/plugin-explorer';
import { HISTORY_PLUGIN, HistoryStore } from '@graphiql/plugin-history';
import {
  GraphiQLProvider,
  useGraphiQL,
  useGraphiQLActions,
} from '@graphiql/react';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL, GraphiQLInterface } from 'graphiql';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

import 'graphiql/style.css';
import '@graphiql/plugin-doc-explorer/style.css';
import '@graphiql/plugin-explorer/style.css';
import '@graphiql/plugin-history/style.css';
import './App.css';

const fallbackUrl = 'https://countries.trevorblades.com/';

const normalizeEndpointUrl = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '';
  }

  try {
    const endpointUrl = new URL(trimmedValue);
    if (endpointUrl.protocol === 'http:' || endpointUrl.protocol === 'https:') {
      return trimmedValue;
    }
  } catch {
    return null;
  }

  return null;
};

const useLocalStorage = (
  key: string,
  fallback?: string,
): [
  typeof fallback extends undefined ? string | null : string,
  Dispatch<SetStateAction<string | null>>,
] => {
  const [value, setValue] = useState(localStorage.getItem(key));

  useEffect(() => {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  }, [key, value]);

  // @ts-expect-error - this is fine
  return [value ?? fallback ?? null, setValue];
};

function DebouncedUrlInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange(nextValue: string): void;
}) {
  const [draftValue, setDraftValue] = useState(value ?? '');
  const [isFocused, setIsFocused] = useState(false);
  const hasMounted = useRef(false);
  const isValidEndpoint = normalizeEndpointUrl(draftValue) !== null;

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      const endpointUrl = normalizeEndpointUrl(draftValue);
      if (endpointUrl !== null) {
        onChange(endpointUrl);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [draftValue, onChange]);

  return (
    <input
      type="text"
      className="graphiql-desktop-url-input"
      value={draftValue}
      placeholder="Endpoint URL"
      minLength={12}
      aria-invalid={!isValidEndpoint}
      data-focused={isFocused ? 'true' : undefined}
      onBlur={() => setIsFocused(false)}
      onChange={(event) => setDraftValue(event.target.value)}
      onFocus={() => setIsFocused(true)}
    />
  );
}

function GraphiQLInterfaceWrapper() {
  const {
    addTab,
    changeTab,
    closeTab,
    introspect,
    setVisiblePlugin: setGraphiQLVisiblePlugin,
  } = useGraphiQLActions();
  const { activeTabIndex, tabs } = useGraphiQL((state) => ({
    activeTabIndex: state.activeTabIndex,
    tabs: state.tabs,
  }));

  useEffect(() => {
    const callback = (event: KeyboardEvent) => {
      const isCommand = event.metaKey || event.ctrlKey;
      let handled = true;

      if (isCommand && event.code.startsWith('Digit')) {
        const index = Number(event.key) - 1;
        if (index >= 0 && index < tabs.length) {
          changeTab(index);
        } else {
          changeTab(tabs.length - 1);
        }
      } else if (isCommand && event.code === 'KeyR') {
        introspect();
      } else if (isCommand && event.code === 'KeyD') {
        setGraphiQLVisiblePlugin('Documentation Explorer');
      } else if (isCommand && event.code === 'KeyK') {
        setGraphiQLVisiblePlugin('Documentation Explorer');
      } else if (isCommand && event.code === 'KeyY') {
        setGraphiQLVisiblePlugin('History');
      } else if (isCommand && event.code === 'KeyE') {
        setGraphiQLVisiblePlugin('GraphiQL Explorer');
      } else if (isCommand && event.code === 'KeyT') {
        addTab();
      } else if (isCommand && event.code === 'KeyW') {
        closeTab(activeTabIndex);
      } else {
        handled = false;
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('keydown', callback, true);
    return () => {
      document.removeEventListener('keydown', callback, true);
    };
  }, [
    activeTabIndex,
    addTab,
    changeTab,
    closeTab,
    introspect,
    setGraphiQLVisiblePlugin,
    tabs,
  ]);

  return (
    <GraphiQLInterface>
      <GraphiQL.Logo>{null}</GraphiQL.Logo>
    </GraphiQLInterface>
  );
}

function GraphiQLWrapper() {
  const [url, setURL] = useLocalStorage('graphiql-desktop:url');
  const fetcher = createGraphiQLFetcher({
    url: url?.trim() || fallbackUrl,
  });
  const explorer = explorerPlugin({
    showAttribution: false,
  });
  const plugins = [DOC_EXPLORER_PLUGIN, HISTORY_PLUGIN, explorer];
  const [visiblePlugin, setVisiblePlugin] = useLocalStorage(
    'graphiql-desktop:lastVisiblePlugin',
  );
  return (
    <div className="graphiql-desktop">
      <DebouncedUrlInput value={url} onChange={setURL} />
      <GraphiQLProvider
        fetcher={fetcher}
        plugins={plugins}
        referencePlugin={DOC_EXPLORER_PLUGIN}
        shouldPersistHeaders
        visiblePlugin={visiblePlugin}
        onTogglePluginVisibility={(plugin) => {
          setVisiblePlugin(plugin?.title ?? null);
        }}
      >
        <HistoryStore>
          <DocExplorerStore>
            <GraphiQLInterfaceWrapper />
          </DocExplorerStore>
        </HistoryStore>
      </GraphiQLProvider>
    </div>
  );
}

export default function App() {
  return <GraphiQLWrapper />;
}
