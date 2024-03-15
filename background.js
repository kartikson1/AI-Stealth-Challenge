/*
This is the background script for the extension, it runs in the background of the browser.

Video tutorial: https://vimeo.com/923628666

Goal: Ensure that there is a continuous stream of timestamps logged from contentScript.js

Rules:
You can only change one file: this background.js file.
When testing your code we will use the original files and only update the background.js file.

Testing: Use this site for easy testing https://ai-stealth-challenge.tiiny.site/

Hint: The solution is only a few lines of code.
*/

console.log("background.js running"); // background console logs can be found by inspecting the extension in chrome://extensions > developer mode > then click on "service worker" > then go to console

/* YOUR CODE BELOW THIS LINE :) */

// **1. Keep-alive connection (might be detectable):**
var connection = new WebSocket("ws://localhost:8080");

connection.onopen = function () {
  setInterval(() => {
    console.log("Sending keep-alive message");
    connection.send("keep-alive");
  }, 1000);
};

connection.onerror = function (error) {
  console.error("WebSocket Error: ", error);
};

connection.onmessage = function (e) {
  console.log("Server: ", e.data);
};

// **2. Chrome Alarms (limited effectiveness):**
chrome.alarms.create("keepActive", { delayInMinutes: 1, periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === "keepActive") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {
        message: "simulate_user_activity",
      });
    });
  }
});

// **3. Simulate user activity (limited effectiveness):**
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "simulate_user_activity") {
    var code = `document.dispatchEvent(new MouseEvent('mousemove'));`;
    chrome.tabs.executeScript(sender.tab.id, { code: code });
  }
});

// **4. Tab activation (might be detectable):**
chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    if (!tab.active) {
      chrome.tabs.update(tab.id, { active: true });
    }
  });
});

// **5. Monkey Patch requestAnimationFrame (limited effectiveness):**
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" && tab.url.includes("http")) {
    // Ensure it's a valid http(s) page
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: patchRequestAnimationFrame,
    });
  }
});

function patchRequestAnimationFrame() {
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = function (callback) {
    setTimeout(callback, 16);
    return originalRequestAnimationFrame(callback);
  };
}

// **6. Background script communication (might be detectable):**
// (Needs contentScript.js modification)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "log_timestamp") {
    console.log("Received timestamp request from content script");
    sendResponse({ timestamp: new Date().toLocaleTimeString() });
  }
});

// **7. High-frequency timers (experimental and might be detectable):**
setInterval(() => {
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach((tab) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: highFrequencyTimer,
      });
    });
  });
}, 1000);

function highFrequencyTimer() {
  if (document.visibilityState !== "visible") {
    console.log("Tab is inactive, performing operations");
    console.log(new Date().toLocaleTimeString());
  }
}

// **8. Visibility API with throttling (might be detectable):**
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "hidden") {
            console.log("Tab is inactive, low-impact operations");
            console.log(new Date().toLocaleTimeString());
          }
        });
      },
    });
  }
});
