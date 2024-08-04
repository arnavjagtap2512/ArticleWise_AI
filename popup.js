document.getElementById("summary-length").oninput = function() {
    document.getElementById("length-value").innerText = this.value;
};

document.getElementById("home-icon").addEventListener("click", () => {
    window.location.href = "home.html";
});

document.getElementById("summarizeBtn").addEventListener("click", (event) => {
    event.preventDefault();
    const maxLength = document.getElementById("summary-length").value;
    document.getElementById("loading").style.display = 'block'; // Show loading spinner
    document.getElementById("summary").innerText = ''; // Clear previous summary
    console.log("Slider value captured: ", maxLength); // Debugging line to ensure value is captured

    // Hide the button
    event.target.style.display = 'none';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getText" }, (response) => {
            if (response && response.text) {
                chrome.runtime.sendMessage(
                    { action: "summarize", text: response.text, max_length: parseInt(maxLength, 10) },
                    (response) => {
                        document.getElementById("loading").style.display = 'none'; // Hide loading spinner
                        if (response && response.summary) {
                            // Access the nested summary field
                            const summaryText = response.summary.summary;
                            displaySummaryWithTypingEffect(summaryText);
                            // Show icons after the summary is displayed
                            document.getElementById("speak-icon").style.display = "inline"; // Show speak icon
                            document.getElementById("copy-icon").style.display = "inline"; // Show copy icon
                        } else if (response && response.error) {
                            document.getElementById("summary").innerText = "Error: " + response.error;
                        }
                    }
                );
            }
        });
    });
});



function displaySummaryWithTypingEffect(summary) {
    const summaryElement = document.getElementById("summary");
    const speakIcon = document.getElementById("speak-icon");
    summaryElement.innerText = '';
    speakIcon.style.display = 'none';
    typeWriter(summary, summaryElement, 0);
    setTimeout(() => speakIcon.style.display = 'inline', summary.length * 20);
}

function typeWriter(text, element, i) {
    if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;
        setTimeout(() => typeWriter(text, element, i), 20);
    }
}

document.getElementById("speak-icon").addEventListener("click", () => {
    const icon = document.getElementById("speak-icon");
    if (icon.classList.contains("playing")) {
        // Pause logic
        icon.classList.remove("playing");
        icon.classList.add("paused");
        // Add your logic to pause the speech synthesis
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
        }
    } else {
        // Play logic
        icon.classList.remove("paused");
        icon.classList.add("playing");
        // Add your logic to play the speech synthesis
        const summaryText = document.getElementById("summary").innerText;
        if (summaryText && !window.speechSynthesis.speaking) {
            const utterance = new SpeechSynthesisUtterance(summaryText);
            window.speechSynthesis.speak(utterance);
            utterance.onend = () => {
                icon.classList.remove("playing");
                icon.classList.add("paused");
            };
        }
    }
});

document.getElementById("copy-icon").addEventListener("click", () => {
    const copyIcon = document.getElementById("copy-icon");
    const summaryText = document.getElementById("summary").innerText;

    if (summaryText) {
        navigator.clipboard.writeText(summaryText).then(() => {
            copyIcon.classList.add("copied");
            document.getElementById("tooltip-text").innerText = "Copied";
            setTimeout(() => {
                copyIcon.classList.remove("copied");
                document.getElementById("tooltip-text").innerText = "Copy Summary";
            }, 2000); // Reset icon and text after 2 seconds
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    }
});
