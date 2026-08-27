import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CourseRoadmap } from "@/components/course-roadmap";
import type { Course } from "@/content/course";

function roadmap(overrides: Partial<Course>) {
  return renderToStaticMarkup(
    <CourseRoadmap
      course={
        {
          curriculum: "modules",
          phases: [],
          ...overrides,
        } as Course
      }
    />,
  );
}

describe("CourseRoadmap", () => {
  it("in ý con và câu chốt của module khi giáo trình chia hai tầng", () => {
    const html = roadmap({
      phases: [
        {
          name: "Từ đề bài đến ý tưởng nghiên cứu",
          summary: "Sau Module 1: học viên có outline hoàn chỉnh.",
          sessions: [
            {
              text: "Hiểu đúng yêu cầu của một bài học thuật",
              points: ["Đọc đề bài và rubric", "Những lỗi mất điểm sớm"],
            },
          ],
        },
      ],
    });

    expect(html).toContain("Module 1: Từ đề bài đến ý tưởng nghiên cứu");
    expect(html).toContain(">1.1<");
    expect(html).toContain("Hiểu đúng yêu cầu của một bài học thuật");
    expect(html).toContain("Đọc đề bài và rubric");
    expect(html).toContain("Những lỗi mất điểm sớm");
    expect(html).toContain("Sau Module 1: học viên có outline hoàn chỉnh.");
  });

  /**
   * Dạng `{ text, href }` có trước `points` và vẫn đang được khóa
   * `viet-bao-cao-khoa-hoc` dùng. Nới kiểu để nhận `points` không được làm hỏng nó.
   */
  it("vẫn render link cho mục dạng { text, href }", () => {
    const html = roadmap({
      curriculum: "sessions",
      phases: [
        {
          name: "Giai đoạn mở đầu",
          sessions: [{ text: "Dịch vụ kiểm tra AI", href: "/dich-vu/kiem-tra-ai" }],
        },
      ],
    });

    expect(html).toContain('href="/dich-vu/kiem-tra-ai"');
    expect(html).toContain("Buổi 1: ");
  });

  it("không in gì thêm cho mục là chuỗi trần", () => {
    const html = roadmap({
      phases: [{ name: "Module gọn", sessions: ["Một mục không có ý con"] }],
    });

    expect(html).toContain("Một mục không có ý con");
    expect(html).not.toContain("<ul");
  });
});
