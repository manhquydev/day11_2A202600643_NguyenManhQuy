// Gradio UI bridge — finds elements and simulates user input
// Gradio uses Svelte; setting textarea value requires native setter + input event

function setNativeValue(element, value) {
  const tag = element.tagName.toLowerCase();
  const proto = tag === "textarea"
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) {
    setter.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

// Find the currently visible/active Gradio tab panel
function getActiveTabPanel() {
  const panels = document.querySelectorAll(".tabitem");
  for (const panel of panels) {
    if (panel.style.display !== "none" && !panel.hidden) return panel;
  }
  return document.body;
}

// Find a textarea in the active tab by label text or placeholder
function findTextarea(labelHint) {
  const scope = getActiveTabPanel();
  const labels = scope.querySelectorAll("label span, .label-wrap span");
  for (const label of labels) {
    if (label.textContent.toLowerCase().includes(labelHint.toLowerCase())) {
      const wrapper = label.closest(".block, .form");
      if (wrapper) {
        const ta = wrapper.querySelector("textarea");
        if (ta) return ta;
      }
    }
  }
  // Fallback: any visible textarea
  const all = scope.querySelectorAll("textarea");
  for (const ta of all) {
    if (ta.offsetParent !== null) return ta;
  }
  return null;
}

// Find a text input by label hint
function findInput(labelHint) {
  const scope = getActiveTabPanel();
  const labels = scope.querySelectorAll("label span, .label-wrap span");
  for (const label of labels) {
    if (label.textContent.toLowerCase().includes(labelHint.toLowerCase())) {
      const wrapper = label.closest(".block, .form");
      if (wrapper) {
        const inp = wrapper.querySelector("input[type=text], input:not([type])");
        if (inp) return inp;
      }
    }
  }
  return null;
}

// Find a button by its text content
function findButton(textHint) {
  const buttons = document.querySelectorAll("button");
  for (const btn of buttons) {
    if (btn.textContent.trim().toLowerCase().includes(textHint.toLowerCase())) {
      return btn;
    }
  }
  return null;
}

// Navigate to the Attacker tab in the Gradio arena UI
function switchToAttackerTab() {
  const tabs = document.querySelectorAll(".tab-nav button, [role=tab]");
  for (const tab of tabs) {
    if (tab.textContent.includes("Attacker") || tab.textContent.includes("⚔")) {
      tab.click();
      return true;
    }
  }
  return false;
}

// Inject a prompt into the Gradio Attacker tab and optionally submit
async function injectAttackPrompt(prompt, teamName, autoSubmit = false) {
  switchToAttackerTab();
  await sleep(300);

  // Set team name
  if (teamName) {
    const teamInput = findInput("team");
    if (teamInput) setNativeValue(teamInput, teamName);
  }

  // Set attack prompt
  const attackTA = findTextarea("attack") || findTextarea("prompt");
  if (!attackTA) {
    return { success: false, error: "Could not find attack prompt textarea" };
  }
  setNativeValue(attackTA, prompt);
  await sleep(100);

  if (autoSubmit) {
    const attackBtn = findButton("attack") || findButton("⚔");
    if (!attackBtn) {
      return { success: false, error: "Could not find Attack button" };
    }
    attackBtn.click();
    return { success: true, submitted: true };
  }

  return { success: true, submitted: false };
}

// Read the latest result from the Gradio output area
function readLatestResult() {
  const scope = getActiveTabPanel();
  const markdowns = scope.querySelectorAll(".prose, .markdown, [data-testid='markdown']");
  for (const el of markdowns) {
    const text = el.textContent || "";
    if (text.includes("LEAKED") || text.includes("BLOCKED") || text.includes("Round")) {
      return { text, leaked: text.includes("LEAKED") };
    }
  }
  return null;
}

// Observe the result area for new responses (returns cleanup fn)
function watchForResult(callback, timeoutMs = 30000) {
  const scope = getActiveTabPanel();
  let resolved = false;

  const observer = new MutationObserver(() => {
    const result = readLatestResult();
    if (result && !resolved) {
      resolved = true;
      observer.disconnect();
      callback(result);
    }
  });

  observer.observe(scope, { childList: true, subtree: true, characterData: true });

  const timer = setTimeout(() => {
    if (!resolved) {
      resolved = true;
      observer.disconnect();
      callback({ text: "Timeout — no response detected", leaked: false, timedOut: true });
    }
  }, timeoutMs);

  return () => { observer.disconnect(); clearTimeout(timer); };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
