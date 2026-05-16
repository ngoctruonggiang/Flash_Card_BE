# BÁO CÁO KIẾN TRÚC PHẦN MỀM FLASHLEARN — BẢN HOÀN CHỈNH

---

## MỤC LỤC

1. Tổng quan hệ thống
2. Architectural Drivers (AD) — Giải thích chi tiết
3. Tactic Catalog — Giải thích từng Tactic
4. Mapping tất cả UC → AD → Tactic → Code (kèm đường dẫn file)
5. Design Decisions & Rejected Alternatives
6. 4+1 View Model
7. Cross-View Traceability & Consistency
8. Logging, Monitoring & Telemetry
9. Mẹo trả lời thầy

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1. FlashLearn là gì?

FlashLearn là ứng dụng web học từ vựng tiếng Anh sử dụng thuật toán **SM-2** (SuperMemo 2 — Spaced Repetition). Người dùng tạo bộ thẻ (deck), thêm thẻ (card), và hệ thống tự động lên lịch ôn tập dựa trên chất lượng trả lời của người dùng.

**Ví dụ hoạt động đơn giản:** User học 1 thẻ → trả lời "Good" → SM-2 tính rằng thẻ này nên ôn lại sau 3 ngày → 3 ngày sau thẻ xuất hiện lại → trả lời "Easy" → SM-2 tính ôn lại sau 7 ngày...

### 1.2. Kiến trúc 4 lớp

Hệ thống chia thành 4 lớp, mỗi lớp có trách nhiệm riêng:

```
Lớp 1: Presentation Layer (Controllers, Middleware)
   → Nhiệm vụ: Nhận HTTP request từ client, validate input, gọi Service
   → VD: StudyController nhận POST /study/review → gọi ReviewService

Lớp 2: Business Logic Layer (Services)
   → Nhiệm vụ: Chứa toàn bộ logic nghiệp vụ, quản lý transactions
   → VD: ReviewService tính SM-2, wrap card.update + review.create trong transaction

Lớp 3: Data Access Layer (Repositories / Prisma)
   → Nhiệm vụ: Tương tác DB, sử dụng indexes, mapping dữ liệu
   → VD: prisma.card.findMany() với composite index để query nhanh

Lớp 4: Database Layer (PostgreSQL)
   → Nhiệm vụ: Lưu trữ dữ liệu, đảm bảo ACID
   → Tables: users, decks, cards, cardReviews, login_attempts
```

**Tại sao chia 4 lớp?**

- Khi cần tối ưu query → chỉ sửa ở lớp 3 (Data Access), KHÔNG ảnh hưởng lớp 1, 2
- Khi cần thêm transaction → sửa ở lớp 2 (Service), KHÔNG ảnh hưởng HTTP routing ở lớp 1
- Trade-off: thêm ~2-5ms/request vì đi qua nhiều lớp, nhưng target là 500ms nên không đáng kể

### 1.3. Tech Stack

| Thành phần    | Công nghệ                                    | Lý do chọn                                         |
| ------------- | -------------------------------------------- | -------------------------------------------------- |
| Backend       | Node.js + Express (REST API)                 | Stateless, dễ scale ngang                          |
| Frontend      | React SPA                                    | Hỗ trợ offline (IndexedDB), single-page cho UX tốt |
| Database      | PostgreSQL                                   | Hỗ trợ ACID transactions, composite indexes        |
| Auth          | JWT HS256, HttpOnly cookie                   | Stateless — không cần lưu session trong DB         |
| Container     | Docker (node:18-alpine + postgres:15-alpine) | restart:always, volume persistence                 |
| Reverse Proxy | Nginx                                        | SSL termination, rate limiting, load balancing     |

### 1.4. Danh sách 24 Use Cases

| Nhóm         | UC    | Tên               | Mô tả                                   |
| ------------ | ----- | ----------------- | --------------------------------------- |
| **User**     | UC-01 | Register          | Tạo tài khoản, bcrypt hash password     |
|              | UC-02 | Login             | Xác thực + JWT + BruteForce guard       |
|              | UC-03 | Logout            | Clear JWT, chặn back-navigation         |
|              | UC-04 | View Profile      | Hiển thị thông tin (loại password_hash) |
|              | UC-05 | Update Profile    | Cập nhật (atomic transaction)           |
|              | UC-06 | Delete Account    | Xóa cascade: reviews→cards→decks→user   |
| **Deck**     | UC-07 | View Deck Library | Phân trang 20/page, composite index     |
|              | UC-08 | Create Deck       | Tạo deck, default VN_EN                 |
|              | UC-09 | Edit Deck         | Sửa metadata (ownership check)          |
|              | UC-10 | Delete Deck       | Cascade: reviews→cards→deck             |
|              | UC-11 | View Deck Stats   | SQL GROUP BY                            |
|              | UC-12 | Advanced Stats    | Lazy computation on-demand              |
| **Card**     | UC-13 | Browse Cards      | Xem thẻ trong deck                      |
|              | UC-14 | Add Card          | SM-2 init + reverseCards()              |
|              | UC-15 | Edit Card         | Ownership check + atomic                |
|              | UC-16 | Delete Card       | Cascade: reviews→card                   |
|              | UC-17 | View Card Stats   | Thống kê từng thẻ                       |
|              | UC-18 | Import JSON       | Batch insert ≤1000 cards                |
|              | UC-19 | Export JSON       | Download file                           |
| **Study** ⭐ | UC-20 | Start Session     | findDueCards() ≤500ms                   |
|              | UC-21 | Record Review     | SM-2 + atomic TX (online/offline)       |
|              | UC-22 | Session Summary   | Accuracy in-memory                      |
|              | UC-23 | Session Stats     | Quality distribution                    |
| **Auth**     | UC-24 | Resource Auth     | Ownership middleware                    |

---

## 2. ARCHITECTURAL DRIVERS (AD) — GIẢI THÍCH CHI TIẾT

### AD là gì? Nằm ở đâu? Nguồn gốc từ đâu?

**Hiểu đơn giản:** Trong hệ thống có rất nhiều yêu cầu. Nhưng KHÔNG PHẢI yêu cầu nào cũng quan trọng đến mức phải thay đổi kiến trúc. Chỉ những yêu cầu **vừa có giá trị kinh doanh cao, vừa có rủi ro kỹ thuật cao** mới gọi là **Architectural Driver (AD)**.

**AD được đánh giá theo 2 tiêu chí:**

- **BV (Business Value):** Giá trị kinh doanh — H (High), M (Medium), L (Low)
- **TR (Technical Risk):** Rủi ro kỹ thuật nếu không giải quyết — H, M, L

**Quy tắc:** Scenario nào có BV=H hoặc TR=H → trở thành AD → BẮT BUỘC phải giải quyết.

**Nguồn gốc AD — nằm ở đâu trong tài liệu:**

```
Bước 1: SRS (24 Use Cases + Business Rules)
   → Tài liệu: FlashLearn_SRS_v2.docx.md
   → Liệt kê tất cả yêu cầu chức năng

Bước 2: Lọc ra yêu cầu chất lượng, xếp vào Utility Tree
   → Tài liệu: Utility Tree Flashcards V2.docx.md
   → Đánh giá BV và TR cho từng scenario

Bước 3: Các scenario có H → trở thành AD (AD-01 đến AD-07)
   → Tài liệu: FlashLearn_ASR_Completed.md
   → Ghi nhận chính thức các AD
```

**Ví dụ cụ thể cách 1 AD được tạo ra:**

```
SRS nói: UC-20 "User click Study Now → hệ thống trả thẻ đến hạn"
   → Utility Tree hỏi: "Performance quan trọng không?" → BV=H (user bỏ app nếu chậm)
   → Utility Tree hỏi: "Rủi ro kỹ thuật?" → TR=H (50,000 records có thể chậm 2-5s)
   → Kết luận: BV=H, TR=H → Trở thành AD-01
```

### 2.1. AD-01: Performance/Latency — BV=H, TR=H — ĐỘ ƯU TIÊN CAO NHẤT

**Nghĩa là gì?** Hệ thống PHẢI phản hồi nhanh khi user bắt đầu phiên học.

**Scenario cụ thể:** User click "Study Now" trên deck có 500+ cards → hệ thống phải trả về danh sách thẻ đến hạn trong ≤500ms.

**Tại sao BV=H?** Nếu chậm → user chờ lâu → bỏ ứng dụng → mất user.

**Tại sao TR=H?** Database có thể chứa 50,000 records. Nếu không có index → full table scan = 2-5 giây. Đây là rủi ro kỹ thuật thực tế.

**UC liên quan:** UC-20, UC-21, UC-22/23

### 2.2. AD-02: Availability/Offline — BV=M, TR=H — RỦI RO KỸ THUẬT CAO NHẤT

**Nghĩa là gì?** User PHẢI học được cả khi mất mạng internet.

**Scenario cụ thể:** User đang review card thứ 10/30 → đột ngột mất mạng → user tiếp tục review 20 cards còn lại → khi có mạng lại → hệ thống tự động đồng bộ lên server.

**Tại sao TR=H?** Đây là bài toán KỸ THUẬT PHỨC TẠP NHẤT: phải lưu data offline (IndexedDB), phải detect mạng, phải batch sync, phải xử lý conflict. Nếu làm sai → mất dữ liệu review → user mất tin tưởng.

**UC liên quan:** UC-21 (offline path)

### 2.3. AD-03: Security/Authorization — BV=H, TR=M

**Nghĩa là gì?** User A KHÔNG ĐƯỢC sửa/xóa dữ liệu của User B, dù cùng role.

**Scenario cụ thể:** Admin A gửi `DELETE /api/decks/5` (deck thuộc Admin B) → hệ thống phải trả 403 Forbidden. Dù cả 2 đều là Admin, Admin A vẫn KHÔNG được xóa deck của Admin B.

**Tại sao quan trọng?** Nếu chỉ dùng RBAC (kiểm tra role) → cả 2 Admin cùng role "Admin" → RBAC cho phép cả 2 → SAI! Cần kiểm tra OWNERSHIP (ai là chủ sở hữu).

