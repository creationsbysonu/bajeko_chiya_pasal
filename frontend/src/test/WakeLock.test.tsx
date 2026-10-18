import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PlayerProvider, usePlayer } from '../context/PlayerContext';

const release = vi.fn(async () => undefined);
const request = vi.fn(async (_type: string) => ({
  release,
  addEventListener: vi.fn(),
}));

const Probe: React.FC = () => {
  const { keepScreenOn, keepScreenOnSupported, toggleKeepScreenOn } = usePlayer();
  return (
    <div>
      <span data-testid="supported">{String(keepScreenOnSupported)}</span>
      <span data-testid="on">{String(keepScreenOn)}</span>
      <button onClick={toggleKeepScreenOn}>toggle</button>
    </div>
  );
};

const renderToggle = () =>
  render(
    <PlayerProvider>
      <Probe />
    </PlayerProvider>
  );

describe('Keep screen on (Screen Wake Lock)', () => {
  beforeEach(() => {
    localStorage.clear();
    request.mockClear();
    release.mockClear();
    // jsdom ships no Screen Wake Lock API — provide one.
    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: (type: string) => request(type) },
      configurable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator as unknown as Record<string, unknown>, 'wakeLock');
  });

  it('reports support when the browser exposes the API', () => {
    renderToggle();
    expect(screen.getByTestId('supported')).toHaveTextContent('true');
  });

  it('starts off and persists the listener\u2019s choice', () => {
    renderToggle();
    expect(screen.getByTestId('on')).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('on')).toHaveTextContent('true');
    expect(localStorage.getItem('bajeko_chiya_pasal_keep_screen_on')).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('on')).toHaveTextContent('false');
    expect(localStorage.getItem('bajeko_chiya_pasal_keep_screen_on')).toBe('0');
  });

  it('restores the saved preference on a fresh visit', () => {
    localStorage.setItem('bajeko_chiya_pasal_keep_screen_on', '1');
    renderToggle();
    expect(screen.getByTestId('on')).toHaveTextContent('true');
  });

  it('never requests a lock before playback starts', () => {
    renderToggle();
    expect(request).not.toHaveBeenCalled();
  });
});
