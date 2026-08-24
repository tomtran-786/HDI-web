import { describe, expect, it } from "vitest";
import { endOfDayVN, startOfDayVN, toDayInputVN } from "@/lib/format";

describe("biên ngày theo giờ Việt Nam", () => {
  it("mở đầu ngày lúc 17:00Z hôm trước, không phải 00:00Z", () => {
    // Đây chính là cái bẫy: 00:00 ở Hà Nội là 17:00 UTC của NGÀY HÔM TRƯỚC.
    expect(startOfDayVN("2026-08-24")?.toISOString()).toBe(
      "2026-08-23T17:00:00.000Z",
    );
  });

  it("kết thúc ngày lúc 16:59:59.999Z hôm sau", () => {
    expect(endOfDayVN("2026-08-24")?.toISOString()).toBe(
      "2026-08-24T16:59:59.999Z",
    );
  });

  it("khoảng một ngày ôm trọn 24 giờ, không hở không chồng", () => {
    const from = startOfDayVN("2026-08-24")!;
    const to = endOfDayVN("2026-08-24")!;
    expect(to.getTime() - from.getTime()).toBe(24 * 60 * 60 * 1000 - 1);
    // Ngày kế tiếp bắt đầu đúng 1ms sau khi ngày này kết thúc.
    expect(startOfDayVN("2026-08-25")!.getTime() - to.getTime()).toBe(1);
  });

  it("một đơn lúc 6 giờ sáng giờ Hà Nội nằm TRONG ngày hôm đó", () => {
    // Bản viết ngây thơ (new Date("2026-08-24")) sẽ đánh rơi đúng đơn này.
    const sauSang = new Date("2026-08-24T06:00:00+07:00");
    expect(sauSang >= startOfDayVN("2026-08-24")!).toBe(true);
    expect(sauSang <= endOfDayVN("2026-08-24")!).toBe(true);
  });

  it.each([
    ["", "chuỗi rỗng"],
    ["24/08/2026", "định dạng Việt Nam"],
    ["2026-8-4", "thiếu số 0"],
    ["2026-02-31", "ngày không tồn tại"],
    ["hôm nay", "chữ"],
  ])("trả null cho %j (%s)", (input) => {
    expect(startOfDayVN(input)).toBeNull();
    expect(endOfDayVN(input)).toBeNull();
  });

  it("trả null cho thứ không phải chuỗi", () => {
    // searchParams có thể cho ra mảng khi tham số lặp lại trên URL.
    expect(startOfDayVN(["2026-08-24"])).toBeNull();
    expect(startOfDayVN(undefined)).toBeNull();
  });

  it("toDayInputVN đổi ngược một thời điểm về ô input, theo giờ Việt Nam", () => {
    // 22:30Z ngày 23 đã là 05:30 sáng ngày 24 ở Hà Nội.
    expect(toDayInputVN(new Date("2026-08-23T22:30:00.000Z"))).toBe("2026-08-24");
    expect(toDayInputVN(startOfDayVN("2026-08-24")!)).toBe("2026-08-24");
    expect(toDayInputVN(endOfDayVN("2026-08-24")!)).toBe("2026-08-24");
  });
});
