document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pageKey = `notes_${tab.url}`; // unique key per page

  // Load saved notes for this page
  chrome.storage.local.get([pageKey], function (result) {
    if (result[pageKey]) {
      document.getElementById("notes").value = result[pageKey];
    }
  });

  // Event listeners
  document.getElementById("summarizeBtn").addEventListener("click", () => summarizeText(tab));
  document.getElementById("saveNotesBtn").addEventListener("click", () => saveNotes(tab));
});

// Function to summarize text based on current tab content selection
async function summarizeText(tab) {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.getSelection().toString(),
    });

    if (!result) {
      showResult("Please select some text.");
      return;
    }

    const response = await fetch("http://localhost:8082/api/research/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: result, operation: "summarize" }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const text = await response.text();
    showResult(text.replace(/\n/g, "<br>"));
  } catch (error) {
    showResult("Error: " + error.message);
  }
}

// Save notes functionality (per page)
async function saveNotes(tab) {
  const pageKey = `notes_${tab.url}`;
  const notes = document.getElementById("notes").value;

  chrome.storage.local.set({ [pageKey]: notes }, function () {
    alert("Notes saved successfully for this page!");
  });
}

// Utility to display results
function showResult(content) {
  document.getElementById("results").innerHTML = `
    <div class="result-item">
      <div class="result-content">${content}</div>
    </div>`;
}
