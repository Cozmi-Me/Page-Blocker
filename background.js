// URL Blocker - Background Service Worker (Manifest V3)

var blockList = [];
var cloudBlockList = [];
var enabled = true;
var cloudSyncUrl = '';
var syncIntervalHours = 1; // Default 1 hour
var blockCount = 0;

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
  chrome.storage.sync.get(['enabled', 'cloudSyncUrl', 'syncInterval', 'cloudBlockList', 'blockCount'], function(result) {
    enabled = result.enabled !== undefined ? result.enabled : true;
    cloudSyncUrl = result.cloudSyncUrl || '';
    // options.js saves syncInterval in hours
    syncIntervalHours = result.syncInterval || 1;
    blockCount = result.blockCount || 0;
    if (result.cloudBlockList) {
      cloudBlockList = result.cloudBlockList;
    }
    updateToolbarIcon();
    setupAlarms();
  });
}

function loadBlockList() {
  chrome.storage.local.get(['blockList'], function(result) {
    if (result.blockList && result.blockList.length > 0) {
      blockList = result.blockList;
    } else {
      blockList = defaultBlockPatterns.slice();
      chrome.storage.local.set({ blockList: blockList });
    }
    updateRules();
    updateToolbarIcon();
  });
}

function getActivePatterns(list) {
  return list.filter(function(line) {
    return line && !line.startsWith('#');
  });
}

let updateRulesPromise = Promise.resolve();

function updateRules() {
  updateRulesPromise = updateRulesPromise.then(async () => {
    try {
      const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
      const oldRuleIds = oldRules.map(rule => rule.id);

      if (!enabled) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: oldRuleIds,
          addRules: []
        });
        return;
      }

      var patterns = getActivePatterns(blockList);
      var cloudPatterns = getActivePatterns(cloudBlockList);
      var allPatterns = patterns.concat(cloudPatterns);
      
      // Deduplicate patterns just in case
      allPatterns = [...new Set(allPatterns)];
      
      var newRules = [];
      var currentId = 1;
      
      for (var i = 0; i < allPatterns.length; i++) {
        var pattern = allPatterns[i];
        try {
          newRules.push({
            id: currentId++,
            priority: 1,
            action: { type: 'block' },
            condition: { regexFilter: pattern }
          });
        } catch (e) {
          // Invalid regex for DNR, skip
        }
      }
      
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRuleIds,
        addRules: newRules
      });
    } catch (err) {
      console.error('Error updating rules:', err);
    }
  });
  return updateRulesPromise;
}

async function syncCloudBlockList() {
  if (!cloudSyncUrl) return;
  
  blinkYellowIcon();
  
  try {
    const response = await fetch(cloudSyncUrl);
    if (response.ok) {
      const text = await response.text();
      var lines = text.split('\n').map(function(line) { return line.trim(); });
      cloudBlockList = lines;
      chrome.storage.sync.set({ cloudBlockList: cloudBlockList });
      updateRules();
      console.log('URL Blocker: Cloud block list synced successfully');
    }
  } catch (e) {
    console.error('URL Blocker: Failed to sync cloud block list', e);
  }
}

function updateToolbarIcon() {
  var iconFile = enabled ? 'green' : 'grey';
  if (chrome.action) {
    chrome.action.setIcon({
      path: {
        16: 'icons/' + iconFile + '-16.png',
        48: 'icons/' + iconFile + '-48.png',
        128: 'icons/' + iconFile + '-128.png'
      }
    });
  }
}

function blinkRedIcon() {
  if (chrome.action) {
    chrome.action.setIcon({
      path: {
        16: 'icons/red-16.png',
        48: 'icons/red-48.png',
        128: 'icons/red-128.png'
      }
    });
    setTimeout(updateToolbarIcon, 250);
  }
}

function blinkYellowIcon() {
  if (chrome.action) {
    chrome.action.setIcon({
      path: {
        16: 'icons/yellow-16.png',
        48: 'icons/yellow-48.png',
        128: 'icons/yellow-128.png'
      }
    });
    setTimeout(updateToolbarIcon, 250);
  }
}

function setupAlarms() {
  chrome.alarms.clear('syncAlarm', () => {
    if (cloudSyncUrl) {
      let intervalInMinutes = syncIntervalHours * 60;
      if (intervalInMinutes < 1) intervalInMinutes = 1;
      chrome.alarms.create('syncAlarm', { periodInMinutes: intervalInMinutes });
    }
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncAlarm') {
    syncCloudBlockList();
  }
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync') {
    if (changes.enabled) {
      enabled = changes.enabled.newValue;
      updateToolbarIcon();
      updateRules();
    }
    if (changes.cloudSyncUrl) {
      cloudSyncUrl = changes.cloudSyncUrl.newValue;
      setupAlarms();
    }
    if (changes.syncInterval) {
      syncIntervalHours = changes.syncInterval.newValue;
      setupAlarms();
    }
    if (changes.cloudBlockList) {
      cloudBlockList = changes.cloudBlockList.newValue;
      updateRules();
    }
  } else if (namespace === 'local') {
    if (changes.blockList) {
      blockList = changes.blockList.newValue;
      updateRules();
    }
  }
});

// Update block count if debugging is possible, otherwise we just keep rules active
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    blockCount++;
    chrome.storage.sync.set({ blockCount: blockCount });
    blinkRedIcon();
  });
}

// Initialize
loadSettings();
loadBlockList();
syncCloudBlockList();
