# Utility Tree: Flashcard Management System (Updated V2)

| Level 1: Quality Attribute | Level 2: Attribute Refinement | Level 3: Scenario (Derived from User Stories) | Business Value | Technical Risk |
| :---- | :---- | :---- | :---: | :---: |
| **Security** | Data Confidentiality | User creates account; password must be hashed with bcrypt (salt \>= 10\) before storage. (UC-01) | H | M |
|  | Authentication | User logs in; system issues secure JWT and implements brute-force protection after 5 failed attempts. (UC-02) | H | M |
|  | **Authorization** | **Admin A attempts to delete a deck created by Admin B; system verifies User ID and Creator ID, then denies action, allowing only "View" access. (UC-24)** | **H** | **M** |
|  | Session Management | Logged-in user logs out; JWT is invalidated on server and "Back" button access is prevented. (UC-03) | M | M |
|  | Access Control | User views profile; sensitive data like password hashes are never returned to the client. (UC-04) | H | L |
| **Performance** | Latency | User starts study session; system queries due cards (NextReviewDate \<= Today) in \< 500ms. (UC-20) | H | H |
|  | Responsiveness | User creates account; system responds with success/failure in \< 2 seconds. (UC-01) | M | L |
|  | Throughput | User imports 1000 cards via JSON; system processes and validates the batch in \< 5 seconds. (UC-18) | M | M |
| **Reliability** | Data Integrity | User updates profile or evaluates a card; system uses DB Transactions to ensure atomicity/rollback on error. (UC-05, UC-21) | H | M |
|  | Recoverability | User deletes a deck; system performs a Cascade delete within a single transaction to prevent orphan data. (UC-10) | H | L |
| **Availability** | Fault Tolerance | User is in a study session and loses internet; system saves progress locally and syncs later. (UC-21) | M | H |
| **Usability** | Error Prevention | User deletes account or deck; system requires confirmation (MSG05/MSG08) to prevent accidental loss. (UC-06, UC-10) | H | L |
|  | Feedback | User enters wrong credentials; system provides a generic error (MSG03) to hide specific failure points. (UC-02) | M | L |
| **Interoperability** | Data Exchange | User exports deck; system generates a standard international JSON file with full metadata. (UC-19) | M | L |
| **Scalability** | Data Volume | User views library; system supports pagination and loads \>100 decks in \< 1 second. (UC-07) | H | M |
| **Integrity** | Conceptual Consistency | User adds a card to a bidirectional deck; system automatically creates the reverse card to maintain logic. (UC-14) | M | M |

---

### Architectural Drivers (The "H,H" and "H,M" scenarios)

1. **Performance/Latency (H,H):** Tối ưu hóa truy vấn thuật toán SM-2 cho tập dữ liệu lớn để đảm bảo bắt đầu phiên học dưới 500ms.  
2. **Availability/Offline Support (M,H):** Thiết kế bộ máy đồng bộ (sync engine) để xử lý kết nối chập chờn khi đang học.  
3. **Security/Authorization (H,M):** Triển khai phân quyền mức tài nguyên (Resource-Level Authorization/Ownership) dựa trên User ID và Creator ID.  
4. **Reliability/Transactions (H,M):** Đảm bảo tất cả các cập nhật và xóa thẻ được thực hiện trong các giao dịch cơ sở dữ liệu (database transactions) an toàn.

