import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { referralPage } from "@/content/referral";
import { appUrl } from "@/lib/app-url";
import { currentSession } from "@/lib/current-session";
import { formatDate, formatVnd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { ensureReferralCode } from "@/lib/referral-code";
import { creditBalanceVnd } from "@/lib/referral-ledger";
import { Card } from "@/components/ui/card";
import { Section, SectionHeading } from "@/components/ui/section";
import { CopyField } from "./copy-field";

export const metadata: Metadata = {
  title: "Giới thiệu bạn bè — HDI Research Center",
  robots: { index: false, follow: false },
};

/** Sổ dài bao nhiêu cũng chỉ đọc được chừng này trên một trang. */
const HISTORY_LIMIT = 50;

export default async function ReferralPage() {
  const session = await currentSession();
  // Layout của /tai-khoan đã chặn khách chưa đăng nhập; kiểm lại ở đây chỉ để
  // TypeScript và trang này đứng độc lập được với thứ tự render.
  if (!session?.user?.id) redirect("/dang-nhap");
  const userId = session.user.id;

  /**
   * Cấp mã LƯỜI, đúng lúc người ta cần tới nó.
   *
   * Cấp hàng loạt trong migration sẽ phát mã cho cả những tài khoản không bao
   * giờ mở trang này, và mỗi mã phát ra là một hàng trong không gian mã hữu hạn.
   */
  const code = await ensureReferralCode(prisma, userId);

  const [balanceVnd, referredCount, entries] = await Promise.all([
    creditBalanceVnd(prisma, userId),
    prisma.user.count({
      // Chỉ đếm tài khoản đã xác thực email: quan hệ giới thiệu được gắn đúng
      // lúc xác thực, nên một hàng chưa xác thực không thể trỏ về ai cả.
      where: { referredById: userId },
    }),
    prisma.referralLedger.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        status: true,
        amountVnd: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    }),
  ]);

  const shareUrl = code
    ? `${appUrl()}/dang-ky-tai-khoan?ref=${code}`
    : null;

  return (
    <Section soft>
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          eyebrow={referralPage.eyebrow}
          title={referralPage.title}
          subtitle={referralPage.subtitle}
        />

        <Card className="p-6 sm:p-8" hover={false}>
          {code && shareUrl ? (
            <div className="space-y-5">
              <CopyField label={referralPage.codeLabel} value={code} mono />
              <CopyField label={referralPage.linkLabel} value={shareUrl} />
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-fg-muted">
              {referralPage.codeUnavailable}
            </p>
          )}
        </Card>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Card className="p-6" hover={false}>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              {referralPage.balanceLabel}
            </p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-primary">
              {formatVnd(Math.max(0, balanceVnd))}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-fg-subtle">
              {referralPage.balanceHint}
            </p>
          </Card>

          <Card className="p-6" hover={false}>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              {referralPage.referredLabel}
            </p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-primary">
              {referredCount}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-fg-subtle">
              {referredCount === 0
                ? referralPage.referredEmpty
                : referralPage.referredCount(referredCount)}
            </p>
          </Card>
        </div>

        <div className="mt-5 rounded-card border border-line bg-card p-6 sm:p-7">
          <p className="text-lg font-bold tracking-tight text-primary">
            {referralPage.historyTitle}
          </p>
          {entries.length === 0 ? (
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              {referralPage.historyEmpty}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {entries.map((entry) => {
                const note = referralPage.entryStatus[entry.status] ?? "";
                return (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-baseline justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-fg">
                        {referralPage.entryType[entry.type] ?? entry.type}
                        {note && (
                          <span className="font-normal text-fg-subtle"> · {note}</span>
                        )}
                      </p>
                      <p className="text-xs text-fg-subtle">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                    {/* Dấu đi kèm con số, và dòng đã hoàn lại thì mờ đi: một
                        khoản `void` vẫn nằm trong sổ nhưng KHÔNG còn trừ vào số
                        dư, nên hiện nó y như một khoản đang trừ sẽ khiến người
                        đọc cộng tay ra một con số khác. */}
                    <p
                      className={`font-bold tabular-nums ${
                        entry.status === "void"
                          ? "text-fg-subtle line-through"
                          : entry.amountVnd < 0
                            ? "text-fg-muted"
                            : "text-primary"
                      }`}
                    >
                      {entry.amountVnd < 0 ? "−" : "+"}
                      {formatVnd(Math.abs(entry.amountVnd))}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-5 rounded-card border border-line bg-bg-soft p-6 sm:p-7">
          <p className="text-sm font-bold text-fg">{referralPage.rulesTitle}</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-fg-muted">
            {referralPage.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-sm">
          <Link className="font-bold text-primary" href="/tai-khoan">
            {referralPage.backToAccount}
          </Link>
        </p>
      </div>
    </Section>
  );
}
