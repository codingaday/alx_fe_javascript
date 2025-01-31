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
      const serverQuotes = await this.fetchQuotesFromServer();
      const mergedQuotes = this.mergeQuotes(serverQuotes);

      localStorage.setItem("quotes", JSON.stringify(mergedQuotes));
      this.quotes = mergedQuotes;

      if (this.conflicts.length > 0) {
        this.showConflictResolution();
      }

      this.updateUI();
      this.showNotification("Sync completed successfully");
    } catch (error) {
      this.showNotification("Sync failed: " + error.message, true);
    }
  }

  async fetchQuotesFromServer() {
    try {
      const response = await fetch(SERVER_URL);
      if (!response.ok) throw new Error("Server response not OK");

      const serverData = await response.json();
      return serverData.map((post) => ({
        id: `server-${post.id}`,
        text: post.title,
        category: post.body.substring(0, 15),
        timestamp: Date.now(),
      }));
    } catch (error) {
      this.showNotification(`Failed to fetch quotes: ${error.message}`, true);
      return [];
    }
  }

  mergeQuotes(serverQuotes) {
    const quoteMap = new Map();
    const conflicts = [];

    serverQuotes.forEach((quote) => {
      quoteMap.set(quote.id, quote);
    });

    this.quotes.forEach((localQuote) => {
      const serverQuote = quoteMap.get(localQuote.id);
      if (serverQuote) {
        conflicts.push({ server: serverQuote, local: localQuote });
        quoteMap.set(
          localQuote.id,
          serverQuote.timestamp > localQuote.timestamp
            ? serverQuote
            : localQuote
        );
      } else {
        quoteMap.set(localQuote.id, localQuote);
      }
    });

    this.conflicts = conflicts;
    return Array.from(quoteMap.values());
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.getElementById("notifications").appendChild(notification);

    if (type !== "conflict") {
      setTimeout(() => notification.remove(), 5000);
    }
  }

  setupEventListeners() {
    document.getElementById("manualSync").addEventListener("click", () => {
      this.syncWithServer();
      this.showNotification("Manual sync initiated...");
    });
  }
}

const quoteSyncer = new QuoteSyncer();
