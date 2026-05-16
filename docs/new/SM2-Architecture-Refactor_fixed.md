# PHASE B — TÀI LIỆU REFACTOR KỸ THUẬT

## Golden Cluster: UC-20, UC-21, UC-23 — "Học & Ôn tập SM-2"

> **Tài liệu này là hướng dẫn từng bước để Dev tự đọc và tự apply.**
> **TUYỆT ĐỐI KHÔNG sửa source code trực tiếp — chỉ đọc tài liệu và làm theo.**

---

## CHƯƠNG 3: CONTROLLER & DTO

### 3.1. Tổng quan thay đổi Controller

**File:** `src/controllers/study/study.controller.ts`

Chương này tập trung vào 2 endpoint thuộc Golden Cluster cần refactor tại tầng Controller:

| Endpoint                            | Method | UC    | Vấn đề hiện tại                                             | Thay đổi                                      |
| ----------------------------------- | ------ | ----- | ----------------------------------------------------------- | --------------------------------------------- |
| `/study/start/:id`                  | GET    | UC-20 | Không truyền `userId` xuống service → thiếu ownership check | Thêm `@GetUser()` decorator, truyền `user.id` |
| `/study/review`                     | POST   | UC-21 | Không truyền `userId` xuống service → thiếu ownership check | Thêm `@GetUser()` decorator, truyền `user.id` |
| `/study/session-statistics/:deckId` | GET    | UC-23 | Không thay đổi controller — chỉ refactor service layer      | Giữ nguyên                                    |

---

### 3.2. Refactor: `GET /study/start/:id` — UC-20

#### 3.2.1. Code hiện tại (TRƯỚC refactor)

```typescript
// Nguồn: src/controllers/study/study.controller.ts — dòng 156-165
@Get('/start/:id')
@ApiOperation({ summary: 'Get due reviews for a deck' })
@ApiResponse({ status: 200, description: 'Return due reviews' })
@RouteConfig({
  message: 'Start Study Session',
  requiresAuth: true,
})
getDueReviews(@Param() params: IdParamDto) {
  return this.reviewService.getDueReviews(params.id);
}
```

**Vấn đề:** Endpoint chỉ truyền `params.id` (deckId) xuống service. Không có `@GetUser()` decorator → service không biết user nào đang request → không thể verify ownership. Các endpoint khác trong cùng controller (VD: `getUserStatistics`, `startCramSession`) đã dùng `@GetUser()` — endpoint này là ngoại lệ.

#### 3.2.2. Code mới (SAU refactor)

```typescript
// Nguồn: src/controllers/study/study.controller.ts — thay thế dòng 156-165
@Get('/start/:id')
@ApiOperation({ summary: 'Get due reviews for a deck' })
@ApiResponse({ status: 200, description: 'Return due reviews' })
@RouteConfig({
  message: 'Start Study Session',
  requiresAuth: true,
})
getDueReviews(@GetUser() user: User, @Param() params: IdParamDto) {
  // AUTH-CHECK [UC-20]: Truyền userId để service verify ownership
  return this.reviewService.getDueReviews(params.id, user.id);
}
```

#### 3.2.3. Hướng dẫn apply từng bước

**Bước 1:** Mở file `src/controllers/study/study.controller.ts`

**Bước 2:** Xác nhận dòng 163 hiện tại là:

```typescript
getDueReviews(@Param() params: IdParamDto) {
```

**Bước 3:** Thay thế dòng 163-164 bằng:

```typescript
getDueReviews(@GetUser() user: User, @Param() params: IdParamDto) {
  // AUTH-CHECK [UC-20]: Truyền userId để service verify ownership
  return this.reviewService.getDueReviews(params.id, user.id);
}
```

**Bước 4:** Xác nhận import `User` đã có ở dòng 25:

```typescript
import type { User } from '@prisma/client';
```

Import `GetUser` đã có ở dòng 6:

```typescript
import { GetUser } from 'src/utils/decorators/user.decorator';
```

→ Không cần thêm import mới.

**Bước 5:** ⚠️ KHÔNG chạy build ở bước này.
Service chưa được cập nhật signature → build sẽ báo lỗi TypeScript.
Đây là expected — tiếp tục sang Chương 4 trước.
Build chỉ chạy sau khi hoàn tất toàn bộ §6.2 Bước 4.

---

### 3.3. Refactor: `POST /study/review` — UC-21

#### 3.3.1. Code hiện tại (TRƯỚC refactor)

```typescript
// Nguồn: src/controllers/study/study.controller.ts — dòng 127-136
@Post('/review')
@ApiOperation({ summary: 'Submit card review' })
@ApiResponse({ status: 201, description: 'Review submitted successfully' })
@RouteConfig({
  message: 'Submitting card review',
  requiresAuth: true,
})
submitReview(@Body() cardReview: SubmitReviewDto) {
  return this.reviewService.submitReviews(cardReview);
}
```

**Vấn đề:** Endpoint không truyền `userId` → service `submitReviews()` không biết user nào submit → không thể verify ownership card/deck.

#### 3.3.2. Code mới (SAU refactor)

```typescript
// Nguồn: src/controllers/study/study.controller.ts — thay thế dòng 127-136
@Post('/review')
@ApiOperation({ summary: 'Submit card review' })
@ApiResponse({ status: 201, description: 'Review submitted successfully' })
@RouteConfig({
  message: 'Submitting card review',
  requiresAuth: true,
})
submitReview(@GetUser() user: User, @Body() cardReview: SubmitReviewDto) {
  // AUTH-CHECK [UC-21]: Truyền userId để service verify ownership
  return this.reviewService.submitReviews(cardReview, user.id);
}
```

