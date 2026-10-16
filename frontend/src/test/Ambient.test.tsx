import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { AmbientProvider, useAmbient } from '../context/AmbientContext';
import { AMBIENT_LAYERS, ambientEngine } from '../services/ambient';

const Harness: React.FC = () => {
  const ambient = useAmbient();
  return (
    <div>
      <span data-testid="supported">{String(ambient.supported)}</span>
      <span data-testid="count">{ambient.activeCount}</span>
      <span data-testid="master">{ambient.master}</span>
      {AMBIENT_LAYERS.map((l) => (
        <button key={l.id} data-testid={`toggle-${l.id}`} onClick={() => ambient.toggle(l.id)}>
          {String(ambient.isActive(l.id))}
        </button>
      ))}
      <button data-testid="surprise" onClick={ambient.surprise}>surprise</button>
      <button data-testid="clear" onClick={ambient.stopAll}>clear</button>
    </div>
  );
};

describe('ambient soundscape layers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ships a well-formed catalogue of unique layers', () => {
    expect(AMBIENT_LAYERS.length).toBeGreaterThanOrEqual(6);
    const ids = AMBIENT_LAYERS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    AMBIENT_LAYERS.forEach((l) => {
      expect(l.id).toMatch(/^[a-z-]+$/);
      expect(l.name.length).toBeGreaterThan(0);
      expect(l.nameNe.length).toBeGreaterThan(0);
      expect(l.base).toBeGreaterThan(0);
    });
  });

  it('reports unsupported and stays inert without an AudioContext (jsdom)', () => {
    expect(ambientEngine.isSupported()).toBe(false);

    render(
      <AmbientProvider>
        <Harness />
      </AmbientProvider>,
    );

    expect(screen.getByTestId('supported')).toHaveTextContent('false');
    expect(screen.getByTestId('count')).toHaveTextContent('0');

    // Toggling must be a no-op when the platform cannot play audio.
    fireEvent.click(screen.getByTestId('toggle-rain'));
    expect(screen.getByTestId('count')).toHaveTextContent('0');

    fireEvent.click(screen.getByTestId('surprise'));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('persists the ambience state to localStorage', () => {
    render(
      <AmbientProvider>
        <Harness />
      </AmbientProvider>,
    );

    expect(localStorage.getItem('pd-ambient-active')).toBeTruthy();
    expect(localStorage.getItem('pd-ambient-master')).toBeTruthy();
  });
});
