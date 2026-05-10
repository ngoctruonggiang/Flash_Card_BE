# PHASE A — ĐỌC & THIẾT KẾ
## Nhóm UC đã chọn: UC-20, UC-21, UC-23 — "Học & Ôn tập SM-2"

---

## CHƯƠNG 1: ĐỌC TOÀN BỘ — XÁC ĐỊNH GOLDEN CLUSTER

### 1.1. Bức tranh hệ thống (từ SRS)

FlashLearn là nền tảng web học từ vựng tiếng Anh dựa trên thuật toán SM-2 spaced repetition. Hệ thống cho phép người dùng quản lý flashcards, decks, theo dõi tiến trình học và tối ưu khoảng cách ôn tập dựa trên hiệu suất.

**Chức năng cốt lõi theo SRS:**
- Quản lý User (UC-01 → UC-06)
- Quản lý Deck (UC-07 → UC-12)
- Quản lý Card & Import/Export (UC-13 → UC-19)
- **Hoạt động ôn tập — SCOPE HIỆN TẠI (UC-20 → UC-23)**
- Quản trị & Phân quyền nâng cao (UC-24)

---

### 1.2. Project Map — Bản đồ toàn bộ (CHỈ ĐỌC)

```
[Auth Domain] ⚪
┌─ Controller : src/controllers/auth/auth.controller.ts → POST /auth/register, POST /auth/login
├─ Service    : src/services/auth/auth.service.ts → signUp(), signIn()
├─ Repository : (qua PrismaService) → User table
├─ Entity     : prisma/schema.prisma → User model
└─ Module     : src/modules/auth.module.ts → [AuthService, JwtService, UserService]

[User Domain] ⚪
┌─ Controller : src/controllers/user/user.controller.ts → GET /user, PATCH /user, DELETE /user, GET /user/all, etc.
├─ Service    : src/services/user/user.service.ts → getUserById(), update(), remove(), findByEmail()
├─ Repository : (qua PrismaService) → User table
├─ Entity     : prisma/schema.prisma → User model
└─ Module     : src/modules/user.module.ts → [UserService, PrismaModule, JwtModule]

[Deck Domain] ⚪
┌─ Controller : src/controllers/deck/deck.controller.ts → CRUD + statistics endpoints
├─ Service    : src/services/deck/deck.service.ts → create(), findOne(), getDeckStatistics(), getAdvancedStatistics()
├─ Repository : (qua PrismaService) → Deck, Card, CardReview tables
├─ Entity     : prisma/schema.prisma → Deck model
└─ Module     : src/modules/deck.module.ts → [DeckService, ReviewService, CardModule]

[Card Domain] ⚪
┌─ Controller : src/controllers/card/card.controller.ts → CRUD + statistics endpoints
├─ Service    : src/services/card/card.service.ts → create(), update(), getCardStatistics()
├─ Repository : (qua PrismaService) → Card, CardReview tables
├─ Entity     : prisma/schema.prisma → Card model
└─ Module     : src/modules/card.module.ts → [CardService, PrismaModule]

[Study Domain] 🟡 — GOLDEN CLUSTER
┌─ Controller : src/controllers/study/study.controller.ts → 🟡
│    → GET /study/start/:id (UC-20)
│    → POST /study/review (UC-21)
│    → POST /study/cram/review
│    → GET /study/preview/:id
│    → GET /study/consecutive-days/:id
│    → GET /study/cram/:deckId
│    → GET /study/session-statistics/:deckId (UC-23)
│    → GET /study/time-range-statistics/:deckId
│    → GET /study/user-statistics
│    → GET /study/user-daily-breakdown
│    → GET /study/recent-activity
├─ Service    : src/services/review/review.service.ts → 🟡
│    → getDueReviews() (UC-20)
│    → submitReviews() (UC-21)
│    → submitCramReviews()
│    → getReviewPreview()
│    → getConsecutiveStudyDays()
├─ Service    : src/services/study/study.service.ts → 🟡
│    → calculateSessionStatistics() (UC-23)
│    → getTimeRangeStatistics()
│    → getCramCards()
│    → getUserStatistics()
│    → getUserDailyBreakdown()
│    → getRecentActivity()
├─ Scheduler  : src/services/scheduler.ts → 🟡
│    → AnkiScheduler.calculateNext()
├─ Repository : (qua PrismaService) → Card, CardReview, Deck tables
├─ Entity     : prisma/schema.prisma → Card, CardReview models
└─ Module     : src/modules/study.module.ts → 🟡 [ReviewService, StudyService, PrismaModule]
```

