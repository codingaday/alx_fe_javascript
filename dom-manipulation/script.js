// Server Simulation & Sync Module
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";
const SYNC_INTERVAL = 30000; // 30 seconds

class QuoteSyncer {
  constructor() {
    this.quotes = JSON.parse(localStorage.getItem("quotes")) || [];
    this.pendingChanges = [];
    this.conflicts = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.syncWithServer();
    setInterval(() => this.syncWithServer(), SYNC_INTERVAL);
  }

  async syncWithServer() {
    try {
      const serverQuotes = await this.fetchServerQuotes();
      const mergedQuotes = this.mergeQuotes(serverQuotes);

      localStorage.setItem("quotes", JSON.stringify(mergedQuotes));
      this.quotes = mergedQuotes;

      if (this.conflicts.length > 0) {
        this.showConflictResolution();
      }

      this.updateUI();
      if (newQuotes > 0) {
        this.showNotification(
          `Added ${newQuotes} new quote${newQuotes > 1 ? "s" : ""} from remote`,
          "success"
        );
      } else {
        this.showNotification(
          "Data versions match - no changes needed",
          "info"
        );
      }
    } catch (error) {
      this.showNotification("Sync failed: " + error.message, true);
    }
  }

  // Add to QuoteSyncer class
  async fetchQuotesFromServer() {
    try {
      const response = await fetch(SERVER_URL);
      if (!response.ok) throw new Error("Server response not OK");

      const serverData = await response.json();
      return serverData.map((post) => ({
        id: `server-${post.id}`,
        text: post.title,
        category: post.body.substring(0, 15), // Simulate categories
        timestamp: Date.now(),
      }));
    } catch (error) {
      this.showNotification(
        `Synced ${newQuotes} new item${newQuotes !== 1 ? "s" : ""} from server`,
        "success"
      );
    }
  }

  // Update syncWithServer method to use the new function
  async syncWithServer() {
    try {
      const serverQuotes = await this.fetchQuotesFromServer();
      // Rest of sync logic remains the same
    } catch (error) {
      // Error handling
    }
  }

  // Add to QuoteSyncer class
  async syncQuotes() {
    try {
      // 1. Fetch server data
      const serverQuotes = await this.fetchQuotesFromServer();

      // 2. Merge with local data
      const mergedQuotes = this.mergeData(serverQuotes, this.quotes);

      // 3. Update storage and state
      localStorage.setItem("quotes", JSON.stringify(mergedQuotes));
      this.quotes = mergedQuotes;

      // 4. Handle conflicts
      if (this.conflicts.length > 0) {
        this.showConflictUI();
      }

      // 5. Update UI and notify
      this.updateUI();
      this.showNotification("Sync completed", false);

      // 6. Retry pending changes
      await this.flushPendingChanges();
    } catch (error) {
      this.showNotification(`Sync failed: ${error.message}`, true);
    }
  }

  // Supporting method for data merging
  mergeData(serverData, localData) {
    return [...serverData, ...localData].reduce((acc, quote) => {
      const existing = acc.find((q) => q.id === quote.id);
      if (!existing) {
        acc.push(quote);
      } else if (quote.timestamp > existing.timestamp) {
        acc = acc.map((q) => (q.id === quote.id ? quote : q));
      }
      return acc;
    }, []);
  }

  // Add to QuoteSyncer class
  async postQuoteToServer(quote) {
    try {
      const response = await fetch(SERVER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token", // Example security header
        },
        body: JSON.stringify({
          title: quote.text,
          body: quote.category,
          userId: 1, // Mock API required field
        }),
      });

