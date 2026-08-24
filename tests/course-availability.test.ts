import { describe, expect, it } from "vitest";
import { cardPresentation } from "@/lib/course-availability";

describe("presentation của availability trên thẻ khóa học", () => {
  it.each([
    ["buyable", "buyable", true],
    ["full", "full", false],
    ["not_open", "not_open", false],
    [undefined, null, true],
  ] as const)("%s → badge=%s, buyable=%s", (input, badge, buyable) => {
    expect(cardPresentation(input)).toEqual({ badge, buyable });
  });
});
