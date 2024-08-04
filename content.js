// content.js
function getTextFromPage() {
    let text = document.body.innerText;
    return text;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getText") {
        let text = getTextFromPage();
        sendResponse({ text: text });
    }
});
