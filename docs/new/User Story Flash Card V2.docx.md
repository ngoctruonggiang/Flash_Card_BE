# TÀI LIỆU USER STORY TÍCH HỢP THUỘC TÍNH CHẤT LƯỢNG (QA) \- V2

## 1\. Quản lý người dùng (User Management)

**Trọng tâm:** Security, Performance, Usability

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Thuộc tính chất lượng (QA) |
| :---- | :---- | :---- | :---- |
| UC-01 | Là một người dùng chưa đăng ký, tôi muốn tạo tài khoản mới để bắt đầu sử dụng hệ thống. | • Email, tên đăng nhập và mật khẩu phải hợp lệ và duy nhất. • Mật khẩu phải được mã hóa bằng thuật toán bcrypt (salt round \>= 10). • Thời gian phản hồi tạo tài khoản phải \< 2 giây. • Hiển thị thông báo thành công (MSG02). | Security, Performance |
| UC-02 | Là một người dùng đã đăng ký, tôi muốn đăng nhập để truy cập vào Dashboard. | • Xác thực qua Email/Password. • Cấp mã JWT token có thời hạn và lưu trữ an toàn. • Khóa tài khoản tạm thời sau 5 lần nhập sai liên tiếp (Chống Brute-force). • Thông báo lỗi (MSG03) không được chỉ đích danh là sai mật khẩu hay sai email. | Security, Usability |
| UC-03 | Là một người dùng đang đăng nhập, tôi muốn đăng xuất để bảo mật tài khoản. | • Vô hiệu hóa JWT token phía server và xóa session phía client. • Chuyển hướng về trang đăng nhập ngay lập tức (\< 500ms). • Ngăn chặn sử dụng nút "Back" để truy cập lại phiên cũ. | Security, Performance |
| UC-04 | Là một người dùng, tôi muốn xem hồ sơ cá nhân để kiểm tra thông tin. | • Truy xuất dữ liệu qua Session ID/Token hợp lệ. • Hiển thị đầy đủ thông tin cá nhân và số liệu thống kê. • Dữ liệu nhạy cảm (như password hash) không được trả về phía client. | Security, Usability |
| UC-05 | Là một người dùng, tôi muốn cập nhật hồ sơ để thay đổi thông tin cá nhân. | • Cập nhật thành công vào DB và mã hóa lại nếu đổi mật khẩu. • Đảm bảo tính toàn vẹn dữ liệu: Nếu một trường lỗi, toàn bộ quá trình cập nhật phải rollback. • Hiển thị thông báo (MSG04). | Reliability, Security |
| UC-06 | Là một người dùng, tôi muốn xóa tài khoản để gỡ bỏ thông tin khỏi hệ thống. | • Hiển thị hộp thoại xác nhận (MSG05) để tránh thao tác nhầm. • Thực hiện xóa Cascade trong một Database Transaction duy nhất. • Đảm bảo dữ liệu liên quan được xóa sạch trong \< 3 giây. | Usability, Reliability, Performance |

---

## 2\. Quản lý bộ thẻ (Deck Management)

**Trọng tâm:** Performance, Scalability, Manageability

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Thuộc tính chất lượng (QA) |
| :---- | :---- | :---- | :---- |
| UC-07 | Là một người dùng, tôi muốn xem thư viện bộ thẻ để quản lý danh sách. | • Tải danh sách bộ thẻ thuộc sở hữu của người dùng. • Hỗ trợ phân trang (Pagination) nếu số lượng bộ thẻ \> 20\. • Thời gian tải thư viện phải \< 1 giây ngay cả khi có 100+ bộ thẻ. | Performance, Scalability |
| UC-08 | Là một người dùng, tôi muốn tạo bộ thẻ mới để phân loại từ vựng. | • Tên bộ thẻ không trống (Lỗi MSG06). • Gán ngôn ngữ mặc định là "VN\_EN" nếu người dùng không chọn. • Hệ thống hỗ trợ ký tự UTF-8 đa ngôn ngữ. | Usability, Flexibility |
| UC-10 | Là một người dùng, tôi muốn xóa bộ thẻ để loại bỏ nội dung không cần thiết. | • Xác nhận (MSG08). • Xóa toàn bộ thẻ và lịch sử ôn tập trong một Transaction để tránh dữ liệu rác (Orphan data). | Reliability, Maintainability |
| UC-11 | Là một người dùng, tôi muốn xem thống kê cơ bản của bộ thẻ. | • Tính toán số lần ôn tập, tỷ lệ đúng/sai chính xác 100%. • Biểu đồ phân bổ chất lượng (Again, Hard, Good, Easy) hiển thị trực quan. | Usability, Testability |
| UC-12 | Là một người dùng, tôi muốn xem thống kê nâng cao của bộ thẻ. | • Hiển thị trạng thái thẻ (New, Learning, Review, Relearn). • Thuật toán dự báo số thẻ đến hạn trong 7 ngày tới phải xử lý \< 200ms. | Performance, Conceptual Integrity |

