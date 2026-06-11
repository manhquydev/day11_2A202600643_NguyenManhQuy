// Content script — entry point injected into Gradio pages
// Waits for Gradio to finish rendering, then injects the attack panel

function isArenaPage() {
  const text = (document.title + " " + document.body.innerText).toLowerCase();
  return (
    text.includes("attack") ||
    text.includes("arena") ||
    text.includes("gradio") ||
    text.includes("defender") ||
    text.includes("secret")
  );
}

function tryInit(attempts) {
  if (document.getElementById("arena-attacker-panel")) return;
  console.log("[ArenaAttacker] tryInit attempts=" + attempts + " isArena=" + isArenaPage());
  if (isArenaPage()) {
    createPanel();
    // Re-inject if Gradio does a full re-render (SPA navigation)
    const observer = new MutationObserver(() => {
      if (!document.getElementById("arena-attacker-panel") && isArenaPage()) {
        createPanel();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return;
  }
  // Gradio renders slowly — retry up to 5 times with increasing delays
  if (attempts > 0) {
    setTimeout(() => tryInit(attempts - 1), 1500);
  }
}

// Gradio renders asynchronously — start after load, retry if not ready
if (document.readyState === "complete") {
  setTimeout(() => tryInit(5), 500);
} else {
  window.addEventListener("load", () => setTimeout(() => tryInit(5), 500));
}
