# Plan.MD — HDI Research Center landing page

> **Đọc file này đầu tiên khi bắt đầu một phiên làm việc mới.**
> **Cập nhật mục “Tiến độ” và thêm một mục vào “Nhật ký phiên” trước khi kết thúc phiên.**

---

## 1. Mục tiêu

Một landing page (một trang, nhiều section) cho **HDI Research Center**, do
**Dr. Cong Tam Trinh** dẫn dắt chuyên môn.

Trang này thay thế trang Google Sites cũ (`congtamtrinh.com`) — vốn chỉ là một danh
sách học thuật không có thiết kế — bằng một trang **bán dịch vụ**: phần đầu trang giới
thiệu các chương trình kèm cặp nghiên cứu và khóa học 8 buổi; hồ sơ học thuật (công bố,
đề tài, hội thảo) nằm phía dưới với vai trò **bằng chứng năng lực**, không phải nội dung chính.

Đối tượng: sinh viên đại học, học viên cao học, nghiên cứu sinh, và giảng viên trẻ
đang cần công bố quốc tế.

---

## 2. Quyết định đã chốt (không bàn lại)

| Hạng mục | Quyết định |
|---|---|
| **Thương hiệu** | `HDI Research Center` — **chỉ dùng chữ viết tắt**, không diễn giải HDI là gì ở bất kỳ đâu trên trang. Không dùng lại thương hiệu MIN&KIN. |
| **Định vị** | **Dịch vụ dẫn dắt.** Hero + Chương trình + Khóa học đứng trước; Công bố / Dự án / Hội thảo đứng sau làm bằng chứng. |
| **Công nghệ** | Next.js 16 (App Router) + TypeScript + Tailwind v4. Node v24.16.0. |
| **Ngôn ngữ** | **Tiếng Việt** cho toàn bộ giao diện và văn xuôi. **Giữ nguyên tiếng Anh** cho: tên bài báo, tên tạp chí, tên hội thảo, tên trường/tổ chức, tên người, tên bằng cấp, tên chương trình (Coach Session, Research Class…), và các chỉ số (ABDC, SSCI, Q1, IF). |
| **Bảng màu** | **Một bảng màu duy nhất** (xanh dương đậm). Bản đầu dùng thêm bảng màu cam cho phần khóa học — **đã bỏ** theo yêu cầu ngày 2026-08-19: khóa học không phải trang riêng nên không dùng màu riêng. |
| **Mô hình khóa học** | Chốt 2026-08-20: **tất cả khóa đều dạy trực tiếp theo kỳ (cohort)**, record chỉ để xem lại khi cần — **không phải bán video**. Kéo theo: một SKU cho mỗi khóa, và đòn bẩy chuyển đổi là **khan hiếm** (ngày khai giảng, sĩ số), không phải tiện lợi. |

> ⚠️ **Phạm vi đang mở rộng.** Đây hiện là landing page, nhưng kế hoạch đã duyệt ngày
> 2026-08-20 sẽ biến nó thành **ứng dụng có tài khoản, CSDL và tiền thật chạy qua**
> (đăng nhập bằng email/mật khẩu hoặc Google → PayOS → webhook → cấp quyền Google Drive).
> Kế hoạch đầy đủ ở
> `~/.claude/plans/b-t-u-phi-n-m-i-twinkly-karp.md`. **Chốt 2026-08-20: HDI tách khỏi edubit**
> — nút chặn của GĐ2–GĐ4 đã gỡ. Đã xong phần code của **GĐ0–GĐ4** trên nhánh
> `feat/gd2-nen-tang`; PayOS, Resend và Google Drive còn cần bí mật/tài khoản production
> của HDI trước khi kiểm thử sandbox và mở bán.
>
> Kế hoạch chi tiết GĐ2 ở `~/.claude/plans/users-tranvomanhtuan-portfolio-app-hdi-cryptic-kite.md`.
> **Repo nguồn để chép code nền tảng: `/Users/tranvomanhtuan/portfolio-app`, nhánh `main`.**

---

## 3. Nguồn dữ liệu — quy tắc quan trọng nhất

> **Không được bịa bất kỳ thông tin nào.** Mọi con số, tên, ngày tháng, học phí trên
> trang đều phải truy được về một file trong `reference/`.

| Thư mục | Vai trò | Ghi chú |
|---|---|---|
| `reference/site/` | **Nguồn nội dung duy nhất** | 13 trang markdown crawl từ `congtamtrinh.com`, cộng `links.json`, `images.json` |
| `reference/site/docs/` | `cv.pdf` (7 trang), `teaching-statement.pdf` | Học vấn trong phần “Về chúng tôi” lấy từ `cv.pdf` |
| `reference/site/images/image-53a4a7a37922.png` | Poster khóa học | **Toàn bộ** thông tin khóa học (8 buổi, học phí, giờ học) đọc từ ảnh này. Ảnh có logo MIN&KIN nên **không nhúng ảnh vào trang**, chỉ lấy dữ liệu. |
| `reference/site/images/image-1b5466b247b2.jpg` | Bảng 4 chương trình kèm cặp | Nguồn của `content/programs.ts` |
| `reference/edubit/` | Bản đồ cấu trúc `thayphongdang.edubit.vn` | Khảo sát từ phiên trước, **không dùng** cho trang này |
| `web-forge/WebForge_tomtran-portfolio_vercel_app/` | **Nguồn ngôn ngữ thiết kế duy nhất** | Là ảnh chụp màn hình + design token, **không phải mã nguồn**. `metadata.json` chứa bảng màu và font. |

Hai thư mục `reference/` và `web-forge/` đã được loại khỏi `.gitignore` và `eslint.config.mjs`
— chúng là tư liệu nghiên cứu, không phải mã ứng dụng.

---

## 4. Cấu trúc dự án

```
app/
  layout.tsx      font Source Sans 3 (subset latin + vietnamese), lang="vi",
                  script bootstrap dark-mode chạy trước khi paint
  globals.css     design token (:root và .dark) + @theme của Tailwind v4
  page.tsx        ghép các section theo thứ tự
components/
  site-header.tsx  site-footer.tsx  theme-toggle.tsx
  course-card.tsx  ← "use client": thẻ khóa học + modal <dialog> chi tiết
  course-list.tsx  ← "use client": state sắp xếp + lưới thẻ khóa học
  cart-provider.tsx ← "use client": giỏ hàng đọc từ cookie qua useSyncExternalStore
  cart-button.tsx   ← "use client": nút giỏ + badge ở header
  add-to-cart.tsx   ← "use client": nút "Thêm vào giỏ" ở /dang-ky/[slug]
  ui/     section.tsx  card.tsx  badge.tsx  reveal.tsx  icons.tsx
          cta-link.tsx ← "use client": MỌI CTA đi qua đây (tư vấn / Zalo / đăng ký)
  sections/  hero  stats  programs  featured-course  services
             about  publications  projects  conferences  teaching  contact
lib/
  analytics.ts     3 event đo phễu + union CtaSource
  prisma.ts        singleton pg.Pool + PrismaPg (GĐ2)
  auth.ts          Auth.js v5 + Credentials + Google + JWT + isAdminEmail
  auth-tokens.ts   token xác minh/reset chỉ lưu SHA-256 + giới hạn thời gian
  auth-throttle.ts giới hạn đăng nhập và email bằng khoá HMAC trong Postgres
  admin.ts         requireAdmin() cho server action (GĐ2)
  courses.ts       cầu nối DB ↔ content/course.ts (GĐ2)
  profile.ts       isProfileComplete + chuẩn hoá SĐT (GĐ2)
  enrollment.ts    confirmEnrollment() — ĐƯỜNG DUY NHẤT để ghi danh thành `paid`
  cohorts.ts       kỳ đang mở · đếm chỗ · kỳ học viên đã giữ (GĐ3)
  cart.ts          đọc cookie giỏ hàng và ĐỊNH GIÁ LẠI từ DB (GĐ3)
  cart-cookie.ts   định dạng cookie, dùng chung cho cả client lẫn server (GĐ3)
  orders.ts        createOrder · processPayosPayment · cancelOrder · expireStaleOrders
  payos.ts         client PayOS + xác minh chữ ký webhook
  fulfillment.ts   cấp/thu hồi quyền Google Drive có lease và đối soát
  format.ts        Intl dùng chung (ngày giờ Asia/Ho_Chi_Minh, tiền VNĐ)
  safe-path.ts     safeNext() — chặn open redirect ở ?tiep=
  generated/       Prisma Client — SINH RA lúc postinstall, đã gitignore
prisma/
  schema.prisma    User/Account/Session/VerificationToken + Cohort/Enrollment
                   + Order/OrderItem/Payment + AuthThrottle/ExternalSyncLease
  load-env.ts      nạp .env.local TRƯỚC mọi import khác — xem chú thích trong file
  seed.ts          upsert kỳ học từ prisma/cohorts.json (gitignore)
  cohorts.example.json
  migrations/      3 migration, chạy lại từ DB trống là dựng đủ schema
prisma.config.ts   CLI trỏ DIRECT_DATABASE_URL (session pooler :5432)
content/    ← TOÀN BỘ chữ nghĩa nằm ở đây, không hardcode trong JSX
  site.ts  programs.ts  course.ts  services.ts  about.ts
  publications.ts  projects.ts  conferences.ts  teaching.ts  stats.ts
  account.ts   ← 5 lựa chọn "giai đoạn" chép nguyên từ Google Form cũ
  checkout.ts  ← chữ cho giỏ hàng, trang chọn kỳ và trang đơn hàng
vercel.json   ghim Framework Preset = nextjs (xem Nhật ký phiên, sự cố 404)
              + regions: icn1 (cùng Seoul với DB) + cron dọn đơn quá hạn
public/
  docs/cv.pdf  docs/teaching-statement.pdf
  images/portrait.jpg   ← cắt từ poster khóa học, đã xóa nền ngoài hình tròn
```

**Quy ước:** sửa nội dung thì sửa trong `content/`; sửa giao diện thì sửa trong
`components/`. Đừng trộn hai việc.

### `content/course.ts` — cấu trúc mảng
File này export `courses: Course[]` cùng hai type `Course`, `CoursePhase`, và
`coursesIntro` (tiêu đề section, theo đúng tiền lệ `programsIntro`). Giáo trình nằm ở
`phases`; học phí tách khỏi `facts` thành `price` riêng để thẻ hiển thị nổi bật.
**Thêm khóa mới = thêm một object vào mảng**, không phải sửa component.

Từ phiên 3 mảng có **5 khóa** và mỗi khóa khai báo `curriculum`:

- `"sessions"` — một `phase` gom nhiều buổi, đánh số liên tục 1…8 ("Buổi 1"…"Buổi 8").
  Chỉ khóa chủ lực `viet-bao-cao-khoa-hoc` dùng kiểu này.
- `"modules"` — một `phase` **là** một module dạy trong một buổi, các mục bên trong
  đánh số 1.1, 1.2… Bốn khóa lấy từ edubit dùng kiểu này.

