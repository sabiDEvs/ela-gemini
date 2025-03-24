const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");
const sendChatButton = document.querySelector("#send-message-button");

// State variables
let userMessage = null;
let isResponseGenerating = false;

// API configuration
const apiKey = "AIzaSyBERprjup6dyF8viGG7RXzhxo4n7rVjtho"; // Your API key here
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;


// Load theme and chat data from local storage on page load
const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  const currentTheme = localStorage.getItem("theme") || 'light_mode';

  // Apply the stored theme
  document.body.classList.add(currentTheme);
  toggleThemeButton.innerText = currentTheme === 'light_mode' ? 'dark_mode' : 'light_mode';

  // Restore saved chats or clear the chat container
  chatContainer.innerHTML = savedChats || '';
  document.body.classList.toggle("hide-header", savedChats);

  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
}

// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}

// Show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(' ');
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");

    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("saved-chats", chatContainer.innerHTML);
    }
    chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
  }, 75);
}

// Fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userMessage }] }]
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.parentElement.closest(".message").classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
    document.querySelectorAll('.loading-indicator').forEach(icon => {
      icon.innerHTML = '';
    });
  }
}

// Show a loading animation while waiting for the API response
const showLoadingAnimation = () => {
  const html = `<div class="message-content">
                  <img class="avatar" src="images/gemini.png" alt="Gemini avatar">
                  <p class="text"></p>
                  <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                  </div>
                </div>
                <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatContainer.appendChild(incomingMessageDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  generateAPIResponse(incomingMessageDiv);
}

// Copy message text to the clipboard
const copyMessage = (copyButton) => {
  const messageText = copyButton.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done";
  setTimeout(() => copyButton.innerText = "content_copy", 500);
}

// Handle sending outgoing chat messages
const handleOutgoingChat = () => {
  userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return;

  isResponseGenerating = true;

  const html = `<div class="message-content">
                  <img class="avatar" src="images/user.png" alt="User avatar">
                  <p class="text"></p>
                </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatContainer.appendChild(outgoingMessageDiv);

  typingForm.reset();
  document.body.classList.add("hide-header");
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  setTimeout(showLoadingAnimation, 1000);
}

// Toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  document.body.classList.toggle("dark_mode", !isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
  localStorage.setItem("theme", isLightMode ? "light_mode" : "dark_mode");
});

// Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats?")) {
    localStorage.removeItem("saved-chats");
    loadDataFromLocalstorage();
  }
});

// Set userMessage and handle outgoing chat when send button is clicked
sendChatButton.addEventListener("click", handleOutgoingChat);

// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});

// Load data from local storage on page load
loadDataFromLocalstorage();