---

### 1.3. Phân tích Stack

| Hạng mục | Giá trị | Dẫn chứng |
|----------|---------|-----------|
| **Web Framework** | NestJS 11.0.1 | `package.json:26` — `"@nestjs/common": "^11.0.1"` |
| **ORM** | Prisma 6.16.3 | `package.json:34` — `"@prisma/client": "^6.16.3"` |
| **DB Engine** | SQLite | `prisma/schema.prisma:12` — `provider = "sqlite"` |
| **Validation** | class-validator + class-transformer | `package.json:38-39` |
| **Config** | @nestjs/config (ConfigModule.forRoot global) | `app.module.ts:26-28` |

Dẫn chứng NGUYÊN VĂN 3 dòng code gốc:

```typescript
// Nguồn: prisma/schema.prisma:11-12
datasource db {
  provider = "sqlite"
```

```typescript
// Nguồn: src/services/prisma.service.ts:5
export class PrismaService extends PrismaClient implements OnModuleInit {
```

```typescript
// Nguồn: src/services/review/review.service.ts:83
await this.prismaService.$transaction([
```

---

### 1.4. Xác định Golden Cluster (30%)

🟡 **GOLDEN CLUSTER — UC đã chọn: [UC-20, UC-21, UC-23]**

┌─────────────────────────────────────────────────────────┐
│ 🟡 File 1: `src/services/review/review.service.ts`     │
│ UC liên quan: UC-20, UC-21                              │
│                                                         │
│ Vai trò trong cluster:                                  │
│ File chứa core logic cho 2/3 UC được chọn:              │
│ - getDueReviews() → UC-20: Truy vấn thẻ đến hạn theo   │
│   nextReviewDate, status (new/learning/relearning).      │
│ - submitReviews() → UC-21: Nhận rating, gọi             │
│   AnkiScheduler.calculateNext(), cập nhật Card +         │
│   tạo CardReview trong $transaction.                     │
│ - submitCramReviews() → liên quan cram mode (ngoài scope │
│   nhưng cùng file, phải giữ nguyên).                    │
│ - getReviewPreview() → dùng AnkiScheduler để preview.    │
│ - getConsecutiveStudyDays() → streak calculation.         │
│ Inject: PrismaService. Import: AnkiScheduler từ          │
│ scheduler.ts. Nếu không có file này, UC-20 và UC-21      │
│ sẽ hoàn toàn không hoạt động.                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🟡 File 2: `src/services/study/study.service.ts`        │
│ UC liên quan: UC-23                                      │
│                                                         │
│ Vai trò trong cluster:                                  │
│ File chứa calculateSessionStatistics() → UC-23.          │
│ Method này query CardReview theo time range (gte/lte     │
│ trên reviewedAt), join Card.status, tính:                │
│ totalCardsReviewed, newCardsIntroduced,                  │
│ learningCardsReviewed, accuracyPercentage,               │
│ qualityDistribution, studyTime.                          │
│ File cũng chứa 5 methods không thuộc scope:              │
│ getTimeRangeStatistics(), getUserStatistics(),            │
│ getUserDailyBreakdown(), getRecentActivity(),             │
│ getCramCards(). Phải giữ nguyên các methods này.          │
│ Inject: PrismaService. Nếu không có file này,            │
│ UC-23 sẽ không hoạt động.                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🟡 File 3: `src/services/scheduler.ts`                  │
│ UC liên quan: UC-21                                      │
│                                                         │
│ Vai trò trong cluster:                                  │
│ Chứa AnkiScheduler class — implement Anki V2 algorithm   │
│ với calculateNext(card, rating). Được import bởi         │
│ review.service.ts để tính next state khi user submit     │
│ review. Exports: Rating, CardStatus, SchedulerCard,      │
│ SchedulerSettings, DEFAULT_SETTINGS, AnkiScheduler.      │
│ Dependency trực tiếp của UC-21 submitReviews() và        │
│ getReviewPreview(). Thay đổi interface SchedulerCard     │
│ hoặc tính toán calculateNext() sẽ ảnh hưởng trực tiếp   │
│ kết quả scheduling.                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🟡 File 4: `src/controllers/study/study.controller.ts`  │
│ UC liên quan: UC-20, UC-21, UC-23                        │
│                                                         │
│ Vai trò trong cluster:                                  │
│ Controller layer cho Study domain. Chứa endpoints:       │
│ - GET /study/start/:id → getDueReviews() (UC-20)        │
│ - POST /study/review → submitReviews() (UC-21)          │
│ - GET /study/session-statistics/:deckId → (UC-23)       │
│ Inject: ReviewService, StudyService.                     │
│ Cũng chứa endpoints không thuộc scope (cram, preview,   │
│ user-statistics, daily-breakdown, recent-activity) —     │
│ phải giữ nguyên.                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🟡 File 5: `src/modules/study.module.ts`                │
│ UC liên quan: UC-20, UC-21, UC-23                        │
│                                                         │
│ Vai trò trong cluster:                                  │
│ NestJS module registration cho Study domain. Nếu thêm   │
│ provider mới (VD: tách service), file này phải được      │
│ cập nhật. Hiện chứa: ReviewService, StudyService.        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🟡 File 6: `src/utils/types/dto/review/submitReview.dto.ts` │
│ UC liên quan: UC-21                                      │
│                                                         │
│ Vai trò trong cluster:                                  │
│ DTO cho POST /study/review — chứa SubmitReviewDto và     │
│ SubmitReviewItemDto. Định nghĩa request body schema.     │
│ Nếu refactor thêm validation hoặc thay đổi field,        │
│ file này phải cập nhật.                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🟡 File 7: `src/utils/types/dto/study/studySessionStatistics.dto.ts` │
│ UC liên quan: UC-23                                      │
│                                                         │
│ Vai trò trong cluster:                                  │
│ DTO cho response của GET /study/session-statistics/:deckId│
│ Định nghĩa shape of statistics response.                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🟡 File 8: `src/utils/types/dto/review/previewReview.dto.ts` │
│ UC liên quan: (hỗ trợ UC-21 flow)                        │
│                                                         │
│ Vai trò trong cluster:                                  │
│ DTO cho GET /study/preview/:id — hiển thị interval        │
│ preview cho Again/Hard/Good/Easy. Dependency trực tiếp   │
│ của getReviewPreview() trong review.service.ts.           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🟡 File 9: `src/utils/types/dto/review/consecutiveDays.dto.ts` │
│ UC liên quan: (hỗ trợ study flow)                        │
│                                                         │
│ Vai trò trong cluster:                                  │
│ DTO cho GET /study/consecutive-days/:id.                  │
│ Dependency của getConsecutiveStudyDays() trong            │
│ review.service.ts.                                       │
└─────────────────────────────────────────────────────────┘

