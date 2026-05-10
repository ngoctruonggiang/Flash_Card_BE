# FlashLearn — SAD v3.0 Quality Attribute Implementation Plan

> **Source**: SOFTWARE ARCHITECTURE DOCUMENT v3.0 (April 2026)
> **Scope**: All 7 Architectural Drivers (AD-01 → AD-07), 7 QA Scenarios (S1–S7), 21 Tactics (T1–T21)

---

## 1. Architectural Drivers Summary

| ID | QA | Scenario | BV | TR | Status |
|----|-----|----------|----|----|--------|
| AD-01 | Performance/Latency | Due-card query ≤ 500ms on 50k cards | H | H | ⚠️ Partial |
| AD-02 | Availability/Offline | Study continues offline; sync on reconnect | M | H | ❌ Missing |
| AD-03 | Security/Authorization | Resource-Level Auth: owner-only mutation | H | M | ⚠️ Partial |
| AD-04 | Reliability/Transactions | All mutations atomic with rollback | H | M | ⚠️ Partial |
| AD-05 | Security/Authentication | JWT + brute-force lockout after 5 failures | H | M | ❌ Missing |
| AD-06 | Security/Confidentiality | Password hash never sent to client | H | M | ✅ Done |
| AD-07 | Scalability/Data Volume | 100+ decks load ≤ 1s via pagination | H | M | ❌ Missing |

---

## 2. Gap Analysis

### ✅ Already Implemented

| SAD Requirement | Current Implementation | File |
|---|---|---|
| T13 — SM2 pure function | `AnkiScheduler.calculateNext()` — zero I/O | `src/services/scheduler.ts` |
| T8 — Atomic review TX | `prisma.$transaction()` for card+review | `src/services/review/review.service.ts` |
| T17 — JWT Authentication | `AuthGuard` verifies JWT, populates `req.user` | `src/middleware/guards/auth.guard.ts` |
| T6 — Generic error messages | `"Invalid email or password"` — never distinguishes | `src/services/auth/auth.service.ts` |
| T9 — Global error handler | `GlobalExceptionFilter` catches all errors | `src/middleware/filters/global.filter.ts` |
| T19 — Input validation | `ValidationPipe` with whitelist + forbidNonWhitelisted | `src/main.ts` |
| T2 — ProfileDTO filtering | `UserDto` excludes `passwordHash` | `src/services/user/user.service.ts` |
| T18 — bcrypt rounds ≥ 10 | `saltOrRounds: 10` | `src/utils/constants.ts` |
| T20 — CASCADE deletes | `onDelete: Cascade` on all FK relations | `prisma/schema.prisma` |
| UC-14 — BIDIRECTIONAL | Auto-creates reverse card | `src/services/card/card.service.ts` |
| Roles Guard | Checks user role against route config | `src/middleware/guards/roles.guard.ts` |
| Ownership checks (partial) | `findOne/update/remove` check userId | `src/services/deck/deck.service.ts` |

### ❌ Gaps to Fill

| SAD Requirement | Gap Description | Priority |
|---|---|---|
| T1 — Composite DB Index | No index on `(deckId, nextReviewDate)` for Card; no `(userId, updatedAt)` for Deck | **CRITICAL** |
| T7 — Paginated Deck Library | `findByUser()` returns ALL decks — no LIMIT/OFFSET | **HIGH** |
| T5 — BruteForceGuard | No `LoginAttempt` table, no lockout mechanism | **HIGH** |
| T4 — ResourceAuthMiddleware | Ownership in services, not as middleware/guard | **MEDIUM** |
| T10/T11 — Offline Batch Sync | No `POST /api/study/review/batch` endpoint | **MEDIUM** |
| T8 — Transactional cascade delete | `deck.remove()` uses 3 separate queries, not `$transaction` | **MEDIUM** |
| Health endpoint | No `GET /api/health` for load balancer | **LOW** |

---

## 3. Implementation Tasks

