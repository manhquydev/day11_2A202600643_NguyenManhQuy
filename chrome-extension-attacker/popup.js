// Popup script — settings save/load and session stats display

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const apiKeyInput = document.getElementById("api-key");
const teamNameInput = document.getElementById("team-name");
const modelSelect = document.getElementById("model-select");
const loadModelsBtn = document.getElementById("load-models-btn");
const saveBtn = document.getElementById("save-btn");
const status = document.getElementById("status");
const statTotal = document.getElementById("stat-total");
const statLeaks = document.getElementById("stat-leaks");

// Load saved settings on open
chrome.storage.local.get(["apiKey", "teamName", "selectedModel", "sessionStats"], (data) => {
  if (data.apiKey) apiKeyInput.value = data.apiKey;
  if (data.teamName) teamNameInput.value = data.teamName;
  if (data.sessionStats) {
    statTotal.textContent = `${data.sessionStats.total} attacks`;
    statLeaks.textContent = `${data.sessionStats.leaks} leaked`;
  }
  if (data.apiKey) {
    // Silently pre-populate model list using saved key
    fetchAndPopulateModels(data.apiKey, data.selectedModel || "").catch(() => {});
  }
});

loadModelsBtn.addEventListener("click", async () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showStatus("⚠ Enter API key first.", "error");
    return;
  }
  loadModelsBtn.disabled = true;
  loadModelsBtn.textContent = "Loading…";
  try {
    const { selectedModel } = await chrome.storage.local.get("selectedModel");
    await fetchAndPopulateModels(apiKey, selectedModel || "");
    showStatus("✓ Models loaded!", "success");
  } catch (err) {
    showStatus("✗ " + err.message, "error");
  } finally {
    loadModelsBtn.disabled = false;
    loadModelsBtn.textContent = "Load Models";
  }
});

async function fetchAndPopulateModels(apiKey, currentValue) {
  const url = `${GEMINI_API_BASE}?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  const models = (data.models || [])
    .filter(m => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map(m => ({ id: m.name.replace("models/", ""), displayName: m.displayName || m.name.replace("models/", "") }));

  modelSelect.textContent = "";
  modelSelect.disabled = false;
  models.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.displayName;
    if (m.id === currentValue) opt.selected = true;
    modelSelect.appendChild(opt);
  });
  if (!models.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "— no models available —";
    modelSelect.appendChild(opt);
    modelSelect.disabled = true;
  }
}

saveBtn.addEventListener("click", () => {
  const apiKey = apiKeyInput.value.trim();
  const teamName = teamNameInput.value.trim() || "Attacker";
  const selectedModel = modelSelect.value || "";

  if (!apiKey) {
    showStatus("⚠ API key is required for AI generation.", "error");
    return;
  }

  chrome.storage.local.set({ apiKey, teamName, selectedModel }, () => {
    showStatus("✓ Settings saved!", "success");
  });
});

function showStatus(msg, type) {
  status.textContent = msg;
  status.className = `popup-status ${type}`;
  setTimeout(() => { status.textContent = ""; status.className = "popup-status"; }, 2500);
}
