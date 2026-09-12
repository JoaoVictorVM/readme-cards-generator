import { describe, expect, test } from "bun:test";
import { escapeXml } from "@/lib/card/escape-xml";

describe("escapeXml", () => {
  test("escapes five significant characters", () => {
    expect(escapeXml(`a<b>&c"d'e`)).toBe("a&lt;b&gt;&amp;c&quot;d&#39;e");
  });

  test("ampersand is escaped even when entity like", () => {
    expect(escapeXml("&amp;")).toBe("&amp;amp;");
    expect(escapeXml("&#39;")).toBe("&amp;#39;");
  });

  test("strips illegal control characters", () => {
    const input = "a\u0000b\u0001c\u0008d\u000be\u000cf\u001fg\ufffeh\uffffi";
    expect(escapeXml(input)).toBe("abcdefghi");
    expect(escapeXml("x\ty\nz\rw")).toBe("x\ty\nz\rw");
  });

  test("unicode text passes through", () => {
    const input = "repositório-ção 日本語 🚀";
    expect(escapeXml(input)).toBe(input);
  });

  test("empty string returns empty", () => {
    expect(escapeXml("")).toBe("");
  });
});
