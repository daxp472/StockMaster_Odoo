# Contributing to StockMaster_Odoo

Thank you for considering contributing! This guide outlines how to set up the project, propose changes, and maintain quality across backend (Node/Express) and frontend (React + TypeScript).

## Table of Contents
- Code of Conduct
- Project Setup
- Branching Strategy
- Commit Message Convention
- Pull Request Guidelines
- Coding Standards
- Testing & Quality
- Security & Responsible Disclosure
- Environments & Secrets
- Documentation
- Release & Versioning
- Contributor Checklist

## Code of Conduct
Be respectful and collaborative. Report unacceptable behavior to the maintainers. By contributing, you agree to uphold a professional and inclusive environment.

## Project Setup

### Prerequisites
- Node.js: LTS (>= 18)
- npm (or pnpm/yarn, stay consistent)
- Git

### Install & Run
Backend:
```
cd backend
npm install
npm run dev   # or npm start if dev script is unavailable
```

Frontend:
```
cd frontend
npm install
npm run dev
```

If you run both, ensure ports do not clash (e.g., Vite default 5173; Express choose 3000 or via env).

## Branching Strategy
- Default branch: `main`
- Create topic branches:
  - Features: `feat/<short-description>`
  - Fixes: `fix/<short-description>`
  - Chores/Docs: `chore/<short-description>` / `docs/<short-description>`

Example: `feat/stock-adjustment-api` or `fix/login-redirect`.

## Commit Message Convention (Conventional Commits)
Use `type(scope): message` format:
- `feat`: add new feature
- `fix`: bug fix
- `docs`: documentation only changes
- `style`: formatting, missing semicolons, etc. (no code change)
- `refactor`: code change that neither fixes a bug nor adds a feature
- `perf`: performance improvement
- `test`: adding or updating tests
- `build`: build system or external dependencies
- `ci`: CI configuration
- `chore`: maintenance tasks

Examples:
```
feat(auth): add JWT refresh token support
fix(api): handle null SKU in stock lookup
docs: update setup steps for Windows
```

## Pull Request Guidelines
- Keep PRs focused and reasonably small.
- Link to related issue or describe the problem clearly.
- Include before/after behavior, screenshots (for UI), and testing notes.
- Ensure CI/lint passes and tests are added/updated.
- Update `README.md`/`SECURITY.md` if behavior or policies change.
- Request review from relevant maintainers.

## Coding Standards

### Backend (Node/Express)
- Use consistent module style (currently CommonJS `require`).
- Validate and sanitize all external input.
- Do not block the event loop; use async/await.
- Handle errors with centralized middleware; avoid `try/catch` silencing.
- Log minimally and avoid sensitive data; prefer structured logs.
- Respect 12‑factor principles (config via env, stateless processes).

### Frontend (React + TypeScript)
- Use functional components and hooks.
- Strongly type props, state, and API responses.
- Keep components focused; extract reusable UI to `components/`.
- Styling: Follow existing Tailwind conventions if present.
- Avoid unnecessary re-renders; use memoization where helpful.

### Lint & Format
- Frontend uses ESLint; fix issues before committing: `npm run lint`.
- If Prettier or other formatters are configured, run them before PR.

## Testing & Quality
- Write unit tests for new logic and critical paths.
- Prefer small, deterministic tests; mock external services.
- If adding endpoints, include validation tests and error cases.
- Measure impact of performance changes; avoid premature optimization.

## Security & Responsible Disclosure
- Follow the project’s security policy: see `SECURITY.md`.
- Never commit secrets; use environment variables and `.env` (excluded from VCS).
- Report vulnerabilities privately; do not file public issues.

## Environments & Secrets
- Use `.env` for local development; document required variables in `README.md`.
- Rotate credentials and keep access scoped.

## Documentation
- Update `README.md` for new features/configuration, including examples.
- Document public APIs (routes, params, responses).
- Add inline comments only where logic is non-obvious; prefer clear naming.

## Release & Versioning
- Follow Semantic Versioning (MAJOR.MINOR.PATCH).
- Aggregate changes in a changelog or release notes.
- For security fixes, coordinate with maintainers per `SECURITY.md`.

## Contributor Checklist
- Branch created from `main` and up to date
- Code, tests, and docs updated
- Lint passed and build successful
- Secrets not committed; environment documented
- PR description clear with issue link and impact

Thank you for contributing and improving StockMaster_Odoo!