**UC liên quan:** UC-24, UC-08/09/10, UC-14/15/16, UC-18/19

### 2.4. AD-04: Reliability/Transactions — BV=H, TR=M

**Nghĩa là gì?** Khi ghi dữ liệu, phải đảm bảo "tất cả hoặc không gì cả" (atomicity).

**Scenario cụ thể:** Trong UC-21, hệ thống cần: (1) cập nhật card, (2) tạo review record. Nếu DB connection drop SAU bước 1 nhưng TRƯỚC bước 2 → card đã update nhưng review chưa tạo → DỮ LIỆU SAI (partial state). Transaction đảm bảo: nếu bước 2 fail → bước 1 cũng rollback.

**UC liên quan:** UC-05, UC-06, UC-10, UC-14, UC-15, UC-16, UC-21

### 2.5. AD-05: Security/Authentication — BV=H, TR=M

**Nghĩa là gì?** Bảo vệ quá trình đăng nhập khỏi tấn công.

**Scenario cụ thể:** Hacker gửi 10 lần login sai liên tiếp trong 5 phút → sau lần thứ 5 → hệ thống khóa tài khoản (429 Locked). Error message chỉ nói "Invalid credentials" — KHÔNG nói rõ sai email hay sai password (để hacker không biết email có tồn tại hay không).

**UC liên quan:** UC-01, UC-02, UC-03

### 2.6. AD-06: Security/Confidentiality — BV=H, TR=M

**Nghĩa là gì?** KHÔNG BAO GIỜ lộ dữ liệu nhạy cảm ra API response.

**Scenario cụ thể:** Khi user xem profile (UC-04), API response chỉ chứa {username, email, stats}. TUYỆT ĐỐI KHÔNG chứa password_hash, salt, hay JWT token. Sử dụng DTO Filtering để loại bỏ các field nhạy cảm trước khi trả về client.

**UC liên quan:** UC-01, UC-04

### 2.7. AD-07: Scalability/Data Volume — BV=H, TR=M

**Nghĩa là gì?** Hệ thống phải xử lý được lượng dữ liệu lớn mà không chậm.

**Scenario cụ thể:** Power Learner có 150 decks → endpoint GET /decks phải phân trang (20 deck/page) kết hợp DB index → response ≤1 giây. Import 1000 cards (UC-18) phải hoàn thành ≤5 giây.

**UC liên quan:** UC-07, UC-11/12, UC-18, UC-22/23

---

## 3. TACTIC CATALOG — GIẢI THÍCH TỪNG TACTIC

### Tactic là gì? Nằm ở đâu?

**Hiểu đơn giản:**

- **AD = VẤN ĐỀ** cần giải quyết (VD: "query phải nhanh ≤500ms")
- **Tactic = GIẢI PHÁP** cụ thể cho vấn đề đó (VD: "tạo composite DB index")

**Nguồn gốc Tactic — nằm ở đâu trong tài liệu:**

```
Bước 1: AD xác định vấn đề (từ ASR)
Bước 2: Chọn Tactic phù hợp (từ sách Bass, Clements, Kazman — tài liệu ADD)
   → Tài liệu: FlashLearn_ADD.docx.md
Bước 3: Triển khai Tactic trong code
Bước 4: Ghi lại trong SAD (Section 10 — Tactic Catalogue)
   → Tài liệu: FlashLearn_SAD.docx.md
```

**Ví dụ luồng đầy đủ:**

```
AD-01 nói: "Performance phải ≤500ms" ← VẤN ĐỀ
   → ADD chọn Tactic T1: "Tạo composite index" ← GIẢI PHÁP
   → Code triển khai: prisma/schema.prisma có @@index([deckId]) ← TRIỂN KHAI
   → SAD ghi lại: Section 10.1 Tactic T1 ← TÀI LIỆU
```

### Nhóm 1: Tactics cho PERFORMANCE (AD-01)

#### T1 — Composite DB Index

- **Vấn đề:** Query `findDueCards()` trên 50,000 records → full table scan = 2-5 giây
- **Giải pháp:** Tạo composite index trên các cột thường dùng trong WHERE
- **Implementation:** `CREATE INDEX idx_cards_due ON cards(deckId, userId, nextReviewDate)`
- **Hiệu quả:** Query giảm từ 2-5s xuống ≤300ms
- **Trade-off:** Mỗi lần INSERT/UPDATE card tốn thêm ~5% thời gian (vì phải cập nhật index)
- **UC sử dụng:** UC-20 (Start Session), UC-07 (View Deck Library)
- **Code:** `prisma/schema.prisma` — `@@index([deckId])` trên model Card

#### T7 — Query Optimization

- **Vấn đề:** Query không hiệu quả → chậm
- **Giải pháp:** Dùng `WHERE + ORDER BY` trên indexed columns + `LIMIT` để giới hạn kết quả + SQL `GROUP BY` cho thống kê
- **UC sử dụng:** UC-07, UC-11/12, UC-18, UC-20
- **Code:** `src/services/review/review.service.ts` — `findMany({ where: spec, orderBy: { nextReviewDate: 'asc' } })`

#### T13 — In-process SM-2 (Pure Function)

- **Vấn đề:** SM-2 calculation cần nhanh, không được gọi network
- **Giải pháp:** SM-2 là pure function chạy trong cùng process, KHÔNG đọc DB, KHÔNG gọi API. Chỉ nhận input (card hiện tại + rating) → trả output (next state). Thời gian chạy <1ms.
- **Tại sao server-side?** Nếu client-side → user mở DevTools sửa kết quả → phá vỡ scheduling
- **UC sử dụng:** UC-20, UC-21
- **Code:** `src/services/scheduler.ts` — class `AnkiScheduler`, method `calculateNext()`

### Nhóm 2: Tactics cho AVAILABILITY/OFFLINE (AD-02)

#### T10 — Offline Cache (IndexedDB)

- **Vấn đề:** Khi mất mạng, data review phải được lưu ở đâu đó trên browser
- **Giải pháp:** Dùng IndexedDB (KHÔNG dùng localStorage)
- **Tại sao IndexedDB?** Async (không block UI), có transaction, dung lượng lớn, persist qua tab reload. localStorage thì đồng bộ (block UI), chỉ lưu string, giới hạn ~5MB.
- **UC sử dụng:** UC-21 (offline path)

#### T11 — Batch Sync

- **Vấn đề:** Khi có mạng lại, cần gửi TẤT CẢ reviews offline lên server 1 lần
- **Giải pháp:** `OfflineSyncService.syncPending()` đọc IndexedDB → POST /review/batch → server xử lý atomic. Nếu fail → retry exponential backoff (tối đa 3 lần).
- **UC sử dụng:** UC-21 (offline path)

#### T12 — Network Monitor

- **Vấn đề:** App cần biết khi nào mất mạng, khi nào có mạng lại
- **Giải pháp:** Subscribe `window.online/offline` events → hiển thị banner thông báo → chuyển giữa online/offline mode tự động
- **UC sử dụng:** UC-21 (offline path)

### Nhóm 3: Tactics cho SECURITY (AD-03, AD-05, AD-06)

#### T4 — Resource-Level Authorization (Ownership Check)

- **Vấn đề:** 2 Admin cùng role → RBAC cho phép cả 2 → SAI
- **Giải pháp:** Tạo ResourceAuthMiddleware, gọi `findByIdAndOwner(deckId, userId)` → WHERE id=? AND userId=? → nếu null → 403 Forbidden. Controller KHÔNG BAO GIỜ được gọi nếu ownership fail.
- **Trade-off:** +50ms mỗi request mutation (1 query DB thêm). Nhưng security violation tệ hơn nhiều.
- **UC sử dụng:** UC-08-10, UC-14-16, UC-18-19, UC-24
- **Code:** Ownership check trong các service files, VD `src/services/review/review.service.ts`

#### T5 — BruteForce Guard

- **Vấn đề:** Hacker thử login nhiều lần để đoán password
- **Giải pháp:** Bảng `login_attempts` theo dõi (email, IP, timestamp). Sau 5 lần sai liên tiếp → khóa tài khoản.
- **Trade-off:** User hợp lệ cũng bị khóa nếu nhập sai 5 lần
- **UC sử dụng:** UC-02
- **Code:** `src/services/auth/auth.service.ts`

#### T6 — Generic Error Messages

- **Vấn đề:** Nếu nói "Email không tồn tại" → hacker biết email nào có trong hệ thống
- **Giải pháp:** Luôn trả "Invalid credentials" — KHÔNG phân biệt sai email hay sai password
- **UC sử dụng:** UC-02, UC-24

#### T2 — DTO Filtering

- **Vấn đề:** API response có thể vô tình chứa password_hash
- **Giải pháp:** Tạo ProfileDTO chỉ chứa {username, email, stats}, loại bỏ password_hash, salt
- **UC sử dụng:** UC-04
- **Code:** Trong service files khi trả response

#### T3 — Data Isolation

- **Vấn đề:** Query có thể trả dữ liệu của user khác
- **Giải pháp:** TẤT CẢ queries đều có `userId` trong WHERE clause
- **UC sử dụng:** UC-04, UC-19, UC-24

#### T17 — JWT Authentication

- **Giải pháp:** JWT HS256, verify signature + expiry mỗi request. Lưu trong HttpOnly SameSite=Strict cookie (KHÔNG dùng localStorage vì XSS).
- **Trade-off:** JWT_SECRET rotation → invalidate TẤT CẢ sessions
- **UC sử dụng:** Tất cả endpoint cần xác thực
- **Code:** `src/middleware/guards/auth.guard.ts`

#### T18 — HTTPS + bcrypt

- **Giải pháp:** HTTPS-only (Nginx redirect HTTP→HTTPS). Password hash bằng bcrypt rounds≥10. JWT trong HttpOnly cookie.
- **UC sử dụng:** UC-01, UC-02, UC-04

