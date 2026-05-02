# Phase 85 - Arabic Localization And First-Launch Language Selection

## What Was Added

Phase 85 adds a lightweight in-app localization layer for English and Arabic without changing CipherChat's production security status. The implementation keeps translation dictionaries, storage, RTL helpers, and provider code under `src/i18n/`.

## First-Launch Flow

The post-splash route now checks for a stored language before checking onboarding state:

Splash -> Language Selection -> Onboarding -> Welcome/Auth -> Device Verification -> Main Tabs

Returning users with a stored language keep the existing onboarding/auth behavior. Resetting onboarding does not erase the selected language.

## Storage Key

Selected language is stored in AsyncStorage with `@cipherchat/language-v1`.

Unsupported stored values are ignored and treated as missing, which sends first-time users back to Language Selection.

## RTL Behavior

Arabic uses RTL-aware helpers for text alignment, row direction, and directional chevrons where practical. The app calls React Native `I18nManager.forceRTL` when the selected language direction changes. React Native may require closing and reopening the app for the whole layout tree to fully apply RTL direction.

## Settings Language Switching

Settings now includes a Language section with current language, English, Arabic, and a restart note when a direction change may require reopening the app.

## Translation Coverage

Phase 85 localizes the first-launch language screen, onboarding carousel, welcome/auth screens, main tab labels, chat/search/empty states, conversation warnings/composer labels, calls/files/contacts headings and actions, device verification, secure file transfer, privacy dashboard title, settings readiness labels, and about screen copy.

Security wording in Arabic keeps the same meaning as English: CipherChat is a demo prototype, not production-ready encrypted messaging software, and production message encryption remains blocked until a reviewed Signal/libsignal adapter is installed.

## Known Limitations

- Some mock contact names, timestamps, sample file names, and backend-provided readiness strings remain source data rather than translated UI copy.
- Full RTL layout direction may require app close/reopen after switching between English and Arabic.
- Localization does not implement or certify Signal/libsignal, production file encryption, push provider evidence, native non-exportable signing keys, or iOS SQLCipher evidence.

## Testing Notes

Phase 85 adds tests for translation lookup, Arabic security warning wording, language storage behavior, and startup routing to Language Selection before onboarding for first-time users.