> Đánh số hai kiểu là **bắt buộc**, không phải trang trí: gọi 21 mục của khóa Stata là
> "Buổi 1…21" sẽ khai khống số buổi học của khóa đó.

**Cả 5 thẻ dùng chung một kiểu** (viền `border-line` + `bg-card`), xếp `md:grid-cols-2`.
Thẻ chỉ hiện tên khóa, đối tượng, học phí và `facts`; **lộ trình nằm hoàn toàn trong
modal**, thẻ chỉ có link "Xem lộ trình chi tiết" ghim đáy bằng `mt-auto` để các thẻ trong
cùng hàng thẳng nhau.

`price.vnd` là chính con số của `price.amount` dưới dạng number, để sắp xếp không phải
parse chuỗi hiển thị. **Đổi giá thì phải sửa cả hai.**

`components/course-list.tsx` ("use client") giữ state sắp xếp và render lưới; nhờ vậy
`featured-course.tsx` vẫn là Server Component. Ba lựa chọn: Mặc định (giữ thứ tự biên tập
trong `content/course.ts`) · Giá cao → thấp · Giá thấp → cao. Dùng lại đúng mẫu pill của
bộ lọc năm ở `#cong-bo`. Hàm sort **copy mảng trước** (`[...courses]`) vì `courses` là mảng
import từ module — sort tại chỗ sẽ ghi đè thứ tự gốc cho mọi nơi khác.

> **Tên 4 giai đoạn của khóa chủ lực là biên tập, không có trên poster.** Tám tiêu đề
> buổi học và mọi con số vẫn giữ nguyên văn từ poster. Đây là ngoại lệ duy nhất so với
> quy tắc ở mục 3.

### `lib/analytics.ts` — đo phễu (GĐ1)
`<Analytics />` của `@vercel/analytics/next` đặt trong `app/layout.tsx`. Ba event:

| event | bắn khi | thuộc tính |
|---|---|---|
| `mo-lo-trinh` | mở modal một khóa học | `khoa` = slug |
| `bam-cta` | bấm link ra Google Form hoặc Zalo | `nguon` · `dich` (`form`/`zalo`) · `khoa` (chỉ với CTA trong modal) |
| `doi-sap-xep` | đổi kiểu sắp xếp khóa học | `kieu` |

`CtaSource` là **union đóng** 7 giá trị: `header` · `header-mobile` · `hero` ·
`chuong-trinh` · `khoa-hoc-modal` · `lien-he` · `footer`. Đóng union để một chỗ gõ sai
không âm thầm tách phễu thành hai nhóm. Bảy chỗ trỏ tới Form, hai trong số đó
(`khoa-hoc-modal`, `lien-he`) có thêm nút Zalo.

**Mọi link ra ngoài phải dùng `CtaLink`, không viết `<a href={links.register}>` nữa.**
`CtaLink` tự phân giải URL từ `target`, nên chỗ gọi chỉ khai báo *nó đang ở đâu*, không
khai báo *nó đi đâu* — nhãn nguồn và URL không thể lệch nhau. Thêm CTA mới = thêm một giá
trị vào `CtaSource` rồi dùng `CtaLink`.

> **Lệch so với file kế hoạch:** kế hoạch ghi dùng `?src=` trên URL đích. Đã **thay bằng
> thuộc tính của event**. Lý do: `forms.gle` là link rút gọn có redirect và Google Forms
> không ghi lại query lạ; `zalo.me` thì bỏ query hẳn. `?src=` sẽ là tham số không ai đọc.
> Mục tiêu "phân biệt 7 CTA" vẫn đạt đủ qua `nguon`. Nếu sau này Dr. Trinh gửi
> *pre-filled link*, nguồn có thể đi kèm thêm bằng một field `entry.*` vào bảng phản hồi.

> ⚠️ **Việc thủ công còn lại:** phải bật **Web Analytics** trong dashboard Vercel của
> project thì dữ liệu mới chảy. Code đã sẵn sàng nhưng không tự bật được. Trong `next dev`
> thư viện chạy ở debug mode và **không gửi request nào** — chỉ log ra console; đó là cách
> kiểm chứng ở local.

### Design token
Định nghĩa ở `app/globals.css`. Sáng: `--primary #0c498f`, `--fg #172636`,
`--bg-soft #f7f9fc`, `--tint #e8f0fe`, `--success #1c7a4d`. Tối: đảo lại trong `.dark`.
Dark-mode dùng **class**, không dùng media query — nút bật/tắt ở header điều khiển.

### Nhịp nền các section
Các section xen kẽ `bg` / `bg-soft` để phân tách thị giác. Thứ tự hiện tại:
Hero(bg) · Stats(bg) · Chương trình(soft) · Khóa học(bg) · Dịch vụ(soft) ·
Về chúng tôi(bg) · Công bố(soft) · Dự án(bg) · Hội thảo(soft) · Giảng dạy(bg) · Liên hệ(soft).
**Thêm section mới thì phải kiểm tra lại nhịp này** — hai section liền nhau không được cùng nền.

---

## 5. Tiến độ

| # | Section | id | Trạng thái |
|---|---|---|---|
| 1 | Header (sticky, nav, dark toggle, CTA) | — | ✅ xong |
| 2 | Hero | `#top` | ✅ xong |
| 3 | Dải số liệu | — | ✅ xong |
| 4 | Chương trình kèm cặp (4 thẻ) | `#chuong-trinh` | ✅ xong |
| 5 | Khóa đào tạo (5 thẻ + modal lộ trình) | `#khoa-hoc` | ✅ xong |
| 6 | Dịch vụ hỗ trợ bản thảo | `#dich-vu` | ✅ xong |
| 7 | Về Dr. Cong Tam Trinh | `#ve-chung-toi` | ✅ xong |
| 8 | Công bố khoa học (13 bài, lọc theo năm) | `#cong-bo` | ✅ xong |
| 9 | Dự án được tài trợ (3) | `#du-an` | ✅ xong |
| 10 | Hội thảo quốc tế (14, thu gọn sau 6) | `#hoi-thao` | ✅ xong |
| 11 | Hướng dẫn & giảng dạy | `#giang-day` | ✅ xong |
| 12 | Liên hệ | `#lien-he` | ✅ xong |
| 13 | Footer 4 cột | — | ✅ xong |

**GĐ2 — khu vực học viên** (nhánh `feat/gd2-nen-tang`):

| # | Hạng mục | Route | Trạng thái |
|---|---|---|---|
| 14 | Schema Prisma + `lib/prisma.ts` + 2 migration đã áp | — | ✅ xong (qua MCP Supabase) |
| 15 | Auth.js v5 + email/mật khẩu + Google OAuth | `/api/auth/*` | ✅ xong · JWT 30 ngày, xác minh/reset email, liên kết Google an toàn |
| 16 | Trang đăng nhập | `/dang-nhap` | ✅ xong, đã chụp ảnh sáng + tối |
| 17 | Dashboard học viên | `/tai-khoan` | ✅ xong · đã test đủ 3 trạng thái + cách ly |
| 18 | Trang quản trị | `/quan-tri` | ✅ xong · đã test 3 mức quyền |
| 19 | Header/footer chuyển lên `layout.tsx` | — | ✅ xong, `/` **pixel-identical** |
| 20 | Hoàn tất hồ sơ (SĐT + giai đoạn) | `/hoan-tat-ho-so` | ✅ xong · lấy đúng 5 lựa chọn của form cũ |

**GĐ3 — giỏ hàng và đơn hàng** (cùng nhánh):

| # | Hạng mục | Route | Trạng thái |
|---|---|---|---|
| 21 | Bảng `Order` / `OrderItem` / `Payment` + migration | — | ✅ xong · mã đơn từ sequence, khởi điểm 100001 |
| 22 | Chọn kỳ học của một khóa | `/dang-ky/[slug]` | ✅ xong · xem công khai, phải đăng nhập trước khi thêm vào giỏ |
| 23 | Giỏ hàng (cookie) + nút giỏ ở header | `/gio-hang` | ✅ xong · giá luôn tính lại phía server |
| 24 | Đặt đơn, giữ chỗ 2 giờ | — | ✅ xong · khoá hàng `FOR UPDATE`, đối soát PayOS trước khi nhả chỗ |
| 25 | Đơn hàng của học viên | `/tai-khoan/don-hang[/mã]` | ✅ xong · truy vấn luôn kèm `userId` |
| 26 | Hàng chờ đối soát (chỉ xem) | `/quan-tri` | ✅ xong · **không có nút duyệt tay** |
| 27 | Cron đối soát đơn/Drive và dọn dữ liệu ngắn hạn | `/api/cron/...` | ✅ xong · housekeeping có giới hạn, không quyết định tính đúng của checkout |
| 28 | PayOS + webhook + Google Drive fulfillment | `/api/webhooks/payos` | ✅ code + full local E2E bằng Google Account phụ xong · còn đăng ký webhook production sau deploy |

**Kiểm chứng số liệu** (đối chiếu với `reference/site`): 13 công bố · 14 hội thảo ·
3 đề tài (US$31,000 + US$2,100 + US$4,200 = US$37,300) · 4 luận án hướng dẫn ·
email `congtam.trinh@gmail.com` · điện thoại `0939 979 890` (ưu tiên Zalo).

---

## 6. Cách chạy và kiểm tra

```bash
npm run dev      # http://localhost:3000
npm run build    # phải sạch TypeScript
npx eslint .     # phải sạch
npx tsc --noEmit # phải sạch
```

**Cơ sở dữ liệu (GĐ2).** Cần `.env.local` có `DATABASE_URL` (:6543) và
`DIRECT_DATABASE_URL` (:5432) — xem `.env.example`:

```bash
npx prisma migrate dev --name init   # lần đầu: tạo prisma/migrations/
npx prisma migrate deploy            # trên CI/Vercel
npx prisma studio                    # xem dữ liệu
cp prisma/cohorts.example.json prisma/cohorts.json   # rồi điền dữ liệu thật
npx tsx prisma/seed.ts               # upsert kỳ học, chạy lại được nhiều lần
```

> `prisma/cohorts.json` và `lib/generated/` **đã được gitignore** — file thứ nhất chứa link
> Zoom + Drive folder ID, file thứ hai sinh lại được lúc `postinstall`.

Chụp ảnh toàn trang ở nhiều khổ màn hình (script dùng Playwright có sẵn trong
`reference/.venv`, không cần cài thêm):

```bash
reference/.venv/bin/python - <<'PY'
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, w, h, dark in [("desktop",1280,900,False),("desktop-dark",1280,900,True),
                                 ("tablet",768,1024,False),("mobile",375,812,False)]:
            ctx = await b.new_context(viewport={"width":w,"height":h},
                                      color_scheme="dark" if dark else "light")
            pg = await ctx.new_page()
            await pg.goto("http://localhost:3000", wait_until="networkidle")
            await pg.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.dataset.shown='true')")
            await pg.wait_for_timeout(900)
            print(name, "overflow-x:",
                  await pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth"))
            await pg.screenshot(path=f"/tmp/{name}.png", full_page=True)
            await ctx.close()
        await b.close()
asyncio.run(main())
PY
```

