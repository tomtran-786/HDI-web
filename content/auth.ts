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

import { REFERRAL_DISCOUNT_PCT } from "@/lib/referral-pricing";

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
    // Bấm nút này kích hoạt mật khẩu của lần đăng ký đã phát ra liên kết, và
    // lần đăng ký đó không nhất thiết là của chủ hộp thư.
    warning: "Nếu bạn không tạo tài khoản này, đừng bấm — làm vậy sẽ kích hoạt tài khoản cùng mật khẩu do người đã đăng ký đặt.",
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

export const signInPage = {
  eyebrow: "Khu vực học viên",
  title: "Đăng nhập",
  subtitle: "Đăng nhập bằng email và mật khẩu hoặc bằng Google.",

  /** Hai tin vui dẫn tới đây: vừa xác thực xong, hoặc vừa đổi mật khẩu xong. */
  verified: "Email đã được xác thực. Bạn có thể đăng nhập ngay.",
  reset: "Mật khẩu đã được đổi và các phiên đăng nhập cũ đã hết hiệu lực.",

  /**
   * Gộp mọi nguyên nhân liên quan tới một tài khoản cụ thể vào một câu là có
   * chủ ý: tách ra sẽ cho biết email nào có tài khoản, và trang đăng nhập là
   * đúng nơi kẻ dò mật khẩu hàng loạt làm việc. Đổi lại, người chưa xác thực
   * cần thấy ngay đường đi tiếp, nên ba liên kết dưới form không phải trang trí.
   *
   * Các mã còn lại không nói gì về một tài khoản nào, nên nói thẳng được. Chúng
   * đến từ `pages.error` trong lib/auth.ts; mã lạ rơi về câu gộp.
   */
  errors: {
    credentials:
      "Email hoặc mật khẩu chưa đúng, tài khoản chưa xác thực, hoặc lượt thử tạm thời đã vượt giới hạn.",
    accessDenied:
      "Google không xác nhận địa chỉ email của tài khoản này, nên đăng nhập bằng Google chưa dùng được. Hãy xác minh email trong tài khoản Google, hoặc đăng nhập bằng mật khẩu.",
    configuration:
      "Đăng nhập đang gặp lỗi cấu hình phía hệ thống. Vui lòng thử lại sau ít phút hoặc liên hệ HDI.",
  },

  // Tài khoản tạo bằng Google không có mật khẩu, nên gõ mật khẩu vào đó sẽ mãi
  // ra câu lỗi gộp ở trên mà không có manh mối nào. Một dòng chữ là cách duy
  // nhất nói ra điều đó mà không lộ email nào có tài khoản.
  googleHint:
    "Nếu bạn tạo tài khoản bằng Google, hãy dùng nút Tiếp tục với Google — tài khoản đó chưa có mật khẩu.",

  fields: { email: "Email", password: "Mật khẩu" },
  action: "Đăng nhập",
  or: "hoặc",
  google: "Tiếp tục với Google",
  driveNote:
    "Record được chia sẻ qua Google Drive. Email đăng nhập cần thuộc tài khoản Google bạn dùng để xem; không nhất thiết phải là Gmail.",
  links: {
    register: "Tạo tài khoản",
    forgot: "Quên mật khẩu",
    resendVerify: "Gửi lại xác thực",
  },
} as const;

export const forgotPage = {
  eyebrow: "Bảo mật tài khoản",
  title: "Quên mật khẩu",
  subtitle: "Nhận liên kết đặt lại mật khẩu qua email.",

  label: "Email",
  action: "Gửi liên kết",
  // 30 phút, không phải 24 giờ như liên kết xác thực — nói rõ vì một liên kết
  // mở sau bữa trưa là một liên kết đã chết.
  hint: "Liên kết có hiệu lực trong 30 phút. Mỗi email nhận tối đa 3 liên kết mỗi giờ.",

  /** Thay chỗ form, cùng lý do như trang xác thực. */
  sent: {
    title: "Đã gửi nếu email đã đăng ký",
    body: "Hãy mở hộp thư và kiểm tra cả mục Spam. Liên kết có hiệu lực trong 30 phút và chỉ dùng được một lần.",
    limitNote:
      "Nếu không thấy email sau vài phút: mỗi email chỉ nhận tối đa 3 liên kết mỗi giờ, nên hãy đợi hết giờ rồi thử lại thay vì bấm liên tục.",
    again: "Gửi cho email khác",
  },

  backToSignIn: "Quay lại đăng nhập",
} as const;

