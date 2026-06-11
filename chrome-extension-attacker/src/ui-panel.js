// Floating attack panel — builds Shadow DOM UI, wires up all interactions
// Dynamic content uses DOM methods (not innerHTML) to avoid XSS

const PANEL_ID = "arena-attacker-panel";
const sessionResults = [];
let activeResultCleanup = null;

function createPanel() {
  if (document.getElementById(PANEL_ID)) return;
  const host = document.createElement("div");
  host.id = PANEL_ID;
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href = chrome.runtime.getURL("styles/panel.css");
  shadow.appendChild(styleLink);

  const panel = buildPanelDOM();
  shadow.appendChild(panel);

  makeDraggable(panel, shadow);
  wireEvents(panel, shadow);
}

// ── Static panel shell built with DOM methods ──────────────────────────────

function buildPanelDOM() {
  const panel = el("div", "ap-panel");

  // Header
  const header = el("div", "ap-header");
  const logo = el("span", "ap-logo");
  logo.textContent = "⚔️ Attacker Pro";
  const headerBtns = el("div", "ap-header-btns");
  const minBtn = el("button", "ap-btn-icon ap-minimize");
  minBtn.title = "Minimize";
  minBtn.textContent = "─";
  const closeBtn = el("button", "ap-btn-icon ap-close");
  closeBtn.title = "Close";
  closeBtn.textContent = "✕";
  headerBtns.append(minBtn, closeBtn);
  header.append(logo, headerBtns);

  // Body
  const body = el("div", "ap-body");

  // Main tabs
  const tabBar = el("div", "ap-tabs");
  const tabDefs = [
    { id: "library", label: "Library" },
    { id: "ai",      label: "AI Generate" },
    { id: "results", label: "Results" },
    { id: "settings",label: "Settings" }
  ];
  tabDefs.forEach(({ id, label }, i) => {
    const btn = el("button", `ap-tab${i === 0 ? " active" : ""}`);
    btn.dataset.tab = id;
    btn.textContent = label;
    if (id === "results") {
      const badge = el("span", "ap-badge");
      badge.id = "ap-results-count";
      badge.textContent = "0";
      btn.append(document.createTextNode(" "), badge);
    }
    tabBar.appendChild(btn);
  });
  body.appendChild(tabBar);

  body.appendChild(buildLibraryTab());
  body.appendChild(buildAITab());
  body.appendChild(buildResultsTab());
  body.appendChild(buildSettingsTab());

  panel.append(header, body);
  return panel;
}

function buildLibraryTab() {
  const div = el("div", "ap-tab-content active");
  div.id = "ap-tab-library";

  const catTabs = el("div", "ap-cat-tabs");
  ATTACK_CATEGORIES.forEach((cat, i) => {
    const btn = el("button", `ap-cat-tab${i === 0 ? " active" : ""}`);
    btn.dataset.cat = cat;
    btn.textContent = cat.split(" ")[0];
    catTabs.appendChild(btn);
  });

  const list = el("div", "ap-attacks-list");
  list.id = "ap-attacks-list";
  renderAttackCards(ATTACK_CATEGORIES[0], list);

  const actionBar = el("div", "ap-action-bar");
  const checkLabel = el("label", "ap-checkbox");
  const checkbox = el("input");
  checkbox.type = "checkbox";
  checkbox.id = "ap-auto-submit";
  checkLabel.append(checkbox, document.createTextNode(" Auto-submit"));
  const teamInput = el("input", "ap-input-sm");
  teamInput.id = "ap-team-name";
  teamInput.placeholder = "Team name";
  teamInput.value = "Attacker";
  actionBar.append(checkLabel, teamInput);

  div.append(catTabs, list, actionBar);
  return div;
}

