// Add notification system
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
   <span>${message}</span>
   <button class="dismiss-btn">×</button>
 `;

  // Auto-remove after 5 seconds
  setTimeout(() => notification.remove(), 5000);

  // Manual dismiss
  notification.querySelector(".dismiss-btn").addEventListener("click", () => {
    notification.remove();
  });

  document.getElementById("notifications").appendChild(notification);
}

// Modified sync function with notifications
async function syncQuotes() {
  showNotification("Syncing with server...", "pending");

  try {
    const serverQuotes = await fetchQuotesFromServer();
    const mergeResult = mergeQuotes(serverQuotes, quoteState.quotes);

    quoteState.quotes = mergeResult.mergedQuotes;
    quoteState.conflicts = mergeResult.conflicts;

    localStorage.setItem("quotes", JSON.stringify(quoteState.quotes));

    const message =
      mergeResult.conflicts.length > 0
        ? `Synced ${mergeResult.newQuotes} items. ${mergeResult.conflicts.length} conflicts need resolution`
        : `Synced ${mergeResult.newQuotes} new quotes successfully`;

    showNotification(
      message,
      mergeResult.conflicts.length ? "warning" : "success"
    );

    if (mergeResult.conflicts.length > 0) {
      showConflictResolution(mergeResult.conflicts);
      showNotification("Conflicts detected! Click to resolve", "error");
    }
  } catch (error) {
    showNotification(`Sync failed: ${error.message}`, "error");
  }
}

// Enhanced conflict UI
function showConflictResolution(conflicts) {
  const resolutionDiv = document.createElement("div");
  resolutionDiv.className = "conflict-resolution";
  resolutionDiv.innerHTML = `
   <h3>Resolve Content Conflicts</h3>
   <div class="conflict-counter">Conflicts found: ${conflicts.length}</div>
   ${conflicts
     .map(
       (conflict, index) => `
     <div class="conflict-item" data-id="${conflict.server.id}">
       <div class="versions">
         <div class="server-version">
           <h4>Server Version</h4>
           <p>${conflict.server.text}</p>
           <small>Updated: ${new Date(
             conflict.server.timestamp
           ).toLocaleString()}</small>
         </div>
         <div class="local-version">
           <h4>Your Version</h4>
           <p>${conflict.local.text}</p>
           <small>Updated: ${new Date(
             conflict.local.timestamp
           ).toLocaleString()}</small>
         </div>
       </div>
       <div class="resolution-actions">
         <button data-action="keep-server">Use Server Version</button>
         <button data-action="keep-local">Keep Local Version</button>
       </div>
     </div>
   `
     )
     .join("")}
 `;

  document.body.appendChild(resolutionDiv);
}

// Add this CSS
const style = document.createElement("style");
style.textContent = `
 #notifications {
   position: fixed;
   top: 20px;
   right: 20px;
   z-index: 1000;
   max-width: 300px;
 }

 .notification {
   padding: 15px;
   margin-bottom: 10px;
   border-radius: 5px;
   background: #f8f9fa;
   box-shadow: 0 2px 5px rgba(0,0,0,0.2);
   display: flex;
   justify-content: space-between;
   align-items: center;
 }

 .notification.success { background: #d4edda; border-left: 4px solid #28a745; }
 .notification.error { background: #f8d7da; border-left: 4px solid #dc3545; }
 .notification.warning { background: #fff3cd; border-left: 4px solid #ffc107; }
 .notification.pending { background: #cce5ff; border-left: 4px solid #007bff; }

 .dismiss-btn {
   background: none;
   border: none;
   cursor: pointer;
   font-size: 1.2em;
   margin-left: 10px;
 }

 .conflict-resolution {
   position: fixed;
   bottom: 20px;
   left: 20px;
   background: white;
   padding: 20px;
   box-shadow: 0 2px 10px rgba(0,0,0,0.1);
   max-width: 400px;
   z-index: 1000;
 }
`;
document.head.appendChild(style);