**Files ngoài cluster cần theo dõi ripple:**

┌─────────────────────────────────────────────────────────┐
│ ⚪ File: `src/services/deck/deck.service.ts`             │
│ Mức rủi ro ripple: Trung                                 │
│                                                         │
│ Lý do theo dõi:                                         │
│ getAdvancedStatistics() gọi private                      │
│ getConsecutiveStudyDays() — logic tương tự method cùng   │
│ tên trong review.service.ts. Nếu refactor logic streak   │
│ calculation, cần verify consistency. Cũng dùng           │
│ CardReview entity — nếu schema CardReview thay đổi,      │
│ getDeckStatistics() và getAdvancedStatistics() bị compile│
│ error. Ảnh hưởng: behavior thay đổi nhưng không crash    │
│ (cả hai đọc cùng data model).                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ⚪ File: `src/services/card/card.service.ts`             │
│ Mức rủi ro ripple: Thấp                                  │
│                                                         │
│ Lý do theo dõi:                                         │
│ getCardStatistics() và getCardsStatisticsByDeck() đọc    │
│ CardReview entity. Nếu CardReview schema thay đổi        │
│ (VD: rename field), sẽ compile error. Tuy nhiên cho      │
│ scope hiện tại (UC-20/21/23), không dự kiến thay đổi    │
│ CardReview schema.                                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ⚪ File: `src/controllers/deck/deck.controller.ts`       │
│ Mức rủi ro ripple: Thấp                                  │
│                                                         │
│ Lý do theo dõi:                                         │
│ Import CardService. Nếu CardService interface thay đổi,  │
│ controller bị ảnh hưởng. Tuy nhiên CardService không     │
│ thuộc scope refactor trực tiếp.                          │
└─────────────────────────────────────────────────────────┘

