"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { conferences, type Conference } from "@/content/conferences";
import {
  conferenceMapOrigins,
  conferenceMapPoints,
  conferenceMapSummary,
} from "@/content/conference-map";
import { stats } from "@/content/stats";
import { observeReveal } from "@/lib/reveal-observer";
import { landPath, MAP_HEIGHT, MAP_WIDTH } from "./conference-map-land";
import { RunningScore, format } from "./stats-board";

type Pin = {
  where: string;
  x: number;
  y: number;
  photo?: { src: string; alt: string };
  items: Conference[];
  origin: boolean;
};

const ORIGINS: readonly string[] = conferenceMapOrigins;

/** Gộp các hội thảo cùng địa điểm thành một ghim. */
const pins: Pin[] = Object.entries(
  conferences.reduce<Record<string, Conference[]>>((byWhere, conference) => {
    (byWhere[conference.where] ??= []).push(conference);
    return byWhere;
  }, {}),
).map(([where, items]) => {
  const point = conferenceMapPoints[where];
  return { where, ...point, items, origin: ORIGINS.includes(where) };
});

const toViewBox = (pin: Pick<Pin, "x" | "y">) => ({
  x: (pin.x / 100) * MAP_WIDTH,
  y: (pin.y / 100) * MAP_HEIGHT,
});

/** Mỗi điểm đến nối với điểm xuất phát gần nhất; hai điểm xuất phát không nối. */
const arcs = pins
  .filter((pin) => !pin.origin)
  .map((pin) => {
    const to = toViewBox(pin);
    const from = pins
      .filter((candidate) => candidate.origin)
      .map(toViewBox)
      .sort(
        (a, b) =>
          Math.hypot(a.x - to.x, a.y - to.y) - Math.hypot(b.x - to.x, b.y - to.y),
      )[0];
    const lift = Math.hypot(to.x - from.x, to.y - from.y) * 0.28;
    const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - lift };
    return {
      where: pin.where,
      d: `M${from.x} ${from.y}Q${mid.x} ${mid.y} ${to.x} ${to.y}`,
    };
  });

/** Tooltip mở về phía còn chỗ: ghim sát mép trái/phải/trên không bị cắt. */
function tipPlacement(pin: Pin) {
  const vertical = pin.y < 34 ? "top-full mt-2" : "bottom-full mb-2";
  const horizontal =
    pin.x < 24
      ? "left-0"
      : pin.x > 76
        ? "right-0"
        : "left-1/2 -translate-x-1/2";
  return `${vertical} ${horizontal}`;
}

/**
 * Bản đồ các hội thảo quốc tế đã trình bày — dữ liệu thật từ
 * content/conferences.ts, không phải số liệu học viên. Cung nối vẽ dần và ghim
 * bật lên khi bản đồ cuộn vào tầm nhìn (CSS ở globals.css, tắt khi
 * prefers-reduced-motion). Ghim là `button`: hover, focus bàn phím hoặc chạm
 * đều mở tooltip.
 */