function buildAITab() {
  const div = el("div", "ap-tab-content");
  div.id = "ap-tab-ai";

  const hint = el("p", "ap-hint");
  hint.textContent = "Paste the defender's latest response to generate targeted attacks.";

  const ta = el("textarea", "ap-textarea");
  ta.id = "ap-defender-response";
  ta.rows = 4;
  ta.placeholder = "Paste agent response here…";

  const genBtn = el("button", "ap-btn-primary");
  genBtn.id = "ap-btn-generate";
  genBtn.textContent = "🤖 Generate 5 Attacks";

  const results = el("div", "ap-ai-results");
  results.id = "ap-ai-results";

  div.append(hint, ta, genBtn, results);
  return div;
}

function buildResultsTab() {
  const div = el("div", "ap-tab-content");
  div.id = "ap-tab-results";

  const summary = el("div", "ap-results-summary");
  summary.id = "ap-results-summary";
  summary.textContent = "No attacks yet.";

  const list = el("div", "ap-results-list");
  list.id = "ap-results-list";

  const clearBtn = el("button", "ap-btn-secondary");
  clearBtn.id = "ap-btn-clear-results";
  clearBtn.textContent = "Clear";

  div.append(summary, list, clearBtn);
  return div;
}

function buildSettingsTab() {
  const div = el("div", "ap-tab-content");
  div.id = "ap-tab-settings";

  const lbl = el("label", "ap-label");
  lbl.textContent = "Gemini API Key";

  const inp = el("input", "ap-input");
  inp.id = "ap-api-key";
  inp.type = "password";
  inp.placeholder = "AIza…";

  const saveBtn = el("button", "ap-btn-secondary");
  saveBtn.id = "ap-btn-save-settings";
  saveBtn.textContent = "Save";

  const status = el("p", "ap-hint");
  status.id = "ap-settings-status";

  div.append(lbl, inp, saveBtn, status);
  return div;
}

// ── Attack cards rendered via DOM methods (no innerHTML) ───────────────────

function renderAttackCards(category, container) {
  container.textContent = "";
  getAttacksByCategory(category).forEach(atk => {
    container.appendChild(buildAttackCard(atk));
  });
}

function buildAttackCard(atk) {
  const card = el("div", "ap-card");
  card.dataset.id = atk.id;

  const header = el("div", "ap-card-header");
  const name = el("span", "ap-card-name");
  name.textContent = atk.name;

  const btns = el("div", "ap-card-btns");
  const injectBtn = el("button", "ap-btn-sm ap-btn-inject");
  injectBtn.dataset.id = atk.id;
  injectBtn.title = "Inject into Gradio";
  injectBtn.textContent = "Inject";

  const copyBtn = el("button", "ap-btn-sm ap-btn-copy");
  copyBtn.dataset.id = atk.id;
  copyBtn.title = "Copy to clipboard";
  copyBtn.textContent = "Copy";

  btns.append(injectBtn, copyBtn);
  header.append(name, btns);

  const promptText = el("div", "ap-card-prompt");
  promptText.textContent = atk.prompt.length > 120
    ? atk.prompt.slice(0, 120) + "…"
    : atk.prompt;

  const tip = el("div", "ap-card-tip");
  tip.textContent = "💡 " + atk.tip;

  card.append(header, promptText, tip);
  return card;
}

function buildAIAttackCard(atk, index) {
  const card = el("div", "ap-card");

  const header = el("div", "ap-card-header");
  const name = el("span", "ap-card-name");
  name.textContent = `AI #${index + 1}: ${atk.technique || atk.name || ""}`;

  const useBtn = el("button", "ap-btn-sm ap-btn-use-ai");
  useBtn.textContent = "Use";
  useBtn.dataset.prompt = atk.prompt || "";

  header.append(name, useBtn);

  const promptText = el("div", "ap-card-prompt");
  const full = atk.prompt || "";
  promptText.textContent = full.length > 140 ? full.slice(0, 140) + "…" : full;

  const why = el("div", "ap-card-tip");
  why.textContent = "💡 " + (atk.why || "");

  card.append(header, promptText, why);
  return card;
}

// ── Event wiring ────────────────────────────────────────────────────────────