**Tổng: 9 file trong cluster / 3 file theo dõi ripple**

---

### 1.5. ✅ SNAPSHOT CONTRACT

| Hạng mục               | Giá trị phát hiện được                          |
|------------------------|------------------------------------------------|
| DB Engine              | SQLite (`prisma/schema.prisma:12`)              |
| ORM & Version          | Prisma 6.16.3 (`package.json:34`)               |
| Web Framework          | NestJS 11.0.1 (`package.json:26`)               |
| UPSERT Method          | Không dùng UPSERT — dùng `$transaction([update, create])` (`review.service.ts:83`) |
| Path Alias gốc (@)     | Không có path alias — dùng `src/` relative paths (`tsconfig.json` không có `paths`) |
| Custom Exception class | `HttpException` (NestJS built-in) + `NotFoundException`, `ForbiddenException` — wrap bởi `src/middleware/filters/global.filter.ts` (`src/middleware/filters/global.filter.ts`) |
| Locking Strategy       | None — không có pessimistic/optimistic lock. `$transaction` chỉ dùng sequential writes |
| Test Framework         | Jest 30.2.0 (`package.json:61`) — config tại `tests/unit/jest.json` |
| Golden Cluster (30%)   | 9 files (xem 1.4): review.service, study.service, scheduler, study.controller, study.module, submitReview.dto, studySessionStatistics.dto, previewReview.dto, consecutiveDays.dto |
| UC được chọn           | UC-20, UC-21, UC-23                             |

> [!NOTE]
> **Locking Strategy = None**: SQLite không hỗ trợ `SELECT FOR UPDATE`. Prisma `$transaction` với SQLite dùng serialized writes (WAL mode). Đây là limitation của SQLite — không cần refactor locking strategy, nhưng cần đảm bảo transaction scope đúng.

> [!NOTE]
> **Path Alias**: `tsconfig.json` không có `paths` config. Code dùng `src/` prefix (VD: `import { SubmitReviewDto } from 'src/utils/types/dto/review/submitReview.dto'`). `jest.json` có moduleNameMapper cho `^src/(.*)$` và `^@/(.*)$`.

---

## CHƯƠNG 2: THIẾT KẾ PATTERN & IMPACT MAP

### 2.1. Bức tranh hệ thống (từ SRS)

SRS xác định Study Activities (Section 4) gồm:
- UC-20: Start Study Session — truy vấn thẻ `NextReviewDate <= Today` trong < 500ms
- UC-21: Record Review Outcome — cập nhật SM-2 + tạo log trong Transaction
- UC-22: Session Summary — aggregate session data (liên quan nhưng ngoài scope)
- UC-23: View Study Session Statistics — truy vấn theo time range

**Architectural Drivers liên quan (từ Utility Tree):**
1. **Performance/Latency (H,H):** Tối ưu truy vấn SM-2 cho bắt đầu phiên học dưới 500ms
2. **Reliability/Transactions (H,M):** Đảm bảo cập nhật thẻ trong DB transactions an toàn

---

### 2.2. Design Pattern Decision Table

| File / Hàm | UC | Pattern chọn | Pattern loại bỏ |
|-------------|------|--------------|-----------------|
| `review.service.ts:getDueReviews` | UC-20 | **Specification Pattern** (query builder encapsulation) | Repository Pattern (overhead cho Prisma), Strategy Pattern (không cần runtime swap query) |
| `review.service.ts:submitReviews` | UC-21 | **Unit of Work** (transaction scope improvement) + **Facade** (simplify scheduler interaction) | Command Pattern (overhead không cần undo), Event Sourcing (quá phức tạp cho scope) |
| `study.service.ts:calculateSessionStatistics` | UC-23 | **Aggregate Root Query** (consolidate aggregate logic) | CQRS (overkill cho read-only statistics), Materialized View (SQLite limitation) |
| `scheduler.ts:calculateNext` | UC-21 | **Giữ nguyên** — Strategy-like structure đã tốt | Không áp thêm pattern — SM-2 math CẤM refactor |

