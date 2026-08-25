"use client";

import { useEffect } from "react";

/**
 * Gắn JSON-LD vào head sau hydration. Cách này tránh để một thẻ script nằm
 * trong React tree khi điều hướng client — trường hợp Next dev sẽ ghi lỗi dù
 * script chỉ mang dữ liệu và không thực thi mã.
 */
export function StructuredData({ id, data }: { id: string; data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  useEffect(() => {
    const script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.text = json;
    document.head.appendChild(script);
    return () => script.remove();
  }, [id, json]);

  return null;
}