#### 3.3.3. Hướng dẫn apply từng bước

**Bước 1:** Mở file `src/controllers/study/study.controller.ts`

**Bước 2:** Xác nhận dòng 134 hiện tại là:

```typescript
submitReview(@Body() cardReview: SubmitReviewDto) {
```

**Bước 3:** Thay thế dòng 134-136 bằng:

```typescript
submitReview(@GetUser() user: User, @Body() cardReview: SubmitReviewDto) {
  // AUTH-CHECK [UC-21]: Truyền userId để service verify ownership
  return this.reviewService.submitReviews(cardReview, user.id);
}
```

**Bước 4:** Không cần thêm import — `GetUser` và `User` đã có sẵn.

---

### 3.4. DTO — Không thay đổi

Tất cả DTO giữ nguyên cấu trúc hiện tại:

| DTO File                                                  | Lý do giữ nguyên                                                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/utils/types/dto/review/submitReview.dto.ts`          | Request body schema không đổi. `userId` lấy từ JWT token qua `@GetUser()`, không phải từ request body. |
| `src/utils/types/dto/study/studySessionStatistics.dto.ts` | Response shape không đổi — chỉ fix logic tính toán ở service layer.                                    |
| `src/utils/types/dto/review/previewReview.dto.ts`         | Không thuộc scope refactor trực tiếp.                                                                  |
| `src/utils/types/dto/review/consecutiveDays.dto.ts`       | Không thuộc scope refactor trực tiếp.                                                                  |

> **Nguyên tắc:** userId PHẢI lấy từ JWT token (server-side), KHÔNG BAO GIỜ từ request body (client-side có thể giả mạo). Convention này nhất quán với cách `getCramCards()` trong `study.service.ts:17-37` đã implement.

---

### 3.5. Checklist Chương 3

- [ ] `study.controller.ts:getDueReviews()` — thêm `@GetUser() user: User`, truyền `user.id`
- [ ] `study.controller.ts:submitReview()` — thêm `@GetUser() user: User`, truyền `user.id`
- [ ] Verify: Không thêm import mới (đã có sẵn)
- [ ] Verify: Không thay đổi DTO nào
- [ ] ⚠️ KHÔNG chạy build ở bước này. Thứ tự apply chính xác xem §6.2.
      Service PHẢI được apply TRƯỚC controller. Build chỉ chạy sau khi hoàn tất §6.2 Bước 3.

---

## CHƯƠNG 4: SERVICE & TRANSACTION

### 4.1. Tổng quan thay đổi Service

| File                | Method                         | UC    | Pattern áp dụng       | Mô tả thay đổi                                                 |
| ------------------- | ------------------------------ | ----- | --------------------- | -------------------------------------------------------------- |
| `review.service.ts` | `getDueReviews()`              | UC-20 | Specification         | Thêm `userId` param + ownership check + extract query spec     |
| `review.service.ts` | `submitReviews()`              | UC-21 | Unit of Work + Facade | Batch transaction + batch fetch + ownership check + actual IDs |
| `study.service.ts`  | `calculateSessionStatistics()` | UC-23 | Aggregate Root Query  | Fix `previousStatus` bug + extract quality aggregation helper  |

---

### 4.2. Refactor: `getDueReviews()` — UC-20 — Specification Pattern

#### 4.2.1. Code hiện tại (TRƯỚC refactor)

```typescript
// Nguồn: src/services/review/review.service.ts — dòng 161-201
async getDueReviews(deckId: number, limit?: number): Promise<Card[]> {
  // Check if deck exists
  const deck = await this.prismaService.deck.findUnique({
    where: { id: deckId },
  });

  if (!deck) {
    throw new NotFoundException('Deck not found');
  }

  const today = new Date();

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

  return cards;
}
```

**Vấn đề đã phân tích (Phase A §2.3):**

1. Không có ownership check — bất kỳ user nào biết `deckId` đều lấy được cards
2. Query logic hardcoded trong method body — vi phạm Open/Closed
3. Deck existence check + card query không atomic

#### 4.2.2. Code mới (SAU refactor)

```typescript
// Nguồn: src/services/review/review.service.ts — thay thế dòng 161-201

/**
 * [SPECIFICATION PATTERN] — Xây dựng Prisma where clause cho due cards.
 * Tách riêng để dễ test, dễ mở rộng (VD: thêm tag filter, new card limit).
 * Được gọi bởi getDueReviews() — UC-20.
 */
private buildDueCardsSpec(deckId: number, now: Date) {
  return {
    deckId,
    OR: [
      // Cards đã review và đến hạn
      { nextReviewDate: { lte: now } },
      // Cards mới chưa bao giờ review
      { status: 'new' as const },
      // Cards đang học và đến hạn
      { status: 'learning' as const, nextReviewDate: { lte: now } },
      // Cards đang học lại và đến hạn
      { status: 'relearning' as const, nextReviewDate: { lte: now } },
    ],
  };
}

/**
 * UC-20: Start Study Session — Lấy danh sách thẻ đến hạn ôn tập.
 * Đã refactor: thêm ownership check + Specification Pattern.
 *
 * @param deckId - ID của deck cần lấy thẻ
 * @param userId - ID của user hiện tại (từ JWT token)
 * @param limit - Số thẻ tối đa trả về (optional)
 * @throws NotFoundException - Nếu deck không tồn tại
 * @throws ForbiddenException - Nếu user không sở hữu deck
 */