### Phase 1: Database Schema & Indexes (AD-01, AD-05, AD-07)

**File: `prisma/schema.prisma`**

**Task 1.1 — Add composite indexes (T1)**
```prisma
// Card model — add composite index for findDueCards query
@@index([deckId, nextReviewDate])

// Deck model — add composite index for paginated library
@@index([userId, updatedAt])
```

**Task 1.2 — Add LoginAttempt model (T5)**
```prisma
model LoginAttempt {
  id          Int      @id @default(autoincrement())
  email       String
  ipAddress   String
  success     Boolean  @default(false)
  attemptedAt DateTime @default(now())

  @@index([email, attemptedAt])
  @@index([ipAddress, attemptedAt])
}
```

**Task 1.3 — Add lockedUntil to User model**
```prisma
lockedUntil DateTime? // Account lockout timestamp (AD-05)
```

**Task 1.4 — Run migration**
```bash
npx prisma migrate dev --name add_perf_indexes_and_login_attempts
```

---

### Phase 2: BruteForceGuard (AD-05, Scenario S2)

> SAD: *"login_attempts table tracks (email, ip, timestamp). After 5 failures: lockout. Fails open on DB error."*

#### Step 2.0 — Add brute-force config to `.env` + `src/utils/constants.ts`

**`.env`** — add the following variables (no magic numbers in code):
```dotenv
BRUTE_FORCE_MAX_ATTEMPTS=5
BRUTE_FORCE_LOCKOUT_MINUTES=15
BRUTE_FORCE_WINDOW_MINUTES=15
```

**`src/utils/constants.ts`** — read from `process.env`, with safe numeric defaults:
```typescript
export const bruteForceConstants = {
  maxAttempts: parseInt(process.env.BRUTE_FORCE_MAX_ATTEMPTS ?? '5', 10),
  lockoutMinutes: parseInt(process.env.BRUTE_FORCE_LOCKOUT_MINUTES ?? '15', 10),
  windowMinutes: parseInt(process.env.BRUTE_FORCE_WINDOW_MINUTES ?? '15', 10),
};
```

**New file: `src/services/auth/brute-force.service.ts`**

```typescript
import { bruteForceConstants } from '../../utils/constants';

@Injectable()
export class BruteForceService {
  constructor(private prisma: PrismaService) {}

  // All thresholds sourced from bruteForceConstants — no inline magic numbers.
  async checkLockout(email: string): Promise<{locked: boolean; attemptsLeft: number; lockoutUntil?: Date}> {
    const { maxAttempts, lockoutMinutes, windowMinutes } = bruteForceConstants;
    try {
      const windowStart = new Date(Date.now() - windowMinutes * 60_000);
      const recentFailures = await this.prisma.loginAttempt.count({
        where: { email, success: false, attemptedAt: { gte: windowStart } },
      });
      if (recentFailures >= maxAttempts) {
        const lastAttempt = await this.prisma.loginAttempt.findFirst({
          where: { email, success: false }, orderBy: { attemptedAt: 'desc' },
        });
        const lockoutUntil = new Date(
          lastAttempt!.attemptedAt.getTime() + lockoutMinutes * 60_000,
        );
        if (new Date() < lockoutUntil) {
          return { locked: true, attemptsLeft: 0, lockoutUntil };
        }
      }
      return { locked: false, attemptsLeft: maxAttempts - recentFailures };
    } catch (error) {
      console.warn('BruteForceGuard: DB error, fail-open', error);
      return { locked: false, attemptsLeft: maxAttempts }; // Fail-open (T5)
    }
  }

  async recordAttempt(email: string, ip: string, success: boolean): Promise<void> {
    try {
      await this.prisma.loginAttempt.create({
        data: { email, ipAddress: ip, success },
      });
      if (success) {
        // Clear old failures on successful login
        await this.prisma.loginAttempt.deleteMany({
          where: { email, success: false },
        });
      }
    } catch (error) {
      console.warn('BruteForceGuard: Failed to record attempt', error);
    }
  }
}
```