#### T19 — Input Validation

- **Giải pháp:** Server-side schema validation (Joi/Zod) chống SQL Injection, XSS
- **UC sử dụng:** UC-01, UC-18

### Nhóm 4: Tactics cho RELIABILITY (AD-04)

#### T8 — DB Transactions

- **Vấn đề:** card.update() thành công nhưng review.create() fail → partial state
- **Giải pháp:** Wrap trong `prisma.$transaction()` → nếu bất kỳ bước nào fail → ROLLBACK tất cả
- **Trade-off:** COMMIT tốn thêm +10-20ms
- **UC sử dụng:** UC-05, UC-06, UC-10, UC-14-16, UC-21
- **Code:** `src/services/review/review.service.ts` — `prisma.$transaction()`

#### T9 — Global Error Handler

- **Vấn đề:** Unhandled error → Node.js crash → downtime
- **Giải pháp:** `app.use((err,req,res,next))` — middleware cuối cùng bắt MỌI lỗi. Trả JSON error response, KHÔNG lộ stack trace, Node.js TIẾP TỤC chạy.
- **UC sử dụng:** Tất cả UC (global)

#### T20 — Orphan Prevention

- **Vấn đề:** Xóa user nhưng cards/reviews vẫn còn trong DB (orphan data)
- **Giải pháp:** FK `ON DELETE CASCADE` + application-level transaction cascade: reviews→cards→decks→user
- **UC sử dụng:** UC-06, UC-10, UC-16

#### T21 — Data Integrity Validation

- **Giải pháp:** Re-hash password chỉ khi field password thay đổi. Full rollback nếu validation fail.
- **UC sử dụng:** UC-05

### Nhóm 5: Tactics cho SCALABILITY & AVAILABILITY (AD-07, AD-02)

#### T14 — Lazy Statistics

- **Giải pháp:** Statistics tính on-demand khi user yêu cầu, KHÔNG pre-compute mỗi lần write card
- **UC sử dụng:** UC-12

#### T15 — Active Redundancy (Docker restart)

- **Giải pháp:** Docker `restart:always` → container tự restart trong <30s nếu crash
- **UC sử dụng:** Infrastructure

#### T16 — Graceful Degradation

- **Vấn đề:** StatisticsService fail → cả study session bị ảnh hưởng
- **Giải pháp:** Nếu StatisticsService fail → trả empty/cached stats, study session TIẾP TỤC không bị gián đoạn
- **UC sử dụng:** UC-11/12, UC-22/23

### Cross-Impact Analysis (Trade-offs giữa các Tactics)

Mỗi Tactic giải quyết 1 vấn đề nhưng có thể gây ra tác động tiêu cực ở chỗ khác:

| Tactic          | Lợi ích                  | Tác động tiêu cực                          | Chấp nhận được không?       |
| --------------- | ------------------------ | ------------------------------------------ | --------------------------- |
| T1 Index        | Query nhanh hơn 10x      | Mỗi INSERT/UPDATE chậm thêm ~5%            | ✅ Vì read nhiều hơn write  |
| T4 Ownership    | Chặn cross-user mutation | +50ms/request (1 query thêm)               | ✅ Vì security > 50ms       |
| T5 BruteForce   | Chống brute-force        | User hợp lệ bị khóa nếu quên password      | ✅ Có unlock mechanism      |
| T8 Transaction  | Zero partial states      | COMMIT tốn +10-20ms                        | ✅ Vì data integrity > 20ms |
| T10/T11 Offline | Học được khi mất mạng    | Data chưa sync ngay (eventual consistency) | ✅ Vì app học từ vựng       |
| T17 JWT         | Stateless, nhanh         | JWT_SECRET rotation mất tất cả sessions    | ⚠️ Cần coordinated deploy   |

## 4. MAPPING TẤT CẢ UC → AD → TACTIC → CODE

### UC-01: Register

- **AD:** AD-05 (Authentication), AD-06 (Confidentiality)
- **Tactics:** T18 (bcrypt hash ≥10 rounds), T19 (Input Validation)
- **Luồng:** User submit form → server validate email/username unique → `bcrypt.hash(password, 10)` → save DB → trả MSG02
- **Code:** Controller: `src/controllers/auth/auth.controller.ts` | Service: `src/services/auth/auth.service.ts` | Schema: `prisma/schema.prisma` (model User)

### UC-02: Login

- **AD:** AD-05 (Authentication) — H,M Driver
- **Tactics:** T5 (BruteForceGuard), T6 (Generic Error), T17 (JWT), T18 (bcrypt)
- **Luồng:**
  ```
  User submit email+password
  → BruteForceGuard.check(email, ip) — nếu 5 failures → 429 Locked
  → bcrypt.compare(password, hash) — constant-time comparison
  → Đúng → generateJWT(user) HS256 → Set HttpOnly SameSite=Strict cookie
  → Sai → MSG03 "Invalid credentials" (KHÔNG nói sai email hay password)
  ```
- **Code:** Controller: `src/controllers/auth/auth.controller.ts` | Service: `src/services/auth/auth.service.ts` | Guard: `src/middleware/guards/auth.guard.ts`

### UC-03: Logout

- **AD:** AD-05 | **Tactics:** T17 (JWT clear)
- **Luồng:** `clearJWTToken()` → redirect Login → block back-navigation. ≤500ms.
- **Code:** `src/controllers/auth/auth.controller.ts` | `src/services/auth/auth.service.ts`

### UC-04: View Profile

- **AD:** AD-06 (Confidentiality) | **Tactics:** T2 (DTO Filtering), T3 (Data Isolation)
- **Luồng:** GET /profile → userId từ JWT (KHÔNG nhận từ client) → query DB → map sang ProfileDTO {username, email, stats} — **KHÔNG** chứa password_hash
- **Code:** `src/controllers/user/` | `src/services/user/`

### UC-05: Update Profile

- **AD:** AD-04 (Reliability) | **Tactics:** T8 (Transaction), T21 (Data Integrity)
- **Luồng:** Nếu password changed → bcrypt.hash(newPassword). Toàn bộ update trong 1 transaction. Fail bất kỳ field → ROLLBACK toàn bộ.
- **Code:** `src/controllers/user/` | `src/services/user/`

### UC-06: Delete Account

- **AD:** AD-04 | **Tactics:** T8 (Transaction), T20 (Orphan Prevention)
- **Luồng:** Hiện MSG05 confirm → User confirm → Single transaction cascade: reviews→cards→decks→user. FK ON DELETE CASCADE là safety net thêm.
- **Code:** `src/controllers/user/` | `src/services/user/`

### UC-07: View Deck Library

- **AD:** AD-07 (Scalability) | **Tactics:** T1 (Index), T7 (LIMIT/OFFSET)
- **Luồng:** GET /decks?page=1 → `findByUserIdPaginated(userId, page=1, size=20)` với index `idx_decks_user` → ≤1s cho 100+ decks
- **Code:** `src/controllers/deck/deck.controller.ts` | `src/services/deck/`

### UC-08/09/10: Create/Edit/Delete Deck

- **AD:** AD-03 (Authorization), AD-04 (Reliability) | **Tactics:** T4, T8, T20
- **UC-10 Luồng:** Request → AuthMiddleware (JWT) → ResourceAuthMiddleware (ownership check) → DeckController → Single TX cascade: reviews→cards→deck
- **Code:** `src/controllers/deck/deck.controller.ts` | `src/services/deck/` | `src/middleware/guards/`

### UC-11/12: View Deck Statistics / Advanced Stats

- **AD:** AD-07 | **Tactics:** T7 (SQL GROUP BY), T14 (Lazy Stats), T16 (Graceful Degradation)
- **Luồng:** SQL aggregation query (KHÔNG tính in-memory). Nếu StatisticsService fail → return empty stats, study session tiếp tục.
- **Code:** `src/services/study/study.service.ts`

### UC-14: Add Card

- **AD:** AD-04 | **Tactics:** T8 (Transaction), T4 (Ownership)
- **Luồng:** Ownership check → SM-2 init server-side: `Interval=0, Reps=0, EFactor=2.5, NextReviewDate=today` (client KHÔNG modify được). Nếu BIDIRECTIONAL deck → `reverseCards()` tạo reverse card trong CÙNG transaction.
- **Code:** `src/controllers/card/` | `src/services/card/`

### UC-15/16: Edit/Delete Card

- **AD:** AD-03, AD-04 | **Tactics:** T4 (Ownership), T8 (Atomic delete: reviews→card)
- **Code:** `src/controllers/card/` | `src/services/card/`

### UC-18: Import JSON

- **AD:** AD-07 | **Tactics:** T7 (Bulk INSERT), T19 (JSON validation), T4 (Ownership)
- **Luồng:** Ownership check → validate JSON schema → skip-invalid, import valid → Response: `{created: N, skipped: M}`. Target: ≤5s cho 1000 cards.
- **Code:** `src/controllers/deck/` hoặc `src/services/card/`

### UC-19: Export JSON

- **AD:** AD-03, AD-06 | **Tactics:** T3 (Data Isolation), T4 (Ownership)
- **Luồng:** Ownership check → query cards by userId+deckId → JSON → `Content-Disposition: attachment`

### ⭐ UC-20: Start Study Session — TOP PRIORITY (AD-01 H,H)

- **AD:** AD-01 (Performance) — ĐỘ ƯU TIÊN CAO NHẤT
- **Tactics:** T1 (Composite Index), T7 (Query Optimization), T13 (In-process SM-2)
- **Luồng chi tiết:**
  ```
  GET /study/start/:deckId
  → StudyController.getDueReviews(@GetUser() user, @Param() deckId)
  → ReviewService.getDueReviews(deckId, userId)
    → Bước 1: prisma.deck.findFirst({ where: { id: deckId, userId } })
      // Ownership check — gộp existence + ownership = 1 query
      // Nếu null → NotFoundException
    → Bước 2: buildDueCardsSpec(deckId, now)
      // Specification Pattern — tách query logic ra method riêng
    → Bước 3: prisma.card.findMany({ where: spec, orderBy: { nextReviewDate: 'asc' } })
      // Composite index đảm bảo ≤300ms
  → Trả về danh sách cards đến hạn
  ```
