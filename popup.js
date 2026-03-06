// URL Blocker - Popup Script
var enabled = true;

document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  
  document.getElementById('toggleBtn').addEventListener('click', toggleBlocking);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
});

function loadSettings() {
  chrome.storage.sync.get(['enabled', 'blockCount'], function(result) {
    enabled = result.enabled !== undefined ? result.enabled : true;
    var blockCount = result.blockCount || 0;
    
    updateUI(blockCount);
  });
}

function updateUI(blockCount) {
  var statusText = document.getElementById('statusText');
  var toggleBtn = document.getElementById('toggleBtn');
  var counterValue = document.getElementById('blockCount');
  
  if (enabled) {
    statusText.textContent = '✅ Enabled';
    statusText.classList.remove('disabled');
    statusText.classList.add('enabled');
    toggleBtn.textContent = 'Disable';
  } else {
    statusText.textContent = '⛔ Disabled';
    statusText.classList.remove('enabled');
    statusText.classList.add('disabled');
    toggleBtn.textContent = 'Enable';
  }
  
  counterValue.textContent = blockCount;
}

function toggleBlocking() {
  enabled = !enabled;
  chrome.storage.sync.set({ enabled: enabled }, function() {
    updateUI();
    // Reload the popup to show immediate changes
    window.close();
  });
}

function openSettings() {
   chrome.runtime.openOptionsPage();
   window.close();
 }

// Listen for storage changes to update UI
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && changes.enabled) {
    enabled = changes.enabled.newValue;
    loadSettings();
  }
});