export function ConferenceMap() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [openWhere, setOpenWhere] = useState<string | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Chỉ khi JS đã chạy mới ẩn arc/ghim chờ animation; không có JS thì bản đồ
    // hiện đủ ngay.
    root.dataset.ready = "true";
    const unobserve = observeReveal(root, () => {
      root.dataset.shown = "true";
    });
    return () => {
      unobserve();
      delete root.dataset.ready;
    };
  }, []);

  useEffect(() => {
    if (!openWhere) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target as Element).closest("[data-map-pin]")) {
        setOpenWhere(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenWhere(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openWhere]);

  return (
    <div ref={rootRef} data-map className="relative">
      <div className="relative aspect-[16/10] sm:aspect-[2/1]">
        <div className="absolute inset-0 overflow-hidden rounded-[20px] border border-line bg-card bg-[radial-gradient(circle_at_50%_40%,color-mix(in_srgb,var(--accent)_4%,transparent),transparent_70%)] shadow-[0_2px_100px_rgba(31,73,125,0.18)]">
          <svg
            aria-hidden
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <pattern
                id="map-dots"
                width="9"
                height="9"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="4.5" cy="4.5" r="1.1" className="map-dot" />
              </pattern>
              {/* Khung hẹp co khung 1000 đơn vị xuống ~330px, nên mobile dùng lưới
                  chấm to gấp rưỡi để chấm vẫn thấy được. */}
              <pattern
                id="map-dots-sm"
                width="16"
                height="16"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="8" cy="8" r="3.2" className="map-dot" />
              </pattern>
              {arcs.map((arc, index) => (
                <mask
                  key={arc.where}
                  id={`map-arc-mask-${index}`}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width={MAP_WIDTH}
                  height={MAP_HEIGHT}
                >
                  <path
                    d={arc.d}
                    fill="none"
                    stroke="#fff"
                    strokeWidth="8"
                    pathLength="1"
                    strokeDasharray="1"
                    className="map-arc-reveal"
                    style={{ "--i": index } as React.CSSProperties}
                  />
                </mask>
              ))}
            </defs>
            <path d={landPath} fill="url(#map-dots-sm)" className="sm:hidden" />
            <path
              d={landPath}
              fill="url(#map-dots)"
              className="hidden sm:block"
            />
            {arcs.map((arc, index) => (
              <path
                key={arc.where}
                d={arc.d}
                className="map-arc"
                vectorEffect="non-scaling-stroke"
                mask={`url(#map-arc-mask-${index})`}
              />
            ))}
          </svg>
          <p className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-line bg-card/90 px-3 py-1.5 text-xs font-semibold text-fg sm:left-5 sm:top-5">
            <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
            {conferenceMapSummary.talks} lần trình bày ·{" "}
            {conferenceMapSummary.countries} quốc gia
          </p>
        </div>

        <ul className="absolute inset-0 m-0 list-none p-0">
          {pins.map((pin, index) => {
            const open = openWhere === pin.where;
            const tipId = `map-tip-${index}`;
            return (
              <li
                key={pin.where}
                data-map-pin
                className={`group absolute -translate-x-1/2 -translate-y-1/2 ${
                  open ? "z-30" : "z-20 hover:z-30 focus-within:z-30"
                }`}
                style={
                  {
                    left: `${pin.x}%`,
                    top: `${pin.y}%`,
                    "--i": index,
                  } as React.CSSProperties
                }
              >
                <div className="map-pin relative">
                  <span
                    aria-hidden
                    className="map-ping pointer-events-none absolute inset-0 rounded-full border border-accent"
                  />
                  <button
                    type="button"
                    aria-describedby={tipId}
                    aria-expanded={open}
                    aria-label={`${pin.where}: ${pin.items.length} lần trình bày`}
                    onClick={() => setOpenWhere(open ? null : pin.where)}
                    className={`relative block overflow-hidden rounded-full border-2 border-accent shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                      pin.photo
                        ? "h-7 w-7 sm:h-9 sm:w-9"
                        : pin.origin
                          ? "h-3.5 w-3.5 bg-accent sm:h-[18px] sm:w-[18px]"
                          : "h-3 w-3 bg-card sm:h-3.5 sm:w-3.5"
                    }`}
                  >
                    {pin.photo && (
                      <Image
                        src={pin.photo.src}
                        alt=""
                        width={72}
                        height={72}
                        sizes="36px"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                  <span
                    id={tipId}
                    role="tooltip"
                    className={`band pointer-events-none absolute z-30 w-60 max-w-[70vw] rounded-xl px-3.5 py-3 text-left shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${
                      open ? "visible opacity-100" : "invisible opacity-0"
                    } ${tipPlacement(pin)}`}
                  >
                    {pin.items.map((conference) => (
                      <span
                        key={conference.name}
                        className="block [&:not(:first-child)]:mt-2.5 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-white/15 [&:not(:first-child)]:pt-2.5"
                      >
                        <span className="line-clamp-3 block text-xs font-semibold leading-snug">
                          {conference.name}
                        </span>
                        <span className="mt-1 block text-[11px] leading-snug text-white/75">
                          {conference.when} · {conference.role}
                        </span>
                      </span>
                    ))}
                    {pin.photo && (
                      <span className="sr-only">{pin.photo.alt}</span>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Thẻ số liệu: nổi đè mép dưới bản đồ từ `sm`, xuống dưới thành lưới 2×2
          ở mobile. Số chạy lên khi cuộn tới (RunningScore). */}
      <dl className="band relative z-10 mt-4 grid grid-cols-2 gap-y-6 rounded-[18px] px-4 py-6 shadow-[0_12px_40px_rgba(12,73,143,0.25)] sm:-mt-10 sm:mx-6 sm:grid-cols-4 sm:px-6">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <dt className="sr-only">{`${stat.label}: ${format(stat, stat.to)}`}</dt>
            <dd>
              <RunningScore stat={stat} className="text-accent-on-band" />
              <span className="mt-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75">
                {stat.label}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