---

## 3\. Quản lý thẻ và Nhập/Xuất (Card Management & I/O)

**Trọng tâm:** Interoperability, Supportability, Reliability

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Thuộc tính chất lượng (QA) |
| :---- | :---- | :---- | :---- |
| UC-13 | Là một người dùng, tôi muốn xem danh sách thẻ trong bộ thẻ. | • Hiển thị mặt trước/sau và hỗ trợ định dạng JSON cho nội dung giàu (hình ảnh, ví dụ). • Giao diện phản hồi mượt mà trên cả mobile và desktop. | Usability, Flexibility |
| UC-14 | Là một người dùng, tôi muốn thêm thẻ mới để mở rộng vốn từ. | • Khởi tạo thông số SM-2: Interval=0, Repetitions=0, E-Factor=2.5. • Tự động tạo thẻ đảo nếu bộ thẻ là "BIDIRECTIONAL" để đảm bảo tính nhất quán của dữ liệu. | Conceptual Integrity |
| UC-17 | Là một người dùng, tôi muốn xem thống kê của từng thẻ. | • Hiển thị lịch sử ôn tập chi tiết. • Dữ liệu thống kê phải được đồng bộ hóa tức thì sau mỗi phiên học. | Reliability, Usability |
| UC-18 | Là một người dùng, tôi muốn nhập dữ liệu từ file JSON để thêm thẻ hàng loạt. | • Kiểm tra cấu trúc file JSON (Schema Validation) trước khi nhập. • Ghi log chi tiết các dòng bị lỗi để hỗ trợ người dùng (Supportability). • Xử lý nhập 1000 thẻ trong \< 5 giây. | Interoperability, Supportability, Performance |
| UC-19 | Là một người dùng, tôi muốn xuất bộ thẻ ra file JSON để sao lưu. | • Chuyển đổi dữ liệu sang định dạng JSON chuẩn quốc tế. • Tệp tải về phải bao gồm đầy đủ meta-data của bộ thẻ. | Interoperability, Reusability |

---

## 4\. Hoạt động ôn tập (Study Activities)

**Trọng tâm:** Reliability, Availability, Performance

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Thuộc tính chất lượng (QA) |
| :---- | :---- | :---- | :---- |
| UC-20 | Là một người dùng, tôi muốn bắt đầu phiên học để ôn tập thẻ đến hạn. | • Truy vấn thẻ có NextReviewDate \<= Today trong \< 500ms. • Sắp xếp đúng ưu tiên Quá hạn/Mới theo thuật toán SM-2. | Performance, Conceptual Integrity |
| UC-21 | Là một người dùng, tôi muốn đánh giá mức độ ghi nhớ để lập lịch ôn tập. | • Cập nhật thông số SM-2 và tạo log lịch sử trong một Transaction. • Đảm bảo hệ thống vẫn hoạt động ổn định (Availability) ngay cả khi mất kết nối mạng tạm thời (lưu kết quả cục bộ và đồng bộ sau). | Reliability, Availability |
| UC-23 | Là một người dùng, tôi muốn xem thống kê phiên học theo thời gian. | • Truy vấn dữ liệu trong khoảng (startDate, endDate) chính xác. • Kết quả tính toán tổng thời gian học phải khớp với log thực tế. | Testability, Usability |

---

## 5\. Quản trị hệ thống & Phân quyền nâng cao (System Admin & Advanced Auth)

**Trọng tâm:** Security, Integrity

| ID | User Story | Tiêu chí chấp nhận (Acceptance Criteria) | Thuộc tính chất lượng (QA) |
| :---- | :---- | :---- | :---- |
| UC-24 | Là một quản trị viên, tôi muốn kiểm soát quyền truy cập dựa trên quyền sở hữu để bảo vệ dữ liệu cá nhân giữa các Admin. | • Hệ thống phải xác định được cả Role và User ID khi thực hiện thao tác nhạy cảm. • Admin A có thể xem bộ thẻ của Admin B nhưng không có quyền Chỉnh sửa/Xóa. • Chỉ chủ sở hữu bộ thẻ mới có quyền cập nhật hoặc xóa tài nguyên đó. • Hiển thị thông báo từ chối truy cập (MSG-AUTH-01) nếu vi phạm. | Security (Authorization), Integrity |

