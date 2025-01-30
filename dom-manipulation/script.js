// State management
const quoteState = {
  quotes: JSON.parse(localStorage.getItem("quotes")) || [],
  conflicts: [],
  pendingChanges: [],
};

// Server simulation constants
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";
const SYNC_INTERVAL = 30000;

// DOM elements
const notificationContainer = document.createElement("div");
notificationContainer.id = "notifications";
document.body.appendChild(notificationContainer);

// Server communication
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error("Server error");
    const data = await response.json();
    return data.map((post) => ({
      id: `server-${post.id}`,
      text: post.title,
      category: "general",
      timestamp: Date.now(),
    }));
  } catch (error) {
    showNotification(`Server error: ${error.message}`, "error");
    return [];
  }
}

async function postQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: quote.text,
        body: quote.category,
        userId: 1,
      }),
    });
  } catch (error) {
    quoteState.pendingChanges.push(quote);
    showNotification("Failed to save to server - changes queued", "warning");
  }
}

// Sync logic
async function syncQuotes() {
  try {
    const serverQuotes = await fetchQuotesFromServer();
    const mergeResult = mergeQuotes(serverQuotes, quoteState.quotes);

    quoteState.quotes = mergeResult.mergedQuotes;
    quoteState.conflicts = mergeResult.conflicts;

    localStorage.setItem("quotes", JSON.stringify(quoteState.quotes));

    if (mergeResult.conflicts.length > 0) {
      showConflictResolution(mergeResult.conflicts);
    }

    showNotification(
      `Synced ${mergeResult.newQuotes} new quotes, ` +
        `${mergeResult.conflicts.length} conflicts detected`,
      mergeResult.conflicts.length ? "warning" : "success"
    );
  } catch (error) {
    showNotification(`Sync failed: ${error.message}`, "error");
  }
}

function mergeQuotes(serverQuotes, localQuotes) {
  const merged = [];
  const conflicts = [];
  let newQuotes = 0;

  // Process server quotes first
  serverQuotes.forEach((serverQuote) => {
    const localMatch = localQuotes.find((q) => q.id === serverQuote.id);

    if (!localMatch) {
      merged.push(serverQuote);
      newQuotes++;
    } else if (serverQuote.text !== localMatch.text) {
      conflicts.push({ server: serverQuote, local: localMatch });
      merged.push(
        serverQuote.timestamp > localMatch.timestamp ? serverQuote : localMatch
      );
    } else {
      merged.push(serverQuote);
    }
  });

  // Add remaining local quotes
  localQuotes.forEach((localQuote) => {
    if (!merged.some((q) => q.id === localQuote.id)) {
      merged.push(localQuote);
    }
  });

  return { mergedQuotes: merged, conflicts, newQuotes };
}

// Conflict resolution UI
function showConflictResolution(conflicts) {
  const resolutionDiv = document.createElement("div");
  resolutionDiv.className = "conflict-resolution";
  resolutionDiv.innerHTML = `
   <h3>Resolve Conflicts (${conflicts.length})</h3>
   <div class="conflict-list">
     ${conflicts
       .map(
         (conflict, index) => `
       <div class="conflict-item">
         <div class="server-version">
           <h4>Server Version:</h4>
           <p>${conflict.server.text}</p>
           <small>${new Date(
             conflict.server.timestamp
           ).toLocaleString()}</small>
         </div>
         <div class="local-version">
           <h4>Your Version:</h4>
           <p>${conflict.local.text}</p>
           <small>${new Date(conflict.local.timestamp).toLocaleString()}</small>
         </div>
         <div class="actions">
           <button data-index="${index}" data-action="server">Use Server</button>
           <button data-index="${index}" data-action="local">Keep Yours</button>
         </div>
       </div>
     `
       )
       .join("")}
   </div>
 `;

  resolutionDiv.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      const action = e.target.dataset.action;
      resolveConflict(index, action);
      if (conflicts.length === 0) resolutionDiv.remove();
    });
  });

  document.body.appendChild(resolutionDiv);
}

function resolveConflict(index, action) {
  const conflict = quoteState.conflicts[index];
  quoteState.quotes = quoteState.quotes.filter(
    (q) => q.id !== conflict.server.id && q.id !== conflict.local.id
  );

  if (action === "server") {
    quoteState.quotes.push(conflict.server);
  } else {
    quoteState.quotes.push(conflict.local);
  }

  localStorage.setItem("quotes", JSON.stringify(quoteState.quotes));
  quoteState.conflicts.splice(index, 1);
}

// UI helpers
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notificationContainer.appendChild(notification);

  setTimeout(() => notification.remove(), type === "error" ? 5000 : 3000);
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Initial sync
  syncQuotes();

  // Periodic sync
  setInterval(syncQuotes, SYNC_INTERVAL);

  // Manual sync button
  document.getElementById("manualSync")?.addEventListener("click", syncQuotes);
});
