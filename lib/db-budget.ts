/**
 * Hạn cho các transaction trên ĐƯỜNG TIỀN.
 *
 * Mặc định của Prisma là 5 giây, và đó là con số đã từng không đủ. App chạy ở
 * `icn1` còn database ở `ap-northeast-2`; đo trên chính pooler này thì một
 * round-trip ấm mất ~87ms (xem khối chú thích đầu lib/prisma.ts). Một đơn nhóm mười
 * người mua vài khóa là hàng chục dòng đơn, nên transaction xác nhận thanh toán
 * từng cần hàng trăm round-trip và vượt trần — khi đó nó rollback CẢ hàng
 * `payments` vừa ghi, và khoản tiền đã vào tài khoản không còn dấu vết nào để
 * đối soát.
 *
 * Đây là TRẦN, không phải mục tiêu: sau khi các lệnh ghi được gộp lại, hai
 * transaction bên dưới chỉ tốn khoảng một giây. Trần của webhook rộng hơn vì
 * route đó có `maxDuration = 60` và không giữ khóa trên bảng `courses`, còn
 * `createOrder` thì có — mỗi giây nó giữ lâu hơn là một giây mọi checkout khác
 * phải chờ.
 *
 * `maxWait` là thời gian chờ MỘT KẾT NỐI RẢNH để bắt đầu, không phải thời gian
 * chạy. Mặc định 2 giây quá ngắn cho một pool chỉ có 3 kết nối trên Vercel.
 *
 * File riêng chứ không nằm trong lib/prisma.ts: mọi test của luồng thanh toán
 * đều `vi.mock("@/lib/prisma")`, nên thêm một export vào đó là bắt hàng chục
 * file test khai báo lại một hằng số không liên quan gì tới thứ chúng kiểm.
 */
export const CHECKOUT_TX = { timeout: 15_000, maxWait: 5_000 } as const;
export const PAYMENT_TX = { timeout: 20_000, maxWait: 5_000 } as const;
