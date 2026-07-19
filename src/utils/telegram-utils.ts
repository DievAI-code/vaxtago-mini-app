export const BOT_USERNAME = "VaxtaGO_bot";

export function isInTelegram(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}

export function getPlatform(): "windows" | "macos" | "linux" | "android" | "ios" | "unknown" {
  const ua = navigator.userAgent;
  const platform = navigator.platform?.toLowerCase() || "";

  if (/windows nt/i.test(ua) || platform.includes("win")) return "windows";
  if (/mac os x/i.test(ua) || platform.includes("mac")) return "macos";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/linux/i.test(ua)) return "linux";
  return "unknown";
}

export function openTelegram(): void {
  const platform = getPlatform();
  const tgUrl = `tg://resolve?domain=${BOT_USERNAME}&startapp`;
  const webUrl = `https://t.me/${BOT_USERNAME}?startapp`;

  if (platform === "android" || platform === "ios") {
    const started = Date.now();
    window.location.href = tgUrl;
    setTimeout(() => {
      if (Date.now() - started < 2000) {
        window.location.href = webUrl;
      }
    }, 1500);
  } else {
    const started = Date.now();
    const newWindow = window.open(tgUrl, "_blank");
    if (!newWindow) {
      window.location.href = tgUrl;
    }
    setTimeout(() => {
      if (Date.now() - started < 2000) {
        window.location.href = webUrl;
      }
    }, 2000);
  }
}