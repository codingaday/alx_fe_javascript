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
      this.showNotification("Data synced successfully");
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
      this.showNotification(`Failed to fetch quotes: ${error.message}`, true);
      return [];
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

  showConflictResolution() {
    const resolutionDiv = document.createElement("div");
    resolutionDiv.className = "conflict-resolution";
    resolutionDiv.innerHTML = `
     <h3>Resolve Conflicts (${this.conflicts.length})</h3>
     ${this.conflicts
       .map(
         (conflict) => `
       <div class="conflict-item">
         <p><strong>Server Version:</strong> ${conflict.server.text}</p>
         <p><strong>Your Version:</strong> ${conflict.local.text}</p>
         <div class="conflict-actions">
           <button data-id="${conflict.server.id}" data-version="server">
             Keep Server Version
           </button>
           <button data-id="${conflict.local.id}" data-version="local">
             Keep Local Version
           </button>
         </div>
       </div>
     `
       )
       .join("")}
   `;
    // ... listener setup ...
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
    this.showSyncNotification(
      `${this.conflicts.length} conflicts detected!`,
      true
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

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message; // Security: use textContent instead of innerHTML
    document.getElementById("notifications").appendChild(notification);

    // Auto-remove after 5 seconds for non-conflict notifications
    if (type !== "conflict") {
      setTimeout(() => notification.remove(), 5000);
    }
  }

  async syncWithServer() {
    try {
      const serverQuotes = await this.fetchQuotesFromServer();
      const { mergedQuotes, conflicts, newQuotes } =
        this.mergeData(serverQuotes);

      // Update notification logic
      let syncMessage;
      if (conflicts.length > 0) {
        syncMessage = `Sync complete. ${newQuotes} new quotes, ${conflicts.length} conflicts need attention`;
        this.showNotification(syncMessage, "conflict");
        this.showConflictResolution();
      } else if (newQuotes > 0) {
        syncMessage = `${newQuotes} new quote${
          newQuotes > 1 ? "s" : ""
        } added from server`;
        this.showNotification(syncMessage, "success");
      } else {
        syncMessage = "Data is up to date";
        this.showNotification(syncMessage, "info");
      }

      localStorage.setItem("quotes", JSON.stringify(mergedQuotes));
      this.quotes = mergedQuotes;
      this.conflicts = conflicts;
      this.updateUI();
    } catch (error) {
      this.showNotification(`Sync failed: ${error.message}`, "error");
    }
  }
  setupEventListeners() {
    document.getElementById("manualSync").addEventListener("click", () => {
      this.syncWithServer();
      this.showNotification("Manual sync initiated...");
    });
  }
}

// Initialize the syncer
const quoteSyncer = new QuoteSyncer();

// Add to your styles
const style = document.createElement("style");
style.textContent = `
  .notification {
    padding: 15px;
    margin: 10px;
    border-radius: 5px;
    color: white;
  }
  .notification.success { background: #4CAF50; }
  .notification.error { background: #f44336; }
  .notification.info { background: #2196F3; }
  .notification.conflict { background: #ff9800; }
`;
document.head.appendChild(style);