export const resetPage = {
  eyebrow: "Bảo mật tài khoản",
  title: "Đặt lại mật khẩu",
  subtitle: "Mật khẩu mới sẽ đăng xuất các phiên cũ.",

  fields: { password: "Mật khẩu mới", confirmPassword: "Nhập lại mật khẩu" },
  action: "Đổi mật khẩu",
  rule: "Mật khẩu cần ít nhất 12 ký tự.",

  /** Liên kết hỏng/hết hạn, hoặc mật khẩu vừa nhập không đạt. */
  invalid: {
    title: "Không đổi được mật khẩu",
    body: "Liên kết đã hết hạn, đã được sử dụng, hoặc mật khẩu chưa đạt yêu cầu. Liên kết đặt lại chỉ sống 30 phút.",
    // Không có câu này thì người cầm liên kết chết đứng ở ngõ cụt: trang cũ chỉ
    // có một đường quay lại đăng nhập, nơi họ vẫn không vào được.
    cta: "Xin liên kết mới",
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

  /**
   * Đăng ký nói thẳng khi email đã có tài khoản, thay vì trả lời chung chung.
   *
   * Đánh đổi đã biết: người ngoài dò được địa chỉ nào đã đăng ký. Chấp nhận vì
   * câu trả lời chung chung từng dẫn tới một lỗi thật — người dùng đăng ký lại
   * bằng mật khẩu mới, thấy báo "đã gửi thư", xác thực xong rồi không đăng nhập
   * được. Trần 3 lần mỗi email và 10 lần mỗi IP trong `allowAuthEmail` mới là
   * thứ giữ cho việc dò không chạy được ở quy mô lớn, không phải câu chữ mập mờ.
   *
   * Chỉ địa chỉ ĐÃ xác thực mới bị từ chối. Đăng ký lại một địa chỉ chưa xác
   * thực nay chạy đúng — mật khẩu đi theo token nên mật khẩu vừa nhập chính là
   * mật khẩu có hiệu lực — nên nó quay về màn hình "đã gửi thư" bình thường.
   */
  errors: {
    invalid:
      "Vui lòng kiểm tra họ tên, email và mật khẩu. Mật khẩu cần ít nhất 12 ký tự và tối đa 72 byte.",
    taken:
      "Email này đã có tài khoản. Hãy đăng nhập, hoặc đặt lại mật khẩu nếu bạn không nhớ.",
    throttled:
      "Đã có quá nhiều lượt đăng ký cho email này. Vui lòng đợi ít phút rồi thử lại.",
    failed:
      "Chưa tạo được tài khoản do lỗi tạm thời ở hệ thống. Vui lòng thử lại sau ít phút.",
    // Tài khoản đã tạo xong, chỉ lá thư là chưa đi. Nói rõ điều đó để người
    // dùng đi gửi lại liên kết thay vì đăng ký lại từ đầu.
    email_failed:
      "Đã tạo tài khoản nhưng chưa gửi được thư xác thực do lỗi hệ thống email. Hãy yêu cầu gửi lại liên kết sau ít phút.",
    // Mã sai phải được nói ra chứ không âm thầm bỏ qua. Bỏ qua im lặng là cách
    // chắc chắn nhất để người giới thiệu mất phần của họ mà không ai biết, và
    // người mới thì mất luôn khoản giảm 10% của đơn đầu tiên.
    ma_gioi_thieu:
      "Mã giới thiệu không tồn tại. Hãy kiểm tra lại mã bạn được gửi, hoặc xóa trống ô đó để đăng ký không kèm mã.",
  },

  errorLinks: {
    signIn: "Đăng nhập",
    reset: "Quên mật khẩu",
    resend: "Gửi lại liên kết xác thực",
  },

  fields: {
    name: "Họ và tên",
    email: "Email",
    password: "Mật khẩu",
    confirmPassword: "Nhập lại mật khẩu",
    referralCode: "Mã giới thiệu (nếu có)",
  },
  /**
   * Ô mã luôn hiện, không nằm sau một nút "tôi có mã".
   *
   * Người vào bằng link mời đã được điền sẵn; người nghe bạn đọc mã qua điện
   * thoại thì cần thấy ô đó tồn tại. Một ưu đãi phải bấm mới thấy là một ưu đãi
   * phần lớn người dùng không bao giờ dùng.
   */
  referralHint: `Nhập mã của người giới thiệu để được giảm ${REFERRAL_DISCOUNT_PCT}% cho khóa học đầu tiên của bạn.`,
  action: "Tạo tài khoản",
  driveNote:
    "Record được cấp qua Google Drive. Email đăng ký cần thuộc một tài khoản Google; địa chỉ không phải Gmail vẫn dùng được nếu đã liên kết với Google.",
  haveAccount: "Đã có tài khoản?",
  signIn: "Đăng nhập",
} as const;
