let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  {
    text: "Be the change you wish to see in the world.",
    category: "inspirational",
  },
  {
    text: "The only way to do great work is to love what you do.",
    category: "success",
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    category: "business",
  },
];

const saveQuotes = () => {
  localStorage.setItem("quotes", JSON.stringify(quotes));
  sessionStorage.setItem(
    "lastCategory",
    document.getElementById("categorySelect").value
  );
};

const showRandomQuote = () => {
  const categorySelect = document.getElementById("categorySelect");
  const selectedCategory = categorySelect.value;
  const quoteDisplay = document.getElementById("quoteDisplay");

  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((quote) => quote.category === selectedCategory);

  if (!filteredQuotes.length) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  quoteDisplay.innerHTML = `
     <blockquote>"${randomQuote.text}"</blockquote>
     <em>- ${randomQuote.category}</em>
 `;

  sessionStorage.setItem("lastQuote", JSON.stringify(randomQuote));
};

const createAddQuoteForm = () => {
  const formDiv = document.createElement("div");
  formDiv.className = "form-section";
  formDiv.innerHTML = `
     <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
     <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
     <button onclick="addQuote()">Add Quote</button>
 `;
  document.body.appendChild(formDiv);
};

const addQuote = () => {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (text && category) {
    quotes.push({ text, category });
    saveQuotes();
    updateCategoryDropdown();
    textInput.value = "";
    categoryInput.value = "";
    showRandomQuote();
  }
};

const updateCategoryDropdown = () => {
  const categorySelect = document.getElementById("categorySelect");
  const currentValue =
    categorySelect.value || sessionStorage.getItem("lastCategory") || "all";

  const categories = ["all", ...new Set(quotes.map((quote) => quote.category))];
  categorySelect.innerHTML = categories
    .map(
      (category) => `
         <option value="${category}" ${
        category === currentValue ? "selected" : ""
      }>
             ${category}
         </option>
     `
    )
    .join("");
};

const exportToJson = () => {
  const dataStr = JSON.stringify(quotes);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const handleFileImport = () => {
  const fileInput = document.getElementById("importFile");
  if (!fileInput.files.length) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      updateCategoryDropdown();
      showRandomQuote();
      alert(`Successfully imported ${importedQuotes.length} quotes!`);
    } catch (error) {
      alert("Error importing quotes. Invalid JSON format.");
    }
  };
  reader.readAsText(fileInput.files[0]);
};

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    try {
      const parsedQuote = JSON.parse(lastQuote);
      document.getElementById("quoteDisplay").innerHTML = `
             <blockquote>"${parsedQuote.text}"</blockquote>
             <em>- ${parsedQuote.category}</em>
         `;
    } catch {
      showRandomQuote();
    }
  } else {
    showRandomQuote();
  }

  updateCategoryDropdown();
  createAddQuoteForm();

  document
    .getElementById("newQuote")
    .addEventListener("click", showRandomQuote);
  document
    .getElementById("importFile")
    .addEventListener("change", handleFileImport);
});
