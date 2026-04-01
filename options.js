// URL Blocker - Options Script
var blockList = [];
var enabled = true;
var cloudSyncUrl = 'https://raw.githubusercontent.com/Cozmi-Me/Page-Blocker/refs/heads/main/Cloud-Block-List.txt';
var syncInterval = 1;

document.addEventListener('DOMContentLoaded', function() {
  loadSettings();
  
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('resetBtn').addEventListener('click', resetDefaults);
  document.getElementById('syncNowBtn').addEventListener('click', syncNow);
});

var defaultBlockPatterns = [
  '# Default block patterns for advertisements',
  '# Add your own patterns below, one per line',
  '# Lines starting with # are comments',
  'ads\\.example\\.com',
  'doubleclick\\.net',
  'google-analytics\\.com',
  'googlesyndication\\.com',
  'ad\\.network\\.com'
];

function loadSettings() {
  chrome.storage.sync.get(['enabled', 'cloudSyncUrl', 'syncInterval'], function(result) {
    enabled = result.enabled !== undefined ? result.enabled : true;
    cloudSyncUrl = result.cloudSyncUrl || 'https://raw.githubusercontent.com/Cozmi-Me/Page-Blocker/refs/heads/main/Cloud-Block-List.txt';
    syncInterval = result.syncInterval || 1;
    
    // Load local block list
    chrome.storage.local.get(['blockList'], function(localResult) {
      if (localResult.blockList && localResult.blockList.length > 0) {
        blockList = localResult.blockList;
      } else {
        blockList = defaultBlockPatterns.slice();
      }
      updateUI();
    });
  });
}

function updateUI() {
  document.getElementById('syncEnabled').checked = !!cloudSyncUrl;
  document.getElementById('cloudSyncUrl').value = cloudSyncUrl || '';
  document.getElementById('syncInterval').value = syncInterval;
  document.getElementById('blockList').value = blockList.join('\n');
}

function saveSettings() {
  var syncEnabled = document.getElementById('syncEnabled').checked;
  cloudSyncUrl = syncEnabled ? document.getElementById('cloudSyncUrl').value.trim() : '';
  syncInterval = parseInt(document.getElementById('syncInterval').value) || 1;
  
  // Parse and validate block list
  var blockListText = document.getElementById('blockList').value;
  blockList = blockListText.split('\n');
  
  // Validate regex patterns
  var activePatterns = blockList.filter(function(line) {
    return line && !line.startsWith('#');
  });
  for (var i = 0; i < activePatterns.length; i++) {
    try {
      new RegExp(activePatterns[i]);
    } catch (e) {
      showSyncStatus('Invalid regex pattern: ' + activePatterns[i], 'error');
      return;
    }
  }
  
  chrome.storage.sync.set({
    enabled: enabled,
    cloudSyncUrl: cloudSyncUrl,
    syncInterval: syncInterval
  }, function() {
    chrome.storage.local.set({ blockList: blockList }, function() {
      showSyncStatus('Settings saved successfully!', 'success');
      
      // Blink yellow to indicate settings update
      chrome.action.setIcon({
        path: {
          16: 'icons/yellow-16.png',
          48: 'icons/yellow-48.png',
          128: 'icons/yellow-128.png'
        }
      });
      setTimeout(function() {
        chrome.action.setIcon({
          path: {
            16: 'icons/green-16.png',
            48: 'icons/green-48.png',
            128: 'icons/green-128.png'
          }
        });
      }, 250);
      
      // Reload the options page after 2 seconds
      setTimeout(function() {
        window.close();
      }, 2000);
    });
  });
}

function resetDefaults() {
  blockList = defaultBlockPatterns.slice();
  document.getElementById('blockList').value = blockList.join('\n');
  showSyncStatus('Block list reset to defaults', 'info');
}

function syncNow() {
  var syncStatus = document.getElementById('syncStatus');
  var syncEnabled = document.getElementById('syncEnabled').checked;
  var url = document.getElementById('cloudSyncUrl').value.trim();
  
  if (!syncEnabled || !url) {
    showSyncStatus('Cloud sync is not enabled or URL is empty', 'info');
    return;
  }
  
  // Blink yellow icon to indicate sync is starting
  chrome.action.setIcon({
    path: {
      16: 'icons/yellow-16.png',
      48: 'icons/yellow-48.png',
      128: 'icons/yellow-128.png'
    }
  });
  
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        var text = xhr.responseText;
        var lines = text.split('\n').map(function(line) { return line.trim(); });
        
        // Validate patterns
        for (var i = 0; i < lines.length; i++) {
          if (lines[i] && !lines[i].startsWith('#')) {
            new RegExp(lines[i]);
          }
        }
        
        chrome.storage.sync.set({ cloudBlockList: lines }, function() {
          showSyncStatus('Cloud block list synced successfully!', 'success');
          // Restore icon after blink
          setTimeout(function() {
            chrome.action.setIcon({
              path: {
                16: 'icons/green-16.png',
                48: 'icons/green-48.png',
                128: 'icons/green-128.png'
              }
            });
          }, 250);
        });
      } else {
        showSyncStatus('Failed to sync cloud block list', 'error');
      }
    }
  };
  xhr.send();
}

function showSyncStatus(message, type) {
  var syncStatus = document.getElementById('syncStatus');
  syncStatus.textContent = message;
  syncStatus.className = 'sync-status sync-' + type;
  syncStatus.style.display = 'block';
  
  // Hide after 3 seconds
  setTimeout(function() {
    syncStatus.style.display = 'none';
  }, 3000);
}

// Listen for storage changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync') {
    if (changes.cloudSyncUrl) {
      cloudSyncUrl = changes.cloudSyncUrl.newValue;
    }
    if (changes.syncInterval) {
      syncInterval = changes.syncInterval.newValue;
    }
  }
});
