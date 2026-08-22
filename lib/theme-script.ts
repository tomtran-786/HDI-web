/**
 * Script chạy trước khi paint để người dùng dark-mode không thấy một nháy trắng.
 *
 * Sống ở đây, không nằm inline trong app/layout.tsx, vì next.config.ts phải băm
 * đúng chuỗi này để đưa hash vào CSP. Hai bản sao của cùng một script là cách
 * chắc chắn nhất để CSP âm thầm chặn nó sau một lần sửa vu vơ.
 */
export const themeBootstrap = `try {
  var stored = localStorage.getItem("hdi-theme");
  var dark = stored ? stored === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (dark) document.documentElement.classList.add("dark");
} catch (e) {}`;