**Lưu ý:** ảnh chụp qua Browser pane của Claude bị trắng khi trang đã cuộn — dùng
script Playwright ở trên thay vì công cụ đó.

Điểm cần soi mỗi lần sửa:
1. `overflow-x` phải bằng 0 ở cả bốn khổ.
2. Dấu tiếng Việt (ế, ữ, ọ, ằ) phải hiện đúng — nếu sai là thiếu subset `vietnamese` trong `next/font`.
3. Bật/tắt dark mode, không có màu nào chỉ được định nghĩa trong media query.
4. `/docs/cv.pdf` và `/docs/teaching-statement.pdf` trả 200.

---

## 7. Nhật ký phiên

### 2026-08-19 — Phiên 1: dựng toàn bộ trang
- Khảo sát `web-forge/` (là ảnh chụp + design token, **không phải mã nguồn** — điểm này
  từng gây hiểu nhầm) và toàn bộ `reference/site/`, kể cả đọc chữ trong hai ảnh poster.
- Chốt 4 quyết định ở mục 2 với người dùng.
- Dựng Next.js 16 + Tailwind v4 + TypeScript. Vì `create-next-app` không nhận tên thư mục
  có chữ hoa (`HDI-web`), phải scaffold ở thư mục tạm rồi chuyển vào.
- Viết 10 file trong `content/`, 5 primitive UI, 11 section, header, footer.
- Cắt ảnh chân dung từ poster khóa học (`PIL`, mask hình tròn, nền trắng) → `public/images/portrait.jpg`.
- **Sửa lỗi phát sinh:**
  - ESLint hết bộ nhớ vì quét `reference/.venv` → thêm `reference/**`, `web-forge/**` vào `globalIgnores`.
  - Lỗi hydration do script bootstrap thêm class `dark` trước khi React hydrate → `suppressHydrationWarning` trên `<html>`.
  - `react-hooks/set-state-in-effect` ở nút đổi theme → bỏ hẳn `useState`/`useEffect`, để CSS chọn icon theo class `.dark`.
  - `//` trong JSX bị đọc thành comment → bọc thành `{"// "}`.
- **Theo yêu cầu giữa phiên:** bỏ bảng màu cam của phần khóa học, đưa về một bảng màu
  chung; xóa luôn toàn bộ token `--warm-*` và nhánh `tone="warm"` trong `section.tsx`,
  `card.tsx`, `badge.tsx`; sắp lại nhịp nền `soft` của các section phía sau.
- Kiểm chứng: build sạch, eslint sạch, `overflow-x = 0` ở cả 4 khổ, PDF + ảnh trả 200,
  các link ngoài (forms.gle, linktr.ee, congtamtrinh.com) trả 200.
- Khởi tạo git, commit đầu tiên, push lên `https://github.com/tomtran-786/HDI-web.git`
  (nhánh `main`). `reference/` bị loại khỏi repo theo yêu cầu — repo chỉ 3.6 MB.
  `web-forge/` **vẫn được đưa lên** vì người dùng chỉ yêu cầu loại trừ `reference/`,
  và nó là nguồn ngôn ngữ thiết kế mà Plan.MD có tham chiếu tới.

### 2026-08-19 — Phiên 1 (tiếp): sự cố 404 khi deploy Vercel
- **Triệu chứng:** deploy lên Vercel xong truy cập vào bị 404.
- **Đã loại trừ:** clone sạch từ GitHub, chạy `npm ci` + `npm run build` đúng như Vercel
  làm → build thành công, sinh đúng route `/` với `index.html` 139 KB. Kiểm tra thêm
  phân biệt hoa/thường trong đường dẫn import (Linux nhạy cảm, macOS thì không) → không lỗi.
  Cảnh báo `npm warn allow-scripts unrs-resolver` trong log chỉ là cảnh báo của một
  dependency thuộc ESLint, không liên quan tới `next build`.
- **Nguyên nhân thật:** **Framework Preset trên Vercel bị đặt là "Other" thay vì "Next.js".**
  Khi đó Vercel chỉ serve file tĩnh từ thư mục gốc, không chạy Next.js runtime → mọi route 404.
- **Cách sửa:** đổi Settings → Build & Deployment → Framework Preset thành **Next.js**, rồi Redeploy.
- **Phòng ngừa:** thêm `vercel.json` với `"framework": "nextjs"` vào repo. Trường này trong
  `vercel.json` ghi đè cấu hình trên dashboard, nên nếu sau này tạo lại project hoặc ai đó
  đổi nhầm preset thì vẫn deploy đúng.

### 2026-08-20 — Phiên 2: học cách sắp xếp khóa học từ edubit

**Khảo sát `reference/edubit/`** (59 trang, 22 khóa + 10 combo). Phát hiện chính: cả 22
trang khóa học dùng **chung một template 4 khối cố định** — `Bạn sẽ học được gì` →
`Giới thiệu khóa học` → `Nội dung khóa học` → `Thông tin giảng viên`. Giáo trình là cây
hai tầng `MODULE n → bài 1.1, 1.2` render bằng widget (không sinh heading nào). Giá +
badge `-57%` đẩy lên thẻ ở trang danh sách. Combo là cơ chế phân tầng giá, luôn chứa
khóa "Training" làm sản phẩm mỏ neo.

**Đã lấy:** giáo trình có nhóm, và đưa học phí lên vị trí nổi bật.
**Không lấy:** trang chi tiết riêng cho từng khóa — edubit cần vì có 32 sản phẩm, HDI
chỉ có **một** khóa thật. Thay bằng **modal**, giữ nguyên kiến trúc landing page.

**Thay đổi:**
- `content/course.ts`: `course` → `courses: Course[]`; `syllabus` phẳng → `phases`
  (4 giai đoạn); tách `price` khỏi `facts`.
- `components/course-card.tsx` (mới): thẻ nền `bg-primary` có hover lift, click mở
  `<dialog>`. Dùng `<dialog>` + `showModal()` chứ không tự dựng overlay — được sẵn
  focus trap, Esc, khôi phục focus, và top layer nên không tranh z-index với header sticky.
- `components/sections/featured-course.tsx`: bỏ lưới 2 cột, còn `courses.map()`.
- `app/globals.css`: style nền cho `dialog` + `::backdrop`, khóa cuộn bằng
  `html:has(dialog[open])` (không cần JS).
- `content/about.ts` + `about.tsx`: thêm `honors` (Excellent research award, VNU-HCMC
  2023) và xếp hạng Deakin — hai dữ kiện thật trên poster mà trang chưa từng dùng.

**Bẫy đã gặp / cần nhớ:**
- `Card` trong `ui/card.tsx` hardcode `bg-card`; truyền `bg-primary` qua `className`
  sẽ phụ thuộc thứ tự CSS chứ không chắc thắng. Nên thẻ khóa học **không** dùng `Card`,
  mà dựng panel trực tiếp và mượn lại đúng class hover của `Card`.
- **Không bọc `Reveal` bên trong `<dialog>`.** `Reveal` bắn một lần bằng
  IntersectionObserver; dialog đóng là `display:none` nên phần tử sẽ kẹt ở `opacity: 0`.
- Số buổi phải chạy liên tục 1→8 xuyên qua 4 giai đoạn, không reset theo từng giai đoạn.
- Dev server giữ log lỗi cũ sau khi đổi tên export; `npm run build` mới là nguồn tin cậy.

**Kiểm chứng:** build + eslint sạch; `overflow-x = 0` ở cả 4 khổ **và** khi modal đang mở;
dialog nằm gọn trong viewport, tự cuộn bên trong (mobile 343×690, desktop 672×765);
Esc / click nền / nút đóng đều đóng, click vào ruột modal thì không; focus quay lại đúng
thẻ; token dark mode áp đúng vào dialog (`#14202f` / `#e9eff7`).

**Còn treo — cần Dr. Trinh xác nhận, không tự điền:**
- ~~Poster ghi grants *Nafosted (2023)*…~~ **Đã gỡ ở phiên 3** — xem bên dưới.
- Poster ghi ông phản biện cho *Finance Research Letters*; `about.ts.refereeFor` (lấy từ
  `cv.pdf`) liệt kê 4 tạp chí khác, không có tạp chí này. Bio trên edubit (nguồn thứ hai,
  do chính ông viết) liệt kê **đúng 4 tạp chí giống `cv.pdf`**, cũng không có FRL. Hai
  nguồn khớp nhau, poster là nguồn duy nhất lệch — vẫn cần xác nhận trước khi thêm.

---

### 2026-08-20 — Phiên 3: crawl nội dung 4 khóa edubit

**Đính chính kết luận của phiên 2.** Phiên 2 kết luận rằng nội dung khóa học của edubit
"nằm trong ảnh, không đọc được". **Sai.** Toàn bộ giáo trình nằm trong DOM, trong
accordion `Nội dung khoá học`. Bản crawl cũ không thấy vì `scrape_edubit.py` chỉ giữ
heading + 200 ký tự `meta_description` — đó là giới hạn của script, không phải của trang.

**Script mới:** `reference/scrape_edubit_courses.py` (crawl4ai + Playwright). Khác
`scrape_edubit.py` ở chỗ nó nhắm vào một số URL cụ thể và lấy toàn văn:
- `js_code` ép mở mọi `.collapse` / `[aria-expanded=false]` / `<details>` trước khi đọc DOM,
  vì accordion chỉ render con khi mở;
- `delay_before_return_html=3.0` để widget kịp dựng;
- đọc theo **từng block** (`p`, `li`, `h*`…) chứ không `body.get_text()` một lần —
  cách sau dính các dòng không liên quan vào nhau.
- Kết quả: `reference/edubit/courses/{slug}.json|.md` + `summary.md`, 15k–21k ký tự/trang.

**Ai dạy khóa nào (quan trọng — trang không hiển thị điều này):**

| khóa | giảng viên thật trên edubit |
|---|---|
| `stata` | TS. Trịnh Công Tâm — **giảng viên duy nhất**, cả 5 module |
| `spss` | PGS.TS. Phương Hữu Từng + TS. Trịnh Công Tâm (module 3, 4) |
| `tap-chi` | Phương Hữu Từng + Dương Công Doanh + Trịnh Công Tâm (module 4, 5) |
| `nckh-sinh-vien` | ThS. Đặng Văn Phong — **Dr. Trinh không dạy phần nào** |

> Chủ trang đã được cảnh báo rõ và vẫn quyết định đưa cả 4 khóa lên dưới tên
> Dr. Cong Tam Trinh, tinh chỉnh sau. Bảng trên được chép nguyên vào comment đầu
> `content/course.ts` để lần chỉnh sau còn truy được nguồn.

**Thay đổi:**
- `content/course.ts`: thêm 4 khóa (tổng 5), thêm field `curriculum`, thêm `coursesIntro`.
- `components/course-card.tsx`: thêm prop `variant` (`filled` / `outline`), tách
  `phaseLabel()`, đánh số theo `curriculum`. Thẻ giờ tự hiển thị tên khóa của nó.
