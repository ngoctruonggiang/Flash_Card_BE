# Danh sách chức năng

|DANH SÁCH CÁC CHỨC NĂNG| | | | | | | | | | | | | | |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|Tên dự án: FlashLearn – Hệ thống học từ vựng tiếng Anh trực tuyến theo thuật toán lặp lại ngắt quãng SM-2| | | | | | | | | | | | | | |
|Người thực hiện: Nhóm phát triển FlashLearn| | | | | | | | | | | | | | |
|STT|Tên chức năng chính|Tên chức năng con|Môi trường triển khai| |C1 / W1 Nhập dữ liệu| |C2 / W2 Xuất dữ liệu| |C3 / W3 Truy vấn EIF| |C4 / W4 File nội bộ ILF| |C5 / W5 Giao diện ngoài EIF| |
| | | |Web|Mobile|C1|W1|C2|W2|C3|W3|C4|W4|C5|W5|
|1|Xác thực & Phiên làm việc|UC-01: Đăng ký tài khoản|X| |1|4|1|5|0|4|1|10|0|7|
|2|Xác thực & Phiên làm việc|UC-02: Đăng nhập (JWT + Brute-Force Guard)|X| |1|4|1|5|0|4|1|10|0|7|
|3|Xác thực & Phiên làm việc|UC-03: Đăng xuất an toàn|X| |1|4|0|5|0|4|0|10|0|7|
|4|Quản lý người dùng|UC-04: Xem hồ sơ người dùng (ProfileDTO)|X| |0|4|1|5|1|4|0|10|0|7|
|5|Quản lý người dùng|UC-05: Cập nhật hồ sơ người dùng|X| |1|4|1|5|0|4|1|10|0|7|
|6|Quản lý người dùng|UC-06: Xóa tài khoản (cascade)|X| |1|4|1|5|0|4|1|10|0|7|
|7|Quản lý Deck|UC-07: Xem danh sách Deck (phân trang)|X| |0|4|1|5|1|4|1|10|0|7|
|8|Quản lý Deck|UC-08: Tạo Deck mới|X| |1|4|1|5|0|4|1|10|0|7|
|9|Quản lý Deck|UC-09: Chỉnh sửa Deck|X| |1|4|1|5|0|4|1|10|0|7|
|10|Quản lý Deck|UC-10: Xóa Deck (cascade xóa card & review)|X| |1|4|1|5|0|4|1|10|0|7|
|11|Quản lý Deck|UC-11: Xem thống kê cơ bản của Deck|X| |0|4|1|5|1|4|1|10|0|7|
|12|Quản lý Deck|UC-12: Xem thống kê nâng cao của Deck|X| |0|4|1|5|1|4|1|10|0|7|
|13|Quản lý Thẻ (Card)|UC-13: Duyệt danh sách thẻ trong Deck|X| |0|4|1|5|1|4|1|10|0|7|
|14|Quản lý Thẻ (Card)|UC-14: Thêm thẻ (khởi tạo SM-2, BIDIRECTIONAL)|X| |1|4|1|5|0|4|1|10|0|7|
|15|Quản lý Thẻ (Card)|UC-15: Chỉnh sửa thẻ (giữ nguyên tiến độ SM-2)|X| |1|4|1|5|0|4|1|10|0|7|
|16|Quản lý Thẻ (Card)|UC-16: Xóa thẻ (cascade xóa review)|X| |1|4|1|5|0|4|1|10|0|7|
|17|Quản lý Thẻ (Card)|UC-17: Xem thống kê thẻ|X| |0|4|1|5|1|4|1|10|0|7|
|18|Nhập/Xuất dữ liệu|UC-18: Nhập hàng loạt thẻ qua JSON (batch)|X| |1|4|1|5|0|4|1|10|1|7|
|19|Nhập/Xuất dữ liệu|UC-19: Xuất Deck ra tệp JSON|X| |0|4|1|5|1|4|1|10|1|7|
|20|Học tập & Ôn tập (SM-2)|UC-20: Bắt đầu phiên học (truy vấn thẻ đến hạn)|X| |0|4|1|5|1|4|1|10|0|7|
|21|Học tập & Ôn tập (SM-2)|UC-21: Ghi nhận kết quả ôn tập (SM-2, transaction)|X| |1|4|1|5|0|4|1|10|0|7|
|22|Học tập & Ôn tập (SM-2)|UC-21b: Hàng đợi offline & đồng bộ batch|X| |1|4|1|5|0|4|1|10|1|7|
|23|Học tập & Ôn tập (SM-2)|UC-22: Tóm tắt phiên học|X| |0|4|1|5|1|4|1|10|0|7|
|24|Thống kê|UC-23: Xem thống kê phiên học (theo khoảng ngày)|X| |0|4|1|5|1|4|1|10|0|7|
|25|Quản trị hệ thống|UC-24: Admin xem Deck của người dùng (read-only, ResourceAuthMW)|X| |0|4|1|5|1|4|1|10|0|7|
|Tổng| | | | |||||||||||
|Tổng điểm chức năng thô (UFP)| | | | | | | | | | | | | ||
| | | | | | | | | | | | | | | |
|Tính hệ số hiệu chỉnh (VAF)| | | | |0.65 + 0.01×ΣFi  (ΣFi từ Sheet Hệ số hiệu chỉnh)| | | | | | | | | |
|ΣFi (Tổng điểm hiệu chỉnh)| | | | |48| | | | | | | | | |
|VAF = 0.65 + 0.01 × 48| | | | |1.13| | | | | | | | | |
|Số lượng FP = VAF × UFP| | | | || | | | | | | | | |
| | | | | | | | | | | | | | | |
|Tên|Giá trị|Đơn vị| | | | | | | | | | | | |
|Chi phí trả mỗi người/tháng|20.00|USD| | | | | | | | | | | | |
|Năng suất giả định|4.00|FP/pm| | | | | | | | | | | | |
|Chi phí mỗi FP|5.00|USD| | | | | | | | | | | | |
|Số lượng FP||FP| | | | | | | | | | | | |
|Quy ra đơn vị pm (FP / Năng suất)||pm| | | | | | | | | | | | |
|Chi phí quy ra tiền USD||USD| | | | | | | | | | | | |