- **Code:** Controller: `src/controllers/study/study.controller.ts` (dòng ~156-165) | Service: `src/services/review/review.service.ts` (dòng ~161-201) | SM-2: `src/services/scheduler.ts` | Schema: `prisma/schema.prisma` — `@@index([deckId])`

### ⭐ UC-21: Record Review Outcome — Online + Offline

- **AD:** AD-01 (Performance), AD-04 (Reliability), AD-02 (Availability)
- **Tactics:** T8 (Transaction), T13 (SM-2), T4 (Ownership), T10/T11/T12 (Offline)

**Online Path:**

```
POST /study/review
→ StudyController.submitReview(@GetUser() user, @Body() cardReview)
→ ReviewService.submitReviews(cardReview, userId)
  → Bước 1: Batch fetch tất cả cards (1 query thay vì N queries):
    prisma.card.findMany({ where: { id: { in: cardIds } }, include: { deck: { select: { userId } } } })
  → Bước 2: Validate ownership: card.deck.userId === userId? Sai → 403
  → Bước 3: prisma.$transaction(async (tx) => {
      for mỗi card:
        schedulerInput = toSchedulerInput(card)     // chuyển đổi format
        nextState = scheduler.calculateNext(input, rating)  // SM-2 pure function <1ms
        tx.card.update({ ...nextState })            // cập nhật card
        tx.cardReview.create({ previousStatus: card.status, ... })  // tạo review record
    })
    // ALL-OR-NOTHING: nếu bất kỳ bước nào fail → ROLLBACK tất cả
```

**Offline Path:**

```
SPA phát hiện navigator.onLine = false (T12 Network Monitor)
→ Hiển thị banner "Đang offline"
→ User tiếp tục review cards từ cached queue
→ Mỗi review → OfflineSyncService.queueReview() → lưu vào IndexedDB (T10)
→ ... (user review N cards offline) ...
→ Browser phát hiện mạng có lại (window 'online' event)
→ OfflineSyncService.syncPending() (T11 Batch Sync)
  → Đọc tất cả reviews từ IndexedDB
  → POST /api/study/review/batch → server xử lý atomic
  → Thành công → xóa queue trong IndexedDB
  → Thất bại → retry exponential backoff (tối đa 3 lần)
  → Trả về {synced: N, failed: M}
```

- **Code:** Controller: `src/controllers/study/study.controller.ts` (dòng ~127-136) | Service: `src/services/review/review.service.ts` (dòng ~48-125) | SM-2: `src/services/scheduler.ts`

### UC-22: Session Summary

- **AD:** AD-01 | **Luồng:** `calculateAccuracy()` trên in-memory session data → ≤200ms (không query DB thêm)

### ⭐ UC-23: View Session Statistics

- **AD:** AD-01, AD-07 | **Tactics:** T7 (SQL GROUP BY), T16 (Graceful Degradation)
- **Bug fix quan trọng:** Code gốc dùng `r.card.status` (status HIỆN TẠI của card, đã thay đổi sau review) → SAI. Fix: dùng `r.previousStatus` (status TẠI THỜI ĐIỂM review, đã lưu sẵn trong CardReview record).
- **Code:** `src/controllers/study/study.controller.ts` | `src/services/study/study.service.ts` (dòng ~40-125)

### UC-24: Resource-Level Authorization

- **AD:** AD-03 | **Tactics:** T3, T4, T6
- **Luồng chi tiết:**
  ```
  Admin A gửi DELETE /api/decks/5 (deck thuộc Admin B)
  → Bước 1: AuthMiddleware verify JWT → extract userId_A
  → Bước 2: ResourceAuthMiddleware:
    → Query: prisma.deck.findFirst({ where: { id: 5, userId: userId_A } })
    → Kết quả: null (vì deck 5 thuộc userId_B, không phải A)
    → Trả 403 Forbidden + MSG-AUTH-01
    → DeckController KHÔNG BAO GIỜ được gọi
    → Dữ liệu Admin B: KHÔNG BỊ ẢNH HƯỞNG
  ```
- **Code:** Guard: `src/middleware/guards/auth.guard.ts` | `src/middleware/guards/roles.guard.ts` | Ownership: trong service files

### Database Schema (cho TẤT CẢ UC)

- **File:** `prisma/schema.prisma`
- **Models:** User, Deck, Card, CardReview
- **Indexes:** `@@index([deckId])` trên Card | `@@index([cardId])`, `@@index([nextReviewDate])`, `@@index([reviewedAt])` trên CardReview

---

## 5. DESIGN DECISIONS & REJECTED ALTERNATIVES

### Decision 1: Tại sao chọn kiến trúc 4 lớp?

**Bối cảnh:** Khi xây dựng FlashLearn, nhóm cần quyết định tổ chức code thế nào.

**Quyết định:** Chia 4 lớp: Controller → Service → Repository → Database.

**Tại sao?** Vì AD-01 cần performance, AD-04 cần transaction, AD-07 cần scale:

- Cần tối ưu query → chỉ sửa Repository, KHÔNG đổi Controller/Service
- Cần thêm transaction → sửa Service, KHÔNG ảnh hưởng HTTP routing
- Cần pagination → thêm ở Repository, Controller API giữ nguyên

**Trade-off:** +2-5ms/request. Target 500ms nên chấp nhận được.

**Code minh chứng:** Controller: `src/controllers/study/study.controller.ts` | Service: `src/services/review/review.service.ts` | DB: `prisma/schema.prisma`

### Decision 2: Tại sao chọn Offline-First (IndexedDB)?

**Bối cảnh:** AD-02 (TR=H) yêu cầu user học được khi mất mạng.

**Quyết định:** IndexedDB ở browser + OfflineSyncService batch sync.

**IndexedDB vs localStorage:**

- IndexedDB: async (không block UI), có transaction, dung lượng lớn, persist qua tab reload
- localStorage: đồng bộ (block UI), không transaction, chỉ string, ~5MB
  → Chọn IndexedDB

**Conflict policy:** Last-write-wins. FlashLearn single-user nên không có 2 người sửa cùng card.

### Decision 3: Tại sao cần ResourceAuthMiddleware?

**Bối cảnh:** UC-24 yêu cầu Admin A không xóa deck Admin B. Nhưng cả 2 cùng role "Admin".

**Vấn đề:** RBAC chỉ check role → cả 2 Admin đều pass → SAI!

**Quyết định:** Middleware kiểm tra OWNERSHIP (chủ sở hữu) thay vì role. `findByIdAndOwner(deckId, userId)` gộp existence + ownership = 1 SQL query. Middleware pattern = viết 1 lần, dùng cho nhiều endpoint.

**Trade-off:** +50ms/mutation. Security > 50ms.

**Code:** `src/middleware/guards/auth.guard.ts`, `src/middleware/guards/roles.guard.ts`

### Decision 4: Tại sao SM-2 phải server-side?

**Nếu client-side:** User mở DevTools → sửa kết quả SM-2 → inflate interval → phá vỡ mục đích app.

**Quyết định:** SM-2 = pure function server-side. Chạy <1ms. User không tamper được.

**Code:** `src/services/scheduler.ts` — class `AnkiScheduler`

### Rejected: Microservices

- <100 users → 80% effort cho <5% benefit
- UC-21 cần atomic card+review → distributed saga cực kỳ phức tạp
- Chỉ 1 team → không cần chia service. Reconsider khi >10,000 users

### Rejected: Monolithic MPA

- AD-02 cần offline → SPA + IndexedDB là duy nhất khả thi
- MPA render HTML server → không có IndexedDB → không offline được

### Rejected: GraphQL

- Cần schema + resolver + DataLoader (chống N+1) → complexity cao
- REST + DTO filtering (T2) đủ tránh over-fetching
- REST cacheable (CDN), GraphQL POST không cache-friendly

## 6. 4+1 VIEW MODEL

### 6.1. Logical View (Module View) — Cấu trúc tĩnh

```
Presentation Layer:
  StudyController, DeckController, CardController, AuthController, UserController
  → Nhận HTTP request, validate input, gọi Service

Business Logic Layer:
  ReviewService, StudyService, SM2Service (scheduler.ts), StatisticsService
  ResourceAuthMiddleware, BruteForceGuard, AuthMiddleware
  OfflineSyncService (SPA side)
  → Business logic, transaction management, ownership checks

Data Access Layer:
  Prisma queries trong các service files
  → Tương tác DB, sử dụng indexes

Database Layer:
  PostgreSQL — tables: users, decks, cards, cardReviews, login_attempts
  → Indexes: idx_cards_due, idx_decks_user
```

### 6.2. Process View (Component & Connector) — Runtime interactions

| Connector | Từ → Đến                     | Loại            | Mô tả                                  |
| --------- | ---------------------------- | --------------- | -------------------------------------- |
| C1        | Browser SPA → Nginx          | HTTPS           | User request qua TLS                   |
| C2        | Nginx → Node.js App          | HTTP internal   | Reverse proxy forward                  |
| C3        | Controller → SM2Service      | In-process call | Pure function, <1ms, không qua network |
| C4        | Repository → PostgreSQL      | SQL/TCP         | Database queries                       |
| C5        | OfflineSyncService → Node.js | HTTP batch POST | Offline sync khi reconnect             |

### 6.3. Physical View (Deployment)

**v1.0 hiện tại:**

```
[Browser] ←HTTPS→ [Nginx Container (nginx:alpine)]
                      ↓ HTTP internal
                   [Node.js Container (node:18-alpine)] ← Docker Volume (logs)
                      ↓ SQL/TCP (internal network ONLY)
                   [PostgreSQL Container (postgres:15-alpine)] ← Docker Volume (data)
```