function wireEvents(panel, shadow) {
  shadow.querySelectorAll(".ap-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      shadow.querySelectorAll(".ap-tab").forEach(t => t.classList.remove("active"));
      shadow.querySelectorAll(".ap-tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      shadow.getElementById(`ap-tab-${tab.dataset.tab}`)?.classList.add("active");
    });
  });

  shadow.querySelectorAll(".ap-cat-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      shadow.querySelectorAll(".ap-cat-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const list = shadow.getElementById("ap-attacks-list");
      if (list) renderAttackCards(tab.dataset.cat, list);
      wireCardButtons(shadow);
    });
  });

  wireCardButtons(shadow);

  shadow.querySelector(".ap-minimize")?.addEventListener("click", () => {
    const body = panel.querySelector(".ap-body");
    if (body) body.style.display = body.style.display === "none" ? "" : "none";
  });

  shadow.querySelector(".ap-close")?.addEventListener("click", () => {
    document.getElementById(PANEL_ID)?.remove();
  });

  shadow.getElementById("ap-btn-generate")?.addEventListener("click", () => handleAIGenerate(shadow));
  shadow.getElementById("ap-btn-save-settings")?.addEventListener("click", () => saveSettings(shadow));
  shadow.getElementById("ap-btn-clear-results")?.addEventListener("click", () => {
    sessionResults.length = 0;
    refreshResults(shadow);
  });

  chrome.storage.local.get(["apiKey", "teamName"], (data) => {
    if (data.apiKey) shadow.getElementById("ap-api-key").value = data.apiKey;
    if (data.teamName) shadow.getElementById("ap-team-name").value = data.teamName;
  });
}

function wireCardButtons(shadow) {
  shadow.querySelectorAll(".ap-btn-inject").forEach(btn => {
    btn.addEventListener("click", async () => {
      const atk = getAttackById(Number(btn.dataset.id));
      if (!atk) return;
      const teamName = shadow.getElementById("ap-team-name")?.value || "Attacker";
      const autoSubmit = shadow.getElementById("ap-auto-submit")?.checked || false;
      btn.textContent = "…";
      const result = await injectAttackPrompt(atk.prompt, teamName, autoSubmit);
      btn.textContent = result.success ? (autoSubmit ? "✓ Sent" : "✓ Injected") : "✗ Err";
      setTimeout(() => { btn.textContent = "Inject"; }, 2000);
      if (autoSubmit && result.success) trackAttackResult(atk, shadow);
    });
  });

  shadow.querySelectorAll(".ap-btn-copy").forEach(btn => {
    btn.addEventListener("click", () => {
      const atk = getAttackById(Number(btn.dataset.id));
      if (!atk) return;
      navigator.clipboard.writeText(atk.prompt)
        .then(() => { btn.textContent = "✓"; setTimeout(() => { btn.textContent = "Copy"; }, 1500); })
        .catch(() => { btn.textContent = "✗"; setTimeout(() => { btn.textContent = "Copy"; }, 1500); });
    });
  });
}

// ── AI Generate handler ─────────────────────────────────────────────────────

async function handleAIGenerate(shadow) {
  const btn = shadow.getElementById("ap-btn-generate");
  const defenderResponse = shadow.getElementById("ap-defender-response")?.value || "";
  const resultsDiv = shadow.getElementById("ap-ai-results");
  const { apiKey } = await chrome.storage.local.get("apiKey");

  if (!apiKey) {
    resultsDiv.textContent = "";
    const warn = el("p", "ap-error");
    warn.textContent = "⚠ Set your Gemini API key in Settings first.";
    resultsDiv.appendChild(warn);
    return;
  }

  btn.disabled = true;
  btn.textContent = "Generating…";
  resultsDiv.textContent = "";
  const hint = el("p", "ap-hint");
  hint.textContent = "Calling Gemini 2.5 Flash…";
  resultsDiv.appendChild(hint);

  try {
    const failed = sessionResults.filter(r => !r.leaked).map(r => ({ prompt: r.prompt }));
    const attacks = await generateTailoredAttacks(apiKey, defenderResponse, failed);

    resultsDiv.textContent = "";
    if (!attacks.length) {
      const err = el("p", "ap-error");
      err.textContent = "No attacks generated — check API key or response.";
      resultsDiv.appendChild(err);
      return;
    }

    attacks.forEach((atk, i) => {
      const card = buildAIAttackCard(atk, i);
      card.querySelector(".ap-btn-use-ai")?.addEventListener("click", async (e) => {
        const prompt = e.target.dataset.prompt;
        const teamName = shadow.getElementById("ap-team-name")?.value || "Attacker";
        await injectAttackPrompt(prompt, teamName, false);
        e.target.textContent = "✓ Injected";
      });
      resultsDiv.appendChild(card);
    });
  } catch (err) {
    resultsDiv.textContent = "";
    const errEl = el("p", "ap-error");
    errEl.textContent = "Error: " + err.message;
    resultsDiv.appendChild(errEl);
  } finally {
    btn.disabled = false;
    btn.textContent = "🤖 Generate 5 Attacks";
  }
}