- `components/sections/featured-course.tsx`: tiêu đề section chuyển sang `coursesIntro`
  (không còn mượn tiêu đề của khóa đầu tiên), lưới `md:grid-cols-2`, khóa đầu `md:col-span-2`.

**Đã gỡ được một điểm treo:** bio của Dr. Trinh trên edubit ghi rõ NAFOSTED là đề tài
**riêng biệt** với các grant IU–VNU ("*In addition,* he is also the principal investigator
of a number of grants funded by VNU-HCMC and International University"), tên đề tài
*"Culture, pandemic, and socio-economic outcomes: An international analysis and Vietnam's
applications"*, dẫn nhóm Úc – Đài Loan – Việt Nam. **Chỉ số US$37,300 không bị ảnh hưởng.**
Bio đó còn có: *Review of Income and Wealth* (Q1, IF 2.0), *International Review of
Financial Analysis* (Q1, IF 9.8, forthcoming), Editorial Board *Eurasian Economic Review*,
15 hội thảo quốc tế tại 10 nước. **Chưa đưa vào trang** — chờ quyết định riêng.

**Gotcha:**
- Thẻ `outline` nằm dưới màn hình nên `Reveal` chưa bắn → chụp ảnh phần tử ra trong suốt.
  Muốn chụp phải ép `document.querySelectorAll('.reveal').forEach(e=>e.dataset.shown='true')`.
- Bỏ tiêu đề khóa khỏi `SectionHeading` mà quên thêm vào thẻ `filled` thì khóa chủ lực
  mất luôn tên. Đã sửa: cả hai variant đều tự render `eyebrow` + `title` + `audience`.

**Kiểm chứng:** build + eslint + `tsc --noEmit` sạch; `overflow-x = 0` ở 375 / 768 / 1280,
cả khi modal mở; modal lớn nhất (tạp chí, 38 dòng) vừa viewport mobile 343×690 và tự cuộn
bên trong; Esc / nút đóng đóng được, click ruột modal thì không; focus quay lại đúng thẻ;
`html { overflow: hidden }` bật/tắt đúng; đánh số đúng hai kiểu (`Buổi 1…8` cho khóa chủ
lực, `1.1…6.7` cho 4 khóa module); token dark mode đúng (`#14202f` / `#e9eff7`).

**Còn treo:** `registerNote` của 4 khóa mới đang là câu chung chung, vì chưa biết Google
Form có mục chọn tên khóa hay không. Cần mở form kiểm tra rồi thay bằng tên mục thật
(khóa chủ lực dùng `"Research Class (Advanced)"`, lấy từ poster).

### 2026-08-20 — Phiên 3 (tiếp): gộp kiểu thẻ, dời lộ trình, thêm sắp xếp

Theo yêu cầu chủ trang, ba thay đổi ở `#khoa-hoc`:

1. **Bỏ variant `filled`.** Thẻ khóa chủ lực từng có nền `bg-primary` chạy hết chiều
   ngang; giờ cả 5 thẻ dùng chung kiểu viền. `CourseCard` không còn prop `variant`, object
   `variants` và hàm `phaseLabel()` bị xóa hẳn (chỉ dùng cho lộ trình trên thẻ).
2. **Lộ trình rời khỏi thẻ, chỉ còn trong modal.** Thẻ gọn lại: tên khóa · đối tượng ·
   học phí · `facts` · link "Xem lộ trình chi tiết".
3. **Thêm sắp xếp theo giá** — xem mục 4.

**Gotcha:** `courses` là mảng import từ module. `.sort()` mutate tại chỗ, nên phải
`[...courses].sort(...)`; nếu không, chọn "Giá cao → thấp" một lần là thứ tự biên tập gốc
mất vĩnh viễn cho tới khi reload.

**Kiểm chứng:** build + eslint + `tsc --noEmit` sạch; 5 thẻ cùng một `background-color`;
`LỘ TRÌNH` không còn trong thẻ; sắp xếp đúng cả 3 chiều và quay lại đúng thứ tự biên tập
khi bấm "Mặc định"; modal vẫn giữ đủ hai kiểu đánh số (`Buổi 1…8` / `1.1…5.3`), Esc đóng,
focus quay lại thẻ, `html { overflow: hidden }` bật/tắt đúng; `overflow-x = 0` ở
375 / 1280, cả sáng lẫn tối.

---

### 2026-08-20 — Phiên 3 (tiếp): GĐ0 của kế hoạch tối ưu luồng đăng ký

Kế hoạch đầy đủ (GĐ0–GĐ4) ở `~/.claude/plans/b-t-u-phi-n-m-i-twinkly-karp.md`.
**Phiên này chỉ làm GĐ0** — phần không cần backend và không cần dữ liệu từ Dr. Trinh.

**1. Sửa nhãn nút lệch kỳ vọng.** `grep` phát hiện 7 CTA cùng trỏ `links.register` nhưng
6 chỗ ghi *"Đăng ký tư vấn (miễn phí)"*, riêng `course-card.tsx` — chỗ ý định mua cao nhất —
ghi **"Đăng ký khóa học"**. Người vừa đọc học phí 1.100.000đ và còn cân nhắc sẽ không bấm một
nút nghe như cam kết đóng tiền. Đổi thành *"Đăng ký tư vấn khóa này"*. Giờ cả 10 link tới form
đều nói "tư vấn".

**2. Zalo deep link.** `contact.phoneNote` bảo *"Ưu tiên liên hệ qua Zalo"* nhưng trang chỉ có
`tel:` — người dùng phải tự copy số, mở app, tìm. Thêm `links.zalo` (cùng số với
`contact.phoneHref`), đặt ở `#lien-he` và **song song** với nút form trong cả 5 modal. Đây là
đường thoát cho nhóm sẽ không bao giờ điền form; với Zalo là kênh chính, nhóm này không nhỏ.
Thêm `IconMessage` vào `components/ui/icons.tsx`.

**3. Tách "Thời lượng" thành "Lớp trực tiếp" / "Kho record" / "Xem lại".**
Con số edubit in là **kho record tích lũy qua nhiều kỳ**, không phải độ dài khóa:

| | edubit in | Thực tế một kỳ live |
|---|---|---|
| Stata | 47 giờ 29 phút | ~10–11h (5 module) — K1 11h20 · K2 11h05 · K3 10h26 · K4 6h15 |
| Tạp chí | 60 giờ 44 phút | ~15h (6 module) — K12 14h08 · K13 15h29 · K14 15h42 |

Ghi `Thời lượng: 47 giờ 29 phút` khiến người đọc tưởng khóa dài 47 tiếng. Tách ra vừa đúng
hơn vừa **bán tốt hơn** — "được cả kho record các kỳ trước" là quyền lợi thật đang bị chôn.
Lý do đầy đủ đã chép vào comment đầu `content/course.ts`.

> Khóa chủ lực `viet-bao-cao-khoa-hoc` **giữ nguyên** `facts` cũ: poster không nói gì về
> record, thêm vào là bịa.
>
> Khóa SPSS **không** ghi sĩ số 40 — trang edubit của khóa đó không có con số này, khác với
> Stata và tạp chí. Không suy diễn từ khóa khác sang.

**4. Dựng sẵn khối "Kỳ tới" (`CourseCohort`), chưa có dữ liệu.** Mô hình cohort sống bằng
khan hiếm mà trang không có một chữ nào về ngày khai giảng. Type + phần render đã xong, field
`cohort?` **tùy chọn** nên chưa khóa nào hiển thị gì — theo đúng quy tắc mục 3, không bịa
ngày tháng. Khi Dr. Trinh đưa lịch thật thì chỉ cần thêm data, không phải sửa component.
`conLai` cũng để tùy chọn: *"còn 3/40 chỗ"* thì bán được, *"còn 38/40"* thì phản tác dụng.

**Gotcha:** đã kiểm nhánh render `cohort` bằng cách **tạm** thêm dữ liệu giả, chụp ảnh xác
nhận (sáng + tối), rồi **gỡ ra và kiểm lại** là chuỗi `KIỂM THỬ` / `10/09/2026` không còn
trong HTML. Đừng ship một nhánh render chưa từng thấy chạy.

**Kiểm chứng:** `tsc --noEmit` + eslint + build sạch; 10/10 nhãn CTA nói "tư vấn"; 6 link
`zalo.me` đúng số; `facts` của 4 khóa tách đúng và khóa chủ lực không đổi; khối `cohort` render
đúng khi có data và **ẩn hoàn toàn** khi không; modal vẫn Esc-đóng, click ruột không đóng,
focus quay lại thẻ, scroll lock bật/tắt đúng; `overflow-x = 0` ở 375 / 1280, sáng và tối.

**Chưa làm (chặn bởi dữ liệu, không phải bởi code):** prefill Google Form và bật
Responses → Link to Sheets — cần Dr. Trinh gửi *pre-filled link* và xác nhận form có đủ tên
5 khóa. Xem bảng "Cần Dr. Trinh cung cấp / quyết định" trong file kế hoạch.

---

### 2026-08-20 — Phiên 4: GĐ1 — đo phễu

Mục tiêu của giai đoạn này là **đo trước khi xây**: GĐ2 (auth + DB + dashboard) tốn 4–5
ngày, và nếu không có số liệu nền thì sau đó không cách nào biết nền tảng mới có thật sự
cải thiện chuyển đổi hay không.

**Thay đổi:**
- `npm i @vercel/analytics` (2.0.1); `<Analytics />` vào `app/layout.tsx`.
- `lib/analytics.ts` (mới) — 3 event + union `CtaSource`. Chi tiết ở §4.
- `components/ui/cta-link.tsx` (mới) — thay **cả 9** link ra ngoài (7 Form + 2 Zalo).
- `components/course-card.tsx` — `showModal()` kèm `trackCourseModal(course.slug)`.
- `components/course-list.tsx` — `setSort` kèm `trackCourseSort(key)`, **bỏ qua khi bấm lại
  đúng pill đang active** (bấm lại không phải là đổi ý; đếm vào sẽ thổi phồng event).
- `components/site-footer.tsx` — link đăng ký nằm trong mảng `documents` render qua
  `FooterColumn`, nên `FooterColumn` giờ nhận `cta?: CtaSource` **thay cho** `href` và
  render `CtaLink` cho mục đó. Dấu `↗` và class giữ nguyên, giao diện không đổi.

**Bẫy đã gặp / cần nhớ:**
- Bỏ `links.register` khỏi `site-header.tsx` làm import `links` thành **unused** → eslint
  fail. Đổi call site thì phải dọn luôn import ở cùng file.
- Cả hai đích đều mở tab mới (`target="_blank"`), nên handler `onClick` kịp chạy và beacon
  kịp rời trang — **không cần** `sendBeacon` hay `e.preventDefault()` rồi tự điều hướng.
- Không gửi `khoa: ""` cho CTA ngoài modal. Chuỗi rỗng tạo một nhóm riêng trong dashboard
  nằm lẫn với các slug thật; dùng spread có điều kiện để **bỏ hẳn** thuộc tính đó.
- Muốn kiểm CTA ở local mà không bị mở 9 tab: gắn một listener capture trên `document`
  gọi `preventDefault()` cho `a[target="_blank"]`. React vẫn chạy `onClick` (nó nghe ở
  pha bubble tại root), chỉ hành vi điều hướng mặc định bị chặn.
- Console của Vercel Analytics **cắt bớt** object payload, nhìn không thấy thuộc tính. Muốn
  đọc đủ thì tạm bọc `console.log` và `JSON.stringify` cái arg có field `sdkn`.

**Kiểm chứng:** `tsc --noEmit` + eslint + build sạch. Bấm thử toàn bộ ở local:
đúng **9 event `bam-cta`** với 9 cặp `nguon`/`dich` **khác nhau** (7 `form` + 2 `zalo`),
`mo-lo-trinh` mang đúng slug khóa, `doi-sap-xep` mang đúng `kieu` — và bấm lại pill đang
active **không** sinh event thứ hai. Không hụt link nào: vẫn đúng **10 link `forms.gle` +
6 link `zalo.me`** như phiên 3, tất cả đều còn `target="_blank"` + `rel="noopener"`.
`overflow-x = 0` ở 375 / 768 / 1280, sáng và tối, và khi modal đang mở; Esc vẫn đóng,
focus vẫn quay lại thẻ, `html { overflow: hidden }` vẫn bật/tắt đúng; footer không đổi
hình.

**Còn lại (thủ công, không phải code):** bật Web Analytics trong dashboard Vercel.

---

### 2026-08-20 — Phiên 5: GĐ2 — nền tảng học viên (nhánh `feat/gd2-nen-tang`)

**Chủ trang chốt: HDI tách khỏi edubit**, và chỉ định lấy `/Users/tranvomanhtuan/portfolio-app`
("Chemistery Academy" — app bán khóa học **đang chạy tiền thật**) làm repo nguồn cho phần
CSDL + thanh toán. Bốn quyết định kèm theo: làm trên nhánh mới trong HDI-web · HDI **đã có
pháp nhân + MST** nên GĐ3 dùng PayOS · ban đầu **chỉ đăng nhập Google OAuth** · ship hai
nhịp, nhịp này chỉ GĐ2 (tiền vẫn thu tay). Quyết định đăng nhập được mở rộng ngày
2026-08-21: thêm email/mật khẩu có xác minh và khôi phục tài khoản, vẫn dùng Auth.js.

**Đã dựng:** `lib/prisma.ts` · `lib/auth.ts` · `lib/admin.ts` · `lib/courses.ts` ·
`prisma/schema.prisma` + `seed.ts` · `prisma.config.ts` · `/dang-nhap` · `/tai-khoan` ·
`/quan-tri` · `app/api/auth/[...nextauth]`. Header/footer chuyển từ `page.tsx` lên
`layout.tsx`. `.env.example`. `vercel.json` thêm `regions: ["icn1"]`.

**Rủi ro lớn nhất đã gỡ.** Repo nguồn ghim `next-auth@5.0.0-beta.25` cho Next 15 kèm
`.npmrc legacy-peer-deps` và `overrides.next-auth.next`. HDI-web chạy Next **16**. Tra
registry trước khi cài: `next-auth@beta` nay là **beta.32**, peer
`next: ^14 || ^15 || ^16`. Cài sạch, **không cần** hai bản vá đó — chúng là vết sẹo của repo
nguồn, không phải yêu cầu. Đừng chép mù.

**Quyết định lệch có chủ đích so với repo nguồn:**

| | repo nguồn | HDI-web | vì sao |
|---|---|---|---|
| Session | JWT + cột `sessions_valid_after` + tra DB mỗi 5 phút | **`strategy: "database"`** + PrismaAdapter | JWT không thu hồi được từ server nên họ phải *giả lập*. Xóa một row thì đơn giản và đúng thật. Giá: 1 query/request — không đáng kể ở quy mô này |
| Migration | `db push` + SQL rời ở `scripts/db/` | **`prisma migrate`** | Ở repo nguồn, `generate_invoice_number()` tồn tại trong DB nhưng **không có trong repo** → dựng lại DB từ số 0 là hỏng thầm lặng |
| Tên cột | snake_case tiếng Việt (`ten`, `ngay_sinh`) | camelCase tiếng Anh, `@@map` tên bảng | Adapter của Auth.js ép hình dạng 4 bảng đầu; trộn hai quy ước trong một schema còn tệ hơn |
| Quyền admin | — | env `ADMIN_EMAILS` | Một admin, không cần UI vai trò, và allowlist không leo thang được từ dữ liệu trong DB |

**Bẫy đã gặp / cần nhớ:**
- **Server action là endpoint POST độc lập.** Guard ở `layout.tsx` bảo vệ *trang*, không bảo
  vệ action. Ai có cookie hợp lệ + action id là gọi được. Nên `lib/admin.ts` có
  `requireAdmin()` và **mọi** admin action gọi nó trước.
- **`await auth()` trong `layout.tsx` gốc sẽ giết static render của cả `/`.** Nó đọc cookie →
  toàn bộ route thành dynamic. Dùng `<SessionProvider>` + `useSession()` ở header thay vì đọc
  session phía server. Kiểm bằng output của `next build`: `/` phải còn dấu `○ (Static)`.
- **`prisma.enrollment.findMany({ include: { cohort: true } })` là chỗ rò link Zoom.** Nó kéo
  cả `meetingUrl`/`driveFolderId` vào dữ liệu dù JSX không render. `/tai-khoan` dùng **hai
  truy vấn**: truy vấn 1 không hề có hai cột đó; truy vấn 2 chỉ chạy cho cohort mà học viên
  `paid` và còn hạn.
- **`requiredSecret()` ném lỗi lúc nạp module ⇒ `npm run build` cũng cần `AUTH_SECRET`.**
  Không có `.env.local` thì build fail ở bước "Collecting page data". Đúng ý đồ fail-loud,
  nhưng phải biết trước.
- **Typed routes của Next 16:** viết `layout.tsx` cho route chưa có `page.tsx` thì
  `tsc` báo `Type '"/quan-tri"' does not satisfy the constraint 'LayoutRoutes'`. Tạo `page.tsx`
  rồi build lại là hết.
- **ESLint chặn `<a href="/...">`** (`@next/next/no-html-link-for-pages`). Header phải dùng
  `next/link`. Link ngoài (`forms.gle`, `zalo.me`) thì `<a>` vẫn đúng.
- `nav` trong `content/site.ts` đổi từ `#khoa-hoc` sang **`/#khoa-hoc`** — header giờ render
  cả ở `/tai-khoan`, hash trần sẽ trỏ vào chính route đó.

**Kiểm chứng đã làm:**
- `tsc --noEmit` + `eslint` + `build` sạch. `next build` xác nhận `/` **vẫn `○ (Static)`**.
- **`/` pixel-identical sau refactor**: diff ảnh full-page 1280 sáng/tối và 768 → *IDENTICAL*;
  375 lệch **137 px với delta tối đa 2/255** (nhiễu khử răng cưa, không phải thay đổi thật).
- `overflow-x = 0` ở 375 / 768 / 1280, sáng và tối, cả trên `/dang-nhap`.
- GĐ1 không hỏng: event `bam-cta` / `mo-lo-trinh` vẫn bắn đúng; vẫn đúng **10 link
  `forms.gle` + 6 link `zalo.me`**; đúng một `<header>`, một `<main>`, một `<footer>`.
- **Chưa đăng nhập vào thẳng `/tai-khoan` và `/quan-tri` → `307` về `/dang-nhap`** (kiểm bằng
  `curl`, không phải bằng mắt). Không cần DB — `auth()` không có cookie thì không truy vấn.
- Audit `grep`: `meetingUrl`/`driveFolderId` chỉ xuất hiện ở truy vấn thứ hai của
  `/tai-khoan` và ở `/quan-tri` (nơi chỉ render boolean "đã có / chưa có").

**Bổ sung cùng phiên — sau khi chủ trang gắn MCP Supabase:**

Gắn MCP xong mới nhìn được vào project, và phát hiện **một lỗ hổng mà kế hoạch đã bỏ sót**.

> ⚠️ **Supabase có CỬA THỨ HAI vào cùng những bảng đó: PostgREST.**
> Supabase phục vụ toàn bộ schema `public` qua REST API mà **anon key** gọi được — mà anon
> key vốn được thiết kế để công khai. Đã kiểm: `anon` và `authenticated` có `USAGE` trên
> `public`. Toàn bộ thiết kế "hai truy vấn" ở `/tai-khoan` chỉ bảo vệ đường đi qua Prisma;
> nếu không khóa PostgREST thì `cohorts.meeting_url` chỉ cách internet **một request**.

**Đã khóa** bằng migration `20260820120100_lock_down_postgrest`: bật RLS trên cả 6 bảng
(**không** `FORCE` — chủ bảng bỏ qua RLS của chính nó nên Prisma chạy y nguyên), **không tạo
policy nào**, và `REVOKE ALL` của `anon` + `authenticated` trên bảng/sequence/function, kèm
`ALTER DEFAULT PRIVILEGES` cho bảng sinh sau.

> **Đừng "sửa" cảnh báo `rls_enabled_no_policy`.** `get_advisors` báo 7 dòng INFO đúng kiểu
> đó — và đó chính là trạng thái mong muốn: app này không bao giờ dùng PostgREST, nên
> *không policy nào* nghĩa là *không ai vào được*. Thêm policy là mở lại cửa.

**Đổi thêm: mọi cột giờ là lowercase snake_case qua `@map`.** Ban đầu định dùng camelCase
(mục 4 kế hoạch GĐ2). Nhưng adapter của Auth.js bind theo **tên field Prisma**, không phải
tên cột — nên `@map` cho cả hai thứ cùng đúng: field vẫn `providerAccountId`, cột là
`provider_account_id`. Tránh được identifier mixed-case phải quote vĩnh viễn trong Postgres.
32 `@map`, code ứng dụng **không đổi một dòng nào** (`tsc` sạch ngay sau đó).

**Đã chạy thật trên DB (project `szzspwwjapxnxskgeyww`, region Seoul):**
- Hai migration đã áp; `prisma/migrations/` giờ **có thật trong repo** — dựng lại DB từ số 0
  chỉ cần `migrate deploy`.
- Ghi sẵn hai dòng vào `_prisma_migrations` kèm **checksum SHA-256 đúng của file**, để lần
  đầu chạy `prisma migrate status` báo sạch chứ không đòi reset.
- Kiểm ràng buộc bằng SQL, có dữ liệu giả rồi **xóa sạch** (DB hiện 0 dòng ở mọi bảng):
  ghi danh trùng `(user, cohort)` → bị `@@unique` chặn ✅ · xóa cohort còn ghi danh → bị
  `ON DELETE RESTRICT` chặn ✅ · xóa user → ghi danh cascade theo ✅.
- `get_advisors(security)` → **không có ERROR/WARN**, chỉ 7 INFO nói trên.

> Có **hai** project Supabase trong tài khoản: `szzspwwjapxnxskgeyww` (HDI-web) và một
> project **Chemistery — production, tiền thật**. Mọi thao tác chỉ được nhắm vào project
> đầu; mã project của Chemistery cố ý không ghi ở đây vì repo này công khai và đó là hạ
> tầng của một hệ thống khác.

**Kiểm chứng runtime — chủ trang đã điền mật khẩu DB + thông tin Google OAuth, đã chạy hết:**

- `prisma migrate status` → **"Database schema is up to date!"**. Checksum ghi tay khớp, CLI
  đi đúng session pooler `:5432`.
- **Cấu hình Google OAuth đúng.** `POST /api/auth/signin/google` dựng đúng URL
  `accounts.google.com/o/oauth2/v2/auth` (`response_type=code`, `scope=openid profile email`,
  PKCE `S256`, `redirect_uri=http://localhost:3000/api/auth/callback/google`), và Google trả về
  **trang đăng nhập thật** với **0** dấu hiệu `redirect_uri_mismatch` / `invalid_client` /
  `deleted_client`. *(Bước gõ mật khẩu Google phải do người thật làm — Claude không nhập
  thông tin đăng nhập.)*
- **Bộ khung kiểm thử không cần mật khẩu Google:** session của Auth.js kiểu `database` chỉ là
  một dòng trong bảng `sessions` + cookie `authjs.session-token`. Tự tạo session trong DB là
  đủ để kiểm toàn bộ hành vi sau đăng nhập. Ghi lại đây vì lần sau sẽ cần lại.

**Kết quả — cùng một học viên, cùng một URL `/tai-khoan`, chỉ đổi `status`:**

| trạng thái | canary trong HTML |
|---|---|
| `pending` | **0** ✅ |
| `paid` | **1** ✅ (hiện nút "Vào lớp" + "Kho record") |
| `cancelled` + `access_revoked_at` | **0** ✅ |

Cohort thử được nhồi hai chuỗi không thể nhầm (`CANARY-MEETING-URL`,
`CANARY-DRIVE-FOLDER-ID`) rồi `grep` toàn bộ HTML 34 KB — đây là **lần kiểm quan trọng nhất
của ship này** và nó đạt.

Các mục còn lại, tất cả đều đạt:
- Chặn route: không session → `307 /dang-nhap` · học viên thường vào `/quan-tri` →
  `307 /tai-khoan` · admin trong `ADMIN_EMAILS` → `200`.
- **Cách ly giữa học viên:** tạo học viên thứ hai đã `paid` cùng kỳ → học viên thứ nhất
  **không** thấy dòng nào của người kia, đúng 1 thẻ được render.
- **Server action `markPaid` chạy thật** (bấm nút trên trình duyệt, không phải SQL):
  `status=paid`, `paid_at` được đặt, `access_expires_at` = **đúng 730 ngày** lấy từ
  `cohort.accessDays`. Đây chính là đường mà webhook GĐ3 sẽ đi.
- `/quan-tri` hiển thị "✓ Link lớp / ✓ Drive" mà **không in giá trị** — grep canary = 0.
- `overflow-x = 0` trên `/tai-khoan` ở 375 / 1280, sáng và tối. Header tự đổi CTA sang
  "TÀI KHOẢN" khi đã đăng nhập.
- Dev server **không có lỗi nào** trong suốt lượt kiểm.
- **Đã dọn sạch toàn bộ dữ liệu thử** — mọi bảng về 0 dòng, chỉ còn 2 dòng `_prisma_migrations`.

> `.env.local` đã được tạo sẵn với **`AUTH_SECRET` thật (random)** và placeholder
> `<MAT_KHAU>` cho hai chuỗi Supabase. File đã gitignore. Điền mật khẩu vào là chạy được.

---

### 2026-08-20 — Phiên 5 (tiếp): bỏ Google Form, thêm hồ sơ học viên, bỏ duyệt tay

Chủ trang xem bản chạy thật rồi đưa 4 yêu cầu. Ba cái đã làm xong trong phiên này.

**1. Chưa có cổng đăng nhập.** Đúng — `/dang-nhap` tồn tại nhưng **không có link nào trỏ
tới**, học viên cũ phải tự gõ URL. Thêm "Đăng nhập" ở header (desktop + mobile) và ở cột
"Khám phá" của footer.

**2. Bỏ duyệt tay, chỉ webhook xác nhận.** Xóa hẳn nút "Đánh dấu đã thanh toán" và hàm
`markPaid`. Thay bằng `lib/enrollment.ts` → `confirmEnrollment()`: **đường duy nhất** để một
ghi danh thành `paid`, và webhook GĐ3 sẽ gọi đúng hàm đó.

> Giữ `markCancelled` — hủy/hoàn tiền không phải việc của webhook.
>
> ⚠️ Đã cảnh báo và chủ trang vẫn quyết: **không còn cách nào xử lý ca "tiền về nhưng sai nội
> dung chuyển khoản"** ngoài sửa tay trong CSDL. Đây là ca hay gặp nhất trong thực tế. Khi làm
> GĐ3 nên dựng hàng chờ đối soát, đó là chỗ đúng để giải quyết — không phải một nút duyệt chạy
> song song với webhook.

**3. Lấy thông tin đăng ký từ Google Form vào app.** Form gốc hỏi 4 mục: Họ tên · Email ·
SĐT · Giai đoạn. Google cho sẵn hai mục đầu, nên chỉ cần hỏi hai mục sau.
- `ResearchStage` enum — **chép nguyên 5 lựa chọn của form**, cùng thứ tự, để câu trả lời
  trước và sau khi đổi vẫn là cùng một câu hỏi. Nhãn ở `content/account.ts`.
- `/hoan-tat-ho-so` — hỏi SĐT + giai đoạn, hiện tên/email của Google ở dạng chỉ đọc.
- `app/tai-khoan/layout.tsx` chặn: hồ sơ chưa đủ → đẩy sang `/hoan-tat-ho-so`; đã đủ mà vào
  lại trang đó → đẩy về `/tai-khoan` (không tạo ngõ cụt).
- `isProfileComplete()` **suy ra** từ dữ liệu chứ không có cột cờ riêng — có cột cờ thì tài
  khoản bị xóa SĐT sau đó vẫn tính là đủ và lặng lẽ bỏ qua form.

**4. Google Form rời khỏi toàn bộ CTA.** Theo mô tả của chủ trang: nút *tư vấn* → mục liên hệ
(Zalo/email/điện thoại); nút *đăng ký* → tài khoản.

| Vị trí | Trước | Sau |
|---|---|---|
| hero · chương trình · header · footer | → `forms.gle` | → `/#lien-he` |
| modal khóa học | "Đăng ký tư vấn khóa này" → form | **"Đăng ký học khóa này"** → `/dang-nhap` |
| mục liên hệ | có link "Hoặc điền form…" | **bỏ** — mục này *chính là* kênh tư vấn |

`CtaTarget` đổi từ `"form" \| "zalo"` thành `"tu-van" \| "zalo" \| "dang-ky"`. **Đổi type là
cách tìm ra hết chỗ phải sửa** — `tsc` chỉ đúng cả 7 call site, không phải grep tay.
`links.register` đổi tên thành `links.legacyForm`, không còn nơi nào render (giữ lại vì form
vẫn chứa phản hồi cũ chưa export).

**Bẫy đã gặp:**
- **`prisma generate` xong phải khởi động lại dev server.** `tsc` đọc type mới từ đĩa nên
  sạch, trong khi tiến trình Next đang chạy vẫn giữ client cũ → `Unknown field 'stage'` lúc
  runtime. Type sạch mà app 500 là dấu hiệu của đúng chuyện này.
- **Server action trả lỗi thì form bị xóa trắng.** `defaultValue` đọc từ DB (vẫn rỗng), nên
  sai một ký tự số điện thoại là mất cả lựa chọn giai đoạn. Sửa: `ProfileState` mang ngược
  `phone`/`stage` đã nhập về, form ưu tiên giá trị đó.
- Enum không được nhận thẳng chuỗi từ client — `saveProfile` đối chiếu với `stages` trước khi
  ghi.

**Kiểm chứng:** `tsc` + eslint + build sạch, `/` vẫn `○ (Static)`.
- Tài khoản mới (phone/stage NULL) vào `/tai-khoan` → `307 /hoan-tat-ho-so` ✅; điền xong →
  về `/tai-khoan` ✅; vào lại `/hoan-tat-ho-so` → `307 /tai-khoan` ✅.
- SĐT sai → lỗi tiếng Việt hiện ra **và giữ nguyên cả hai ô đã nhập** ✅.
- `"0939 979 890"` lưu xuống DB thành `0939979890` (chuẩn hóa) + `stage=phd_research` ✅.
- Trang chủ: **`forms.gle` = 0** · `/#lien-he` = 6 · `/dang-nhap` = 7 · `zalo.me` = 6 (không đổi).
- 8 event GĐ1 vẫn bắn đúng với `dich` mới: `tu-van` / `zalo` / `dang-ky`.
- `overflow-x = 0` ở 375 / 1280, sáng và tối. Đã dọn sạch dữ liệu thử.

**Chưa làm — yêu cầu số 4 của chủ trang:** cơ chế **giỏ hàng + đơn hàng**. Xem mục 8.

---

### 2026-08-20 — Phiên 5 (tiếp): GĐ3 — giỏ hàng và đơn hàng (yêu cầu #4)

Làm phần **không phụ thuộc nhà cung cấp** trước, đúng như đã chốt: chưa có tài khoản
PayOS, nên xây tất cả những gì PayOS *sẽ cắm vào*, và kiểm được ngay hôm nay.

**Trước khi thêm gì: sửa một lỗi đã nằm sẵn trong repo.** Migration
`20260820095355_add_user_stage` sắp xếp **trước** `20260820120000_init`, mà nó lại
`ALTER TABLE "users"` — dựng DB từ số 0 sẽ hỏng ngay câu lệnh đó. Đúng điều §Kiểm chứng
mục 11 hứa là làm được. Đã gộp cột `stage` + enum vào `init` và xoá migration lạc.
DB đang 0 dòng nên không mất gì; `prisma migrate reset` bị Prisma chặn (nó phát hiện
agent gọi và bắt buộc phải hỏi người dùng — hợp lý), nên sửa bằng cách cập nhật
`_prisma_migrations` rồi `migrate deploy`.

**Giỏ hàng nằm ở cookie, không ở CSDL.** Cookie chỉ chứa **danh sách id kỳ học** — không
giá, không tổng tiền, không user id. Nhờ vậy sửa cookie bằng tay chỉ đổi được *có gì
trong giỏ*, không đổi được *giá bao nhiêu*: mọi con số đều tính lại từ DB ở bước đặt
đơn. Cũng vì thế không cần bảng giỏ hàng, không cần dọn giỏ bỏ quên, và người **chưa
đăng nhập vẫn có giỏ** — chỉ tới lúc đặt đơn mới cần tài khoản.

Phía trình duyệt dùng `useSyncExternalStore` chứ không `useState` + `useEffect`:
giỏ hàng thật sự sống ngoài React (server xoá cookie khi đặt đơn xong), và
`useSyncExternalStore` xử lý luôn hydration — render "server snapshot" rỗng trước nên
markup khớp, rồi mới đổi sang giá trị thật. Bản đầu viết bằng `setState` trong effect
và ESLint chặn đúng chỗ đó.

**Giữ chỗ là một `Enrollment` ở trạng thái `pending`**, tạo cùng lúc với đơn. Nghĩa là
đúng một chỗ trong mã lật `pending → paid`, và `confirmEnrollment()` viết ở phiên trước
không phải sửa gì. Đếm chỗ tính cả `pending`, nếu không thì chỗ cuối cùng của lớp bị bán
hai lần.

**Không bán quá chỗ.** `createOrder` mở transaction bằng
`SELECT … FROM cohorts WHERE id = ANY(...) ORDER BY id FOR UPDATE`. Không có khoá đó,
hai người mua chỗ cuối cùng cùng đọc "đã lấy 1/2" và cùng thành công. Khoá **theo thứ tự
id** để hai giỏ hàng giao nhau không kẹt cứng lẫn nhau.

**Đơn mới hết hạn sau 2 giờ.** Một đơn `pending` giữ chỗ; trước khi bán chỗ, checkout đối
soát đơn cũ với PayOS và chỉ nhả chỗ khi provider xác nhận link đã hết hạn, bị huỷ hoặc
không tồn tại. Trạng thái paid/processing/underpaid và lỗi kết nối đều giữ chỗ (fail
closed). `expireStaleOrders()` trong cron Vercel chỉ là housekeeping có giới hạn; tính
đúng không phụ thuộc lịch cron mỗi ngày. Route cron xác thực Bearer theo thời gian hằng,
sai secret trả **404** chứ không 401.

**Mã đơn là `SERIAL` bắt đầu từ 100001**, không phải cuid: PayOS bắt `orderCode` là số
nguyên, duy nhất vĩnh viễn, và ô nội dung chuyển khoản thì ngắn. Bản đầu viết
`@default(dbgenerated("nextval(...)"))` — sai, vì `migrate diff` liên tục đòi **drop
chính cái sequence** cột đó đang dùng. `autoincrement()` để Prisma tự quản, migration
chỉ `ALTER SEQUENCE … RESTART WITH 100001`.

`OrderItem.enrollment_id` **cố ý không unique**: ghi danh đã huỷ được dùng lại khi học
viên đặt lại kỳ đó, nên cùng một ghi danh xuất hiện hợp lệ trên dòng đơn cũ lẫn dòng đơn
mới. Bản đầu để `@unique` và luồng "đơn quá hạn rồi đặt lại" sẽ vỡ.

**Ba bảng mới cũng phải khoá PostgREST.** `ALTER DEFAULT PRIVILEGES` ở migration trước lo
phần GRANT, nhưng RLS bật theo từng bảng — bảng mới trong `public` mặc định vẫn đọc được
bằng anon key, mà anon key sinh ra để công khai.

**Chưa có số tài khoản ngân hàng ở bất cứ đâu.** Trang đơn hàng nói thật: đơn đã ghi nhận,
chỗ đang được giữ, HDI sẽ liên hệ. Bịa số tài khoản là bịa dữ kiện — §3.

**Vẫn không có nút duyệt tay.** `/quan-tri` có hàng chờ đối soát nhưng **chỉ để xem**;
một dòng rời khỏi danh sách là bằng chứng webhook chạy đúng.

**Sửa thêm hai lỗi lộ ra dọc đường:**
- `prisma/seed.ts` gọi `loadEnv()` **sau** khi `import { prisma }`. ESM chạy hết import
  trước câu lệnh đầu tiên, mà `lib/prisma.ts` đọc `DATABASE_URL` ngay lúc nạp — chạy
  `npx tsx prisma/seed.ts` như chính docstring của nó hướng dẫn thì `ECONNREFUSED`.
  Tách thành `prisma/load-env.ts` và import đầu tiên.
- `.gitignore` có `.env*`, nên nó nuốt luôn **`.env.example`** — file duy nhất ghi đủ
  các biến môi trường lại không bao giờ tới được người clone repo. Thêm `!.env.example`.

**Đã kiểm** (19 khẳng định ở tầng nghiệp vụ + 20 ở tầng HTTP, dữ liệu test xoá sạch sau đó):
đặt đơn · từ chối đặt trùng · hết chỗ · webhook phát lại là no-op · huỷ đơn trả lại chỗ ·
**A không huỷ được đơn của C** · cron đóng đơn quá hạn · đặt lại sau khi quá hạn ·
`?tiep=//evil.example` và `https://evil.example` đều rơi về `/tai-khoan` ·
B mở đơn của A ra **404** · canary `meetingUrl`/`driveFolderId` **0 lần** với tài khoản
`pending` và trên **mọi** trang đơn hàng, **2 lần** đúng chỗ với tài khoản `paid` ·
tràn ngang = 0 ở 375 sáng và 1280 tối trên cả 5 route mới · `/` vẫn `○ (Static)` ·
`forms.gle` = 0, 5 CTA modal giờ trỏ `/dang-ky/<slug>` của đúng khóa.

> **Công tắc mở bán:** kỳ học mặc định là `draft`, và mọi trang bán hàng chỉ đọc kỳ
> `open`. Chừng nào chưa có lịch thật thì **không thứ gì thêm vào giỏ được** — đúng ý
> "chờ có lịch thật rồi mới bật", và không cần thêm biến môi trường nào.

### 2026-08-21 — Phiên 6: kiểm thử tích hợp Auth, PayOS, Resend và Drive

- Migration trên Supabase đã ở trạng thái mới nhất; RLS/revoke của
  `auth_throttles` và `external_sync_leases`, unique `lower(email)` và enum
  `requires_review` đều được xác nhận trực tiếp.
- Resend local gửi thành công qua `onboarding@resend.dev` tới địa chỉ test chính thức của
  Resend. Gửi cho học viên thật vẫn chờ domain HDI được xác minh.
- PayOS thật đã tạo, truy vấn và huỷ hosted link. Luồng trình duyệt đã kiểm từ đăng nhập →
  thêm giỏ → giữ chỗ 2 giờ → redirect PayOS. Không thực hiện chuyển tiền.
- Webhook ký bằng SDK: chữ ký sai trả 400; chữ ký đúng chuyển đơn + ghi danh sang `paid`;
  phát lại trả `duplicate` và chỉ có một Payment. Query string giả `status=CANCELLED`
  không đổi được trang kết quả đã thanh toán.
- Kiểm thử DB trực tiếp đạt: bcrypt cost 12; token chỉ lưu SHA-256; verify 24 giờ;
  reset 30 phút; token replay bị từ chối; reset đẩy `sessionsValidAfter`; rate limit
  cho đúng 10/12 lần; tranh chấp chỗ cuối cùng chỉ một đơn thắng.
- Đối soát đơn quá hạn đã huỷ link PayOS trước, rồi mới đổi local thành `expired` và trả
  ghế. Mọi link PayOS/fixture Supabase tạo trong phiên đã được huỷ/xoá.
- Service account đọc và quản lý được cả 5 folder. Nhánh lỗi cấp quyền cho email không có
  Google Account được kiểm thật: đơn vẫn `paid`, `drivePermissionId` để null để retry.
  Với Google Account phụ `manhtuanktvn123@gmail.com`, live test trên folder SPSS đã grant
  `reader`, retry tái sử dụng cùng permission, revoke và xác nhận permission biến mất; không còn
  quyền tạm sau test.
- Sau khi giải phóng cổng 3000, Google chấp nhận chính xác callback
  `http://localhost:3000/api/auth/callback/google`: request không tương tác quay về callback
  với `interaction_required`, không còn `redirect_uri_mismatch`. Full OAuth sau đó hoàn tất bằng
  `manhtuanktvn123@gmail.com`: Auth.js tạo User emailVerified + Account `google/oidc`, không tạo
  passwordHash, profile gate chạy rồi dashboard mở đúng. Email chưa tồn tại trước test.
- Cùng session đó đã chạy browser E2E: tạo cohort SPSS 20.000đ → add cart → checkout → hosted
  PayOS #100011 đúng giá và hạn 2 giờ → webhook có chữ ký trả `succeeded` → DB có đúng một
  Payment + Order/Enrollment `paid` → Drive permission lưu trong DB khớp permission live. Payload
  phát lại trả `duplicate`; URL giả `status=CANCELLED` không đổi kết quả DB-paid.
- Đẩy access expiry fixture về quá khứ rồi chạy reconciliation đã revoke đúng một permission,
  ghi `accessRevokedAt` và xác nhận quyền Drive biến mất. Link PayOS remote được huỷ từ `PENDING`
  sang `CANCELLED`, `amountPaid=0`; sau logout, toàn bộ User/Account/Order/Payment/Enrollment/
  Cohort/lease fixture đều được xác nhận bằng 0.
- Live test phát hiện Server Action logout điều hướng nhưng JWT sống lại do race với request
  SessionProvider. Nút logout đã chuyển sang Auth.js client `signOut`, nơi CSRF + session broadcast
  được phối hợp; retest thật xác nhận `/dang-nhap` không còn redirect ngược về dashboard.
- Profile-completion gate đã kiểm bằng browser và DB: user thiếu SĐT/giai đoạn bị đưa về
  `/hoan-tat-ho-so?tiep=%2Fgio-hang`, không tạo Order hay link PayOS. Cron thật trả 404/200
  đúng Bearer; template reset Resend cũng gửi thành công tới địa chỉ test chính thức.
- Audit bổ sung đã sửa bốn cạnh an toàn: JWT có cutoff nhưng thiếu issue time phải fail closed;
  bank reference đã `requires_review` không thể được diễn giải lại để cấp quyền; webhook bắt
  buộc `paymentLinkId` không rỗng và phục hồi ID có chữ ký khi DB chưa kịp lưu; Drive grant
  chỉ nhắm enrollment của order, có budget toàn batch và gia hạn lease theo owner.
- `npm test`: 69/69; ESLint, TypeScript, Prisma validate, `git diff --check` và production
  build đều sạch. Bổ sung hồi quy cho auth linking/session/registration/reset, cron,
  remote-first cancel, PayOS create/recovery/replay và Drive idempotency/retry/budget/lease.
- Server Action xác thực email và đổi mật khẩu giờ có regression riêng: token expired/replay
  không chạm user; consume + update nằm cùng transaction; reset tạo bcrypt cost 12 và đẩy
  `sessionsValidAfter` chỉ cho tài khoản đã xác minh.
- `codex mcp list/get supabase` xác nhận server Supabase đúng project ref, đủ feature và đang
  `enabled`. Task Codex hiện tại được mở trước khi server được nạp nên chưa thấy tool Supabase;
  cần restart Codex/task nếu muốn dùng feature branching trực tiếp.
- Không chờ MCP reload: đã dựng PostgreSQL 16 disposable bằng Docker trên port riêng. Lần chạy
  đầu phát hiện database sạch thiếu hai role PostgREST do Supabase cấp sẵn; runner integration
  giờ tự bootstrap `anon`/`authenticated` dưới guard xác nhận database disposable. Tạo lại DB từ
  số 0 xong, cả 4 migration và 4/4 integration tests đều qua. Container đã được xoá và port đã
  trả lại; `.env.local` không cần lưu `TEST_DATABASE_URL` tạm.

### 2026-08-21 — Phiên 7: refine UI giỏ hàng/đơn hàng + audit auth/thanh toán/cấp quyền

**1. Commit checkpoint.** Toàn bộ Phiên 5-6 (GĐ4 PayOS/webhook/Drive, auth mở rộng,
bộ test) còn nằm chưa commit từ đầu phiên — đã soát `.env.example`/`.gitignore` không
lộ secret rồi commit riêng thành `3d55ce9`, tách khỏi việc của phiên này.

**2. Refine giỏ hàng/đơn hàng.** Tham khảo UX của `portfolio-app` (iCloud) nhưng
**không** chép kiến trúc giỏ dạng drawer/in-memory của repo đó — giữ nguyên cookie +
định giá lại từ DB.

- Thêm **dialog xác nhận báo giá trước khi tạo đơn** (`CheckoutButton` trong
  `cart-controls.tsx`, theo yêu cầu người dùng để dành chỗ cho chính sách giảm giá
  sau này): nút "Đặt đơn và giữ chỗ" giờ chỉ mở `<dialog>` liệt kê từng dòng + tổng
  tiền; `checkout()` server action chỉ chạy khi bấm "Xác nhận và giữ chỗ" bên trong
  dialog. Đã kiểm bằng dữ liệu thật: đóng dialog qua backdrop **không** tạo `Order`
  nào; xác nhận thì tạo đúng một `Order` + link PayOS thật.
- `Badge` thêm tone `warning`/`danger` (+ token `--warning`/`--danger` trong
  `globals.css`); áp cho trạng thái đơn (`pending` = warning, `cancelled`/`expired` =
  danger, `paid` = success) và dòng giỏ hàng bị chặn.
- `components/checkout-steps.tsx` (mới) — chỉ báo bước 1-4 xuyên suốt
  `/dang-ky/[slug]` → `/gio-hang` → `/thanh-toan/ket-qua` → `/tai-khoan/don-hang/[code]`,
  co lại thành text "Bước n/4" dưới `sm:`.
- `components/hold-countdown.tsx` (mới, client) — đếm ngược "Còn HH:MM giữ chỗ" thật
  từ `expiresAt` đã có sẵn, không thêm API. Đã kiểm chạy thật trên trình duyệt (số
  phút giảm dần qua nhiều lần chụp).
- `components/payment-poll.tsx` (mới, client) — `/thanh-toan/ket-qua` tự
  `router.refresh()` tối đa 8 lần rồi rơi về nút "Kiểm tra lại" thủ công, thay vì im
  lặng chờ người dùng tự reload.
- `app/tai-khoan/don-hang/[code]/cancel.tsx` viết lại bằng `<dialog>` gốc (đúng mẫu
  `course-card.tsx`) thay cho toggle hai bước cũ.
- `AddToCart` gộp 5 kiểu nút rời rạc về một ngôn ngữ nhất quán (filled = hành động
  chính, outline = đã xử lý, muted = hết chỗ).
- `dang-ky/[slug]` và `gio-hang` chuyển sang dùng `Card` thay vì tự viết tay class
  viền/nền; thêm `loading.tsx` (skeleton dùng `Skeleton` mới) cho 5 route có gọi
  DB/PayOS.

**Kiểm chứng — không chỉ đọc code, chạy thật trên DB dev** (`szzspwwjapxnxskgeyww`,
không phải Chemistery production): tạo user + session + cohort test qua Prisma, đăng
nhập **qua chính form thật** (Credentials — phát hiện app đã chuyển từ session
`database` sang **`strategy: "jwt"`** ở Phiên 6 vì Credentials bắt buộc JWT, nên seed
thẳng một dòng `Session` không đăng nhập được, phải login thật để có JWT cookie hợp
lệ) → thêm vào giỏ → mở dialog báo giá → xác nhận → **đơn thật #100012 + link PayOS
thật được tạo** → trang đơn hàng hiện đúng badge/countdown/step → hủy qua dialog mới
→ xác nhận `cancelOrder` gọi PayOS thật trước khi đổi trạng thái local (remote-first,
đúng như tài liệu). Toàn bộ dữ liệu test đã xóa sạch sau đó (0 dòng còn lại).

> **Gotcha:** ảnh chụp qua Browser pane **không hiện được nội dung `<dialog>` mở**
> (top layer không được composite vào screenshot của công cụ), dù DOM/`open`/rect đều
> đúng. Không phải lỗi ứng dụng — xác nhận bằng `document.querySelector('dialog').open`
> và tương tác trực tiếp qua DOM khi cần thay vì chỉ tin ảnh chụp.

**3. Audit auth/thanh toán/cấp quyền.**

- **Vá một khoảng trống rate-limit:** `resetPassword` (tiêu thụ token đặt lại mật
  khẩu) là hành động auth duy nhất **không** qua `allowAuthEmail`/`allowLoginAttempt`.
  Thêm `allowResetConsume()` (khoá theo IP, 10/15 phút — form chỉ có token, không có
  email để khoá theo cặp) vào `lib/auth-throttle.ts`, gọi trước `consumeAuthToken`.
- Thêm `tests/auth-throttle.test.ts` (test trực tiếp toán học cửa sổ cố định — trước
  đây chỉ được test gián tiếp qua các action) và `tests/auth-pages.test.tsx` (test
  render 4 trang `/dang-ky-tai-khoan`, `/quen-mat-khau`, `/dat-lai-mat-khau`,
  `/xac-thuc-email` — trước đây chỉ test server action, chưa test page component).
- Đọc lại và xác nhận lại trực tiếp trên code hiện tại (không chỉ tin tài liệu cũ):
  `Payment` có `@@unique([provider, providerRef])`; `processPayosPayment` append-only
  — một `providerRef` đã ghi `requires_review` không bao giờ bị diễn giải lại thành
  `succeeded`; `cancelOrder` remote-first, fail-closed khi PayOS không phản hồi được.
  Không phát hiện sai lệch so với Plan.MD.
- `npm run test:integration` **bỏ qua** vì Docker daemon không chạy trong môi trường
  này (binary có, daemon không) — không phải lỗ hổng, chỉ là chưa chạy được lần này.

**Kiểm chứng:** `tsc --noEmit` + `eslint` + `build` sạch; `npm test` **84/84** (tăng từ
69, thêm `tests/auth-throttle.test.ts` + `tests/auth-pages.test.tsx`); `/` vẫn
`○ (Static)`.

**4. Commit + merge + push** (theo yêu cầu người dùng: test xong thì merge
`feat/gd2-nen-tang` vào `main` rồi push, không chỉ push nhánh feature).

---

## 8. Việc tiếp theo (gợi ý, chưa làm)

- [ ] Ảnh chân dung hiện cắt từ poster nên hơi mờ (gốc ~310px). Nếu có ảnh gốc độ phân giải cao thì thay `public/images/portrait.jpg`.
- [ ] Chưa có favicon và ảnh Open Graph riêng.
- [ ] Hai dịch vụ ở `#dich-vu` mới chỉ có tiêu đề, vì trang gốc cũng chỉ có tiêu đề. Cần Dr. Trinh cung cấp mô tả và bảng giá thật — **đừng tự viết**.
- [ ] Deploy Vercel: đã sửa preset + thêm `vercel.json`, cần Redeploy và xác nhận trang chạy.
- [ ] **Bật Web Analytics trong dashboard Vercel** — GĐ1 đã gắn code nhưng không tự bật được.
- [x] **GĐ4 — code PayOS + fulfillment.** Đã có tạo/recover link, webhook có chữ ký và idempotency, huỷ remote-first, trạng thái `requires_review`, đối soát, và cấp quyền Google Drive best-effort. Còn việc production: dùng tài khoản PayOS **riêng của HDI**, đặt `PAYOS_CLIENT_ID` / `PAYOS_API_KEY` / `PAYOS_CHECKSUM_KEY`, rồi đăng ký webhook sau deploy.
- [ ] **Đặt bí mật dịch vụ trên Vercel:** `APP_URL`, PayOS, `RESEND_API_KEY`, `EMAIL_FROM`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, cùng các biến Auth.js/DB/admin/cron hiện có. Domain gửi Resend phải được xác minh; email mua hàng phải thuộc một Google Account để Drive cấp quyền.
- [ ] **Đặt `CRON_SECRET` trên Vercel** — thiếu nó thì route housekeeping luôn trả 404. Checkout vẫn tự đối soát đơn quá hạn trước khi bán chỗ; cron mỗi ngày xử lý thêm retry/revoke Drive và dọn token/lease/throttle.
- [ ] **Sequence mã đơn đã tiến thêm trong lúc kiểm thử sandbox.** Vô hại — sequence không lùi, và mã đơn không được phép dùng lại. Đừng reset cho đẹp.
- [ ] **Chính sách hoàn tiền / huỷ đơn** chưa có chữ nào. Trạng thái `refunded` đã có trong DB nhưng chưa có luồng nào dẫn tới nó. Cần Dr. Trinh quyết trước khi thu tiền thật.
- [ ] **GĐ2 — việc tay còn lại:** (1) ~~điền mật khẩu DB~~ ✅ xong; (2) xác nhận OAuth Client ID có redirect `/api/auth/callback/google` cho localhost + preview + prod; (3) service account có quyền quản lý Shared Drive; (4) lịch kỳ học thật từ Dr. Trinh để seed.
- [ ] **Trang chính sách bảo mật + dòng đồng ý.** Từ GĐ2 trang đã lưu tên, email, lịch sử ghi danh — hiện chưa có trang chính sách nào. Nên làm trước khi có học viên thật.
- [ ] **Bật sao lưu DB** (Point-in-Time Recovery của Supabase). Từ giờ có dữ liệu không tái tạo được từ git.
- [ ] **Học phí:** `content/course.ts` đang mirror giá edubit. Đã tách khỏi edubit thì `Cohort.priceVnd` mới là giá thật — cần đối chiếu hai chỗ khi seed.
- [ ] Vệ sinh repo nguồn: `portfolio-app/.claude/settings.local.json` chứa chuỗi kết nối Supabase kèm mật khẩu và một SePay key, mà file đó **không nằm trong `.gitignore`**. Đã kiểm là **chưa từng commit**, nhưng một lệnh `git add .` là đủ để đẩy lên.
- [ ] Nếu sau này cần bản tiếng Anh: mọi chữ đã nằm gọn trong `content/`, chỉ cần tách thành `content/vi/` + `content/en/` và thêm nút chuyển ở header.
