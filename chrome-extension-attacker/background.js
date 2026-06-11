// Service worker — handles extension lifecycle and storage defaults

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["apiKey", "teamName"], (data) => {
    const defaults = {};
    if (!data.teamName) defaults.teamName = "Attacker";
    if (Object.keys(defaults).length) {
      chrome.storage.local.set(defaults);
    }
  });
});
