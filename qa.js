document.getElementById("home-icon").addEventListener("click", () => {
    window.location.href = "home.html";
});

document.getElementById("askBtn").addEventListener("click", () => {
    const userQuery = document.getElementById("user-query").value;
    const chatContainer = document.getElementById("chat");
    const inputContainer = document.getElementById("user-query");

    if (userQuery.trim() === "") {
        return;
    }

    const userMessage = document.createElement("div");
    userMessage.classList.add("user-message");
    userMessage.textContent = userQuery;
    chatContainer.appendChild(userMessage);

    // Clear the input box
    inputContainer.value = "";

    // Show the loading dots animation
    const loadingContainer = document.createElement("div");
    loadingContainer.id = "loading-animation";
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.className = "dot";
        loadingContainer.appendChild(dot);
    }
    chatContainer.appendChild(loadingContainer);
    loadingContainer.style.display = "flex";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getText" }, (response) => {
            if (response && response.text) {
                const articleText = response.text;
                chrome.runtime.sendMessage(
                    { action: "get_answers", text: articleText, question: userQuery },
                    (response) => {
                        const botMessage = document.createElement("div");
                        botMessage.classList.add("bot-message");
                        chatContainer.appendChild(botMessage);
                        loadingContainer.style.display = "none"; // Hide the loading animation

                        if (response.answer) {
                            typeText(botMessage, response.answer);
                        } else if (response.error) {
                            botMessage.textContent = "Error: " + response.error;
                        }
                    }
                );
            }
        });
    });
});

function getArticleText() {
    return document.body.innerText;
}

// Typing effect function
function typeText(element, text) {
    let index = 0;
    function type() {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
            setTimeout(type, 50); // Adjust typing speed here
        }
    }
    type();
}
