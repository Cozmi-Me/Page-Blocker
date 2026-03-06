// URL Blocker - Background Page Script (Manifest V2 compatible)
// Handles request blocking and cloud sync

var blockList = [];
var cloudBlockList = [];
var enabled = true;
var cloudSyncUrl = '';
var syncInterval = 3600000; // Default 1 hour
var lastSyncTime = 0;
var blockCount = 0;

// Default block patterns for advertisements
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

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(['enabled', 'cloudSyncUrl', 'syncInterval', 'cloudBlockList', 'blockCount'], function(result) {
    enabled = result.enabled !== undefined ? result.enabled : true;
    cloudSyncUrl = result.cloudSyncUrl || '';
    syncInterval = result.syncInterval || 3600000;
    blockCount = result.blockCount || 0;
    if (result.cloudBlockList) {
      cloudBlockList = result.cloudBlockList;
    }
    updateToolbarIcon();
  });
}

// Load local block list
function loadBlockList() {
  chrome.storage.local.get(['blockList'], function(result) {
    if (result.blockList && result.blockList.length > 0) {
      blockList = result.blockList;
    } else {
      // Initialize with default patterns
      blockList = defaultBlockPatterns.slice();
      chrome.storage.local.set({ blockList: blockList });
    }
    console.log('URL Blocker: Loaded ' + blockList.length + ' block list patterns');
    updateToolbarIcon();
  });
}

// Parse block patterns (filter out comments and empty lines)
function getActivePatterns(list) {
  return list.filter(function(line) {
    return line && !line.startsWith('#');
  });
}

// Check if URL matches any blocked pattern
function isUrlBlocked(url) {
  var patterns = getActivePatterns(blockList);
  var cloudPatterns = getActivePatterns(cloudBlockList);
  var allPatterns = patterns.concat(cloudPatterns);
  
  for (var i = 0; i < allPatterns.length; i++) {
    var pattern = allPatterns[i];
    try {
      var regex = new RegExp(pattern);
      if (regex.test(url)) {
        return { blocked: true, pattern: pattern };
      }
    } catch (e) {
      // Invalid regex, skip this pattern
    }
  }
  return { blocked: false, pattern: null };
}

// Sync cloud block list
function syncCloudBlockList() {
  if (!cloudSyncUrl) return;
  
  // Blink yellow to indicate sync is starting
  blinkYellowIcon();
  
  var xhr = new XMLHttpRequest();
  xhr.open('GET', cloudSyncUrl, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        var text = xhr.responseText;
        var lines = text.split('\n').map(function(line) { return line.trim(); });
        cloudBlockList = lines;
        chrome.storage.sync.set({ cloudBlockList: cloudBlockList });
        console.log('URL Blocker: Cloud block list synced successfully from ' + cloudSyncUrl);
      } else {
        console.log('URL Blocker: Failed to sync cloud block list, status: ' + xhr.status);
      }
    }
  };
  xhr.send();
}

// Update toolbar icon based on status
function updateToolbarIcon() {
  var now = Date.now();
  var iconFile;
  
  if (!enabled) {
    iconFile = 'grey';
  } else {
    iconFile = 'green';
  }
  
   chrome.browserAction.setIcon({
     path: {
       16: 'icons/' + iconFile + '-16.png',
       48: 'icons/' + iconFile + '-48.png',
       128: 'icons/' + iconFile + '-128.png'
     }
   });
}

// Blink red icon for blocking action
function blinkRedIcon() {
  chrome.browserAction.setIcon({
    path: {
      16: 'icons/red-16.png',
      48: 'icons/red-48.png',
      128: 'icons/red-128.png'
    }
  });
  setTimeout(function() {
    updateToolbarIcon();
  }, 250);
}

// Blink yellow icon for sync operations
function blinkYellowIcon() {
  chrome.browserAction.setIcon({
    path: {
      16: 'icons/yellow-16.png',
      48: 'icons/yellow-48.png',
      128: 'icons/yellow-128.png'
    }
  });
  setTimeout(function() {
    updateToolbarIcon();
  }, 250);
}

// Block request
function blockRequest(details) {
  if (!enabled) return { cancel: false };
  
  var result = isUrlBlocked(details.url);
  if (result.blocked) {
    blockCount++;
    lastSyncTime = Date.now();
    // Persist block count to storage
    chrome.storage.sync.set({ blockCount: blockCount });
    // Blink red to indicate blocking action
    blinkRedIcon();
    console.log('URL Blocker: Blocked "' + details.url + '" matching pattern "' + result.pattern + '"');
    return { cancel: true };
  }
  
  return { cancel: false };
}

// Set up request listener
chrome.webRequest.onBeforeRequest.addListener(
  blockRequest,
  { urls: ['<all_urls>'] },
  ['blocking']
);

// Handle storage changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync') {
    if (changes.enabled) {
      enabled = changes.enabled.newValue;
      updateToolbarIcon();
    }
    if (changes.cloudSyncUrl) {
      cloudSyncUrl = changes.cloudSyncUrl.newValue;
    }
    if (changes.syncInterval) {
      syncInterval = changes.syncInterval.newValue;
    }
    if (changes.cloudBlockList) {
      cloudBlockList = changes.cloudBlockList.newValue;
      console.log('URL Blocker: Cloud block list updated from sync storage');
    }
  } else if (namespace === 'local') {
    if (changes.blockList) {
      blockList = changes.blockList.newValue;
      console.log('URL Blocker: Local block list updated with ' + blockList.length + ' patterns');
    }
  }
});

// Initialize
loadSettings();
loadBlockList();

// Log initialization
console.log('URL Blocker: Extension initialized. Enabled: ' + enabled);

// Sync cloud block list periodically
setInterval(function() {
  if (cloudSyncUrl) {
    syncCloudBlockList();
  }
}, syncInterval);

// Initial sync
syncCloudBlockList();
