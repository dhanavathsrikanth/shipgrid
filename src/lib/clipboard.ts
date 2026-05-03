// Safe clipboard helper that gracefully handles permission errors,
// insecure contexts, and browsers without the async Clipboard API.
// Falls back to a hidden <textarea> + execCommand approach.

export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern async API (only works in secure contexts and with permission)
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or focused element issue — fall through to legacy.
    }
  }

  // Legacy fallback using a temporary textarea
  if (typeof document === "undefined") return false;

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