**Modify: `src/services/auth/auth.service.ts`**
- Inject `BruteForceService`
- In `signIn()`: call `checkLockout()` before password check → return 429 if locked
- After password check: call `recordAttempt(email, ip, success)`

---

### Phase 3: Paginated Deck Library (AD-07, Scenario S6)

> SAD: *"findByUserIdPaginated(userId, page=1, size=20) → {decks, total, page}"*

#### Step 3.0 — Add pagination defaults to `src/utils/constants.ts`

```typescript
export const paginationConstants = {
  defaultPage: parseInt(process.env.PAGINATION_DEFAULT_PAGE ?? '1', 10),
  defaultSize: parseInt(process.env.PAGINATION_DEFAULT_SIZE ?? '20', 10),
  maxSize:     parseInt(process.env.PAGINATION_MAX_SIZE     ?? '100', 10),
};
```

Optionally add to `.env` to allow ops-level tuning without code changes:
```dotenv
PAGINATION_DEFAULT_PAGE=1
PAGINATION_DEFAULT_SIZE=20
PAGINATION_MAX_SIZE=100
```

**Modify: `src/services/deck/deck.service.ts`**

```typescript
import { paginationConstants } from '../../utils/constants';

async findByUserPaginated(
  userId: number,
  page: number = paginationConstants.defaultPage,
  size: number = paginationConstants.defaultSize,
) {
  // Clamp size to prevent excessive data fetches
  const safeSize = Math.min(size, paginationConstants.maxSize);
  const skip = (page - 1) * safeSize;
  const [decks, total] = await Promise.all([
    this.prisma.deck.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },  // Uses composite index (userId, updatedAt)
      skip, take: safeSize,
      include: { cards: { select: { id: true, status: true, nextReviewDate: true } } },
    }),
    this.prisma.deck.count({ where: { userId } }),
  ]);
  return { decks, total, page, size: safeSize, totalPages: Math.ceil(total / safeSize) };
}
```

**Modify: `src/controllers/deck/deck.controller.ts`**
- Add `@Query('page')` and `@Query('size')` to `findAllCurrentUser()`
- Call `findByUserPaginated()` when page param is provided
- Keep backward compatibility: no page param → return all

---

### Phase 4: ResourceAuthMiddleware (AD-03, Scenario S3)

> SAD: *"ResourceAuthMiddleware: DeckRepo.findByIdAndOwner(deckId, userId) per mutating request. 403 if null."*

#### Step 4.0 — Add resource-auth message constants to `src/utils/constants.ts`

No magic strings or role literals in guard logic. Define them as constants:

```typescript
export const authMessages = {
  accessDenied: 'MSG-AUTH-01: Access denied',
  invalidCredentials: 'Invalid email or password', // T6 — generic, never leaks which field failed
};

export const roles = {
  admin: 'ADMIN',
  user: 'USER',
} as const;

export type Role = typeof roles[keyof typeof roles];
```

**New file: `src/middleware/guards/resource-auth.guard.ts`**

```typescript
import { authMessages, roles } from '../../utils/constants';

@Injectable()
export class ResourceAuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resourceType = this.reflector.get<string>('resourceType', context.getHandler());
    if (!resourceType) return true;

    const request = context.switchToHttp().getRequest();
    const user = request['user'];
    const method = request.method;

    // Admin read-only access is permitted (UC-24) — role sourced from constants, not a string literal
    if (user?.role === roles.admin && method === 'GET') return true;

    const resourceId = parseInt(request.params.id || request.params.deckId);
    if (!resourceId || !user) return false;

    if (resourceType === 'deck') {
      const deck = await this.prisma.deck.findFirst({
        where: { id: resourceId, userId: user.id },
      });
      // Error message sourced from authMessages — not a raw string literal
      if (!deck) throw new ForbiddenException(authMessages.accessDenied);
    } else if (resourceType === 'card') {
      const card = await this.prisma.card.findFirst({
        where: { id: resourceId, deck: { userId: user.id } },
      });
      if (!card) throw new ForbiddenException(authMessages.accessDenied);
    }
    return true;
  }
}
```

