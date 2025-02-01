// Simulate Server Interaction (mock)
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // Mock API Endpoint for testing
let quotes = [
  {
    text: "The only limit to our realization of tomorrow is our doubts of today.",
    category: "Motivation",
  },
  {
    text: "Life is 10% what happens to us and 90% how we react to it.",
    category: "Life",
  },
  {
    text: "Do what you can, with what you have, where you are.",
    category: "Inspiration",
  },
];

// Function to create the Add Quote input form dynamically and append it after quoteDisplay
function createAddQuoteForm() {
  document.addEventListener("DOMContentLoaded", () => {
    // Create a div container for the form
    const controlsContainer = document.createElement("div");
    controlsContainer.classList.add("controls");

    // Create the new quote text input field
    const newQuoteTextInput = document.createElement("input");
    newQuoteTextInput.id = "newQuoteText";
    newQuoteTextInput.type = "text";
    newQuoteTextInput.placeholder = "Enter a new quote";

    // Create the new quote category input field
    const newQuoteCategoryInput = document.createElement("input");
    newQuoteCategoryInput.id = "newQuoteCategory";
    newQuoteCategoryInput.type = "text";
    newQuoteCategoryInput.placeholder = "Enter quote category";

    // Create the Add Quote button
    const addQuoteButton = document.createElement("button");
    addQuoteButton.textContent = "Add Quote";
    addQuoteButton.onclick = addQuote; // Attach the addQuote function to the button

    // Append the input fields and button to the controls container
    controlsContainer.appendChild(newQuoteTextInput);
    controlsContainer.appendChild(newQuoteCategoryInput);
    controlsContainer.appendChild(addQuoteButton);

    // Find the quoteDisplay element
    const quoteDisplayElement = document.getElementById("quoteDisplay");

    // Append the controls container right after the quoteDisplay element
    quoteDisplayElement.insertAdjacentElement("afterend", controlsContainer);
  });
}

// Call the function to create the form dynamically when the page is loaded
createAddQuoteForm();

// Fetch server data (Simulate server interaction)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const data = await response.json();
    console.log("Fetched data from server:", data); // Log fetched data to check the content
    return data.slice(0, 5).map((post) => ({
      text: post.title, // Assuming the mock API's title can be treated as a quote text
      category: "Server", // Assign a default category for mock data
    }));
  } catch (error) {
    console.error("Error fetching from server:", error);
    return [];
  }
}

// Post data to server (Simulate saving to the server)
async function postToServer() {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      body: JSON.stringify({ data: quotes }),
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error posting to server:", error);
  }
}

// Function to sync data
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  // Resolve conflicts: If a quote exists both locally and on the server, prioritize server's data
  serverQuotes.forEach((serverQuote) => {
    const localQuote = quotes.find((quote) => quote.text === serverQuote.text);
    if (!localQuote) {
      quotes.push(serverQuote); // If not found locally, add it
    }
  });

  // Sync local data with the server
  await postToServer();

  // Notify the user of successful sync
  displaySyncNotification();
  populateCategories();
  filterQuotes(); // Ensure quotes are re-filtered after syncing
}

// Display sync notification
function displaySyncNotification() {
  const syncNotification = document.getElementById("syncNotification");
  const currentTime = new Date().toLocaleTimeString();
  syncNotification.innerHTML = `Quotes synced with server!<br>Last synced at: ${currentTime}`;
  syncNotification.style.display = "block";
  setTimeout(() => {
    syncNotification.style.display = "none";
  }, 5000); // Hide after 5 seconds
}

// Populate categories in dropdown
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  categoryFilter.innerHTML = "<option value='all'>All Categories</option>";

  // Ensure categories are populated correctly
  const categories = [...new Set(quotes.map((q) => q.category || "General"))]; // Default to "General" if category is missing
  console.log("Categories populated:", categories); // Log to check the populated categories
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// Filter quotes based on selected category
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  const quoteDisplay = document.getElementById("quoteDisplay");

  quoteDisplay.innerHTML = "";

  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((q) => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes available in this category.</p>";
  } else {
    filteredQuotes.forEach((quote) => {
      const quoteElement = document.createElement("p");
      quoteElement.textContent = `${quote.text} - [${
        quote.category || "General"
      }]`; // Default to "General" if category is missing
      quoteDisplay.appendChild(quoteElement);
    });
  }
}

// Show a random quote
function showRandomQuote() {
  const quoteDisplay = document.getElementById("quoteDisplay");
  const randomIndex = Math.floor(Math.random() * quotes.length);
  quoteDisplay.textContent = `${quotes[randomIndex].text} - [${
    quotes[randomIndex].category || "General"
  }]`; // Default to "General" if category is missing
}

// Function to add a new quote
function addQuote() {
  const newQuoteText = document.getElementById("newQuoteText").value.trim();
  const newQuoteCategory = document
    .getElementById("newQuoteCategory")
    .value.trim();

  if (newQuoteText && newQuoteCategory) {
    quotes.push({ text: newQuoteText, category: newQuoteCategory });

    // Save updated quotes array to local storage
    localStorage.setItem("quotes", JSON.stringify(quotes));

    // Clear input fields
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";

    alert("Quote added successfully!");
    populateCategories(); // Update the category dropdown with the new category
    filterQuotes(); // Re-display the quotes according to the selected filter
  } else {
    alert("Please enter both a quote and a category.");
  }
}

// Export quotes to a JSON file
function exportToJsonFile() {
  const jsonData = JSON.stringify(quotes, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Import quotes from a JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    const importedQuotes = JSON.parse(event.target.result);
    if (Array.isArray(importedQuotes)) {
      quotes.push(...importedQuotes);
      alert("Quotes imported successfully!");
      populateCategories();
      filterQuotes();
    } else {
      alert("Invalid JSON format.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Event listeners
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// Auto-sync every 30 seconds
setInterval(syncQuotes, 30000);

// Initial setup
document.addEventListener("DOMContentLoaded", () => {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  }

  populateCategories();
  showRandomQuote();
  syncQuotes();
});