async getDueReviews(deckId: number, userId: number, limit?: number): Promise<Card[]> {
  // AUTH-CHECK [UC-20]: Verify ownership — dùng findFirst thay vì findUnique để check cả id + userId
  const deck = await this.prismaService.deck.findFirst({
    where: { id: deckId, userId },
  });

  if (!deck) {
    throw new NotFoundException('Deck not found or access denied');
  }

  const now = new Date();

  // SPECIFICATION PATTERN: Delegate query construction
  const whereSpec = this.buildDueCardsSpec(deckId, now);

  const cards = await this.prismaService.card.findMany({
    where: whereSpec,
    take: limit,
    orderBy: { nextReviewDate: 'asc' },
  });

  return cards;
}
```

#### 4.2.3. Hướng dẫn apply từng bước

**Bước 1:** Mở file `src/services/review/review.service.ts`

**Bước 2:** Thêm import `ForbiddenException` nếu chưa có — kiểm tra dòng 1:

```typescript
// Hiện tại:
import { Injectable, NotFoundException } from '@nestjs/common';
// Thay thế thành:
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
```

> 📌 **LÝ DO IMPORT Ở ĐÂY:** `ForbiddenException` được thêm tại bước này
> để dùng cho §4.3 (`submitReviews`). `getDueReviews()` không dùng
> `ForbiddenException` — method này chủ động throw `NotFoundException`
> cho cả 2 case (deck không tồn tại + không có quyền truy cập).
> Đây là security by design: không lộ thông tin deck có tồn tại hay không
> cho user không có quyền.

**Bước 3:** Tìm method `getDueReviews` (dòng 161-201). Thay thế TOÀN BỘ method bằng code mới ở §4.2.2.

**Bước 4:** Thêm method `buildDueCardsSpec` (private) TRƯỚC `getDueReviews` — đặt vào khoảng dòng 160.

**Bước 5:** Verify signature đã thay đổi:

- Cũ: `getDueReviews(deckId: number, limit?: number)`
- Mới: `getDueReviews(deckId: number, userId: number, limit?: number)`

> **LƯU Ý:** `findFirst({ where: { id, userId } })` thay vì `findUnique({ where: { id } })` + check riêng. Cách này gộp existence check + ownership check thành 1 query duy nhất, vừa atomic vừa tiết kiệm 1 DB roundtrip. Convention nhất quán với `getCramCards()` trong `study.service.ts:19-21`.

---

### 4.3. Refactor: `submitReviews()` — UC-21 — Unit of Work + Facade

#### 4.3.1. Code hiện tại (TRƯỚC refactor)

```typescript
// Nguồn: src/services/review/review.service.ts — dòng 48-125
async submitReviews(review: SubmitReviewDto) {
  const scheduler = new AnkiScheduler();
  const results: CardReview[] = [];

  for (const r of review.CardReviews) {
    const card = await this.prismaService.card.findUnique({
      where: { id: r.cardId },
    });

    if (!card) {
      throw new NotFoundException(`Card with id ${r.cardId} not found`);
    }

    const schedulerInput: SchedulerCard = {
      status: card.status,
      stepIndex: card.stepIndex,
      easeFactor: card.easeFactor,
      interval: card.interval,
    };

    const rating = r.quality as Rating;
    const nextState = scheduler.calculateNext(schedulerInput, rating);

    const now = new Date();

    await this.prismaService.$transaction([
      this.prismaService.card.update({
        where: { id: card.id },
        data: {
          status: nextState.status,
          stepIndex: nextState.stepIndex,
          easeFactor: nextState.easeFactor,
          interval: nextState.interval,
          nextReviewDate: nextState.nextReviewDate,
        },
      }),
      this.prismaService.cardReview.create({
        data: {
          cardId: card.id,
          quality: r.quality,
          repetitions: 0,
          interval: nextState.interval,
          eFactor: nextState.easeFactor,
          nextReviewDate: nextState.nextReviewDate || now,
          reviewedAt: now,
          previousStatus: card.status,
          newStatus: nextState.status,
        },
      }),
    ]);

    results.push({
      id: 0, // ← BUG: Mock ID
      cardId: card.id,
      quality: r.quality,
      repetitions: 0,
      interval: nextState.interval,
      eFactor: nextState.easeFactor,
      nextReviewDate: nextState.nextReviewDate || now,
      reviewedAt: now,
      previousStatus: card.status,
      newStatus: nextState.status,
    });
  }

  return results;
}
```

**Vấn đề (Phase A §2.3):**

1. N+1 Query: 2N DB operations cho N cards
2. Transaction per card: partial update khi card thứ K fail
3. Mock ID: `id: 0` cho tất cả reviews
4. No ownership check
5. `new AnkiScheduler()` mỗi lần gọi (stateless, nên dùng singleton hoặc tạo 1 lần)

#### 4.3.2. Code mới (SAU refactor)

```typescript
// Nguồn: src/services/review/review.service.ts — thay thế dòng 48-125

/**
 * [FACADE] — Chuyển đổi Card entity thành SchedulerCard input.
 * Encapsulate mapping logic, giảm coupling giữa DB schema và Scheduler interface.
 */
private toSchedulerInput(card: Card): SchedulerCard {
  return {
    status: card.status,
    stepIndex: card.stepIndex,
    easeFactor: card.easeFactor,
    interval: card.interval,
  };
}