**New decorator: `@ResourceType('deck')` / `@ResourceType('card')`**

Apply to `PATCH`/`DELETE` endpoints on deck and card controllers.

---

### Phase 5: Optimized findDueCards (AD-01, Scenario S1)

> SAD: *"findDueCards(deckId, userId, today) → Card[] sorted overdue first. Query ≤ 300ms."*

**Modify: `src/services/review/review.service.ts` — `getDueReviews()`**

```typescript
async getDueReviews(deckId: number, userId: number, limit?: number): Promise<Card[]> {
  // Verify ownership (AD-03)
  const deck = await this.prismaService.deck.findFirst({
    where: { id: deckId, userId },
  });
  if (!deck) throw new NotFoundException('Deck not found');

  const today = new Date();
  return this.prismaService.card.findMany({
    where: {
      deckId,
      OR: [
        { nextReviewDate: { lte: today } },  // Overdue cards
        { status: 'new' },                    // New cards
        { status: 'learning', nextReviewDate: { lte: today } },
        { status: 'relearning', nextReviewDate: { lte: today } },
      ],
    },
    orderBy: { nextReviewDate: 'asc' },  // Overdue first → uses composite index
    take: limit,
  });
}
```

**Modify: `src/controllers/study/study.controller.ts`**
- Pass `user.id` to `getDueReviews()` for ownership verification

---

### Phase 6: Transactional Operations (AD-04, Scenario S4)

> SAD: *"All mutations atomic with rollback on failure."*

**Task 6.1 — Wrap deck cascade delete in transaction**

**Modify: `src/services/deck/deck.service.ts` — `remove()`**
```typescript
import { authMessages } from '../../utils/constants';

async remove(id: number, userId?: number) {
  const deck = await this.prisma.deck.findUnique({ where: { id } });
  if (!deck) throw new NotFoundException(`Deck #${id} not found`);
  if (userId !== undefined && deck.userId !== userId)
    // Use shared authMessages constant — no raw string literals
    throw new ForbiddenException(authMessages.accessDenied);

  return this.prisma.$transaction(async (tx) => {
    const cardIds = (await tx.card.findMany({
      where: { deckId: id }, select: { id: true }
    })).map(c => c.id);

    if (cardIds.length > 0) {
      await tx.cardReview.deleteMany({ where: { cardId: { in: cardIds } } });
    }
    await tx.card.deleteMany({ where: { deckId: id } });
    return tx.deck.delete({ where: { id } });
  });
}
```

**Task 6.2 — Wrap user profile update in transaction**

**Modify: `src/services/user/user.service.ts` — `update()`**
- Wrap conflict checks + update in `prisma.$transaction()`

**Task 6.3 — Wrap account deletion in transaction (UC-06)**

**Modify: `src/services/user/user.service.ts` — `remove()`**
- Cascade: reviews → cards → decks → user in single `$transaction()`

---

### Phase 7: Batch Review Sync Endpoint (AD-02, Scenario S5)

> SAD: *"POST /api/study/review/batch [{queued reviews}]. Server processes atomically."*

**New DTO: `src/utils/types/dto/review/batchReview.dto.ts`**
```typescript
export class BatchReviewItemDto {
  @IsInt() cardId: number;
  @IsEnum(ReviewQuality) quality: ReviewQuality;
  @IsDateString() reviewedAt: string;
}

