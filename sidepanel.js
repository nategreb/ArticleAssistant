const chatContainer = document.getElementById("chatContainer");
const sendBtn = document.getElementById("sendBtn");
const chatbotInput = document.getElementById("chatbotInput");
const thinkingDiv = document.getElementById("thinking"); 
const inputBoxPlaceholder = "Type your question about this page..."

chrome.runtime.sendMessage({ type: MessageTypes.SIDE_PANEL_REFRESHED});

const MessagePerson = Object.freeze({
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system"
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case MessageTypes.LLM_RESPONSE:
        appendMessage(MessagePerson.ASSISTANT, parseMarkdownToHTML(message.response))
        const systemMessages = document.getElementsByClassName("system-message")
        while (systemMessages.length > 0) {
          systemMessages[0].remove();
        }
        thinkingDiv.innerHTML = "";
        break;
      default:
        console.error(`Received unknown message type: ${message.type}`)
    }
});

chatbotInput.addEventListener("input", autoResizeTextarea);
chatbotInput.addEventListener("focus", function() {
  if (this.value === inputBoxPlaceholder) {
    this.value = "";
  }
});

function autoResizeTextarea() {
  this.style.height = "auto";            // Reset height
  this.style.height = this.scrollHeight + "px";  // Set to scroll height
}

chatbotInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault(); 
    sendMessage();
  }
});

  
sendBtn.addEventListener("click", sendMessage);

async function sendMessage() {
  const question = chatbotInput.value.trim();
  if (question === "") {
    chatbotInput.value = "Your message was empty. Type a valid question into this box..."
    return;
  } 
  appendMessage(MessagePerson.USER, question);
  appendMessage(MessagePerson.SYSTEM, "Thinking...")
  console.log("Sending question to the background worker")
  chrome.runtime.sendMessage({type: MessageTypes.ASK_LLM ,text: question});
  chatbotInput.value = inputBoxPlaceholder;
}
 
function appendMessage(sender, text) {
  const messageDiv = document.createElement("div");
  switch (sender) {
    case MessagePerson.USER:
      messageDiv.className = "user-message"
      break;
    case MessagePerson.ASSISTANT:
      messageDiv.className = "assistant-message"
      break;
    case MessagePerson.SYSTEM:
      messageDiv.className = "system-message"
      break;
    default:
      console.error("Unknown message sender: " + sender);
      break;
  }
  messageDiv.innerHTML = text;
  chatContainer.appendChild(messageDiv);

  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// chrome extension CSP prevents importing external scripts so adding a simple alg with regex;
// alternative to this is just re-using some open source code with a MIT licence but need to make sure it doesn't
// also have dependencies.
function parseMarkdownToHTML(text) {
  let html = text;

  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.*?)`/g, "<code>$1</code>");
  html = html.replace(/\n/g, "<br>");
  html = html.replace(/(?:^|\n)[*-] (.*?)(?=\n|$)/g, "<li>$1</li>");
  if (html.includes("<li>")) {
    html = "<ul>" + html + "</ul>";
  }
  return html;
}
