document.addEventListener("DOMContentLoaded", () => {
    const summarizeBtn = document.getElementById("summarize-Btn");
    const qaBtn = document.getElementById("qaBtn");

    if (summarizeBtn && qaBtn) {
        summarizeBtn.addEventListener("click", () => {
            window.location.href = "popup.html";
        });

        qaBtn.addEventListener("click", () => {
            window.location.href = "qa.html";
        });
    } else {
        console.error("Buttons not found.");
    }
});
