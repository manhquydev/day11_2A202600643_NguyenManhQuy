// Popup script — settings save/load and session stats display

const apiKeyInput = document.getElementById("api-key");
const teamNameInput = document.getElementById("team-name");
const saveBtn = document.getElementById("save-btn");
const status = document.getElementById("status");
const statTotal = document.getElementById("stat-total");
const statLeaks = document.getElementById("stat-leaks");

// Load saved settings on open
chrome.storage.local.get(["apiKey", "teamName", "sessionStats"], (data) => {
  if (data.apiKey) apiKeyInput.value = data.apiKey;
  if (data.teamName) teamNameInput.value = data.teamName;
  if (data.sessionStats) {
    statTotal.textContent = `${data.sessionStats.total} attacks`;
    statLeaks.textContent = `${data.sessionStats.leaks} leaked`;
  }
});

saveBtn.addEventListener("click", () => {
  const apiKey = apiKeyInput.value.trim();
  const teamName = teamNameInput.value.trim() || "Attacker";

  if (!apiKey) {
    showStatus("⚠ API key is required for AI generation.", "error");
    return;
  }

  chrome.storage.local.set({ apiKey, teamName }, () => {
    showStatus("✓ Settings saved!", "success");
  });
});

function showStatus(msg, type) {
  status.textContent = msg;
  status.className = `popup-status ${type}`;
  setTimeout(() => { status.textContent = ""; status.className = "popup-status"; }, 2500);
}
