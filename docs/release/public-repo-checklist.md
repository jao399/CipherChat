# CipherChat Public Repository Checklist

Date: 2026-05-01

## Validation Commands Run

```powershell
git status
git log --oneline -10
npm run validate:ci
npm run verify:release-evidence
npm audit --audit-level=high
```

Required final validation before changing repository visibility:

```powershell
npm run validate:ci
npm run verify:release-evidence
npm audit --audit-level=high
```

## Secret Scan Command

PowerShell-safe equivalent used for public-release review:

```powershell
git grep -n "PRIVATE KEY\|SECRET\|TOKEN\|PASSWORD\|DATABASE_URL\|API_KEY\|FIREBASE\|APNS\|JWT\|BEGIN RSA\|BEGIN OPENSSH\|BEGIN EC"
```

Expected allowed hits are placeholder docs, local demo examples, environment variable names, test fixtures, and CI service placeholders. Real production secrets must not be present.

## Risky File Scan Command

Unix command requested for manual review:

```bash
find . -type f \( -name ".env*" -o -name "*.apk" -o -name "*.aab" -o -name "*.jks" -o -name "*.keystore" -o -name "*.p12" -o -name "*.mobileprovision" -o -name "*.cer" -o -name "*.key" -o -name "*.log" -o -name "*.dump" -o -name "*.sql" \) -not -path "./node_modules/*" -not -path "./.git/*"
```

Windows-safe tracked-file scan:

```powershell
git ls-files | Select-String -Pattern '(^|/)(\.env[^/]*|.*\.(apk|aab|jks|keystore|p12|mobileprovision|cer|key|log|dump|sql))$'
```

Tracked Prisma migration SQL files are expected source files and are explicitly allowed by `.gitignore`.

## Files That Must Never Be Committed

- `.env` and `.env.*` files with real values
- APK, AAB, IPA, and native build artifacts
- Java/Android keystores and signing files
- Apple certificates, provisioning profiles, and private keys
- Firebase config files containing real project secrets
- APNs/FCM private keys, provider credentials, and push tokens
- database dumps, logs, screenshots with private data, and production infrastructure details
- real user data, private chats, emails, access tokens, safety numbers, or decrypted identifiers

## Screenshots Safety Rules

- Public-safe demo screenshots are allowed only inside `screenshots/`.
- Use mock/demo data only.
- Do not commit screenshots containing secrets, private chats, real accounts, tokens, API keys, emails, database information, personal data, or production infrastructure.
- Screenshots outside `screenshots/` must be reviewed before public release.

## Final GitHub Description

Demo-ready Expo React Native secure messaging prototype with Fastify/PostgreSQL/Redis backend, SQLCipher evidence, trust-state UI, and fail-closed production crypto boundaries.

## Recommended GitHub Topics

- `react-native`
- `expo`
- `typescript`
- `cybersecurity`
- `secure-messaging`
- `mobile-security`
- `postgresql`
- `redis`
- `fastify`
- `prisma`
- `sqlcipher`
- `security-architecture`

## Final Public Status Statement

CipherChat is demo-ready for GitHub, CV, portfolio, and presentation use. It is not production-ready encrypted messaging software.

## Manual Visibility Command

After manual review of the final commit and repository settings, the owner can run:

```bash
gh repo edit --visibility=public
```
