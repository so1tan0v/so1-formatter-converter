import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';

const STORAGE_KEY = 'so1-fmt.window-size.v2';
const DEFAULT_SCALE = 0.95;
const MIN_SIZE = { width: 520, height: 400 };
const STAGE_PAD_X = 0.025;
const STAGE_PAD_Y = 0.025;

export interface WindowSize {
  width: number;
  height: number;
}

export function usePersistedWindowSize(enabled: boolean): {
  ref: RefObject<HTMLDivElement | null>;
  size: WindowSize;
  onGripPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<WindowSize>(() => readStoredSize());
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const onGripPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const handle = event.currentTarget;
      const startX = event.clientX;
      const startY = event.clientY;
      const start = sizeRef.current;

      handle.setPointerCapture(event.pointerId);

      const onMove = (moveEvent: PointerEvent) => {
        const next = clampSize({
          width: start.width + (moveEvent.clientX - startX),
          height: start.height + (moveEvent.clientY - startY),
        });

        sizeRef.current = next;
        setSize(next);
      };

      const onUp = () => {
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);
        writeStoredSize(sizeRef.current);
      };

      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onViewport = () => {
      const next = clampSize(sizeRef.current);

      if (
        next.width === sizeRef.current.width &&
        next.height === sizeRef.current.height
      ) {
        return;
      }

      sizeRef.current = next;
      setSize(next);
    };

    window.addEventListener('resize', onViewport);

    return () => {
      window.removeEventListener('resize', onViewport);
    };
  }, [enabled]);

  return { ref, size, onGripPointerDown };
}

function readStoredSize(): WindowSize {
  if (typeof window === 'undefined') {
    return MIN_SIZE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultSize();
    }

    const parsed = JSON.parse(raw) as Partial<WindowSize>;

    if (
      typeof parsed.width !== 'number' ||
      typeof parsed.height !== 'number' ||
      !Number.isFinite(parsed.width) ||
      !Number.isFinite(parsed.height)
    ) {
      return defaultSize();
    }

    return clampSize({
      width: parsed.width,
      height: parsed.height,
    });
  } catch {
    return defaultSize();
  }
}

function defaultSize(): WindowSize {
  const max = maxSize();

  return clampSize({
    width: max.width * DEFAULT_SCALE,
    height: max.height * DEFAULT_SCALE,
  });
}

function writeStoredSize(size: WindowSize): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(size));
}

function maxSize(): WindowSize {
  if (typeof window === 'undefined') {
    return MIN_SIZE;
  }

  return {
    width: Math.max(
      MIN_SIZE.width,
      Math.round(window.innerWidth * (1 - STAGE_PAD_X * 2)),
    ),
    height: Math.max(
      MIN_SIZE.height,
      Math.round(window.innerHeight * (1 - STAGE_PAD_Y * 2)),
    ),
  };
}

function clampSize(size: WindowSize): WindowSize {
  const max = maxSize();

  return {
    width: Math.min(max.width, Math.max(MIN_SIZE.width, Math.round(size.width))),
    height: Math.min(
      max.height,
      Math.max(MIN_SIZE.height, Math.round(size.height)),
    ),
  };
}