/**
 * UC-21: Record Review Outcome — Submit batch review results.
 * Đã refactor: Unit of Work (single transaction) + Facade (scheduler helper)
 * + ownership check + actual review IDs.
 *
 * @param review - DTO chứa mảng CardReviews
 * @param userId - ID của user hiện tại (từ JWT token)
 * @throws NotFoundException - Nếu card không tồn tại
 * @throws ForbiddenException - Nếu user không sở hữu card/deck
 */
async submitReviews(review: SubmitReviewDto, userId: number) {
  const scheduler = new AnkiScheduler();
  // ĐÚNG — DTO không có reviewedAt, dùng server-side timestamp
  const now = new Date();

  // ──── BƯỚC 1: Batch fetch tất cả cards cần review ────
  const cardIds = review.CardReviews.map((r) => r.cardId);
  const cards = await this.prismaService.card.findMany({
    where: { id: { in: cardIds } },
    include: { deck: { select: { userId: true } } },
  });

  // ──── BƯỚC 2: Validate existence + ownership ────
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  for (const r of review.CardReviews) {
    const card = cardMap.get(r.cardId);
    if (!card) {
      throw new NotFoundException(`Card with id ${r.cardId} not found`);
    }
    // AUTH-CHECK [UC-21]: Verify user sở hữu deck chứa card
    if (card.deck.userId !== userId) {
      throw new ForbiddenException(
        `You do not have permission to review card ${r.cardId}`,
      );
    }
  }

  // ──── BƯỚC 3: UNIT OF WORK — Single interactive transaction ────
  const results = await this.prismaService.$transaction(async (tx) => {
    const reviewResults: CardReview[] = [];

    for (const r of review.CardReviews) {
      const card = cardMap.get(r.cardId)!;

      // FACADE: Convert Card → SchedulerCard
      const schedulerInput = this.toSchedulerInput(card);
      const rating = r.quality as Rating;
      const nextState = scheduler.calculateNext(schedulerInput, rating);

      // Update card state
      await tx.card.update({
        where: { id: card.id },
        data: {
          status: nextState.status,
          stepIndex: nextState.stepIndex,
          easeFactor: nextState.easeFactor,
          interval: nextState.interval,
          nextReviewDate: nextState.nextReviewDate,
        },
      });

      // Create review record — trả về actual ID (không còn mock id: 0)
      const createdReview = await tx.cardReview.create({
        data: {
          cardId: card.id,
          quality: r.quality,
          // NOTE: Giữ nguyên behavior gốc — AnkiScheduler không expose
          // repetitions count ra ngoài nextState. stepIndex trên Card entity
          // được dùng thay thế để track vị trí trong learning steps.
          // Thay đổi field này cần đồng bộ với scheduler.ts — ngoài scope.
          repetitions: 0,
          interval: nextState.interval,
          eFactor: nextState.easeFactor,
          nextReviewDate: nextState.nextReviewDate || now,
          reviewedAt: now,
          previousStatus: card.status,
          newStatus: nextState.status,
        },
      });

      reviewResults.push(createdReview);
    }

    return reviewResults;
  });

  return results;
}
```

#### 4.3.3. Hướng dẫn apply từng bước

**Bước 1:** Mở file `src/services/review/review.service.ts`

**Bước 2:** Thêm method private `toSchedulerInput` trước `submitReviews` (~dòng 47).

**Bước 3:** Thay thế TOÀN BỘ method `submitReviews` (dòng 48-125) bằng code mới ở §4.3.2.

**Bước 4:** Xác nhận import `Card` đã có ở dòng 3:

```typescript
import { Card, CardReview, ReviewQuality } from '@prisma/client';
```

→ Không cần thêm import mới.

**Bước 5:** Xác nhận `ForbiddenException` đã được thêm ở Bước 2 của §4.2.3.

**Điểm khác biệt chính so với code gốc:**

| Khía cạnh         | Trước                             | Sau                                          |
| ----------------- | --------------------------------- | -------------------------------------------- |
| DB Operations     | 2N (N findUnique + N transaction) | 1 findMany + 1 interactive transaction       |
| Transaction scope | Per card                          | Per batch (all-or-nothing)                   |
| Review ID         | `id: 0` (mock)                    | Actual ID từ `tx.cardReview.create()` return |
| Ownership         | Không check                       | Check `card.deck.userId !== userId`          |
| Scheduler mapping | Inline trong loop                 | Extracted `toSchedulerInput()`               |

> **CẢNH BÁO:** Prisma interactive transaction (`$transaction(async (tx) => {...})`) có timeout mặc định 5 giây. Với batch 50 cards, mỗi card cần 2 operations (update + create) = 100 operations sequential trong transaction. Với SQLite WAL mode, đây không phải vấn đề cho batch nhỏ. Nếu batch > 200 cards, cần tăng timeout: `$transaction(async (tx) => {...}, { timeout: 10000 })`.

---

### 4.4. Refactor: `calculateSessionStatistics()` — UC-23 — Aggregate Root Query

#### 4.4.1. Code hiện tại (TRƯỚC refactor)

```typescript
// Nguồn: src/services/study/study.service.ts — dòng 40-125
async calculateSessionStatistics(
  deckId: number,
  sessionStartTime: Date,
  sessionEndTime: Date,
): Promise<StudySessionStatisticsDto> {
  const reviews = await this.prismaService.cardReview.findMany({
    where: {
      card: { deckId },
      reviewedAt: { gte: sessionStartTime, lte: sessionEndTime },
    },
    include: {
      card: { select: { status: true } },  // ← BUG: đọc CURRENT status
    },
  });

  const totalCardsReviewed = reviews.length;

  // ← BUG: Đếm card.status (hiện tại) thay vì previousStatus (tại thời điểm review)
  const newCardsIntroduced = reviews.filter(
    (r) => r.card.status === 'new',
  ).length;
  const learningCardsReviewed = reviews.filter(
    (r) => r.card.status === 'learning',
  ).length;
  const reviewCardsReviewed = reviews.filter(
    (r) => r.card.status === 'review',
  ).length;

  // ... quality distribution counting ...
}
```

**Bug phát hiện (Phase A §2.3):**
Comment nói "Count cards by status **before** the review" nhưng code đọc `r.card.status` — đây là status HIỆN TẠI của card, KHÔNG phải status tại thời điểm review. Sau khi review, card status đã thay đổi (VD: `new` → `learning`). CardReview đã lưu `previousStatus` — nên dùng field này.

#### 4.4.2. Code mới (SAU refactor)

```typescript
// Nguồn: src/services/study/study.service.ts — thay thế dòng 40-125

