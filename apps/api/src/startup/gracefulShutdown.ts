export type ShutdownLogger = {
  error(error: unknown, message?: string): void;
  info?(message: string): void;
};

export type GracefulShutdownOptions = {
  label: string;
  close: () => Promise<void>;
  logger?: ShutdownLogger;
  exit?: (code: number) => never;
};

export function createGracefulShutdown({ label, close, logger, exit = process.exit }: GracefulShutdownOptions) {
  let closing: Promise<void> | null = null;

  return async function shutdown(signal: NodeJS.Signals | 'manual' = 'manual') {
    if (!closing) {
      logger?.info?.(`${label} shutting down after ${signal}`);
      closing = close();
    }

    try {
      await closing;
    } catch (error) {
      logger?.error(error, `${label} shutdown failed`);
      exit(1);
    }

    exit(0);
  };
}
