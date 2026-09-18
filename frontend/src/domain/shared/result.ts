export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function failure<T = never>(error: string): Result<T> {
  return { ok: false, error };
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown error';
}
