# 📖 Article Assistant Chrome Extension

Chrome Extension that lets you read articles while chatting with a local AI model via a side panel using [Ollama](https://ollama.ai/)

---

## 📦 Setup & Development Guide

### 1️⃣ Load the Extension into Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select your extension project folder
5. The extension should now appear in your browser  
   *(you can pin it to your toolbar for easy access)*

---

### 2️⃣ Install and Configure Ollama

Download and install Ollama by following the instructions here:  
👉 [https://github.com/ollama/ollama/tree/main/docs](https://github.com/ollama/ollama/tree/main/docs)

---

### 3️⃣ Download a Model  

By default, the extension uses **Gemma3 - 4.3B**.  
To download it locally:

```bash
ollama run gemma3
``` 

To use a different model:
- Open `background.js`
- Update the `"model"` field in the API request body:

```javascript
model: "your-model-name"
```

---

### 4️⃣ Enable CORS for Ollama Local API

Since the extension communicates with your local Ollama server, you’ll need to allow cross-origin requests.

**On macOS:**

```bash
launchctl setenv OLLAMA_ORIGINS "*"
```

For more details:  
👉 [https://objectgraph.com/blog/ollama-cors/](https://objectgraph.com/blog/ollama-cors/)

**Test CORS configuration:**

```bash
curl -X OPTIONS http://localhost:11434 \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: GET" -I
```

✅ If successful, you'll get:

```
HTTP/1.1 204 No Content
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS
```

If you see:

```
HTTP/1.1 403 Forbidden
```

Double-check your environment variable and restart Ollama.

---

## 🔧 Development TODOs

- Add ESLint + linter config for consistent code quality
- Support dynamically switching models via extension settings
- Store conversation history using `chrome.storage`
- Improve UX with better markdown rendering
- Improve converation state
