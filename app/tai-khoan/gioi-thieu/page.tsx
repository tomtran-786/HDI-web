import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { referralPage } from "@/content/referral";
import { appUrl } from "@/lib/app-url";
import { currentSession } from "@/lib/current-session";
import { formatDate, formatVnd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { ensureReferralCode } from "@/lib/referral-code";
import {
  creditBalanceVnd,
  pendingCreditVnd,
  rewardedReferralsInWindow,
} from "@/lib/referral-ledger";
import { REWARDED_REFERRALS_MAX } from "@/lib/referral-pricing";
import { ReferralGuide } from "@/components/referral-guide";
import { Card } from "@/components/ui/card";
import { Section, SectionHeading } from "@/components/ui/section";
import { CopyField } from "./copy-field";

export const metadata: Metadata = {
  title: "Giới thiệu bạn bè — HDI Research Center",
  robots: { index: false, follow: false },
};

/** Sổ dài bao nhiêu cũng chỉ đọc được chừng này trên một trang. */
const HISTORY_LIMIT = 50;

/** Một ô số, dùng chung cho cả bốn chỉ số ở đầu trang. */
function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="p-5 sm:p-6" hover={false}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-primary">
        {value}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-fg-subtle">{hint}</p>
    </Card>
  );
}

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
  // MỘT mốc thời gian cho cả trang: số dư, phần đang chờ và cửa sổ đếm lượt
  // thưởng phải cùng nói về một thời điểm, nếu không bốn ô số sẽ cộng không ra.
  const now = new Date();

  const [balanceVnd, pendingVnd, referredCount, rewarded, entries] =
    await Promise.all([
      creditBalanceVnd(prisma, userId, now),
      pendingCreditVnd(prisma, userId, now),
      prisma.user.count({
        // Chỉ đếm tài khoản đã xác thực email: quan hệ giới thiệu được gắn đúng
        // lúc xác thực, nên một hàng chưa xác thực không thể trỏ về ai cả.
        where: { referredById: userId },
      }),
      rewardedReferralsInWindow(prisma, userId, now),
      prisma.referralLedger.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          status: true,
          amountVnd: true,
          createdAt: true,
          availableAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: HISTORY_LIMIT,
      }),
    ]);

  const shareUrl = code ? `${appUrl()}/dang-ky-tai-khoan?ref=${code}` : null;
  const rewardsLeft = Math.max(0, REWARDED_REFERRALS_MAX - rewarded);

  return (
    <Section soft>
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          eyebrow={referralPage.eyebrow}
          title={referralPage.title}
          subtitle={referralPage.subtitle}
        />

        <div className="rounded-card border border-line bg-card p-6 sm:p-7">
          <p className="text-lg font-bold tracking-tight text-primary">
            {referralPage.howItWorksTitle}
          </p>
          <ol className="mt-4 space-y-4">
            {referralPage.howItWorks.map((step, index) => (
              <li key={step.text} className="flex gap-3.5">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tint text-[11px] font-bold tabular-nums text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-fg">{step.text}</p>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <Card className="mt-5 p-6 sm:p-8" hover={false}>
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

          <div className="mt-7 border-t border-line pt-6">
            <p className="text-sm font-bold text-fg">
              {referralPage.guideTitle}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              {referralPage.guideIntro}
            </p>
            <ReferralGuide code={code} />
          </div>
        </Card>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Stat
            label={referralPage.balanceLabel}
            value={formatVnd(Math.max(0, balanceVnd))}
            hint={referralPage.balanceHint}
          />
          <Stat
            label={referralPage.pendingLabel}
            value={formatVnd(Math.max(0, pendingVnd))}
            hint={
              pendingVnd > 0
                ? referralPage.pendingHint
                : referralPage.pendingEmpty
            }
          />
          <Stat
            label={referralPage.referredLabel}
            value={String(referredCount)}
            hint={
              referredCount === 0
                ? referralPage.referredEmpty
                : referralPage.referredCount(referredCount)
            }
          />
          <Stat
            label={referralPage.rewardsLabel}
            value={referralPage.rewardsValue(rewardsLeft)}
            hint={
              rewardsLeft === 0
                ? referralPage.rewardsExhausted
                : referralPage.rewardsHint
            }
          />
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
                // Một khoản còn trong thời gian giữ chưa vào số dư, nên nó phải
                // tự nói ra ngày mở khóa; sau ngày đó thì hạn dùng mới là thứ
                // người đọc cần biết.
                const held =
                  entry.availableAt != null && entry.availableAt > now;
                const timing = held
                  ? referralPage.historyAvailableOn(formatDate(entry.availableAt!))
                  : entry.expiresAt
                    ? referralPage.historyExpiresOn(formatDate(entry.expiresAt))
                    : null;
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
                        {timing && ` · ${timing}`}
                      </p>
                    </div>
                    {/* Dấu đi kèm con số, và dòng đã hoàn lại thì mờ đi: một
                        khoản `void` vẫn nằm trong sổ nhưng KHÔNG còn trừ vào số
                        dư, nên hiện nó y như một khoản đang trừ sẽ khiến người
                        đọc cộng tay ra một con số khác. Khoản đang giữ cũng mờ,
                        vì cùng lý do — nó chưa nằm trong "credits khả dụng". */}
                    <p
                      className={`font-bold tabular-nums ${
                        entry.status === "void"
                          ? "text-fg-subtle line-through"
                          : held || entry.amountVnd < 0
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
          <div className="mt-4 space-y-5">
            {referralPage.rules.map((group) => (
              <div key={group.title}>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                  {group.title}
                </p>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-fg-muted">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
