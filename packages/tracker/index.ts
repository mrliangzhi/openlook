/**
 * @openlook/tracker — browser session tracker (core)
 * Zero dependencies. Target: < 12KB gzipped.
 */

export interface OpenLookOptions {
  maskAllInputs?: boolean;
  maskTextSelector?: string;
  networkCapture?: boolean;
  performance?: boolean;
  respectDNT?: boolean;
  endpoint?: string;
  flushIntervalMs?: number;
}

interface EventEnvelope { t: number; s: number; type: string; payload: unknown }

const FLUSH_MS = 5000;
const MAX_BATCH = 64;

export class OpenLook {
  private key = '';
  private opts: Required<OpenLookOptions>;
  private buf: EventEnvelope[] = [];
  private seq = 0;
  private sessionId = '';
  private observer?: MutationObserver;
  private timer?: ReturnType<typeof setInterval>;
  private started = false;

  constructor(opts: Partial<OpenLookOptions> = {}) {
    this.opts = {
      maskAllInputs: true, maskTextSelector: '', networkCapture: true,
      performance: true, respectDNT: true, endpoint: '/v1/events',
      flushIntervalMs: FLUSH_MS, ...opts,
    };
  }

  init(projectKey: string, opts: Partial<OpenLookOptions> = {}): void {
    if (this.started) return;
    if (this.opts.respectDNT && navigator.doNotTrack === '1') return;
    this.key = projectKey;
    Object.assign(this.opts, opts);
    this.sessionId = crypto.randomUUID();
    this.started = true;
    this.observeDom();
    this.observeInputs();
    if (this.opts.networkCapture) this.instrumentNetwork();
    if (this.opts.performance) this.collectVitals();
    this.push('init', { ua: navigator.userAgent, url: location.href });
    this.timer = setInterval(() => this.flush(), this.opts.flushIntervalMs);
    addEventListener('pagehide', () => this.flush(true));
  }

  identify(id: string, traits: Record<string, unknown> = {}): void {
    this.push('identify', { id, traits });
  }

  event(name: string, props: Record<string, unknown> = {}): void {
    this.push('event', { name, props });
  }

  getSessionURL(): string | null {
    return this.sessionId ? `https://app.openlook.dev/replay/${this.sessionId}` : null;
  }

  pause(): void { this.observer?.disconnect(); }
  resume(): void { this.observeDom(); }

  optOut(): void {
    this.pause();
    this.buf = [];
    if (this.timer) clearInterval(this.timer);
    this.started = false;
  }

  private push(type: string, payload: unknown): void {
    this.buf.push({ t: Date.now(), s: this.seq++, type, payload });
    if (this.buf.length >= MAX_BATCH) this.flush();
  }

  private observeDom(): void {
    if (this.observer) return;
    this.observer = new MutationObserver((muts) => {
      for (const m of muts) {
        const node = m.target as HTMLElement;
        if (node.closest?.('[data-ol-ignore]')) continue;
        this.push('dom', serializeMutation(m, this.opts));
      }
    });
    this.observer.observe(document.documentElement, {
      childList: true, attributes: true, characterData: true, subtree: true,
    });
  }

  private observeInputs(): void {
    document.addEventListener('input', (e) => {
      const el = e.target as HTMLInputElement;
      if (el.closest?.('[data-ol-ignore]')) return;
      const masked = this.opts.maskAllInputs || !!el.closest?.(this.opts.maskTextSelector || '[data-ol-mask]');
      this.push('input', { path: domPath(el), value: masked ? '***' : el.value });
    }, { capture: true, passive: true });
  }

  private instrumentNetwork(): void {
    const push = this.push.bind(this);
    const origFetch = window.fetch;
    window.fetch = async (...args) => {
      const t0 = performance.now();
      const res = await origFetch(...args);
      push('net', { url: String(args[0]), status: res.status, ms: Math.round(performance.now() - t0) });
      return res;
    };
  }

  private collectVitals(): void {
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) this.push('vitals', { name: e.name, value: e.startTime });
      }).observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
    } catch { /* unsupported */ }
  }

  private flush(sync = false): void {
    if (!this.buf.length) return;
    const body = JSON.stringify({ k: this.key, sid: this.sessionId, ev: this.buf.splice(0) });
    if (sync && navigator.sendBeacon) {
      navigator.sendBeacon(this.opts.endpoint, body);
      return;
    }
    fetch(this.opts.endpoint, { method: 'POST', body, keepalive: true }).catch(() => {});
  }
}

function domPath(el: Element): string {
  const seg: string[] = [];
  let n: Element | null = el;
  while (n && seg.length < 8) {
    const id = n.id ? `#${n.id}` : '';
    seg.unshift(n.tagName.toLowerCase() + id);
    n = n.parentElement;
  }
  return seg.join('>');
}

function serializeMutation(m: MutationRecord, opts: Required<OpenLookOptions>): unknown {
  return { t: m.type, target: domPath(m.target as HTMLElement), added: m.addedNodes.length, removed: m.removedNodes.length, attr: m.attributeName };
}

const singleton = new OpenLook();
export default singleton;
