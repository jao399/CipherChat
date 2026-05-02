import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ONBOARDING_STORAGE_KEY } from '../constants/storage';
import { LANGUAGE_STORAGE_KEY } from '../i18n/languageStorage';
import { resolvePostSplashRoute } from './startupRoute';

function createStorage(initial?: Record<string, string>) {
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

describe('startup route', () => {
  it('sends first-time users to language selection before onboarding', async () => {
    assert.equal(await resolvePostSplashRoute(createStorage()), 'LanguageSelection');
  });

  it('sends localized users to onboarding when tutorial is not complete', async () => {
    assert.equal(await resolvePostSplashRoute(createStorage({ [LANGUAGE_STORAGE_KEY]: 'ar' })), 'Onboarding');
  });

  it('sends returning localized users to welcome auth flow', async () => {
    assert.equal(
      await resolvePostSplashRoute(
        createStorage({
          [LANGUAGE_STORAGE_KEY]: 'en',
          [ONBOARDING_STORAGE_KEY]: 'true',
        }),
      ),
      'Welcome',
    );
  });
});

