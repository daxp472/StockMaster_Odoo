**Security Policy**

- Project: `StockMaster_Odoo`
- Purpose: Safe handling of vulnerabilities and secure releases

**Supported Versions**

- We actively support and patch the latest `main` branch and the most recent
  production release. Older releases may receive fixes on a best‑effort basis.

**Report a Vulnerability**

- Preferred: Email a responsible disclosure to `security@stockmaster.example`.
- Subject: `StockMaster_Odoo Vulnerability Report`
- Include:
  - Clear description and impact (e.g., data exposure, RCE, auth bypass)
  - Steps to reproduce with minimal PoC
  - Affected components (`backend/`, `frontend/`) and versions/commit SHA
  - Environment details (OS, Node version, browser, config)
  - Suggested remediation if known

Do not open public issues for security bugs. Use email or a private channel.

**Our Triage & Response SLAs**

- Acknowledgement: within 72 hours
- Triage: severity assigned within 5 days
- Fix timelines (target):
  - Critical: 72 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 60 days

We will provide status updates until resolution and coordinate release timing.

**Coordinated Disclosure**

- Please keep details confidential until a fix is available.
- We will publish release notes, credit reporters (if desired), and may request
  a CVE if applicable.

**Scope & Out‑of‑Scope Examples**

- In scope:
  - Auth/session flaws, privilege escalation, injection, XSS/CSRF, SSRF, RCE
  - Sensitive data exposure, path traversal, unsafe deserialization
  - Supply‑chain issues in our declared dependencies

- Out of scope:
  - DoS rate‑limiting bypass without practical exploit
  - Issues requiring physical access or social engineering
  - 3rd‑party services not maintained by this project
  - Self‑XSS via user‑controlled fields in dev tooling

**Secure Development Guidelines**

- Secrets: Never commit credentials; use environment variables (`.env`) and
  a secrets manager. Rotate and audit regularly.
- Dependencies: Run `npm audit` and keep `package.json` dependencies updated.
- Input handling: Validate and sanitize; avoid building SQL/OS commands from
  untrusted input.
- Config: Disable debug in production; enforce CORS and secure headers.
- Logging: Avoid logging sensitive data; prefer structured logs.

**Release Process for Security Fixes**

- Prepare fix on a private branch, add tests, and update docs/CHANGELOG.
- Backport to the latest stable release (if applicable).
- Publish advisory with impact, CVE (if any), and upgrade/workaround steps.

**Verifying Fixes**

- Reproduce using reporter steps, confirm failure pre‑fix and success post‑fix.
- Add automated tests to prevent regressions.

**Contact**

- Email: `security@stockmaster.example`
- If email is unavailable, coordinate via a private channel specified by the
  maintainers.

Note: Replace the placeholder email with your real security contact.