// ── Results tracking ────────────────────────────────────────────────────────

function trackAttackResult(atk, shadow) {
  if (activeResultCleanup) { activeResultCleanup(); activeResultCleanup = null; }
  activeResultCleanup = watchForResult((result) => {
    sessionResults.unshift({
      id: atk.id,
      name: atk.name,
      prompt: atk.prompt,
      leaked: result.leaked,
      response: result.text?.slice(0, 200) || "",
      time: new Date().toLocaleTimeString()
    });
    activeResultCleanup = null;
    refreshResults(shadow);
  });
}

function refreshResults(shadow) {
  const count = shadow.getElementById("ap-results-count");
  const summary = shadow.getElementById("ap-results-summary");
  const list = shadow.getElementById("ap-results-list");
  if (!list) return;

  const total = sessionResults.length;
  const leaks = sessionResults.filter(r => r.leaked).length;

  if (count) count.textContent = total;

  if (summary) {
    summary.textContent = "";
    if (total) {
      const strong1 = el("strong"); strong1.textContent = `${leaks}/${total}`;
      const strong2 = el("strong"); strong2.textContent = `${Math.round(leaks / total * 100)}%`;
      summary.append(strong1, document.createTextNode(" leaked — win rate "), strong2);
    } else {
      summary.textContent = "No attacks yet.";
    }
  }

  list.textContent = "";
  sessionResults.forEach(r => {
    const row = el("div", `ap-result ${r.leaked ? "leaked" : "blocked"}`);
    const badge = el("span", "ap-result-badge");
    badge.textContent = r.leaked ? "🔴 LEAKED" : "🟢 BLOCKED";
    const name = el("span", "ap-result-name");
    name.textContent = r.name;
    const time = el("span", "ap-result-time");
    time.textContent = r.time;
    row.append(badge, name, time);
    list.appendChild(row);
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function saveSettings(shadow) {
  const apiKey = shadow.getElementById("ap-api-key")?.value.trim();
  const teamName = shadow.getElementById("ap-team-name")?.value.trim();
  const status = shadow.getElementById("ap-settings-status");
  if (!apiKey) {
    if (status) status.textContent = "⚠ API key cannot be empty.";
    return;
  }
  chrome.storage.local.set({ apiKey, teamName }, () => {
    if (status) {
      status.textContent = "✓ Saved!";
      setTimeout(() => { status.textContent = ""; }, 2000);
    }
  });
}

function makeDraggable(panel, shadow) {
  const header = panel.querySelector(".ap-header");
  if (!header) return;
  let dragging = false, ox = 0, oy = 0;
  header.addEventListener("mousedown", e => {
    dragging = true;
    const rect = panel.getBoundingClientRect();
    ox = e.clientX - rect.left;
    oy = e.clientY - rect.top;
  });
  document.addEventListener("mousemove", e => {
    if (!dragging) return;
    panel.style.left = `${e.clientX - ox}px`;
    panel.style.top = `${e.clientY - oy}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  });
  document.addEventListener("mouseup", () => { dragging = false; });
}

function el(tag, className = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}
