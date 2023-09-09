import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { GraphiQL, GraphiQLInterface } from 'graphiql';
import {
  GraphiQLProvider,
  usePluginContext,
  useEditorContext,
  useSchemaContext,
} from '@graphiql/react';
import { useExplorerPlugin } from '@graphiql/plugin-explorer';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { DebounceInput } from 'react-debounce-input';

import './App.css';
import 'graphiql/graphiql.min.css';
import '@graphiql/plugin-explorer/dist/style.css';

const useLocalStorage = (
  key: string,
  fallback?: string
): [
  typeof fallback extends undefined ? string | null : string,
  Dispatch<SetStateAction<string | null>>
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

const GraphiQLInterfaceWrapper = ({
  setVisiblePlugin,
}: {
  setVisiblePlugin(value: SetStateAction<string | null>): void;
}) => {
  const pluginContext = usePluginContext();
  const editorContext = useEditorContext({ nonNull: true });
  const schemaContext = useSchemaContext({ nonNull: true });

  useEffect(() => {
    const callback = (event: KeyboardEvent) => {
      const isCommand = event.metaKey || event.ctrlKey;
      if (isCommand && event.code.startsWith('Digit')) {
        event.preventDefault();
        const index = Number(event.key) - 1;
        if (index >= 0 && index < editorContext.tabs.length) {
          editorContext?.changeTab(index);
        } else {
          editorContext?.changeTab(editorContext.tabs.length - 1);
        }
      } else if (isCommand && event.code === 'KeyR') {
        event.preventDefault();
        schemaContext.introspect();
      } else if (isCommand && event.code === 'KeyD') {
        event.preventDefault();
        setVisiblePlugin('Documentation Explorer');
      } else if (isCommand && event.code === 'KeyK') {
        pluginContext?.setVisiblePlugin('Documentation Explorer');
        setVisiblePlugin('Documentation Explorer');
      } else if (isCommand && event.code === 'KeyY') {
        event.preventDefault();
        setVisiblePlugin('History');
      } else if (isCommand && event.code === 'KeyE') {
        event.preventDefault();
        setVisiblePlugin('GraphiQL Explorer');
      } else if (isCommand && event.code === 'KeyT') {
        event.preventDefault();
        editorContext?.addTab();
      } else if (isCommand && event.code === 'KeyW') {
        event.preventDefault();
        editorContext?.closeTab(editorContext.activeTabIndex);
      }
    };
    document.addEventListener('keydown', callback);
    return () => {
      document.removeEventListener('keydown', callback);
    };
  }, [pluginContext, editorContext, schemaContext, setVisiblePlugin]);

  return (
    <GraphiQLInterface>
      <GraphiQL.Logo>
        <></>
      </GraphiQL.Logo>
    </GraphiQLInterface>
  );
};

const GraphiQLWrapper = () => {
  const [query, setQuery] = useState<string>();
  const [url, setURL] = useLocalStorage('graphiql-desktop:url');
  const fetcher = createGraphiQLFetcher({
    url: url ?? 'https://swapi-graphql.netlify.app/.netlify/functions/index',
  });
  const explorer = useExplorerPlugin({
    query,
    onEdit: setQuery,
    showAttribution: false,
  });
  const [visiblePlugin, setVisiblePlugin] = useLocalStorage(
    'graphiql-desktop:lastVisiblePlugin'
  );
  return (
    <div className="graphiql-desktop">
      <DebounceInput
        type="text"
        className="graphiql-desktop-url-input"
        value={url ?? undefined}
        placeholder="Endpoint URL"
        minLength={12}
        debounceTimeout={500}
        onChange={(e) => setURL(e.target.value)}
      />
      <GraphiQLProvider
        fetcher={fetcher}
        query={query}
        plugins={[explorer]}
        shouldPersistHeaders
        visiblePlugin={visiblePlugin}
        onTogglePluginVisibility={(plugin) => {
          setVisiblePlugin(plugin?.title ?? null);
        }}
      >
        <GraphiQLInterfaceWrapper setVisiblePlugin={setVisiblePlugin} />
      </GraphiQLProvider>
    </div>
  );
};

export default function App() {
  return <GraphiQLWrapper />;
}
