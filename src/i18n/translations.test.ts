import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { translate, translations, type TranslationKey } from './translations';

describe('translations', () => {
  it('returns English and Arabic labels for core navigation', () => {
    assert.equal(translate('en', 'tabs.settings'), 'Settings');
    assert.equal(translate('ar', 'tabs.settings'), 'الإعدادات');
  });

  it('keeps Arabic production security warning honest', () => {
    const warning = translate('ar', 'security.warning.notProductionReady');

    assert.match(warning, /نموذج تجريبي/);
    assert.match(warning, /محظور/);
    assert.match(warning, /Signal\/libsignal/);
  });

  it('keeps Arabic dictionary coverage aligned with English', () => {
    assert.deepEqual(Object.keys(translations.ar).sort(), Object.keys(translations.en).sort());
  });

  it('falls back to English when a locale entry is absent at runtime', () => {
    const missingKey = 'tabs.chats' as TranslationKey;
    const arabicTranslations = translations.ar as unknown as Record<string, string>;
    const original = arabicTranslations[missingKey];

    delete arabicTranslations[missingKey];
    assert.equal(translate('ar', missingKey), 'Chats');
    arabicTranslations[missingKey] = original;
  });
});
