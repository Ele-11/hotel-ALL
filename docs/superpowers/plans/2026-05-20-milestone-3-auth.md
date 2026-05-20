# Milestone 3 Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build registration, login, current-user lookup, and role-based API access control for USER, MERCHANT, and ADMIN accounts.

**Architecture:** The API owns password hashing, token signing, current-user extraction, and role guards. The web app provides a small login/register experience and stores the token client-side for `/auth/me`; future milestones can reuse the auth helpers without receiving hotel, audit, or booking business logic early.

**Tech Stack:** Nest.js, TypeScript, Prisma, PostgreSQL, React 18, Tailwind CSS, Axios, Zustand.

---

### Task 1: Backend Auth Services

**Files:**
- Create: `apps/api/src/prisma/prisma.module.ts`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/auth/password.service.ts`
- Create: `apps/api/src/auth/token.service.ts`
- Create: `apps/api/src/auth/current-user.type.ts`
- Test: `apps/api/src/auth/password.service.spec.ts`
- Test: `apps/api/src/auth/token.service.spec.ts`

- [x] Write failing unit tests for password hashing and token verification.
- [x] Run the focused tests and confirm they fail because services do not exist.
- [x] Implement Prisma, password, token, and user type services.
- [x] Run focused tests and confirm they pass.

### Task 2: Auth API

**Files:**
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/dto/register.dto.ts`
- Create: `apps/api/src/auth/dto/login.dto.ts`
- Create: `apps/api/src/auth/current-user.decorator.ts`
- Create: `apps/api/src/auth/auth.guard.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`
- Test: `apps/api/test/auth.e2e-spec.ts`

- [x] Write failing e2e tests for register, login, `/auth/me`, ADMIN registration rejection, and bad credentials.
- [x] Run e2e tests and confirm they fail because routes do not exist.
- [x] Implement auth module, controller, service, guard, and response envelope handling.
- [x] Run focused e2e tests and confirm they pass.

### Task 3: Role Guards

**Files:**
- Create: `apps/api/src/auth/roles.decorator.ts`
- Create: `apps/api/src/auth/roles.guard.ts`
- Test: `apps/api/src/auth/roles.guard.spec.ts`

- [x] Write failing unit tests for USER, MERCHANT, ADMIN, unauthenticated, and forbidden role cases.
- [x] Run focused tests and confirm they fail because the guard does not exist.
- [x] Implement role metadata and guard.
- [x] Run focused tests and confirm they pass.

### Task 4: Seed Password Hashing

**Files:**
- Modify: `apps/api/prisma/seed.ts`
- Modify: `.env.example`
- Modify: `apps/api/.env.example`

- [x] Add tests or existing auth e2e coverage proving seeded users can authenticate with hashed passwords.
- [x] Update seed to store hashed passwords and avoid hard-coded production secrets.
- [x] Document local auth secret and optional seed passwords in env examples.
- [x] Run backend tests.

### Task 5: Frontend Auth Entry

**Files:**
- Create: `apps/web/src/types/auth.ts`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/store/auth-store.ts`
- Create: `apps/web/src/components/AuthForm.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/package.json`

- [x] Add Axios and Zustand only if they are still absent.
- [x] Implement login/register form with USER and MERCHANT registration only.
- [x] Persist token and restore current user with `/auth/me`.
- [x] Show role-aware destination cards without implementing later milestone pages.
- [x] Run web typecheck and build.

### Task 6: Final Verification

**Files:**
- All changed files

- [x] Run `pnpm --filter @hotel/api test`.
- [x] Run `pnpm --filter @hotel/api test:e2e`.
- [x] Run `pnpm --filter @hotel/api typecheck`.
- [x] Run `pnpm --filter @hotel/api build`.
- [x] Run `pnpm --filter @hotel/web typecheck`.
- [x] Run `pnpm --filter @hotel/web build`.
- [x] Run root `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` when feasible.
