# E-Commerce TypeScript Compilation Error Analysis

**Total Errors:** 2,159 | **Date:** 2026-04-24

---

## 1. **TSX/JSX Configuration Issues**

**File Count:** 28 files | **Error Count:** 1,843 errors

**Error Pattern:**
```
TS17004: Cannot use JSX unless the '--jsx' flag is provided.
TS6142: Module '<file>' was resolved to '.tsx', but '--jsx' is not set.
```

**Affected Files:**
- Backend email templates: `backend/src/emails/*.tsx` (4 files)
- Frontend admin pages: `frontend/src/app/(admin)/**/*.tsx` (10+ files)
- Frontend auth pages: `frontend/src/app/(auth)/**/*.tsx` (5+ files)
- Frontend public pages: `frontend/src/app/(public)/**/*.tsx` (5+ files)

**Root Cause:** Backend `tsconfig.json` has `"jsx": "react"` but the TypeScript compiler is not recognizing `.tsx` files. Frontend correctly uses `"jsx": "react-jsx"` with `next.config.ts` plugin. Backend TSX files are being treated as if they're in a Node.js environment without JSX support.

---

## 2. **Module Resolution Errors**

**File Count:** 12 files | **Error Count:** 236 errors

**Error Pattern:**
```
TS2307: Cannot find module '<path>' or its corresponding type declarations.
```

**Common Missing Modules:**
- `@/lib/mongoose` (38 errors in frontend API routes)
- `@/lib/api-response` (28 errors)
- `@/models/Product` (20 errors)
- `@/models/Order` (16 errors)
- `@/models/AuditLog`, `@/models/User`, `@/models/Review` (12-14 errors each)
- `../../shared/constants` (9 errors in backend jobs)
- `../../frontend/src/models/*` (18 errors in backend)
- `@jest/globals` (2 errors in test files)

**Affected Files:**
- Test files: `__tests__/**/*.ts` (7 errors)
- Backend jobs: `backend/src/jobs/*.ts` (9 errors)
- Backend middleware: `backend/src/middleware/*.ts` (3 errors)
- Backend services: `backend/src/services/*.ts` (15 errors)

**Root Cause:** Cross-workspace imports using relative paths (`../../frontend/src/models/`) instead of alias paths. Frontend has path aliases configured, but backend does not. The `shared/` package is not accessible via configured aliases in backend's `tsconfig.json`.

---

## 3. **API Route Type Issues**

**File Count:** 15+ files | **Error Count:** 28+ errors

**Error Pattern:**
```
TS7006: Parameter '<name>' implicitly has an 'any' type.
TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'.
```

**Affected Files:**
- `frontend/src/app/(auth)/checkout/CheckoutClient.tsx` (2+ implicit any)
- `frontend/src/app/(admin)/dashboard/page.tsx` (implicit any in order reducer)
- `frontend/src/app/(auth)/checkout/page.tsx` (implicit any in address filter)
- `frontend/src/app/(public)/page.tsx` (2+ implicit any in map callbacks)
- `frontend/src/app/(public)/cart/page.tsx` (implicit any in item mapping)

**Root Cause:** Arrow function parameters lack explicit type annotations. React Server Components and client components need `unknown` narrowed to proper types before use. Email component type mismatches in `backend/src/jobs/email.queue.ts` due to union type not narrowing properly.

---

## 4. **Backend Service Type Issues**

**File Count:** 6 files | **Error Count:** 12+ errors

**Error Pattern:**
```
TS2307: Cannot find module '../../frontend/src/models/*'
TS2307: Cannot find module '../../shared/constants'
TS6142: Module resolved to .tsx but '--jsx' is not set
```

**Affected Files:**
- `backend/src/services/order.service.ts` (imports models and shared utils)
- `backend/src/services/payment.service.ts` (imports models)
- `backend/src/services/product.service.ts` (imports models and shared)
- `backend/src/services/email.service.ts` (imports .tsx email components)
- `backend/src/services/notification.service.ts` (imports models)
- `backend/src/services/cloudinary.service.ts` (imports shared utils)