export class BatchReviewDto {
  @ValidateNested({ each: true })
  @Type(() => BatchReviewItemDto)
  reviews: BatchReviewItemDto[];
}
```

**Modify: `src/controllers/study/study.controller.ts`**
```typescript
@Post('/review/batch')
@RouteConfig({ message: 'Batch sync reviews (offline)', requiresAuth: true })
async batchSyncReviews(@Body() dto: BatchReviewDto) {
  return this.reviewService.processBatchReviews(dto);
}
```

**Modify: `src/services/review/review.service.ts`**
- Add `processBatchReviews()`: iterate reviews, each in `$transaction`, return `{synced, failed, errors}`
- Skip duplicates (idempotency)

---

### Phase 8: Health Check Endpoint

> SAD Section 8.2: *"GET /api/health → 200 OK with DB connectivity status"*

**Modify: `src/app.controller.ts`**
```typescript
@Get('health')
async healthCheck() {
  try {
    await this.prismaService.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'connected', timestamp: new Date().toISOString() };
  } catch {
    return { status: 'degraded', db: 'disconnected', timestamp: new Date().toISOString() };
  }
}
```

---

## 4. Tactic → Implementation Traceability Matrix

| Tactic | QA | Scenario | Implementation | Phase |
|--------|-----|----------|---------------|-------|
| T1 Composite DB Index | Performance | S1, S6 | `@@index([deckId, nextReviewDate])`, `@@index([userId, updatedAt])` | 1 |
| T2 DTO Filtering | Security | S7 | `UserDto` excludes passwordHash ✅ | Done |
| T3 Data Isolation | Security | S3, S7 | userId in all queries ✅ + ResourceAuthGuard | 4 |
| T4 Resource-Level Auth | Security | S3 | `ResourceAuthGuard` — findByIdAndOwner() | 4 |
| T5 BruteForceGuard | Security | S2 | `BruteForceService` + LoginAttempt table | 2 |
| T6 Generic Errors | Security | S2, S7 | "Invalid email or password" ✅ | Done |
| T7 Query Optimization | Performance | S1, S6 | Paginated queries + indexed findDueCards | 3, 5 |
| T8 DB Transactions | Reliability | S4 | `$transaction()` for all mutations | 6 |
| T9 Global Error Handler | Availability | S4 | `GlobalExceptionFilter` ✅ | Done |
| T10 Offline Cache | Availability | S5 | Frontend IndexedDB (not backend scope) | — |
| T11 Batch Sync | Availability | S5 | `POST /review/batch` endpoint | 7 |
| T12 Network Monitor | Availability | S5 | Frontend concern (not backend scope) | — |
| T13 SM2 Pure Function | Performance | S1 | `AnkiScheduler` — zero I/O ✅ | Done |
| T14 Lazy Stats | Performance | S6 | Stats computed on-demand ✅ | Done |
| T15 Active Redundancy | Availability | S4, S5 | Docker restart:always (deployment config) | — |
| T16 Degrade Gracefully | Availability | General | Stats failure → empty response (partial) ✅ | Done |
| T17 JWT Auth | Security | All | `AuthGuard` ✅ | Done |
| T18 HTTPS + bcrypt | Security | S2, S7 | bcrypt rounds=10 ✅; HTTPS = Nginx config | Done |
| T19 Input Validation | Security | General | `ValidationPipe` ✅ | Done |
| T20 Prevent Orphan Data | Reliability | S4 | `onDelete: Cascade` ✅ | Done |
| T21 Data Integrity | Reliability | General | Transactional profile update | 6 |

---

## 5. Files Changed Summary

### New Files
| File | Purpose |
|------|---------|
| `src/services/auth/brute-force.service.ts` | BruteForceGuard service (AD-05, T5) |
| `src/middleware/guards/resource-auth.guard.ts` | Resource-level authorization guard (AD-03, T4) |
| `src/utils/types/dto/review/batchReview.dto.ts` | DTO for offline batch sync (AD-02, T11) |

### Modified Files
| File | Changes |
|------|---------|
| `.env` | Add `BRUTE_FORCE_*` and `PAGINATION_*` env vars (no hardcoded defaults in source) |
| `src/utils/constants.ts` | Add `bruteForceConstants`, `paginationConstants`, `authMessages`, `roles` |
| `prisma/schema.prisma` | Composite indexes + LoginAttempt model + User.lockedUntil |
| `src/services/auth/auth.service.ts` | Integrate BruteForceService into signIn(); use `authMessages.invalidCredentials` |
| `src/services/deck/deck.service.ts` | Add findByUserPaginated() + transactional remove(); use `paginationConstants` & `authMessages` |
| `src/controllers/deck/deck.controller.ts` | Add pagination query params; use `paginationConstants` as default values |
| `src/services/review/review.service.ts` | Optimized getDueReviews() + processBatchReviews() |
| `src/controllers/study/study.controller.ts` | Add POST /review/batch + pass userId to getDueReviews |
| `src/services/user/user.service.ts` | Transactional update() and remove(); use `authMessages` |
| `src/app.controller.ts` | Add GET /health endpoint |
| `src/app.module.ts` | Register BruteForceService + ResourceAuthGuard |
| `src/modules/auth.module.ts` | Add BruteForceService provider |

---

## 6. Execution Order & Dependencies

```
Phase 1 (Schema)  ──→ Phase 2 (BruteForce) ──→ Phase 3 (Pagination)
                  ──→ Phase 4 (ResourceAuth)
                  ──→ Phase 5 (findDueCards)
                  ──→ Phase 6 (Transactions)
                  ──→ Phase 7 (Batch Sync)
                  ──→ Phase 8 (Health Check)
