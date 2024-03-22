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

// WebRTC
const peerConnection = new RTCPeerConnection();

const signalingServerUrl =
  "wss://agile-retreat-37410-5794244e8e2a.herokuapp.com";
const signalingSocket = new WebSocket(signalingServerUrl);

signalingSocket.onopen = () => {
  console.log("Connected to signaling server");
  peerConnection.createOffer().then((offer) => {
    peerConnection
      .setLocalDescription(offer)
      .then(() => {
        signalingSocket.send(
          JSON.stringify({
            type: "offer",
            payload: peerConnection.localDescription,
          })
        );
      })
      .catch((error) => console.error(error));
  });
};

const dataChannel = peerConnection.createDataChannel("keepAlive");

dataChannel.onopen = () => {
  console.log("WebRTC data channel opened");
  setInterval(() => {
    dataChannel.send("ping");
  }, 1000);
};

// Handle incoming WebRTC signals
signalingSocket.onmessage = (event) => {
  const signal = JSON.parse(event.data);

  if (signal.type === "offer") {
    peerConnection
      .setRemoteDescription(new RTCSessionDescription(signal.payload))
      .then(() => {
        peerConnection.createAnswer().then((answer) => {
          peerConnection
            .setLocalDescription(answer)
            .then(() => {
              signalingSocket.send(
                JSON.stringify({
                  type: "answer",
                  payload: peerConnection.localDescription,
                })
              );
            })
            .catch((error) => console.error(error));
        });
      })
      .catch((error) => console.error(error));
  } else if (signal.type === "answer") {
    peerConnection
      .setRemoteDescription(new RTCSessionDescription(signal.payload))
      .catch((error) => console.error(error));
  } else if (signal.type === "candidate") {
    peerConnection
      .addIceCandidate(new RTCIceCandidate(signal.payload))
      .catch((error) => console.error(error));
  }
};

/*
Not deleting old code for reference
*/

// // **1. Keep-alive connection (might be detectable):**
// var connection = new WebSocket("ws://localhost:8080");

// connection.onopen = function () {
//   setInterval(() => {
//     console.log("Sending keep-alive message");
//     connection.send("keep-alive");
//   }, 1000);
// };

// connection.onerror = function (error) {
//   console.error("WebSocket Error: ", error);
// };

// connection.onmessage = function (e) {
//   console.log("Server: ", e.data);
// };

// // **2. Chrome Alarms (limited effectiveness):**
// chrome.alarms.create("keepActive", { delayInMinutes: 1, periodInMinutes: 1 });
// chrome.alarms.onAlarm.addListener(function (alarm) {
//   if (alarm.name === "keepActive") {
//     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//       var activeTab = tabs[0];
//       chrome.tabs.sendMessage(activeTab.id, {
//         message: "simulate_user_activity",
//       });
//     });
//   }
// });

// // **3. Simulate user activity (limited effectiveness):**
// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   if (request.message === "simulate_user_activity") {
//     var code = `document.dispatchEvent(new MouseEvent('mousemove'));`;
//     chrome.tabs.executeScript(sender.tab.id, { code: code });
//   }
// });

// // **4. Tab activation (might be detectable):**
// chrome.tabs.onActivated.addListener(function (activeInfo) {
//   chrome.tabs.get(activeInfo.tabId, function (tab) {
//     if (!tab.active) {
//       chrome.tabs.update(tab.id, { active: true });
//     }
//   });
// });

// // **5. Monkey Patch requestAnimationFrame (limited effectiveness):**
// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//   if (changeInfo.status === "complete" && tab.url.includes("http")) {
//     // Ensure it's a valid http(s) page
//     chrome.scripting.executeScript({
//       target: { tabId: tabId },
//       function: patchRequestAnimationFrame,
//     });
//   }
// });

// function patchRequestAnimationFrame() {
//   const originalRequestAnimationFrame = window.requestAnimationFrame;
//   window.requestAnimationFrame = function (callback) {
//     setTimeout(callback, 16);
//     return originalRequestAnimationFrame(callback);
//   };
// }

// // **6. Background script communication (might be detectable):**
// // (Needs contentScript.js modification)
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.message === "log_timestamp") {
//     console.log("Received timestamp request from content script");
//     sendResponse({ timestamp: new Date().toLocaleTimeString() });
//   }
// });

// // **7. High-frequency timers (experimental and might be detectable):**
// setInterval(() => {
//   chrome.tabs.query({}, function (tabs) {
//     tabs.forEach((tab) => {
//       chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         function: highFrequencyTimer,
//       });
//     });
//   });
// }, 1000);

// function highFrequencyTimer() {
//   if (document.visibilityState !== "visible") {
//     console.log("Tab is inactive, performing operations");
//     console.log(new Date().toLocaleTimeString());
//   }
// }

// // **8. Visibility API with throttling (might be detectable):**
// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//   if (changeInfo.status === "complete") {
//     chrome.scripting.executeScript({
//       target: { tabId: tabId },
//       func: () => {
//         document.addEventListener("visibilitychange", () => {
//           if (document.visibilityState === "hidden") {
//             console.log("Tab is inactive, low-impact operations");
//             console.log(new Date().toLocaleTimeString());
//           }
//         });
//       },
//     });
//   }
// });

// // **9. Service worker **

// chrome.runtime.onInstalled.addListener(() => {
//   console.log("Extension installed, registering Service Worker...");
//   if ("serviceWorker" in navigator) {
//     navigator.serviceWorker
//       .register("service-worker.js")
//       .then((registration) => {
//         console.log(
//           "Service Worker registered with scope:",
//           registration.scope
//         );
//       })
//       .catch((error) => {
//         console.log("Service Worker registration failed:", error);
//       });
//   }
// });

// function sendMessageToServiceWorker(message) {
//   navigator.serviceWorker.controller.postMessage(message);
// }

// sendMessageToServiceWorker("Hello, Service Worker!");

// // **10. Offscreen API - added offscreen permission in manifest.json **

// const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
// chrome.runtime.onStartup.addListener(keepAlive);
// keepAlive();

// async function createOffscreen() {
//   await chrome.offscreen
//     .createDocument({
//       url: "offscreen.html",
//       reasons: ["BLOBS"],
//       justification: "Keep service worker running",
//     })
//     .catch(() => {});
// }

// chrome.runtime.onStartup.addListener(createOffscreen);
// self.onmessage = (e) => {};
// createOffscreen();
