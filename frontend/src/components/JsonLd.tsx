import React, { useEffect } from 'react';

interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Emits a schema.org block for the current screen.
 *
 * The tag is attached by script rather than rendered as JSX because `<script>`
 * content is inert markup: `JSON.stringify` leaves `</script>` intact, so a
 * catalog string containing that sequence would close the block early and inject
 * raw text into `<head>`. Escaping `<` (and re-attaching on every data change)
 * keeps the block valid whatever the database returns.
 *
 * Google renders JavaScript, but static/early blocks are parsed more reliably —
 * so this is only for data that genuinely changes with the screen (FAQ copy,
 * the station list), never for the always-present WebSite/Organization tags
 * that live in `index.html`.
 */
export const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  useEffect(() => {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.textContent = json;
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, [json]);

  return null;
};