---

### 2.3. Phân tích Chi Tiết Pattern ↔ Utility Tree

---

#### `review.service.ts:getDueReviews` — UC-20 — Pattern: Specification Pattern

─────────────────────────────────────────────────────────
**PHẦN 1 — TẠI SAO CHỨC NĂNG NÀY ĐƯỢC CHỌN ĐỂ ÁP PATTERN?**
─────────────────────────────────────────────────────────

Trạng thái hiện tại — `src/services/review/review.service.ts` tại [review.service.ts:161-201]:

```typescript
// Nguồn: review.service.ts:173-198
const cards = await this.prismaService.card.findMany({
  where: {
    deckId,
    OR: [
      { nextReviewDate: { lte: today } },
      { status: 'new' },
      { status: 'learning', nextReviewDate: { lte: today } },
      { status: 'relearning', nextReviewDate: { lte: today } },
    ],
  },
  take: limit,
  orderBy: { nextReviewDate: 'asc' },
});
```

**Vấn đề hiện tại:**
1. **No ownership check** — hàm nhận `deckId` nhưng không verify user sở hữu deck đó. Bất kỳ user nào biết deckId đều lấy được cards. Vi phạm Authorization (H,M) trong Utility Tree.
2. **Query logic embedded trong service** — filter conditions (OR clause) hardcoded trong method body. Nếu cần thay đổi tiêu chí lọc (VD: thêm filter theo tag, limit new cards per session), phải sửa trực tiếp method, vi phạm Open/Closed.
3. **Deck existence check không atomic** — query deck riêng (line 163-165), rồi query cards riêng. Hai queries không trong transaction → race condition lý thuyết (deck bị xóa giữa 2 queries).

**Hệ quả nếu không áp pattern:**
- UC-24 (Authorization H,M) không thể enforce ownership cho study flow → security gap.
- Khi mở rộng tính năng (VD: configurable new card limit per day), phải sửa method body → risk regression.

─────────────────────────────────────────────────────────
**PHẦN 2 — TẠI SAO CHỌN PATTERN NÀY, KHÔNG PHẢI PATTERN KHÁC?**
─────────────────────────────────────────────────────────

**Patterns đã xem xét:**
1. **Repository Pattern** → Loại bỏ. Prisma đã đóng vai trò repository. Thêm thêm 1 layer nữa chỉ tạo indirection không cần thiết trong codebase nhỏ (62 files). Codebase hiện tại inject PrismaService trực tiếp — convention này đã nhất quán 100%.
2. **Strategy Pattern** → Loại bỏ. Chỉ có 1 strategy duy nhất (query due cards) — không có nhu cầu swap algorithm at runtime. Tạo N class con cho 1 behavior duy nhất = over-engineering.
3. **Specification Pattern** → Chọn. Encapsulate query conditions thành reusable, composable specifications. Trong context Prisma, "specification" = extracted `where` clause builder functions. Cơ chế: tạo helper functions trả về Prisma `where` object, compose chúng trong service method. Trade-off: thêm 1 level abstraction nhưng giữ API không đổi.

**Trade-off:** Function-level abstraction thay vì class-level → nhẹ, không thay đổi DI, không cần new provider registration. Mất: flexibility nếu cần runtime composition phức tạp — nhưng scope hiện tại không cần.

─────────────────────────────────────────────────────────
**PHẦN 3 — CHỨNG MINH ĐÁP ỨNG UTILITY TREE**
─────────────────────────────────────────────────────────

→ Scenario [UC-20] — "User starts study session; system queries due cards (NextReviewDate <= Today) in < 500ms."

**Yêu cầu kỹ thuật:** Performance — query phải trả về kết quả trong < 500ms.

**Cơ chế đáp ứng:** Pattern Specification encapsulate query clause → không thêm overhead (compile-time composition). Query gốc đã dùng index `@@index([deckId])` trên Card và `@@index([nextReviewDate])` trên CardReview. Extracted specification functions chỉ build `where` object — zero runtime cost so với inline query.

**Hệ quả nếu không dùng:** Query inline hiện tại cũng đáp ứng < 500ms cho dataset nhỏ. Tuy nhiên khi thêm ownership check + configurable filters, method body phình to, khó maintain, dễ introduce performance regression khi thêm logic mới.