- PostgreSQL KHÔNG expose port 5432 ra public
- Docker `restart:always` → tự restart <30s nếu crash (T15)
- Data trên Docker named volume → survive container restart

**v2.0 horizontal scaling:**

```
[Nginx LB] → [Node.js #1] → [PostgreSQL Primary]
            → [Node.js #2]   [PostgreSQL Read Replica cho Statistics]
            → [Node.js #N]
```

- Node.js stateless (JWT) → thêm instance chỉ cần update Nginx upstream

### 6.4. Behavior View — Sequence Diagrams

**SD1 — UC-21 Online:**

```
User → SPA → Nginx → StudyController.submitReview()
  → ReviewService.submitReviews()
    → Step 1: prisma.card.findMany({in: cardIds}) + include deck.userId  [Batch fetch]
    → Step 2: Validate card.deck.userId === userId                       [Auth check]
    → Step 3: prisma.$transaction(async (tx) => {                        [Transaction]
        → Step 4: SM2Service.calculateNext(card, rating)                 [Pure function]
        → Step 5: tx.card.update(nextState)                              [Update card]
        → Step 6: tx.cardReview.create(record)                           [Create review]
      })
    → Return actual review IDs
```

**SD2 — UC-21 Offline:**

```
SPA detects offline → User tiếp tục review
  → queueReview() → IndexedDB
  → ... N cards ...
  → Browser fires 'online' event
  → syncPending() → POST /review/batch
  → Server xử lý atomic → clear IndexedDB queue
```

**SD3 — UC-24 Auth Denied:**

```
Admin A → DELETE /decks/{deckId_B}
  → AuthMiddleware: JWT → userId_A
  → ResourceAuthMiddleware: findByIdAndOwner(deckId_B, userId_A) → null
  → 403 Forbidden. Controller KHÔNG gọi. Admin B data: UNCHANGED.
```

---

## 7. CROSS-VIEW TRACEABILITY & CONSISTENCY

| Element                 | Module View    | C&C View      | Deployment      | Behavior   |
| ----------------------- | -------------- | ------------- | --------------- | ---------- |
| SM2Service              | Business Layer | C3 in-process | node:18-alpine  | SD1 Step 4 |
| ResourceAuthMiddleware  | Business Layer | Interceptor   | node:18-alpine  | SD3        |
| CardRepo.findDueCards() | Data Access    | C4 SQL        | Node→PostgreSQL | SD1 Step 1 |
| OfflineSyncService      | Business Layer | C5 batch POST | Browser+Node    | SD2        |

**6 Consistency Checks — TẤT CẢ PASS:**

1. ✅ Mọi component trong C&C đều có định nghĩa ở Module View
2. ✅ Node.js App → node:18-alpine, PostgreSQL → postgres:15
3. ✅ 3 sequence diagrams = 3 ASUCs
4. ✅ AD-01 xuất hiện trong tất cả views
5. ✅ Multiplicities nhất quán (1:1 v1.0, scaled v2.0)
6. ✅ `findByIdAndOwner()` nhất quán giữa Module View và SD3

---

## 8. LOGGING, MONITORING & TELEMETRY — DỰA TRÊN SOURCE CODE THỰC TẾ

### Tổng quan Observability

Hệ thống FlashLearn triển khai **3 trụ cột giám sát** (Observability):

| Trụ cột | Câu hỏi trả lời | Công cụ trong project | File code |
| --- | --- | --- | --- |
| **Logging** | "Chuyện gì đã xảy ra?" | Winston + `nest-winston` | `src/config/logger.config.ts` |
| **Monitoring** | "Hệ thống có đang khỏe không?" | `@nestjs/terminus` Health Checks | `src/controllers/health/health.controller.ts` |
| **Metrics (Telemetry)** | "Bao nhiêu request/giây? Latency trung bình?" | Prometheus (`@willsoto/nestjs-prometheus`) | `src/config/metrics.config.ts` |

---

### 8.1. LOGGING — Winston Structured Logging

#### 8.1.1. Tại sao dùng Winston thay vì NestJS Logger mặc định?

NestJS có sẵn `Logger` class nhưng **không đủ cho production**:

| Vấn đề | NestJS Logger mặc định | Winston (project dùng) |
| --- | --- | --- |
| Format output | Plain text, không parse được | **JSON** (production) / **Colorized** (dev) |
| Lưu file | Không (chỉ console) | **Rotate file** theo ngày + nén gzip |
| Crash capture | Mất khi process tắt | `exceptionHandlers` ghi crash ra disk |
| Tìm kiếm | Không thể grep hiệu quả | JSON queryable bởi ELK/Datadog |

**Code:** File `src/config/logger.config.ts` (102 dòng)

#### 8.1.2. Kiến trúc Transport — Log đi đâu?

Winston gửi MỘT log entry đến NHIỀU nơi cùng lúc:

```
                    ┌─────────────────────┐
                    │  Application Code   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Winston Logger    │
                    └──┬───────┬───────┬──┘
                       │       │       │
              ┌────────▼──┐ ┌──▼─────┐ ┌▼──────────────┐
              │  Console  │ │ Error  │ │   Combined    │
              │ Transport │ │  File  │ │     File      │
              │           │ │        │ │               │
              │ Dev: Color│ │ Chỉ    │ │ Tất cả levels │
              │ Prod: JSON│ │ errors │ │ (info+warn+   │
              │           │ │ 30 ngày│ │  error)       │
              │           │ │ giữ lại│ │ 14 ngày giữ   │
              └───────────┘ └────────┘ └───────────────┘
```

**Thêm 2 safety nets:**
- `exceptionHandlers` → bắt unhandled exceptions → ghi vào `exceptions-YYYY-MM-DD.log`
- `rejectionHandlers` → bắt unhandled promise rejections → ghi vào `rejections-YYYY-MM-DD.log`

**Code thực tế** (trích `src/config/logger.config.ts`):

```typescript
// Error file — giữ 30 ngày, max 20MB/file, nén gzip
const errorRotateTransport = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'error-%DATE%.log',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  zippedArchive: true,
});

// Combined file — giữ 14 ngày
const combinedRotateTransport = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'combined-%DATE%.log',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
});

// Console — JSON ở production, colorized ở dev
export const winstonConfig: WinstonModuleOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? prodJsonFormat : devConsoleFormat,
    }),
    errorRotateTransport,
    combinedRotateTransport,
  ],
};
```

**Cấu trúc thư mục logs thực tế:**
```
logs/
├── combined-2026-05-14.log      ← Log hôm nay (tất cả levels)
├── combined-2026-05-13.log.gz   ← Hôm qua (đã nén)
├── error-2026-05-14.log         ← Chỉ errors hôm nay
├── exceptions-2026-05-14.log    ← Unhandled exceptions
└── rejections-2026-05-14.log    ← Unhandled promise rejections
```

**Đáp ứng AD nào?** AD-04 (Reliability) — log không mất khi restart; AD-01 (Performance) — tách error riêng để debug nhanh.

#### 8.1.3. Dual Registration Pattern — Tại sao đăng ký Winston 2 lần?

Winston được đăng ký **2 lần** trong project:

```typescript
// Lần 1: main.ts — TRƯỚC khi DI container tồn tại
const logger = WinstonModule.createLogger(winstonConfig);
const app = await NestFactory.create(AppModule, { logger });

// Lần 2: app.module.ts — SAU khi DI container chạy
WinstonModule.forRoot(winstonConfig),
```

**Tại sao cần cả 2?**
- `main.ts`: NestJS cần logger TRƯỚC khi load module. Nếu DB config sai và app crash khi khởi động → logger này bắt được lỗi đó.
- `app.module.ts`: Middleware và Filter cần `@Inject(WINSTON_MODULE_NEST_PROVIDER)` qua DI. Registration này làm Winston available trong DI container.

**Code:** `src/main.ts` + `src/app.module.ts`

#### 8.1.4. Request Logging — Ghi log MỌI HTTP request

**File:** `src/middleware/interceptor/requestLog.interceptor.ts` (83 dòng)

**Luồng hoạt động chi tiết:**

```
Client gửi HTTP Request (VD: GET /api/study/start/5)
       │
       ▼
┌──────────────────┐
│ RequestLogger    │ ← ① Ghi startTime = Date.now()
│ Middleware       │ ← ② Đăng ký listener response.on('finish')
└──────┬───────────┘
       │ next()
       ▼
┌──────────────────┐
│   Auth Guard     │ ← Kiểm tra JWT token
└──────┬───────────┘
       ▼
┌──────────────────┐
│   Controller     │ ← Route handler
└──────┬───────────┘
       ▼
┌──────────────────┐
│   Service + DB   │ ← Business logic + query DB
└──────┬───────────┘
       ▼
  Response gửi về client
       │
       ▼
┌──────────────────┐
│ 'finish' event   │ ← ③ Tính duration = Date.now() - startTime
│ fires!           │ ← ④ Ghi log + Ghi Prometheus metrics
└──────────────────┘
```

**Code thực tế** (trích `requestLog.interceptor.ts`):

```typescript
use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method } = request;
    const userAgent = request.get('user-agent') || '';
    const url = request.originalUrl || request.url;
    const startTime = Date.now();           // ① Ghi thời điểm bắt đầu

    response.on('finish', () => {           // ③ Khi response gửi xong
      const { statusCode } = response;
      const contentLength = response.get('content-length') || '0';
      const duration = Date.now() - startTime;  // ④ Tính thời gian xử lý

      // Tạo log message
      const logMessage =
        `${method} ${url} ${statusCode} - ${contentLength}b ${duration}ms - ${userAgent} ${ip}`;

      // ⑤ Smart Log Level Routing — chọn level dựa trên status code
      if (statusCode >= 500) {
        this.logger.error(logMessage, undefined, 'HTTP');  // Server lỗi → ERROR
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage, 'HTTP');               // Client sai → WARN
      } else {
        this.logger.log(logMessage, 'HTTP');                // OK → INFO
      }
    });

    next();                                 // ② Chuyển sang handler tiếp theo
}
```

