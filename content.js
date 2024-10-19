let popupWindow = null;

function createPopup() {
    const popupURL = chrome.runtime.getURL('popup.html');
    popupWindow = window.open(popupURL, 'MovieRatingPopup', 'width=300,height=400,top=100,left=100');
}

function initializeExtension() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.storage) {
        document.addEventListener('mouseup', handleMouseUp);
    } else {
        console.warn('Chrome APIs not available. Extension may not function properly.');
    }
}

function handleMouseUp() {
    if (chrome.runtime && chrome.runtime.id) {
        chrome.storage.sync.get('enabled', function(result) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return;
            }
            if (result.enabled) {
                const selectedText = window.getSelection().toString().trim();
                if (selectedText && selectedText.split(' ').length <= 20) {
                    fetchMovieRating(selectedText);
                } else if (selectedText.split(' ').length > 20) {
                    sendMessageToBackground({
                        action: 'updatePopup',
                        title: 'Error',
                        rating: 'Selected text must be less than 20 words'
                    });
                }
            }
        });
    } else {
        console.warn('Extension context invalidated. Attempting to reinitialize...');
        setTimeout(initializeExtension, 1000);
    }
}

function fetchMovieRating(title) {
    const apiKey = CONFIG.API_KEY; // Use the API key from config.js
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`;

    fetch(url, {
        method: 'GET',
        mode: 'cors',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.Response === 'True') {
            sendMessageToBackground({
                action: 'updatePopup',
                title: data.Title,
                rating: data.imdbRating ? `IMDb Rating: ${data.imdbRating}` : 'Rating not available'
            });
        } else {
            sendMessageToBackground({
                action: 'updatePopup',
                title: title,
                rating: 'Rating not available'
            });
        }
    })
    .catch(error => {
        console.error('Error fetching movie rating:', error);
        sendMessageToBackground({
            action: 'updatePopup',
            title: 'Error',
            rating: 'Failed to fetch movie rating'
        });
    });
}

function sendMessageToBackground(message) {
    if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage(message);
    } else {
        console.warn('Cannot send message: Extension context invalidated');
    }
}

// Initialize the extension
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

// Attempt to reinitialize if the extension is updated
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener(() => {
        console.log('Extension installed or updated');
        initializeExtension();
    });
}

// Listen for messages from the popup
window.addEventListener('message', function(event) {
    if (event.data.action === 'closePopup') {
        if (popupWindow && !popupWindow.closed) {
            popupWindow.close();
        }
        popupWindow = null;
    }
});
