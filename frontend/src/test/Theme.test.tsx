import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

const Harness: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button data-testid="toggle" onClick={toggleTheme}>
      {theme}
    </button>
  );
};

type DocWithViewTransition = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

describe('ThemeContext day/night wave transition', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = 'dark';
    document.documentElement.removeAttribute('style');
  });

  afterEach(() => {
    delete (document as DocWithViewTransition).startViewTransition;
  });

  it('drives the reveal through startViewTransition and sets the wave origin', async () => {
    let snapshot: (() => void) | null = null;
    let resolveFinished: () => void = () => {};
    const startViewTransition = vi.fn((cb: () => void) => {
      snapshot = cb;
      return {
        finished: new Promise<void>((resolve) => {
          resolveFinished = resolve;
        }),
      };
    });
    (document as DocWithViewTransition).startViewTransition = startViewTransition;

    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('toggle')).toHaveTextContent('dark');

    fireEvent.click(screen.getByTestId('toggle'));

    // The transition is used and the ripple origin is anchored to the button.
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.getPropertyValue('--theme-wave-x')).not.toBe('');
    expect(document.documentElement.style.getPropertyValue('--theme-wave-y')).not.toBe('');

    // The real API invokes the callback, which swaps the palette inside it.
    act(() => {
      snapshot?.();
    });
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(screen.getByTestId('toggle')).toHaveTextContent('light');

    await act(async () => {
      resolveFinished();
    });
    expect(document.documentElement.style.getPropertyValue('--theme-wave-x')).toBe('');
  });

  it('falls back to an instant swap when the API is unavailable', () => {
    render(
      <ThemeProvider>
        <Harness />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByTestId('toggle'));
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(screen.getByTestId('toggle')).toHaveTextContent('light');
  });
});