→ Scenario [UC-24] — "Admin A attempts to delete a deck created by Admin B; system verifies User ID and Creator ID, then denies action."

**Yêu cầu kỹ thuật:** Authorization — verify ownership.

**Cơ chế đáp ứng:** getDueReviews() hiện thiếu ownership check. Refactor sẽ thêm `userId` parameter và verify `deck.userId === userId` trước khi query cards. Comment: `// AUTH-CHECK [UC-20]: Verify ownerId === requesterId`

**Hệ quả nếu không dùng:** Bất kỳ user nào biết deckId có thể bắt đầu study session trên deck của người khác. Đây là lỗ hổng bảo mật rõ ràng.

---

#### `review.service.ts:submitReviews` — UC-21 — Pattern: Unit of Work + Facade

─────────────────────────────────────────────────────────
**PHẦN 1 — TẠI SAO CHỨC NĂNG NÀY ĐƯỢC CHỌN ĐỂ ÁP PATTERN?**
─────────────────────────────────────────────────────────

Trạng thái hiện tại — `src/services/review/review.service.ts` tại [review.service.ts:48-125]:

```typescript
// Nguồn: review.service.ts:53-107
for (const r of review.CardReviews) {
  const card = await this.prismaService.card.findUnique({ where: { id: r.cardId } });
  // ...
  const nextState = scheduler.calculateNext(schedulerInput, rating);
  await this.prismaService.$transaction([
    this.prismaService.card.update({ ... }),
    this.prismaService.cardReview.create({ ... }),
  ]);
  results.push({ id: 0, ... }); // Mock ID
}
```

**Vấn đề hiện tại:**
1. **N+1 Query**: Mỗi card trong batch → 1 `findUnique` + 1 `$transaction` (2 operations) = 2N DB operations cho N cards. Với 50 cards → 100 DB roundtrips.
2. **Transaction per card, not per batch**: Mỗi card có transaction riêng. Nếu card thứ 25/50 fail, 24 cards trước đã committed → partial update, vi phạm Reliability (H,M).
3. **Mock ID returned**: `results.push({ id: 0, ... })` — trả về `id: 0` cho tất cả reviews → response không có actual ID. Đây là hydration issue.
4. **No ownership check**: Không verify card thuộc deck của user hiện tại.
5. **Scheduler instantiated per call**: `new AnkiScheduler()` tạo mới mỗi lần gọi submitReviews() — không cần vì scheduler stateless.

**Hệ quả nếu KHÔNG áp pattern:**
- N+1 performance degradation tuyến tính với số cards reviewed per session.
- Partial update khi batch fail giữa chừng.
- Response trả ID không chính xác → frontend không thể reference review records.

─────────────────────────────────────────────────────────
**PHẦN 2 — TẠI SAO CHỌN PATTERN NÀY, KHÔNG PHẢI PATTERN KHÁC?**
─────────────────────────────────────────────────────────

**Patterns đã xem xét:**
1. **Command Pattern** → Loại bỏ. Mỗi review sẽ là 1 Command object — nhưng không có undo, không có queue, không có deferred execution. Chỉ tạo thêm boilerplate.
2. **Event Sourcing** → Loại bỏ. Quá phức tạp cho scope. CardReview đã là event log rồi — nhưng Event Sourcing full cần event store, projection, eventual consistency — overkill.
3. **Unit of Work** → Chọn. Wrap toàn bộ batch trong single `$transaction` interactive. Cơ chế: Prisma interactive transaction (`prismaService.$transaction(async (tx) => { ... })`) thay vì sequential `$transaction([])` per card. Đảm bảo atomicity cho toàn bộ batch.
4. **Facade** → Chọn bổ sung. Encapsulate scheduler interaction + pre-validation vào helper method, giảm complexity của main method body.

**Trade-off:**
- **Được:** Atomic batch (all-or-nothing), giảm N+1 (batch fetch trước, batch write sau), actual review IDs returned (hydration).
- **Mất:** Nếu 1 card fail, toàn bộ batch rollback — user phải retry tất cả. Tuy nhiên đây là behavior mong đợi theo Utility Tree (H,M Reliability).

─────────────────────────────────────────────────────────
**PHẦN 3 — CHỨNG MINH ĐÁP ỨNG UTILITY TREE**
─────────────────────────────────────────────────────────

