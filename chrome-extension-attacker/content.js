// Content script — entry point injected into Gradio pages
// Waits for Gradio to finish rendering, then injects the attack panel

function isArenaPage() {
  const text = document.title + document.body.innerText;
  return (
    text.includes("Attack") ||
    text.includes("Arena") ||
    text.includes("Attacker") ||
    text.includes("gradio")
  );
}

function init() {
  if (!isArenaPage()) return;
  createPanel();

  // Re-inject if Gradio does a full re-render (SPA navigation)
  const observer = new MutationObserver(() => {
    if (!document.getElementById("arena-attacker-panel")) {
      createPanel();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Gradio renders asynchronously — wait for first meaningful content
if (document.readyState === "complete") {
  setTimeout(init, 1500);
} else {
  window.addEventListener("load", () => setTimeout(init, 1500));
}