/**
 * [AGGREGATE ROOT QUERY] — Helper tính quality distribution.
 * Tập trung logic đếm Again/Hard/Good/Easy vào 1 chỗ để tránh duplicate
 * (hiện có ở getDeckStatistics, getAdvancedStatistics, getTimeRangeStatistics).
 */
private calculateQualityDistribution(reviews: { quality: string }[]) {
  const againCount = reviews.filter((r) => r.quality === 'Again').length;
  const hardCount = reviews.filter((r) => r.quality === 'Hard').length;
  const goodCount = reviews.filter((r) => r.quality === 'Good').length;
  const easyCount = reviews.filter((r) => r.quality === 'Easy').length;
  return { againCount, hardCount, goodCount, easyCount };
}

/**
 * UC-23: View Study Session Statistics.
 * Đã refactor: dùng previousStatus thay vì card.status + extract quality helper.
 *
 * @param deckId - ID của deck
 * @param sessionStartTime - Thời điểm bắt đầu session
 * @param sessionEndTime - Thời điểm kết thúc session
 */
async calculateSessionStatistics(
  deckId: number,
  sessionStartTime: Date,
  sessionEndTime: Date,
): Promise<StudySessionStatisticsDto> {
  // Query reviews — KHÔNG cần include card.status nữa (dùng previousStatus)
  const reviews = await this.prismaService.cardReview.findMany({
    where: {
      card: { deckId },
      reviewedAt: { gte: sessionStartTime, lte: sessionEndTime },
    },
    // Removed: include: { card: { select: { status: true } } }
    // Lý do: previousStatus đã có sẵn trên CardReview record
  });

  const totalCardsReviewed = reviews.length;

  // FIX [UC-23]: Dùng previousStatus (trạng thái TẠI THỜI ĐIỂM review)
  // thay vì card.status (trạng thái HIỆN TẠI sau tất cả reviews)
  const newCardsIntroduced = reviews.filter(
    (r) => r.previousStatus === 'new',
  ).length;
  const learningCardsReviewed = reviews.filter(
    (r) => r.previousStatus === 'learning',
  ).length;
  const reviewCardsReviewed = reviews.filter(
    (r) => r.previousStatus === 'review',
  ).length;

  // AGGREGATE ROOT QUERY: Dùng shared helper
  const { againCount, hardCount, goodCount, easyCount } =
    this.calculateQualityDistribution(reviews);

  const correctAnswers = goodCount + easyCount;
  const incorrectAnswers = againCount;

  const accuracyPercentage =
    totalCardsReviewed > 0 ? (correctAnswers / totalCardsReviewed) * 100 : 0;

  const totalStudyTime = Math.floor(
    (sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000,
  );

  const averageTimePerCard =
    totalCardsReviewed > 0 ? totalStudyTime / totalCardsReviewed : 0;

  const deck = await this.prismaService.deck.findUnique({
    where: { id: deckId },
    select: { title: true },
  });

  return {
    totalCardsReviewed,
    newCardsIntroduced,
    learningCardsReviewed,
    reviewCardsReviewed,
    correctAnswers,
    incorrectAnswers,
    accuracyPercentage: parseFloat(accuracyPercentage.toFixed(2)),
    totalStudyTime,
    averageTimePerCard: parseFloat(averageTimePerCard.toFixed(2)),
    againCount,
    hardCount,
    goodCount,
    easyCount,
    sessionStartTime,
    sessionEndTime,
    deckId: deckId.toString(),
    deckName: deck?.title || 'Unknown',
  };
}
```

#### 4.4.3. Hướng dẫn apply từng bước

**Bước 1:** Mở file `src/services/study/study.service.ts`

**Bước 2:** Thêm method private `calculateQualityDistribution` trước `calculateSessionStatistics` (~dòng 39).

**Bước 3:** Thay thế TOÀN BỘ method `calculateSessionStatistics` (dòng 40-125) bằng code mới ở §4.4.2.

**Bước 4:** Verify 3 thay đổi logic chính:

1. ✅ `r.card.status` → `r.previousStatus` (fix bug)
2. ✅ `include: { card: { select: { status: true } } }` → removed (không cần join nữa)
3. ✅ Quality counting inline → `this.calculateQualityDistribution(reviews)`

**Bước 5:** `npm run build` — phải pass hoàn toàn (không thay đổi public interface).

> **GIẢI THÍCH BUG FIX:** CardReview record đã lưu `previousStatus` (dòng 103 trong `submitReviews` gốc: `previousStatus: card.status`). Đây chính là status card TRƯỚC khi review. Dùng field này cho statistics đảm bảo: nếu session review 10 new cards → `newCardsIntroduced = 10` (đúng), thay vì `newCardsIntroduced = 0` (sai — vì sau review cards đã thành `learning`).

---

### 4.5. Checklist Chương 4

- [ ] `review.service.ts`: Thêm import `ForbiddenException`
- [ ] `review.service.ts`: Thêm private `buildDueCardsSpec()` — Specification Pattern
- [ ] `review.service.ts`: Refactor `getDueReviews()` — thêm `userId`, ownership check
- [ ] `review.service.ts`: Thêm private `toSchedulerInput()` — Facade Pattern
- [ ] `review.service.ts`: Refactor `submitReviews()` — batch fetch, interactive transaction, actual IDs
- [ ] `study.service.ts`: Thêm private `calculateQualityDistribution()` — Aggregate helper
- [ ] `study.service.ts`: Refactor `calculateSessionStatistics()` — fix `previousStatus` bug
- [ ] `npm run build` — phải pass hoàn toàn

---

## CHƯƠNG 5: REPOSITORY & INDEXING

### 5.1. Prisma Schema — KHÔNG THAY ĐỔI

**File:** `prisma/schema.prisma`

Refactor này **KHÔNG** thay đổi Prisma schema. Tất cả thay đổi nằm ở tầng Service và Controller.

Lý do:

1. Entities `Card`, `CardReview`, `Deck` — giữ nguyên 100% fields và relationships.
2. `CardReview.previousStatus` và `CardReview.newStatus` — đã tồn tại trong schema. UC-23 bug fix chỉ cần đọc field này thay vì join `card.status`.
3. Không có field mới, không có relation mới, không migration.

```prisma
// Nguồn: prisma/schema.prisma — GIỮNGUYÊN, KHÔNG SỬA
model CardReview {
  id             Int           @id @default(autoincrement())
  cardId         Int
  card           Card          @relation(fields: [cardId], references: [id])
  quality        ReviewQuality
  repetitions    Int           @default(0)
  interval       Int           @default(0)
  eFactor        Float         @default(2.5)
  nextReviewDate DateTime
  reviewedAt     DateTime      @default(now())
  previousStatus String        @default("new")  // ← UC-23 dùng field này
  newStatus      String        @default("new")

  @@index([cardId])
  @@index([nextReviewDate])
  @@index([reviewedAt])
}
```

### 5.2. Index Verification

Các index hiện tại đã đủ cho refactor:

| Index                       | Bảng       | Dùng bởi                             | Mục đích                       |
| --------------------------- | ---------- | ------------------------------------ | ------------------------------ |
| `@@index([deckId])`         | Card       | `getDueReviews()` UC-20              | Filter cards theo deck         |
| `@@index([nextReviewDate])` | CardReview | `getDueReviews()` UC-20              | Sort/filter thẻ đến hạn        |
| `@@index([cardId])`         | CardReview | `submitReviews()` UC-21              | Lookup reviews theo card       |
| `@@index([reviewedAt])`     | CardReview | `calculateSessionStatistics()` UC-23 | Filter reviews theo time range |

> **Kết luận:** Không cần thêm index mới. Query patterns sau refactor sử dụng ĐÚNG các index đã có. Batch fetch `findMany({ where: { id: { in: cardIds } } })` dùng primary key index — hiệu quả nhất.

### 5.3. Module Configuration — KHÔNG THAY ĐỔI

**File:** `src/modules/study.module.ts`

```typescript
// Nguồn: src/modules/study.module.ts — GIỮNGUYÊN
@Module({
  imports: [PrismaModule],
  controllers: [StudyController],
  providers: [ReviewService, StudyService],
})
export class StudyModule {}
```

Không thêm provider mới. Tất cả refactor nằm trong `ReviewService` và `StudyService` đã registered.

### 5.4. Checklist Chương 5

- [ ] Verify `prisma/schema.prisma` — KHÔNG có thay đổi
- [ ] Verify `src/modules/study.module.ts` — KHÔNG có thay đổi
- [ ] Verify: Không cần chạy `npx prisma generate` (schema không đổi)
- [ ] Verify: Không cần chạy `npx prisma migrate` (không có migration mới)

---

## CHƯƠNG 6: TỔNG KẾT & HƯỚNG DẪN APPLY

### 6.1. Tổng kết thay đổi

| #   | File                                        | Loại thay đổi                          | UC           | Pattern                             |
| --- | ------------------------------------------- | -------------------------------------- | ------------ | ----------------------------------- |
| 1   | `src/controllers/study/study.controller.ts` | MODIFY — 2 methods                     | UC-20, UC-21 | Thêm `@GetUser()` cho ownership     |
| 2   | `src/services/review/review.service.ts`     | MODIFY — 2 methods + 2 private helpers | UC-20, UC-21 | Specification, Unit of Work, Facade |
| 3   | `src/services/study/study.service.ts`       | MODIFY — 1 method + 1 private helper   | UC-23        | Aggregate Root Query                |
| 4   | `src/services/scheduler.ts`                 | KHÔNG SỬA                              | UC-21        | Giữ nguyên (CẤM refactor SM-2 math) |
| 5   | `prisma/schema.prisma`                      | KHÔNG SỬA                              | —            | Giữ nguyên                          |
| 6   | `src/modules/study.module.ts`               | KHÔNG SỬA                              | —            | Giữ nguyên                          |
| 7   | Tất cả DTOs (4 files)                       | KHÔNG SỬA                              | —            | Giữ nguyên                          |

**Tổng: 3 file sửa / 6+ file giữ nguyên**

### 6.2. Thứ tự Apply (BẮT BUỘC tuân theo)

**⛔ TRƯỚC KHI BẮT ĐẦU — BẮT BUỘC:**

```bash
# Bước 0a: Tạo branch mới — KHÔNG làm trực tiếp trên main/develop
git checkout -b refactor/uc-20-21-23-sm2

# Bước 0b: Verify test suite hiện tại đang xanh trước khi touch bất cứ thứ gì
npm test

# Bước 0c: Ghi lại kết quả build sạch làm baseline
npm run build
```

> Nếu `npm test` đang fail trước khi apply → **DỪNG.**
> Không được tiếp tục khi baseline đã broken.
> Fix test gốc trước, sau đó mới apply tài liệu này.

```
┌────────────────────────────────────────────────────────────┐
│  BƯỚC 1: review.service.ts                                  │
│  ├─ 1a. Thêm import ForbiddenException (dòng 1)            │
│  ├─ 1b. Thêm private toSchedulerInput() (trước dòng 48)    │
│  ├─ 1c. Thay thế submitReviews() (dòng 48-125)             │
│  ├─ 1d. Thêm private buildDueCardsSpec() (trước dòng 161)  │
│  └─ 1e. Thay thế getDueReviews() (dòng 161-201)            │
│                                                             │
│  BƯỚC 2: study.service.ts                                   │
│  ├─ 2a. Thêm private calculateQualityDistribution()        │
│  │       (trước dòng 40)                                    │
│  └─ 2b. Thay thế calculateSessionStatistics() (dòng 40-125)│
│                                                             │
│  BƯỚC 3: study.controller.ts                                │
│  ├─ 3a. Thay thế submitReview() (dòng 134)                 │
│  └─ 3b. Thay thế getDueReviews() (dòng 163)                │
│                                                             │
│  BƯỚC 4: Verification                                       │
│  ├─ 4a. npm run build                                       │
│  ├─ 4b. npm test                                            │
│  └─ 4c. npm run start:dev                                   │
└────────────────────────────────────────────────────────────┘
```

> **TẠI SAO THỨ TỰ NÀY?** Service trước Controller — vì Controller depend on Service interface. Nếu apply Controller trước, TypeScript sẽ báo lỗi vì service signature chưa thay đổi. Apply service trước đảm bảo mỗi bước đều có thể build incrementally.

### 6.3. Ripple Effect Analysis (Post-Apply)

Sau khi apply tất cả thay đổi, các file ngoài cluster cần kiểm tra:

| File ngoài cluster                          | Method bị ảnh hưởng                              | Mức độ    | Hành động                                                                                                                                                                                          |
| ------------------------------------------- | ------------------------------------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/deck/deck.service.ts`         | `getDeckStatistics()`, `getAdvancedStatistics()` | Thấp      | Không cần sửa — vẫn dùng inline quality counting riêng. `calculateQualityDistribution()` chỉ add cho `study.service.ts`. Sau này có thể refactor deck.service để dùng shared helper (ngoài scope). |
| `src/services/deck/deck.service.ts`         | `getConsecutiveStudyDays()` (private)            | Thấp      | Không ảnh hưởng — logic duplicate nhưng independent. Review.service.ts có method cùng tên nhưng khác implementation.                                                                               |
| `tests/unit/review/review.service.spec.ts`  | Tests cho `getDueReviews`, `submitReviews`       | **Cao**   | **CẦN CẬP NHẬT** — signature `getDueReviews(deckId, userId)` và `submitReviews(review, userId)` thay đổi. Xem §6.4.                                                                                |
| `tests/unit/study/study.service.spec.ts`    | Tests cho `calculateSessionStatistics`           | **Trung** | Có thể cần update assertions nếu test check `include: { card }`.                                                                                                                                   |
| `tests/unit/study/study.controller.spec.ts` | Tests cho controller endpoints                   | **Trung** | Cần update mock calls với `user.id` parameter.                                                                                                                                                     |

### 6.4. Hướng dẫn cập nhật Unit Tests

Sau khi apply code changes, unit tests CẦN được update vì service signatures thay đổi:

#### Test cho `getDueReviews` — thêm `userId` parameter

```typescript
// TRƯỚC (test gốc):
const result = await service.getDueReviews(1);

// SAU (test cập nhật):
const result = await service.getDueReviews(1, 1); // deckId=1, userId=1

// Mock deck phải trả về deck có userId match:
prismaService.deck.findFirst.mockResolvedValue({ id: 1, userId: 1, ... });
// Thay vì:
// prismaService.deck.findUnique.mockResolvedValue({ id: 1, ... });
```

#### Test cho `submitReviews` — thêm `userId` parameter + interactive transaction

```typescript
// TRƯỚC (test gốc):
const result = await service.submitReviews(submitDto);

// SAU (test cập nhật):
const result = await service.submitReviews(submitDto, 1); // userId=1

// Mock cards phải include deck.userId:
prismaService.card.findMany.mockResolvedValue([
  { id: 1, deckId: 1, deck: { userId: 1 }, status: 'new', ... },
]);

// Mock interactive transaction:
prismaService.$transaction.mockImplementation(async (fn) => {
  return fn({
    card: { update: jest.fn().mockResolvedValue({}) },
    cardReview: { create: jest.fn().mockResolvedValue({ id: 1, ... }) },
  });
});
```

#### Test cho `calculateSessionStatistics` — fix previousStatus

```typescript
// TRƯỚC (test gốc dùng card.status):
prismaService.cardReview.findMany.mockResolvedValue([
  { quality: 'Good', card: { status: 'new' }, ... },
]);

// SAU (test cập nhật dùng previousStatus):
prismaService.cardReview.findMany.mockResolvedValue([
  { quality: 'Good', previousStatus: 'new', ... },
  // Removed: card: { status: ... } — không cần include nữa
]);
```

### 6.5. Verification Commands

```bash
# Bước 1: Build check — phải pass 0 errors
npm run build

# Bước 2: Test — update tests trước, rồi chạy
npm test

# Bước 3: Dev server — verify startup không crash
npm run start:dev

# Bước 4 (Optional): Manual test qua Swagger UI
# Truy cập http://localhost:3000/api (nếu Swagger enabled)
# Test endpoint GET /study/start/:id — phải trả về cards (với valid JWT)
# Test endpoint POST /study/review — phải trả về actual review IDs (không còn id: 0)
```

### 6.6. Bảng tóm tắt Bug Fix & Improvement

| #   | Loại               | Mô tả                                    | File                | Trước                     | Sau                                        |
| --- | ------------------ | ---------------------------------------- | ------------------- | ------------------------- | ------------------------------------------ |
| 1   | 🐛 Bug Fix         | Session statistics đếm wrong card status | `study.service.ts`  | `r.card.status` (current) | `r.previousStatus` (at review time)        |
| 2   | 🐛 Bug Fix         | Mock review ID                           | `review.service.ts` | `id: 0`                   | Actual ID from DB                          |
| 3   | 🔒 Security        | Missing ownership check — study start    | `review.service.ts` | No check                  | `deck.userId === userId`                   |
| 4   | 🔒 Security        | Missing ownership check — submit review  | `review.service.ts` | No check                  | `card.deck.userId === userId`              |
| 5   | ⚡ Performance     | N+1 query in submitReviews               | `review.service.ts` | 2N DB ops                 | 1 batch fetch + 1 transaction              |
| 6   | 🛡️ Reliability     | Transaction per card (partial update)    | `review.service.ts` | N transactions            | 1 interactive transaction (all-or-nothing) |
| 7   | 🏗️ Maintainability | Inline query logic                       | `review.service.ts` | Hardcoded WHERE           | `buildDueCardsSpec()`                      |
| 8   | 🏗️ Maintainability | Inline scheduler mapping                 | `review.service.ts` | Inline in loop            | `toSchedulerInput()`                       |
| 9   | 🏗️ Maintainability | Duplicate quality counting               | `study.service.ts`  | Inline filters            | `calculateQualityDistribution()`           |

---

✅ **PHASE B HOÀN TẤT.**

Tài liệu này chứa đầy đủ hướng dẫn để Dev tự đọc và tự apply toàn bộ refactor cho UC-20 (Start Study Session), UC-21 (Record Review Outcome), và UC-23 (View Study Session Statistics).

**Tổng file sửa: 3** | **Tổng file giữ nguyên: 6+** | **Bug fix: 2** | **Security fix: 2** | **Performance fix: 1**

---

### 6.7. ✅ Definition of Done — Checklist Verify Sau Apply

Sau khi apply toàn bộ theo §6.2, verify từng mục sau.
Không được đánh dấu ✅ nếu chưa có bằng chứng thực tế.

**Build & Test:**

- [ ] `npm run build` — output: 0 errors, 0 warnings liên quan đến files đã sửa
- [ ] `npm test` — tất cả test pass (sau khi đã update tests theo §6.4)
- [ ] `npm run start:dev` — server khởi động không crash

**Ownership Check:**

- [ ] `GET /study/start/:id` với JWT của user khác → trả về 404 (không trả về cards của deck người khác)
- [ ] `POST /study/review` với cardId thuộc deck người khác → trả về 403

**Data Correctness:**

- [ ] `POST /study/review` response — tất cả review objects có `id` khác 0
- [ ] `GET /study/session-statistics/:deckId` — `newCardsIntroduced` đúng với số new cards thực sự được review trong session (không phải 0)

**Transaction:**

- [ ] Submit batch 3+ cards — nếu 1 card fail → toàn bộ batch rollback, không có partial update trong DB

**Code Labels:**

- [ ] `review.service.ts` — có comment `// AUTH-CHECK [UC-20]` và `// AUTH-CHECK [UC-21]`
- [ ] `review.service.ts` — có comment `// SPECIFICATION PATTERN` và `// UNIT OF WORK`
- [ ] `study.service.ts` — có comment `// FIX [UC-23]: Dùng previousStatus`
- [ ] Không còn `id: 0` trong bất kỳ `results.push(...)` nào
- [ ] Không còn `r.card.status` trong `calculateSessionStatistics()`

<!-- Fixed: 2026-04-26 — C1, C2, M1, M2, M3, L2 applied | Patch: C2-§3.2.3, M1-position applied -->