**Ví dụ output log:**
```
GET /api/study/start/5 200 - 376b 120ms - Mozilla/5.0... ::1
```

**Tại sao phân level theo status code?**
- `404 Not Found` = lỗi của CLIENT → chỉ WARN, không cần báo động
- `500 Internal Server Error` = lỗi của SERVER → ERROR, cần sửa ngay
- Tránh **alert fatigue**: nếu mọi 404 đều là ERROR → kỹ sư nhận hàng trăm cảnh báo giả

**UC nào dùng?** TẤT CẢ 24 UC — mọi endpoint đều đi qua middleware này.

**Đáp ứng AD nào?**
- AD-01 (Performance): Ghi `duration`ms → biết endpoint nào chậm quá 500ms
- AD-04 (Reliability): Trace lại request khi có lỗi

#### 8.1.5. Global Exception Filter — Bắt MỌI lỗi không crash server

**File:** `src/middleware/filters/global.filter.ts` (88 dòng)

**Nguyên tắc "2 Audiences" (2 Đối tượng):** Mỗi lỗi có 2 người cần thông tin KHÁC NHAU:

```
                    ┌─────────────────┐
                    │   Exception     │
                    │   xảy ra        │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼───────┐         ┌───────▼───────┐
        │ INTERNAL LOG  │         │ CLIENT        │
        │ (cho dev)     │         │ RESPONSE      │
        │               │         │ (cho user)    │
        │ ✅ Stack trace │         │ ❌ Không stack │
        │ ✅ File paths  │         │ ❌ Không path  │
        │ ✅ DB errors   │         │ ❌ Không DB    │
        │ ✅ Full context│         │ ✅ Status code │
        └───────────────┘         └───────────────┘
```

**Code thực tế** (trích `global.filter.ts`):

```typescript
@Catch(Error, HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  catch(exception: HttpException | Error, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      // Operational error (mình throw cố ý)
      if (status >= 500) {
        this.logger.error(`${method} ${url} ${status} - ${message}`, exception.stack, 'ExceptionFilter');
      } else {
        this.logger.warn(`${method} ${url} ${status} - ${message}`, 'ExceptionFilter');
      }
      // Trả client: message thật
      response.status(status).json({ statusCode: status, message: message, data: null });
    } else {
      // Unexpected error (không lường trước được)
      this.logger.error(`${method} ${url} 500 - ${exception.message}`, exception.stack, 'ExceptionFilter');
      // Trả client: message generic — KHÔNG LỘ chi tiết internal
      response.status(500).json({ statusCode: 500, message: 'Internal server error', data: null });
    }
  }
}
```

**Dev thấy gì (trong `error-2026-05-14.log`):**
```json
{
  "context": "ExceptionFilter",
  "level": "error",
  "message": "POST /api/study/review 500 - Cannot read property 'id' of undefined",
  "stack": "TypeError: ... at ReviewService.submitReview (review.service.ts:42:15)",
  "timestamp": "2026-05-14T02:54:42.057Z"
}
```

**Client thấy gì (HTTP response):**
```json
{ "statusCode": 500, "message": "Internal server error", "data": null }
```

**Tại sao KHÔNG trả stack trace cho client?** Vì hacker có thể biết: dùng Prisma (ORM), cấu trúc file, pattern query → lộ thông tin nội bộ → rủi ro bảo mật.

**Đáp ứng AD nào?**
- AD-04 (Reliability): Process KHÔNG crash, tiếp tục chạy
- AD-06 (Confidentiality): Client KHÔNG thấy internal details
- AD-02 (Availability): Uptime duy trì

**UC nào?** Tất cả — VD: UC-21 DB drop → T9 bắt lỗi, trả 503; UC-06 cascade fail → rollback + log

---

### 8.2. MONITORING — Health Checks (`@nestjs/terminus`)

#### 8.2.1. Health Check là gì?

Health check = endpoint trả lời: **"Hệ thống có sẵn sàng nhận request không?"**

Giống checklist trước khi máy bay cất cánh:
- ✅ Động cơ chạy? (process alive)
- ✅ Nhiên liệu đủ? (disk space)
- ✅ Thiết bị hoạt động? (database reachable)
- ✅ Áp suất cabin OK? (memory usage)

#### 8.2.2. Kiến trúc Health Check trong FlashLearn

**File:** `src/controllers/health/health.controller.ts` (71 dòng) + `src/services/health/prisma.health.ts` (36 dòng)

```
              ┌─────────────────────────────┐
              │ GET /api/health              │
              │ (HealthController)           │
              │ requiresAuth: false ← PUBLIC │
              └──────────┬──────────────────┘
                         │
              ┌──────────▼──────────────────┐
              │  HealthCheckService          │
              │  (@nestjs/terminus)          │
              │  Chạy 4 indicators:         │
              └──┬────┬────┬────┬───────────┘
                 │    │    │    │
    ┌────────────▼┐ ┌─▼──┐ ┌▼──┐ ┌▼────────┐
    │ PrismaHealth│ │Heap│ │RSS│ │  Disk   │
    │ Indicator   │ │    │ │   │ │ Storage │
    │             │ │<256│ │<512│ │  <90%  │
    │ SELECT 1    │ │ MB │ │ MB│ │  used  │
    └─────────────┘ └────┘ └───┘ └─────────┘
```

**Code thực tế** (trích `health.controller.ts`):

```typescript
@Get()
@HealthCheck()
@RouteConfig({ message: 'Health check', requiresAuth: false })  // PUBLIC — không cần JWT
check() {
  return this.health.check([
    () => this.prismaHealth.isHealthy('database'),         // DB còn sống?
    () => this.memory.checkHeap('memory_heap', 256 * 1024 * 1024),  // Heap < 256MB?
    () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024),    // RSS < 512MB?
    () => this.disk.checkStorage('disk', { thresholdPercent: 0.9, path: process.cwd() }),  // Disk < 90%?
  ]);
}
```

**PrismaHealthIndicator** (trích `prisma.health.ts`):

```typescript
async isHealthy(key: string): Promise<HealthIndicatorResult> {
  await this.prisma.$queryRawUnsafe('SELECT 1');  // Query rẻ nhất — không đọc table nào
  return this.getStatus(key, true);               // { database: { status: "up" } }
}
```

**Response khi healthy (200):**
```json
{ "status": "ok", "info": { "database": { "status": "up" }, "memory_heap": { "status": "up" }, "memory_rss": { "status": "up" }, "disk": { "status": "up" } } }
```

**Response khi unhealthy (503):**
```json
{ "status": "error", "error": { "database": { "status": "down", "message": "SQLITE_CANTOPEN" } } }
```

#### 8.2.3. Liveness vs Readiness Probes

**File:** `health.controller.ts` — có 2 endpoints:

| Endpoint | Câu hỏi | Khi fail thì sao? |
| --- | --- | --- |
| `GET /api/health` (Readiness) | "App có thể phục vụ traffic không?" | Ngừng gửi traffic, KHÔNG restart |
| `GET /api/health/liveness` | "Process có đang sống không?" | Restart container |

**VD:** App chạy (liveness OK) nhưng DB chết (readiness FAIL) → Nginx/K8s ngừng gửi traffic nhưng không restart container (vì restart không sửa được DB).

**Liveness code:**
```typescript
@Get('liveness')
@RouteConfig({ message: 'Liveness probe', requiresAuth: false })
liveness() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

**Đáp ứng AD nào?** AD-02 (Availability), AD-04 (Reliability)
**UC nào?** Infrastructure — Load balancer gọi mỗi 10-30 giây

---

### 8.3. METRICS/TELEMETRY — Prometheus

#### 8.3.1. Prometheus là gì và tại sao cần?

Khác với Logging (ghi text events) và Monitoring (kiểm tra sống/chết), **Metrics** thu thập **số liệu** để trả lời: "Bao nhiêu request/giây? Latency trung bình? Error rate bao nhiêu %?"

| Aspect | Logs | Metrics |
| --- | --- | --- |
| Format | Text/JSON events | Số liệu time-series |
| Volume | 1 entry/event (triệu/ngày) | Aggregated (rất nhẹ) |
| Câu hỏi | "Chuyện gì xảy ra lúc 10:03?" | "Error rate giờ qua bao nhiêu?" |
| Công cụ | Winston → File/ELK | Prometheus → Grafana |

#### 8.3.2. 4 Custom Metrics trong FlashLearn

**File:** `src/config/metrics.config.ts` (71 dòng)

```typescript
// 1. Histogram — Đo thời gian mỗi request (quan trọng nhất cho AD-01)
export const httpRequestDurationProvider = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// 2. Counter — Đếm tổng số request
export const httpRequestsTotalProvider = makeCounterProvider({
  name: 'http_requests_total',
  labelNames: ['method', 'route', 'status_code'],
});

// 3. Histogram — Đo kích thước request
export const httpRequestSizeProvider = makeHistogramProvider({
  name: 'http_request_size_bytes',
  buckets: [100, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000, 10_000_000],
});

// 4. Histogram — Đo kích thước response
export const httpResponseSizeProvider = makeHistogramProvider({
  name: 'http_response_size_bytes',
  buckets: [100, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000, 10_000_000],
});
```

**+ ~20 default Node.js metrics** (tự động):
- `process_cpu_user_seconds_total` — CPU usage
- `nodejs_heap_size_used_bytes` — Memory heap
- `nodejs_eventloop_lag_seconds` — Event loop lag
- `nodejs_gc_duration_seconds` — Garbage collection

#### 8.3.3. Metrics được ghi ở đâu trong code?

**File:** `src/middleware/interceptor/requestLog.interceptor.ts` — CÙNG middleware với logging!

```typescript
// Middleware inject cả Winston logger VÀ Prometheus metrics
constructor(
  @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  @InjectMetric(METRICS.HTTP_REQUEST_DURATION) private readonly httpRequestDuration: Histogram,
  @InjectMetric(METRICS.HTTP_REQUESTS_TOTAL) private readonly httpRequestsTotal: Counter,
  @InjectMetric(METRICS.HTTP_REQUEST_SIZE) private readonly httpRequestSize: Histogram,
  @InjectMetric(METRICS.HTTP_RESPONSE_SIZE) private readonly httpResponseSize: Histogram,
) {}

