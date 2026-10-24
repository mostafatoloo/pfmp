/**
 * Chromium HTML→PDF (ADR-004). Import only from worker / Node scripts —
 * never from Next.js route handlers (keeps Playwright out of the web bundle).
 */
import { chromium } from "playwright";

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export function isPdfBuffer(bytes: Buffer): boolean {
  return bytes.length > 4 && bytes.subarray(0, 4).toString("utf8") === "%PDF";
}