→ Scenario [UC-21] — "User evaluates a card; system uses DB Transactions to ensure atomicity/rollback on error."

**Yêu cầu kỹ thuật:** Reliability — DB Transaction đảm bảo atomicity.

**Cơ chế đáp ứng:** Unit of Work pattern wrap `$transaction(async (tx) => { ... })` interactive. Tất cả card updates + review creates nằm trong 1 transaction duy nhất. Nếu bất kỳ operation nào fail → toàn bộ rollback.

**Hệ quả nếu không dùng:** Hiện tại mỗi card có transaction riêng → partial update khi fail giữa batch. User thấy 24/50 cards đã review nhưng 26 cards chưa → data inconsistency.

→ Scenario [UC-20] — "System queries due cards in < 500ms."

**Yêu cầu kỹ thuật:** Performance — liên quan đến submitReviews vì pre-fetch cards.

**Cơ chế đáp ứng:** Batch fetch tất cả cards cần review bằng 1 query `findMany({ where: { id: { in: cardIds } } })` thay vì N `findUnique`. Giảm từ 2N xuống 3 DB operations (1 fetch all + 1 batch update + 1 batch create).

**Hệ quả nếu không dùng:** 100 DB roundtrips cho 50 cards → latency tăng tuyến tính, dễ vượt 500ms target.

---

#### `study.service.ts:calculateSessionStatistics` — UC-23 — Pattern: Aggregate Root Query

─────────────────────────────────────────────────────────
**PHẦN 1 — TẠI SAO CHỨC NĂNG NÀY ĐƯỢC CHỌN ĐỂ ÁP PATTERN?**
─────────────────────────────────────────────────────────

Trạng thái hiện tại — `src/services/study/study.service.ts` tại [study.service.ts:40-125]:

```typescript
// Nguồn: study.service.ts:68-76
const newCardsIntroduced = reviews.filter(
  (r) => r.card.status === 'new',
).length;
const learningCardsReviewed = reviews.filter(
  (r) => r.card.status === 'learning',
).length;
const reviewCardsReviewed = reviews.filter(
  (r) => r.card.status === 'review',
).length;
```

**Vấn đề hiện tại:**
1. **Incorrect status counting**: Đếm `r.card.status` (card CURRENT status) thay vì `r.previousStatus` (status TẠI THỜI ĐIỂM review). Nếu card ban đầu là "new", sau review trở thành "learning" — query này đếm "learning" thay vì "new". Đây là **logic bug tiềm ẩn** — kết quả sẽ sai khi session data được fetch AFTER reviews changed card statuses.
2. **Code duplicate**: Quality distribution counting (filter Again/Hard/Good/Easy) lặp lại ở `src/controllers/study/study.controller.ts`, `src/services/deck/deck.service.ts`, `src/controllers/deck/deck.controller.ts`. 4 methods cùng logic filter.
3. **2 queries**: Fetch reviews + fetch deck info → 2 DB operations có thể merge thành 1.

**Hệ quả nếu KHÔNG áp pattern:**
- Statistics hiển thị sai newCardsIntroduced/learningCardsReviewed vì đọc current status thay vì snapshot status.
- Code duplicate khiến bug fix phải apply ở 4 chỗ → dễ sót.

─────────────────────────────────────────────────────────
**PHẦN 2 — TẠI SAO CHỌN PATTERN NÀY, KHÔNG PHẢI PATTERN KHÁC?**
─────────────────────────────────────────────────────────

**Patterns đã xem xét:**
1. **CQRS** → Loại bỏ. Separate read model cho statistics — overkill cho SQLite single-writer DB. Không có concurrency benefit.
2. **Materialized View** → Loại bỏ. SQLite không support materialized views natively. Pre-computing sẽ cần cron job + separate table — complexity không justify cho current scale.
3. **Aggregate Root Query** → Chọn. Consolidate tất cả aggregate logic (count, filter, group) vào well-defined aggregation functions. Cơ chế: extract shared quality distribution counting, use `previousStatus` thay vì `card.status`, combine queries where possible.

**Trade-off:** Minimal — chỉ restructure code, không thêm abstraction layer. Mất: methods dài hơn nếu inline aggregation. Được: correctness + reusability.