// Trong response.on('finish') callback:
response.on('finish', () => {
  const duration = Date.now() - startTime;
  const durationInSeconds = duration / 1000;

  // Route normalization — tránh high-cardinality labels
  // "/api/deck/123" → "/api/deck/:id" (gộp thành 1 series thay vì hàng nghìn)
  const route = request.route?.path
    ? `${request.baseUrl}${request.route.path}`
    : url;

  const labels = { method, route, status_code: String(statusCode) };

  // Ghi metrics
  this.httpRequestDuration.observe(labels, durationInSeconds);  // ← AD-01: đo latency
  this.httpRequestsTotal.inc(labels);                           // ← đếm request
  this.httpRequestSize.observe({ method, route }, requestSize);
  this.httpResponseSize.observe({ method, route }, responseSize);

  // Ghi log (Winston) — code ở section 8.1.4
  // ...
});
```

#### 8.3.4. Truy cập Metrics — Endpoint `/api/metrics`

**Endpoint:** `GET /api/metrics` (public, không cần JWT)

**Output mẫu (Prometheus text format):**
```
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.5",method="GET",route="/api/health",status_code="200"} 1
http_request_duration_seconds_sum{method="GET",route="/api/health",status_code="200"} 0.498

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/health",status_code="200"} 1

# HELP nodejs_heap_size_used_bytes Process heap size used from Node.js in bytes
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes 37017480
```

Grafana/dashboard tool có thể scrape endpoint này mỗi 15-30 giây để vẽ biểu đồ real-time.

**Đáp ứng AD nào?**
- AD-01 (Performance): `http_request_duration_seconds` đo latency → biết UC-20 có ≤500ms không
- AD-04 (Reliability): Đếm error rate → phát hiện sự cố
- AD-07 (Scalability): Theo dõi request volume

---

### 8.4. Tóm tắt — Bảng File Code Observability

| File | Vai trò | AD |
| --- | --- | --- |
| `src/config/logger.config.ts` | Cấu hình Winston: transports, rotation, format | AD-04 |
| `src/middleware/interceptor/requestLog.interceptor.ts` | Ghi log + ghi Prometheus metrics MỌI request | AD-01, AD-04 |
| `src/middleware/filters/global.filter.ts` | Bắt exceptions, tách internal log vs client response | AD-04, AD-06 |
| `src/config/metrics.config.ts` | Định nghĩa 4 custom Prometheus metrics | AD-01 |
| `src/modules/metrics.module.ts` | Wire PrometheusModule + export providers | AD-01 |
| `src/controllers/health/health.controller.ts` | Health endpoints: readiness + liveness | AD-02, AD-04 |
| `src/services/health/prisma.health.ts` | Custom DB health indicator: `SELECT 1` | AD-02 |
| `src/modules/health.module.ts` | Wire TerminusModule + PrismaModule | AD-02 |
| `src/main.ts` | Bootstrap Winston TRƯỚC DI container | AD-04 |
| `src/app.module.ts` | Register Winston + Health + Metrics modules | All |



---


### 8.5. GIẢI THÍCH TOÀN BỘ LUỒNG HOẠT ĐỘNG — TỪ ĐẦU ĐẾN CUỐI

#### 8.5.1. Luồng tổng thể: 1 request đi qua hệ thống Observability như thế nào?

Hãy tưởng tượng User click "Study Now" (UC-20). Dưới đây là TOÀN BỘ hành trình của request đó qua 3 tầng Observability:

```
[1] User click "Study Now" → Browser gửi GET /api/study/start/5
         │
         ▼
[2] ╔════════════════════════════════════════════════════════════╗
    ║  RequestLoggerMiddleware (chạy ĐẦU TIÊN)                 ║
    ║                                                           ║
    ║  → Ghi startTime = Date.now()  (VD: 1715686800000)       ║
    ║  → Đọc request size (content-length header)               ║
    ║  → Đăng ký listener: "Khi response gửi xong, gọi tôi"   ║
    ║  → Gọi next() → chuyển request sang bước tiếp            ║
    ╚════════════════════════════════════════════════════════════╝
         │
         ▼
[3] AuthGuard: Kiểm tra JWT → OK → tiếp tục
         │
         ▼
[4] StudyController.getDueReviews() → gọi service
         │
         ▼
[5] StudyService → Prisma query findDueCards() với composite index
         │
         ▼
[6] Database trả về danh sách 30 thẻ đến hạn
         │
         ▼
[7] Response gửi về client (200 OK, body = 30 cards JSON)
         │
         ▼
[8] ╔════════════════════════════════════════════════════════════╗
    ║  Event 'finish' FIRES! (response đã gửi xong)            ║
    ║                                                           ║
    ║  ┌──────────────── LOGGING (Winston) ───────────────────┐ ║
    ║  │ duration = Date.now() - startTime = 120ms            │ ║
    ║  │ logMessage = "GET /api/study/start/5 200 - 4200b     │ ║
    ║  │              120ms - Mozilla/5.0... 192.168.1.1"     │ ║
    ║  │ statusCode = 200 → dùng logger.log() (level INFO)   │ ║
    ║  │                                                      │ ║
    ║  │ Winston gửi log entry này đến 3 nơi CÙNG LÚC:       │ ║
    ║  │   → Console (hiển thị cho dev đang xem terminal)     │ ║
    ║  │   → combined-2026-05-14.log (ghi vào file)           │ ║
    ║  │   → (KHÔNG ghi error file vì status 200, không lỗi)  │ ║
    ║  └──────────────────────────────────────────────────────┘ ║
    ║                                                           ║
    ║  ┌──────────────── METRICS (Prometheus) ────────────────┐ ║
    ║  │ route = "/api/study/start/:id" (đã normalize)        │ ║
    ║  │ labels = {method:"GET", route, status_code:"200"}    │ ║
    ║  │                                                      │ ║
    ║  │ httpRequestDuration.observe(labels, 0.120)           │ ║
    ║  │   → Ghi: request này mất 0.12 giây (120ms)          │ ║
    ║  │                                                      │ ║
    ║  │ httpRequestsTotal.inc(labels)                        │ ║
    ║  │   → Đếm: thêm 1 vào tổng số request cho route này   │ ║
    ║  │                                                      │ ║
    ║  │ httpResponseSize.observe(labels, 4200)               │ ║
    ║  │   → Ghi: response này nặng 4200 bytes                │ ║
    ║  └──────────────────────────────────────────────────────┘ ║
    ╚════════════════════════════════════════════════════════════╝
         │
         ▼
[9] ╔════════════════════════════════════════════════════════════╗
    ║  Grafana scrape GET /api/metrics (mỗi 15-30 giây)        ║
    ║  → Đọc tất cả metrics đã tích lũy                        ║
    ║  → Vẽ biểu đồ: latency P95, request rate, error rate     ║
    ║  → Nếu P95 > 500ms → Gửi alert cho team                  ║
    ╚════════════════════════════════════════════════════════════╝
```

**MEANWHILE (song song, không liên quan đến request trên):**
```
[10] ╔════════════════════════════════════════════════════════════╗
     ║  Load Balancer gọi GET /api/health (mỗi 30 giây)         ║
     ║  → HealthController chạy 4 indicators                    ║
     ║  → Database OK? Memory OK? Disk OK?                      ║
     ║  → Trả 200 {"status":"ok"} → LB tiếp tục gửi traffic    ║
     ║  → Nếu trả 503 → LB NGỪNG gửi traffic vào server này    ║
     ╚════════════════════════════════════════════════════════════╝
```

#### 8.5.2. Khi có LỖI xảy ra — luồng đi khác như thế nào?

VD: UC-21 Record Review, nhưng DB connection bị drop giữa chừng:

```
[1] User submit review → POST /api/study/review
         │
         ▼
[2] RequestLoggerMiddleware: startTime = Date.now(), đăng ký 'finish' listener
         │ next()
         ▼
[3] AuthGuard: JWT OK → tiếp
         │
         ▼
[4] StudyController.submitReview() → ReviewService.submitReviews()
         │
         ▼
[5] prisma.$transaction([card.update, review.create])
    → card.update() THÀNH CÔNG
    → review.create() → ❌ DB CONNECTION DROP!
    → Transaction ROLLBACK → card.update() cũng bị hủy
    → Prisma throw Error("Connection timed out")
         │
         ▼
[6] ╔════════════════════════════════════════════════════════════╗
    ║  GlobalExceptionFilter BẮT LỖI (Tactic T9)               ║
    ║                                                           ║
    ║  exception KHÔNG phải HttpException → Unexpected Error    ║
    ║                                                           ║
    ║  INTERNAL LOG (cho dev):                                  ║
    ║  this.logger.error(                                       ║
    ║    "POST /api/study/review 500 - Connection timed out",   ║
    ║    exception.stack,    ← stack trace đầy đủ               ║
    ║    'ExceptionFilter'   ← context label                    ║
    ║  )                                                        ║
    ║  → Winston ghi vào:                                       ║
    ║    - Console (dev thấy ngay trên terminal)                ║
    ║    - error-2026-05-14.log (file riêng cho errors)         ║
    ║    - combined-2026-05-14.log (file tổng hợp)              ║
    ║                                                           ║
    ║  CLIENT RESPONSE (cho user):                              ║
    ║  { statusCode: 500,                                       ║
    ║    message: "Internal server error",  ← KHÔNG lộ chi tiết ║
    ║    data: null }                                           ║
    ║                                                           ║
    ║  → Node.js KHÔNG CRASH → vẫn tiếp tục phục vụ user khác  ║
    ╚════════════════════════════════════════════════════════════╝
         │
         ▼
