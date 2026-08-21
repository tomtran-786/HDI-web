/**
 * Copy cho luồng xác thực email.
 *
 * Hai ràng buộc của backend phải hiện lên chữ nghĩa ở đây, nếu không giao diện
 * sẽ hứa những thứ hệ thống không làm:
 *
 *   1. Xác thực là một LIÊN KẾT, không phải mã số. Không chỗ nào được nói "mã".
 *   2. `allowAuthEmail` chỉ cho 3 lượt gửi mỗi giờ cho một email. Quá số đó,
 *      server vẫn trả về đúng màn hình "đã gửi" (cố ý, để không lộ email nào
 *      có tài khoản) — nên chữ phải nói trước về giới hạn, bằng không học viên
 *      ngồi chờ một email không bao giờ tới.
 */

export const verifyPage = {
  eyebrow: "Bảo mật tài khoản",
  title: "Xác thực email",
  subtitle: "Xác nhận địa chỉ email trước khi đăng nhập bằng mật khẩu.",

  /** Màn hình khi liên kết trong email còn hiệu lực. */
  confirm: {
    lead: "Bạn đang xác thực địa chỉ",
    // Người dùng vừa bấm một liên kết và lại gặp thêm một nút — không giải
    // thích thì trông như trang lỗi. Lý do là thật: bộ quét thư của một số nhà
    // cung cấp tự mở liên kết trong email, nên việc xác thực phải do một cú
    // bấm thật kích hoạt, không phải do trang được tải.
    why: "Cần thêm một bước này vì bộ quét thư của một số nhà cung cấp tự mở liên kết trong email. Xác thực chỉ diễn ra khi bạn bấm nút bên dưới.",
    action: "Xác thực email này",
  },

  /** Liên kết hỏng, hết hạn, đã dùng, hoặc tài khoản đã xác thực từ trước. */
  invalid: {
    title: "Liên kết không dùng được",
    body: "Liên kết đã hết hạn, đã được sử dụng, hoặc tài khoản này đã xác thực xong. Nhập email bên dưới để nhận liên kết mới.",
  },

  /** Form xin gửi lại. */
  resend: {
    label: "Email cần xác thực",
    action: "Gửi liên kết xác thực",
    hint: "Liên kết có hiệu lực trong 24 giờ. Mỗi email nhận tối đa 3 liên kết mỗi giờ.",
  },

  /** Sau khi bấm gửi lại — thay chỗ form, không để form trống mời bấm tiếp. */
  sent: {
    title: "Đã gửi nếu tài khoản đang chờ xác thực",
    body: "Hãy mở hộp thư và kiểm tra cả mục Spam. Liên kết có hiệu lực trong 24 giờ.",
    limitNote:
      "Nếu không thấy email sau vài phút: mỗi email chỉ nhận tối đa 3 liên kết mỗi giờ, nên hãy đợi hết giờ rồi thử lại thay vì bấm liên tục.",
    again: "Gửi cho email khác",
  },

  backToSignIn: "Quay lại đăng nhập",
} as const;

export const registerPage = {
  eyebrow: "Khu vực học viên",
  title: "Tạo tài khoản",
  subtitle: "Đăng ký bằng email hoặc tiếp tục bằng Google ở trang đăng nhập.",

  /** Sau khi đăng ký — thay chỗ form, vì form trống hiện lại trông như submit hỏng. */
  sent: {
    title: "Kiểm tra hộp thư của bạn",
    body: "Nếu email có thể đăng ký, HDI đã gửi một liên kết xác thực. Hãy mở thư và bấm nút trong đó để kích hoạt đăng nhập bằng mật khẩu.",
    spam: "Chưa thấy thư? Kiểm tra mục Spam, hoặc yêu cầu gửi lại liên kết.",
    resendCta: "Gửi lại liên kết xác thực",
    signInCta: "Tới trang đăng nhập",
  },

  error:
    "Vui lòng kiểm tra họ tên, email và mật khẩu. Mật khẩu cần ít nhất 12 ký tự và tối đa 72 byte.",

  fields: {
    name: "Họ và tên",
    email: "Email",
    password: "Mật khẩu",
    confirmPassword: "Nhập lại mật khẩu",
  },
  action: "Tạo tài khoản",
  driveNote:
    "Record được cấp qua Google Drive. Email đăng ký cần thuộc một tài khoản Google; địa chỉ không phải Gmail vẫn dùng được nếu đã liên kết với Google.",
  haveAccount: "Đã có tài khoản?",
  signIn: "Đăng nhập",
} as const;
