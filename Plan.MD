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
| **Bảng màu** | **Một bảng màu duy nhất** (xanh dương đậm). Bản đầu dùng thêm bảng màu cam cho phần khóa học — **đã bỏ** theo yêu cầu ngày 2026-08-19: khóa học không phải trang riêng nên không dùng màu riêng. Phần khóa học nay nổi bật bằng một panel nền `bg-primary`. |

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
  ui/     section.tsx  card.tsx  badge.tsx  reveal.tsx  icons.tsx
  sections/  hero  stats  programs  featured-course  services
             about  publications  projects  conferences  teaching  contact
content/    ← TOÀN BỘ chữ nghĩa nằm ở đây, không hardcode trong JSX
  site.ts  programs.ts  course.ts  services.ts  about.ts
  publications.ts  projects.ts  conferences.ts  teaching.ts  stats.ts
vercel.json   ghim Framework Preset = nextjs (xem Nhật ký phiên, sự cố 404)
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

**Kiểm chứng số liệu** (đối chiếu với `reference/site`): 13 công bố · 14 hội thảo ·
3 đề tài (US$31,000 + US$2,100 + US$4,200 = US$37,300) · 4 luận án hướng dẫn ·
email `congtam.trinh@gmail.com` · điện thoại `0939 979 890` (ưu tiên Zalo).

---

## 6. Cách chạy và kiểm tra

```bash
npm run dev      # http://localhost:3000
npm run build    # phải sạch TypeScript
npx eslint .     # phải sạch
```

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

## 8. Việc tiếp theo (gợi ý, chưa làm)

- [ ] Ảnh chân dung hiện cắt từ poster nên hơi mờ (gốc ~310px). Nếu có ảnh gốc độ phân giải cao thì thay `public/images/portrait.jpg`.
- [ ] Chưa có favicon và ảnh Open Graph riêng.
- [ ] Hai dịch vụ ở `#dich-vu` mới chỉ có tiêu đề, vì trang gốc cũng chỉ có tiêu đề. Cần Dr. Trinh cung cấp mô tả và bảng giá thật — **đừng tự viết**.
- [ ] Deploy Vercel: đã sửa preset + thêm `vercel.json`, cần Redeploy và xác nhận trang chạy.
- [ ] Nếu sau này cần bản tiếng Anh: mọi chữ đã nằm gọn trong `content/`, chỉ cần tách thành `content/vi/` + `content/en/` và thêm nút chuyển ở header.