[7] 'finish' event fires (statusCode = 500):
    ║  LOGGING: logger.error("POST /api/study/review 500 - ...") ║
    ║  METRICS: httpRequestDuration.observe(labels, 2.5)         ║
    ║           httpRequestsTotal.inc({...status_code:"500"})    ║
```

**Kết quả:** Dev mở `error-2026-05-14.log`, thấy ngay:
```json
{
  "context": "ExceptionFilter",
  "level": "error",
  "message": "POST /api/study/review 500 - Connection timed out",
  "stack": "Error: Connection timed out\n    at PrismaClient._request ...",
  "timestamp": "2026-05-14T08:12:33.441Z"
}
```
Trong khi đó, user CHỈ thấy: `{"message": "Internal server error"}` — KHÔNG biết đang dùng Prisma, không biết DB connection drop.

#### 8.5.3. Giải thích ngữ nghĩa từng khái niệm quan trọng

**1. "Transport" nghĩa là gì?**
Transport = "Phương tiện vận chuyển" log. Giống như bạn gửi 1 lá thư, bạn có thể gửi qua: (a) bưu điện (File), (b) email (Console), (c) tin nhắn (HTTP). Winston cho phép gửi MỘT log entry đến NHIỀU transport cùng lúc. Trong project có 3 transport: Console, Error File, Combined File.

**2. "Rotate" nghĩa là gì?**
Nếu ghi log vào 1 file duy nhất, file sẽ phình to hàng GB → tốn disk, mở chậm. "Rotate" = mỗi ngày tạo file MỚI (VD: `combined-2026-05-14.log` → ngày mai tạo `combined-2026-05-15.log`). File cũ quá 14 ngày → tự động XÓA. File cũ hơn 1 ngày → tự động NÉN (gzip) để tiết kiệm disk.

**3. "Structured Logging" nghĩa là gì?**
So sánh 2 cách ghi log:
```
❌ Unstructured: "User 42 reviewed card 100 at 10:03"
✅ Structured:   {"userId":42, "cardId":100, "action":"review", "timestamp":"10:03"}
```
Structured = dạng JSON → máy tính có thể query: "Tìm tất cả log có `level == error` VÀ `context == HTTP`". Unstructured = dạng text → máy phải đoán, rất khó tìm kiếm.

**4. "Log Level" nghĩa là gì?**
Mỗi log entry có mức độ nghiêm trọng:
```
error  (0) ← Nghiêm trọng nhất. Hệ thống hỏng. Cần sửa NGAY.
 warn  (1) ← Có vấn đề nhưng chưa chết. Cần theo dõi.
 info  (2) ← Hoạt động bình thường. "User logged in", "Server started".
 http  (3) ← Sự kiện HTTP cụ thể.
debug  (5) ← Chi tiết cho dev. CHỈ hiện trong môi trường dev.
```
Ở Production, chỉ ghi `error`, `warn`, `info` (giảm noise). Ở Development, ghi cả `debug` (xem nhiều chi tiết hơn).

**5. "Histogram" vs "Counter" trong Prometheus nghĩa là gì?**
- **Counter** = bộ đếm, CHỈ TĂNG, không bao giờ giảm. VD: `http_requests_total` = tổng số request từ lúc khởi động đến giờ. Nếu giá trị = 1000, nghĩa là đã có 1000 request.
- **Histogram** = phân bổ giá trị vào các "xô" (buckets). VD: `http_request_duration_seconds` với buckets `[0.1, 0.25, 0.5, 1]` nghĩa là: bao nhiêu request mất <100ms? bao nhiêu mất 100-250ms? bao nhiêu mất 250-500ms? Từ đó tính được P95 (95% request nhanh hơn bao nhiêu ms).

**6. "Route Normalization" nghĩa là gì?**
Nếu KHÔNG normalize, mỗi URL tạo 1 metric riêng:
```
http_requests_total{route="/api/deck/1"} 1
http_requests_total{route="/api/deck/2"} 1
http_requests_total{route="/api/deck/3"} 1
... hàng nghìn series → Prometheus bị quá tải (high cardinality)
```
Normalize: gộp tất cả `/api/deck/1`, `/api/deck/2`, `/api/deck/3` thành 1 pattern `/api/deck/:id`:
```
http_requests_total{route="/api/deck/:id"} 3  ← GỌN, hiệu quả
```

**7. "Liveness" vs "Readiness" khác nhau sao?**
- **Liveness** = "Process còn sống không?" → Nếu FAIL → RESTART container (vì process chết rồi).
- **Readiness** = "Process có thể PHỤC VỤ traffic không?" → Nếu FAIL → NGỪNG gửi traffic nhưng KHÔNG restart (vì process vẫn sống, chỉ là DB chết → restart cũng không giúp gì).

VD thực tế: App chạy bình thường (liveness OK) nhưng DB bị overload (readiness FAIL). Nginx sẽ ngừng route traffic đến server này, nhưng KHÔNG restart container. Khi DB recover → readiness OK lại → Nginx gửi traffic tiếp.

#### 8.5.4. Mỗi UC dùng Observability component nào?

| UC | Logging (RequestLogger) | Logging (ExceptionFilter) | Health Check | Prometheus Metrics |
| --- | --- | --- | --- | --- |
| UC-01 Register | ✅ Log request | ✅ Bắt validation error | - | ✅ Duration, count |
| UC-02 Login | ✅ Log request + WARN nếu 401 | ✅ Bắt lỗi auth | - | ✅ Duration, count, **error rate** |
| UC-20 Study ⭐ | ✅ Log request + **duration ms** | ✅ Bắt query timeout | - | ✅ **Duration histogram** → P95 ≤500ms |
| UC-21 Review ⭐ | ✅ Log request | ✅ Bắt transaction fail | - | ✅ Duration, count, **error rate** |
| UC-24 Auth | ✅ Log request + WARN nếu 403 | ✅ Log ownership denied | - | ✅ Count 403s |
| Infrastructure | - | - | ✅ **Mỗi 30s** | ✅ Default Node.js metrics |

#### 8.5.5. Debugging thực tế — Khi user report lỗi "Bấm Study Now bị lỗi"

**Bước 1: Kiểm tra Health**
```bash
curl https://api.flashlearn.com/api/health
→ {"status":"ok","info":{"database":{"status":"up"}}}
```
DB sống → vấn đề ở application logic.

**Bước 2: Tìm error log**
```bash
grep "study/start" logs/error-2026-05-14.log | tail -5
```
```json
{"context":"ExceptionFilter","level":"error","message":"GET /api/study/start/5 500 - Cannot read property 'easeFactor' of undefined","stack":"TypeError...at StudyService.findDueCards (study.service.ts:87)","timestamp":"2026-05-14T08:12:33Z"}
```
Tìm thấy! `easeFactor` bị `undefined` trên một số cards.

**Bước 3: Kiểm tra Prometheus metrics**
```
http_requests_total{route="/api/study/start/:id",status_code="500"} → 47
```
47 requests bị 500 → ảnh hưởng nhiều user.

**Bước 4: Fix → Deploy → Verify**
```bash
tail -f logs/error-2026-05-14.log | grep "study/start"
→ ... im lặng. Không còn error mới.
```

**Tổng thời gian debug: ~10 phút.** Không có structured logging → có thể mất hàng giờ đoán mò.



---

## 9. MẸO TRẢ LỜI THẦY

### 9.1. Khi thầy chọn 1 Business Rule bất kỳ → Trả lời 6 bước:

1. **Xác định UC:** "Business Rule này thuộc UC-21 Record Review"
2. **Chỉ ra AD:** "UC-21 liên quan AD-04 Reliability (BV=H, TR=M) và AD-01 Performance (BV=H, TR=H)"
3. **Trích dẫn Scenario:** "Scenario S4: DB drop giữa card.update và review.create → rollback toàn bộ"
4. **Nêu Tactic:** "Áp dụng T8 DB Transactions và T4 Resource-Level Auth"
5. **Chỉ Code:** "Code dùng `prisma.$transaction()` trong `src/services/review/review.service.ts`"
6. **Trade-off:** "T8 thêm +10-20ms COMMIT nhưng đảm bảo zero partial states"

### 9.2. Khi thầy hỏi Logging/Monitoring/Telemetry:

> "Hệ thống dùng 3 tầng giám sát:
>
> - **Logging** ghi lại sự kiện đã xảy ra: Global Request Log (mọi request), Error Log qua T9 Global Error Handler (ngăn crash), Security Log (login failures, 403).
> - **Monitoring** theo dõi real-time: Health endpoint `/api/health` cho load balancer, Query latency P95 cho UC-20 target ≤500ms, Transaction failure rate cho UC-21, Auth failure rate cho UC-02/UC-24.
> - **Telemetry** thu thập usage patterns: Offline sync success rate cho UC-21 (đảm bảo zero data loss), SM-2 quality distribution cho UC-23."

### 9.3. Khi thầy hỏi tại sao không Microservices:

> "SM-2 cần atomic card+review trong 1 transaction. Microservices → 2 service → distributed saga → eventual consistency rất phức tạp. Với <100 users, infrastructure microservices (API gateway, service discovery) chiếm 80% effort cho <5% benefit. Module boundaries hiện tại đã service-aligned → dễ extract khi scale >10,000 users."

### 9.4. Khi thầy hỏi về Offline:

> "Khi mất mạng, T12 Network Monitor detect offline event → mọi review chuyển sang T10 IndexedDB. User tiếp tục học bình thường. Khi online lại → T11 Batch Sync đọc IndexedDB → POST /review/batch → server xử lý atomic. Retry exponential backoff nếu fail. Zero data loss guaranteed."

### 9.5. Khi thầy hỏi ResourceAuthMiddleware vs RBAC:

> "RBAC chỉ check role. 2 Admin cùng role → RBAC pass cả 2 → SAI. ResourceAuthMiddleware check ownership: `findByIdAndOwner()` → WHERE id=? AND userId=? → null → 403. Middleware đặt TRƯỚC Controller → Controller không gọi nếu fail. Trade-off: +50ms nhưng security > performance."
