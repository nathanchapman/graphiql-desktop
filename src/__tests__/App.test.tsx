import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import App from '../renderer/App';

describe('App', () => {
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should render', () => {
    expect(render(<App />)).toBeTruthy();
  });
});
