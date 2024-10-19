chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({enabled: false, movieList: []});
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updatePopup') {
        chrome.storage.local.set({ currentMovie: { title: message.title, rating: message.rating } });
        chrome.runtime.sendMessage(message);
    }
});