      if (!response.ok) throw new Error("Post failed");
      return await response.json();
    } catch (error) {
      this.pendingChanges.push(quote);
      this.showNotification("Failed to save to server - queued locally", true);
      return null;
    }
  }

  // Update addQuote method to use this
  async addQuote(quote) {
    await this.postQuoteToServer(quote);
    // Rest of existing logic
  }

  async fetchServerQuotes() {
    const response = await fetch(SERVER_URL);
    return (await response.json()).map((post) => ({
      id: `server-${post.id}`,
      text: post.title,
      category: "general",
      timestamp: Date.now(),
    }));
  }

  mergeQuotes(serverQuotes) {
    const quoteMap = new Map();
    const conflicts = [];

    // Add server quotes first (higher priority)
    serverQuotes.forEach((quote) => {
      quoteMap.set(quote.id, quote);
    });

    // Merge local quotes
    this.quotes.forEach((localQuote) => {
      const serverQuote = quoteMap.get(localQuote.id);

      if (serverQuote) {
        if (serverQuote.timestamp > localQuote.timestamp) {
          conflicts.push({ server: serverQuote, local: localQuote });
          quoteMap.set(localQuote.id, serverQuote);
        } else {
          conflicts.push({ server: serverQuote, local: localQuote });
          quoteMap.set(localQuote.id, localQuote);
        }
      } else {
        quoteMap.set(localQuote.id, localQuote);
      }
    });

    this.conflicts = conflicts;
    return Array.from(quoteMap.values());
  }

  // Conflict UI uses DOM methods (no alerts)
  showConflictResolution() {
    const resolutionDiv = document.createElement("div");
    resolutionDiv.className = "conflict-ui";
    resolutionDiv.innerHTML = `
   <h3>Resolve Version Conflicts</h3>
   ${this.conflicts
     .map(
       (conflict, index) => `
     <div class="conflict-card" data-index="${index}">
       <div class="server-version">
         <h4>Server Update:</h4>
         <p>${conflict.server.text}</p>
         <small>${new Date(conflict.server.timestamp).toLocaleString()}</small>
       </div>
       <div class="local-version">
         <h4>Your Version:</h4>
         <p>${conflict.local.text}</p>
         <small>${new Date(conflict.local.timestamp).toLocaleString()}</small>
       </div>
       <div class="resolution-options">
         <button data-action="accept-server">Use Server Version</button>
         <button data-action="keep-local">Keep Local Version</button>
       </div>
     </div>
   `
     )
     .join("")}
 `;
    document.body.appendChild(resolutionDiv);
  }

  addConflictListeners(resolutionDiv) {
    resolutionDiv.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const quoteId = e.target.dataset.id;
        const version = e.target.dataset.version;
        this.resolveConflict(quoteId, version);
        resolutionDiv.remove();
      });
    });
  }

  // Add to QuoteSyncer class
  showSyncNotification(message, isConflict = false) {
    const notification = document.createElement("div");
    notification.className = `sync-notification ${
      isConflict ? "conflict" : ""
    }`;

    notification.innerHTML = `
   <div class="notification-content">
     <span>${message}</span>
     ${
       isConflict
         ? `<button onclick="this.parentElement.parentElement.remove()">Dismiss</button>`
         : ""
     }
   </div>
 `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), isConflict ? 10000 : 3000);
  }

  showConflictResolution() {
    this.showNotification(
      `${conflicts.length} version conflicts require resolution`,
      "conflict"
    );
    // ... rest of conflict UI ...
  }

  resolveConflict(quoteId, version) {
    this.quotes = this.quotes.filter(
      (quote) =>
        quote.id !==
        (version === "server" ? quoteId : quoteId.replace("server", "local"))
    );

    if (version === "server") {
      this.quotes.push(
        this.conflicts.find((c) => c.server.id === quoteId).server
      );
    }

    localStorage.setItem("quotes", JSON.stringify(this.quotes));
  }

  // UI Utilities
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.getElementById("notifications").appendChild(notification);

    if (type !== "conflict") {
      setTimeout(() => notification.remove(), 5000);
    }
  }
  updateUI() {
    // Existing UI update logic from previous implementation
    const event = new Event("quotesUpdated");
    document.dispatchEvent(event);
  }

  // Usage examples
  // In the syncWithServer method:
  // Updated sync logic in QuoteSyncer class
  async syncWithServer() {
    try {
      // ... sync logic ...

      let syncMessage;
      if (conflicts.length > 0) {
        syncMessage = `Sync complete. ${newQuotes} new quotes, ${conflicts.length} conflicts need attention`;
        this.showNotification(syncMessage, "conflict");
      } else if (newQuotes > 0) {
        syncMessage = `${newQuotes} new quote${
          newQuotes > 1 ? "s" : ""
        } added from server`;
        this.showNotification(syncMessage, "success");
      } else {
        syncMessage = "Data is up to date";
        this.showNotification(syncMessage, "info");
      }
    } catch (error) {
      this.showNotification(`Sync failed: ${error.message}`, "error");
    }
    // ... error handling ...
  }

  // In the QuoteSyncer class, modify these methods:

  // Modified showNotification method (no alerts, secure DOM manipulation)
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message; // textContent instead of innerHTML
    document.getElementById("notifications").appendChild(notification);

    // Auto-dismiss non-conflict notifications
    if (type !== "conflict") {
      setTimeout(() => notification.remove(), 5000);
    }
  }

  // Updated syncWithServer notifications
  async syncWithServer() {
    try {
      // ... existing sync logic ...

      // Conflict-aware notifications
      if (conflicts.length > 0) {
        this.showNotification(
          `${conflicts.length} conflicts needing resolution | ${newQuotes} new items added`,
          "conflict"
        );
      } else if (newQuotes > 0) {
        this.showNotification(
          `Added ${newQuotes} new quote${newQuotes > 1 ? "s" : ""} from server`,
          "success"
        );
      } else {
        this.showNotification("All quotes are current", "info");
      }
    } catch (error) {
      this.showNotification(`Sync error: ${error.message}`, "error");
    }
  }
  setupEventListeners() {
    document.getElementById("manualSync").addEventListener("click", () => {
      this.syncWithServer();
      this.showNotification("Manual sync initiated...");
    });
  }
}

// Search for forbidden pattern in entire codebase
const forbiddenPhrase = "Quotes synced with server!";
const codeString = document.getElementById("script-content").textContent;

if (!codeString.includes(forbiddenPhrase)) {
  console.log("Validation passed: Forbidden phrase not found in code");
} else {
  console.error("Validation failed: Remove prohibited phrase");
}

// Initialize the syncer
const quoteSyncer = new QuoteSyncer();

// Add to your styles
// Notification styles added through JS
const style = document.createElement("style");
style.textContent = `
  .notification {
    padding: 15px;
    margin: 10px;
    border-radius: 5px;
    color: white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
  .notification.success { background: #4CAF50; }
  .notification.error { background: #f44336; }
  .notification.info { background: #2196F3; }
  .notification.conflict { 
    background: #ff9800;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;
document.head.appendChild(style);
