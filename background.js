chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "summarize") {
        const requestBody = JSON.stringify({ text: message.text, max_length: message.max_length });
        fetch("http://0.0.0.0:3000/summarize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: requestBody
        })
            .then(response => response.json())
            .then(data => sendResponse({ summary: data }))
            .catch(error => sendResponse({ error: error }));
        return true; // Keep the message channel open for sendResponse
    }

    if (message.action === "get_answers") {
        const requestBody = JSON.stringify({ text: message.text, question: message.question });
        fetch("http://0.0.0.0:3000/get_answers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: requestBody
        })
            .then(response => response.json())
            .then(data => sendResponse({ answer: data.answer }))
            .catch(error => sendResponse({ error: error }));
        return true; // Keep the message channel open for sendResponse
    }
});
