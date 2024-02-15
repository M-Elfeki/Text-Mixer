chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.request === "getSelectedText") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: getSelectedText,
            }, (injectionResults) => {
                for (const frameResult of injectionResults)
                    sendResponse({selectedText: frameResult.result});
            });
        });
        return true;
    }
});

function getSelectedText() {
    return window.getSelection().toString();
}
