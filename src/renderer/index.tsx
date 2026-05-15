import { createRoot } from 'react-dom/client';
import 'graphiql/setup-workers/webpack';
import App from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);
