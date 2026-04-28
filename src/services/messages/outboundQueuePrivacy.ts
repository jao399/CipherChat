const forbiddenPlaintextKeys = new Set([
  'body',
  'content',
  'draft',
  'message',
  'messagebody',
  'messagetext',
  'plainbody',
  'plaintext',
  'text',
]);

function normalizeKey(key: string) {
  return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function collectPlaintextFieldPaths(value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectPlaintextFieldPaths(item, `${path}[${index}]`));
  }

  if (!isObject(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const nextPath = `${path}.${key}`;
    const normalized = normalizeKey(key);
    const ownLeak = forbiddenPlaintextKeys.has(normalized) ? [nextPath] : [];
    return [...ownLeak, ...collectPlaintextFieldPaths(child, nextPath)];
  });
}

export function findOutboundQueuePlaintextFields(value: unknown) {
  return collectPlaintextFieldPaths(value);
}

export function assertNoPlaintextFieldsInOutboundQueue(value: unknown) {
  const leaks = findOutboundQueuePlaintextFields(value);

  if (leaks.length > 0) {
    throw new Error(`Outbound queue records must not contain plaintext fields: ${leaks.join(', ')}`);
  }
}