─────────────────────────────────────────────────────────
**PHẦN 3 — CHỨNG MINH ĐÁP ỨNG UTILITY TREE**
─────────────────────────────────────────────────────────

→ Scenario [UC-23] — "Query dữ liệu trong khoảng (startDate, endDate) chính xác. Kết quả tính toán tổng thời gian học phải khớp với log thực tế."

**Yêu cầu kỹ thuật:** Testability + Accuracy — kết quả phải chính xác.

**Cơ chế đáp ứng:** Aggregate Root Query sử dụng `r.previousStatus` (từ CardReview record) thay vì `r.card.status` (card current state). Điều này đảm bảo counting phản ánh trạng thái card TẠI THỜI ĐIỂM review, không phải sau khi reviews đã thay đổi card status.

**Hệ quả nếu không dùng:** Session statistics hiển thị sai: VD session review 10 new cards → tất cả 10 cards trở thành "learning" sau review → `newCardsIntroduced` = 0 thay vì 10. Bug này hiện tại ĐANG TỒN TẠI trong code.

---

#### `scheduler.ts:calculateNext` — UC-21 — **GIỮ NGUYÊN**

SM-2/Anki V2 algorithm implementation. **CẤM refactor công thức.** Code hiện tại tổ chức tốt: separate phases (Learning/Relearning → Review), clear rating handling, configurable settings. Không cần áp thêm pattern — structure hiện tại đã clean.

---

### 2.4. Pre-Implementation Impact Map

| Thay đổi trong cluster | File ngoài cluster | Hàm | Mức độ |
|------------------------|--------------------|-----|--------|
| `review.service.ts:getDueReviews()` thêm userId param | `src/controllers/study/study.controller.ts` | getDueReviews() endpoint call | **Th** — controller đã nằm trong cluster |
| `review.service.ts:submitReviews()` batch transaction | Không file ngoài bị ảnh hưởng | — | — |
| `study.service.ts:calculateSessionStatistics()` fix previousStatus | Không file ngoài bị ảnh hưởng | — | — |
| Fix quality distribution shared logic | `src/services/deck/deck.service.ts` | getDeckStatistics(), getAdvancedStatistics() | **Th** — chỉ refactor methods TRONG cluster, deck.service giữ nguyên duplicate code riêng |

> [!NOTE]
> Tổng file ngoài cluster bị ảnh hưởng: **0-1 file** (deck.service.ts chỉ bị ảnh hưởng NẾU chọn extract shared utility — sẽ KHÔNG làm trong scope này). Ripple rất thấp → an toàn tiến hành.

---

### 2.5. Boundary Sync Contract

```
Controller  → Service   : SubmitReviewDto (unchanged), IdParamDto + userId (added)
Service     → Repository: Prisma where clause (specification), $transaction interactive
Repository  → Service   : Card[] / CardReview[] (unchanged schema)
Service     → Controller: CardReview[] (actual IDs instead of mock 0), StudySessionStatisticsDto (unchanged shape)
```

⚠️ **BOUNDARY SYNC:** `study.controller.ts:getDueReviews()` — hiện chỉ truyền `params.id` (deckId). Cần thêm `user.id` parameter để service thực hiện ownership check. Controller đã inject `@GetUser()` decorator ở các methods khác nhưng KHÔNG sử dụng trong getDueReviews endpoint → cần bổ sung.

---

## Verification Plan

### Automated Tests
Existing tests đã có tại:
- `tests/unit/review/review.service.spec.ts` — tests for ReviewService
- `tests/unit/review/review.service.preview.spec.ts` — tests for preview
- `tests/unit/review/review.service.cram.spec.ts` — tests for cram
- `tests/unit/study/study.service.spec.ts` — tests for StudyService
- `tests/unit/study/study.controller.spec.ts` — tests for StudyController
- `tests/unit/scheduler/scheduler.spec.ts` — tests for AnkiScheduler

**Command:** `npm test` (runs `jest --config ./tests/unit/jest.json`)

### Manual Verification
After applying Phase B documentation, dev should:
1. Run `npm run build` — verify no compile errors
2. Run `npm test` — verify all existing tests pass
3. Run `npm run start:dev` — verify server starts without errors

---

✅ **PHASE A hoàn tất. Gõ [CODE] để bắt đầu PHASE B — Chương 3.**


<!-- Fixed: 2026-04-26 — L1 applied -->