**Root Cause:** Backend cannot import from frontend using relative paths. No path alias configuration in `backend/tsconfig.json` for `@/*` or `@stylemart/*`. Email service imports TSX files which require JSX support.

---

## 5. **Backend Job/Queue Issues**

**File Count:** 4 files | **Error Count:** 15+ errors

**Error Pattern:**
```
TS2307: Cannot find module '../../shared/constants' or '../../frontend/src/models/*'
TS7006: Parameter '<name>' implicitly has an 'any' type
TS2345: Argument of type 'X' is not assignable to type 'Y' (union type mismatch)
```

**Affected Files:**
- `backend/src/jobs/cleanup.queue.ts` (2 model imports + constants)
- `backend/src/jobs/email.queue.ts` (1 model import, 3 type mismatches, constants)
- `backend/src/jobs/notification.queue.ts` (constants import)
- `backend/src/jobs/stock-alert.queue.ts` (2 model imports, 1 implicit any, constants)

**Root Cause:** Jobs lack proper TypeScript path aliases for monorepo imports. Email queue job handler has loose union types on email data — switch cases don't narrow type correctly. Parameter types missing (`admin` parameter has no type annotation).

---

## 6. **Middleware Type Issues**

**File Count:** 2 files | **Error Count:** 5 errors

**Error Pattern:**
```
TS2307: Cannot find module '../../frontend/src/models/*'
```

**Affected Files:**
- `backend/src/middleware/auth.middleware.ts` (cannot find User model)
- `backend/src/middleware/error.middleware.ts` (cannot find AuditLog model)

**Root Cause:** Same as services — backend middleware attempts relative imports of frontend models without proper path resolution.

---

## 7. **Test File Issues**

**File Count:** 3 files | **Error Count:** 12+ errors

**Error Pattern:**
```
TS2307: Cannot find module '@jest/globals' or '@/lib/mongoose'
TS2304: Cannot find name 'jest'
TS2540: Cannot assign to 'NODE_ENV' because it is a read-only property
```

**Affected Files:**
- `__tests__/api.test.ts` (6 module import errors)
- `__tests__/payment-order.test.ts` (1 module import error)
- `__tests__/setup.ts` (3 module import + 1 readonly property error)

**Root Cause:** Test files lack Jest type declarations (`@jest/globals` not installed or not in tsconfig includes). They import from frontend using `@/` alias which isn't configured at root level. `NODE_ENV` assignment violates TypeScript readonly constraint.

---

## Summary Table

| Category | Files | Errors | Root Cause |
|---|---|---|---|
| TSX/JSX Config | 28 | 1,843 | Backend JSX support not configured; .tsx not recognized by tsc |
| Module Resolution | 12 | 236 | Cross-workspace relative imports; missing path aliases in backend |
| API Route Types | 15+ | 28+ | Implicit `any` in callback parameters; union type not narrowing |
| Backend Services | 6 | 12+ | Relative imports of frontend models; JSX imports without support |
| Backend Jobs | 4 | 15+ | Path alias missing; loose union types; implicit any parameters |
| Middleware | 2 | 5 | Relative imports of frontend models |
| Test Files | 3 | 12+ | Missing Jest types; @/ alias not in root tsconfig; readonly property |

---

## Priority Fixes Required

1. **Critical:** Add `"jsx": "preserve"` to `backend/tsconfig.json` and configure path aliases
2. **Critical:** Create `backend/tsconfig.json` path aliases for `@/*` → `frontend/src/*` and `@stylemart/*` → `shared/*`
3. **High:** Add `@types/jest` and configure Jest types in test tsconfig
4. **High:** Type all implicit `any` parameters (use `unknown` + type guards where needed)
5. **Medium:** Extract email templates to shared package or use `render-to-string` without JSX in service layer