```

Phase 1 must go first (schema migration). Phases 2–8 can run in any order after Phase 1.

---

## 7. Verification Plan

| Test | Validates | Command |
|------|-----------|---------|
| Login lockout after 5 failures | AD-05, T5, S2 | POST /auth/login ×6 → expect 429 |
| Paginated deck list | AD-07, T7, S6 | GET /deck?page=1&size=20 → expect {decks, total, page} |
| Cross-user deck DELETE blocked | AD-03, T4, S3 | DELETE /deck/:otherUserId → expect 403 |
| Admin GET permitted | AD-03, UC-24 | Admin GET /deck/:otherId → expect 200 |
| Cascade delete atomic | AD-04, T8, S4 | DELETE /deck/:id → verify no orphan reviews/cards |
| Batch sync reviews | AD-02, T11, S5 | POST /review/batch [{10 reviews}] → expect {synced:10} |
| Due cards query uses index | AD-01, T1, S1 | GET /study/start/:id → response ≤ 500ms |
| Health check | Deployment | GET /health → {status:'ok', db:'connected'} |
| Profile excludes passwordHash | AD-06, T2, S7 | GET /user → response has no passwordHash field |
| Generic login error | AD-05, T6, S2 | Wrong password → "Invalid email or password" |

---

## 8. Architectural Driver Traceability (SAD Section 15.3)

| Driver | Utility Tree | QA Scenario | Tactics | Phase | Code Element |
|--------|-------------|-------------|---------|-------|-------------|
| AD-01 | Sec 3 (H,H) | S1 | T1, T7, T13 | 1, 5 | Composite index + getDueReviews() |
| AD-02 | Sec 3 (M,H) | S5 | T10, T11, T12 | 7 | POST /review/batch |
| AD-03 | Sec 3 (H,M) | S3 | T3, T4, T6 | 4 | ResourceAuthGuard |
| AD-04 | Sec 3 (H,M) | S4 | T8, T9, T15 | 6 | $transaction() wrappers |
| AD-05 | Sec 3 (H,M) | S2 | T5, T6, T17 | 2 | BruteForceService |
| AD-06 | Sec 3 (H,M) | S7 | T2, T3, T18 | Done | UserDto + bcrypt |
| AD-07 | Sec 3 (H,M) | S6 | T1, T7, T14 | 1, 3 | findByUserPaginated() |
