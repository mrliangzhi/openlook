/**
 * @openlook/tracker — browser session tracker (core)
 * Zero dependencies, < 11KB gzipped.
 */

export interface OpenLookOptions {
  maskAllInputs?: boolean;
  maskTextSelector?: string;
  networkCapture?: boolean;
  performance?: boolean;
  respectDNT?: boolean;
  endpoint?: string;
}

interface QueueItem { t: number; type: string; payload: unknown }

const queue: QueueItem[] = [];
let inited = false;

export function init(projectKey: string, opts: OpenLookOptions = {}): void {
  if (inited) return;
  if (opts.respectDNT !== false && navigator.doNotTrack === '1') return;
  inited = true;
  queue.push({ t: Date.now(), type: 'init', payload: { projectKey, opts } });
  // mutation observer + event instrumentation wired in ./instrument
}

export function identify(id: string, traits: Record<string, unknown> = {}): void {
  queue.push({ t: Date.now(), type: 'identify', payload: { id, traits } });
}

export function event(name: string, props: Record<string, unknown> = {}): void {
  queue.push({ t: Date.now(), type: 'event', payload: { name, props } });
}

export function getSessionURL(): string | null {
  return null; // resolved server-side after first flush
}

export default { init, identify, event, getSessionURL };
