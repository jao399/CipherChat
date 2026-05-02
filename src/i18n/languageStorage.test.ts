import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  LANGUAGE_STORAGE_KEY,
  clearStoredLanguage,
  readStoredLanguage,
  writeStoredLanguage,
} from './languageStorage';

function createMemoryStorage(initial?: Record<string, string>) {
  const data = new Map(Object.entries(initial ?? {}));

  return {
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: async (key: string) => {
      data.delete(key);
    },
  };
}

describe('language storage', () => {
  it('returns null until a supported language is selected', async () => {
    assert.equal(await readStoredLanguage(createMemoryStorage()), null);
    assert.equal(await readStoredLanguage(createMemoryStorage({ [LANGUAGE_STORAGE_KEY]: 'fr' })), null);
  });

  it('persists and clears the selected language', async () => {
    const storage = createMemoryStorage();

    await writeStoredLanguage('ar', storage);
    assert.equal(await readStoredLanguage(storage), 'ar');

    await clearStoredLanguage(storage);
    assert.equal(await readStoredLanguage(storage), null);
  });
});

