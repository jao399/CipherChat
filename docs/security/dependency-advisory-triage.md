# CipherChat Dependency Advisory Triage

Date: 2026-05-01

## npm Audit Summary

`npm audit --audit-level=moderate` currently reports 11 moderate advisories in Expo transitive tooling paths. The known affected packages are:

- `postcss <8.5.10`, surfaced through Expo Metro/config dependencies.
- `uuid <14.0.0`, surfaced through `xcode` and Expo config tooling dependencies.

The high-severity CI audit gate still passes with `npm audit --omit=dev --audit-level=high`.

## Expo Transitive Advisories

The reported paths are under Expo-managed dependencies such as `expo`, `@expo/cli`, `@expo/config`, `@expo/config-plugins`, `@expo/metro-config`, `@expo/prebuild-config`, `expo-splash-screen`, and `xcode`. They are not direct application imports in CipherChat source.

## Why Forced Fix Is Not Applied

`npm audit fix --force` recommends a breaking Expo version change. This project should not downgrade or force-upgrade Expo without validating Android, iOS, OP-SQLite SQLCipher, Expo development client, and existing navigation/runtime behavior. A forced dependency rewrite could break the currently verified Android release-candidate SQLCipher evidence.

## Current Risk Classification

Current classification: moderate production blocker, monitored and unresolved. The advisories do not close until an Expo-compatible patch or tested SDK upgrade is applied and all validation commands pass again.

## Required Monitoring Action

- Re-run `npm audit --audit-level=moderate` before every release candidate.
- Track Expo SDK and package patch releases for safe dependency updates.
- Prefer Expo-compatible upgrades over manual overrides.
- Record advisory status in `docs/release/production-blocker-burndown.md`.

## Re-Test Requirement Before Release

After any dependency update:

- run `npm install`,
- run `npm run validate:ci`,
- run `npx expo-doctor`,
- rebuild and rerun Android release-candidate SQLCipher evidence,
- rerun iOS SQLCipher evidence when macOS/Xcode or EAS device verification is available,
- run a smoke pass through mock/demo mode.

## Validate And Audit Commands

```powershell
npm run validate:ci
npm audit --omit=dev --audit-level=high
npm audit --audit-level=moderate
```

## Do Not Suppress Advisories

These advisories must remain visible until remediated or formally accepted by release owners after external review. Do not hide them by deleting lockfile entries, suppressing audit output, or applying unvalidated forced fixes.
