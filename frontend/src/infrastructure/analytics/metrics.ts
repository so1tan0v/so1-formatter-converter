const ENDPOINT = '/api/metrics/collect';
const VISIT_KEY = 'so1-fmt.visit';

interface VisitState {
  id: string;
  accumulatedMs: number;
  visibleSince: number | null;
}

interface MetricsContext {
  lang: string;
  embed: boolean;
}

let state: VisitState | null = null;
let booted = false;
let context: MetricsContext = { lang: 'en', embed: false };
let lastView = { path: '', at: 0 };

/**
 * Запоминает язык и признак встраивания для следующих событий
 *
 * @param next Текущий язык и режим iframe
 */
export function setMetricsContext(next: MetricsContext): void {
  context = next;
}

/**
 * Открывает визит один раз за вкладку
 *
 * @param path Первый путь
 */
export function ensureVisit(path: string): void {
  if (booted || typeof window === 'undefined') {
    return;
  }

  booted = true;
  state = readState() ?? {
    id: crypto.randomUUID(),
    accumulatedMs: 0,
    visibleSince: document.visibilityState === 'visible' ? Date.now() : null,
  };
  persist();
  void send({ kind: 'start', path, durationMs: elapsed() });
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onHide);
  window.setInterval(() => {
    void send({ kind: 'heartbeat', durationMs: elapsed() });
  }, 20_000);
}

/**
 * Сообщает о действии на сайте
 *
 * @param name Имя действия
 * @param target Раздел или путь
 */
export function trackAction(name: string, target?: string): void {
  if (!state || typeof window === 'undefined') {
    return;
  }

  const path = target || window.location.pathname;

  if (name === 'view' && (path === '/' || path === '')) {
    return;
  }

  if (name === 'view' && lastView.path === path && Date.now() - lastView.at < 80) {
    return;
  }

  if (name === 'view') {
    lastView = { path, at: Date.now() };
  }

  void send({ kind: 'event', name, target: path });
}

function onVisibility(): void {
  if (!state) {
    return;
  }

  if (document.visibilityState === 'hidden') {
    flush();
    void send({ kind: 'heartbeat', durationMs: elapsed() });

    return;
  }

  state.visibleSince = Date.now();
  persist();
}

function onHide(): void {
  flush();
  send({ kind: 'end', durationMs: elapsed() }, true);
}

function flush(): void {
  if (!state?.visibleSince) {
    return;
  }

  state.accumulatedMs += Math.max(0, Date.now() - state.visibleSince);
  state.visibleSince = null;
  persist();
}

function elapsed(): number {
  if (!state) {
    return 0;
  }

  const live = state.visibleSince
    ? Math.max(0, Date.now() - state.visibleSince)
    : 0;

  return state.accumulatedMs + live;
}

function send(
  body: {
    kind: string;
    path?: string;
    name?: string;
    target?: string;
    durationMs?: number;
  },
  beacon = false,
): void {
  if (!state) {
    return;
  }

  const payload = JSON.stringify({
    visitId: state.id,
    lang: context.lang,
    embed: context.embed,
    ...body,
  });

  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon(
      ENDPOINT,
      new Blob([payload], { type: 'application/json' }),
    );

    return;
  }

  void fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}

function readState(): VisitState | null {
  try {
    const raw = sessionStorage.getItem(VISIT_KEY);

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isState(parsed)) {
      return null;
    }

    return {
      ...parsed,
      visibleSince: document.visibilityState === 'visible' ? Date.now() : null,
    };
  } catch {
    return null;
  }
}

function persist(): void {
  if (!state) {
    return;
  }

  try {
    sessionStorage.setItem(
      VISIT_KEY,
      JSON.stringify({
        id: state.id,
        accumulatedMs: state.accumulatedMs,
        visibleSince: state.visibleSince,
      }),
    );
  } catch {
    return;
  }
}

function isState(value: unknown): value is VisitState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === 'string' &&
    typeof record.accumulatedMs === 'number' &&
    (record.visibleSince === null || typeof record.visibleSince === 'number')
  );
}
