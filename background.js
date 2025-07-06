importScripts("constants.js");

/* 
TODO: improvements on article conversation state
1. context window length checking
2. knowing when to resend page contents during the conversation 
*/ 
const ConversationState = (() => { 
	let pageContent = "";
	let conversationContext = [];
	let query = ""
	let isNewPageConversation = false 

	// TODO: adjust prompts & maybe, i don't need separate prompts 
	const followUpPrompt = `
			I'm reading the article I provided to you earlier. From what you can remember,
			can you help answer my query?. If you're unsure, just make an educated guess and guide
			the reader with helpful ways to figure it out. Answer with markdown text.` 
	const initPrompt = `You are an article helper. I'm providing you an article to remember and help
			readers if they have any questions.`
  
	return {
	  setNewPageConversation(){
		isNewPageConversation = true
		return this
	  },
	  getIsNewPageConversation() {
		return isNewPageConversation
	  },
	  setPageContent(content) {
		isNewPageConversation = true
		pageContent = content;
		console.log("✅ Page content updated.");
		return this
	  },
	  getPageContent() {
		return pageContent;
	  },
	  setLLMContext(context) {
		conversationContext = context;
		console.log("✅ LLM response cached.");
		return this
	  },
	  getLLMContext(){
		return conversationContext
	  },
	  getLLMResponse() {
		return lastLLMResponse;
	  },
	  getPrompt(){
		if (isNewPageConversation) {
			isNewPageConversation = false
			return `Your job:${initPrompt}; Customer Query ${this.getQuery()}; Article: ${this.getPageContent()}`
		}
		return `${followUpPrompt} ${this.getQuery()}` 
	  },
	  setQuery(newQuery) {
		query = newQuery;
		console.log("✅ query cached.");
		return this
	  },
	  getQuery() {
		return query
	  },
	  getLLMMessageWithContext() {
		return JSON.stringify({
			model: "gemma3", // TODO: magic string
			prompt: this.getPrompt(),
			stream: false,
			context: this.getLLMContext(),
		})
	  },
	  async sendLLMMessage() {
			prompt = this.getLLMMessageWithContext()
			console.log(`sending message ${prompt}`)
			const response = await fetch("http://localhost:11434/api/generate", {  //TODO: magic string and use the '/chat' endpoint etc. more in the docs
				method: "POST",
				headers: { 
					"Content-Type": "application/json", 
					"Access-Control-Allow-Origin": "localhost" // TODO
				},
				body: prompt // TODO: look into Ollama structured output
			});
		
			console.log(`status: ${response.status}`)
		
			if (!response.ok) {
				console.error('Request failed with status:', response.status);
				return `chatbot failed. Please try again`
			} else {
				responseBody = await response.json()
				console.log(`LLM response ${responseBody.response}`)
				this.setLLMContext(responseBody.context)
				return responseBody.response 
			}
		}
	};
})();


chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'openSidePanel',
      title: 'Open Article Assistant',
      contexts: ['all']
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	switch (info.menuItemId) {
		case "openSidePanel":
			chrome.sidePanel.open({ windowId: tab.windowId });	
			break;
	}
});

chrome.runtime.onMessage.addListener((message, sender) => {
	(async () => {
		console.log(`Received ${message.type}`)
		if (message.type === 'open_side_panel') {
			await chrome.sidePanel.open({ tabId: sender.tab.id });
			await chrome.sidePanel.setOptions({
				tabId: sender.tab.id,
				path: 'sidepanel.html',
				enabled: true
			});
		}
		if (message.type === "askLLM") { // TODO: create enum types for runtime request messages and responses 
			const llmResponse = await ConversationState.setQuery(message.text).sendLLMMessage()
			chrome.runtime.sendMessage({
				type: MessageTypes.LLM_RESPONSE,
				response: llmResponse
			});
		}
		if (message.type === "pageContent") {
			ConversationState.setPageContent(message.text)
		}
		if (message.type === "sidePanelRefreshed") {
			ConversationState.setNewPageConversation() // TODO: might need fixing. It might not necessarily be a new page conversation
			if (!ConversationState.getPageContent()) {
				console.log("Page content not set - getting page content");
				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
					if (tabs[0]) {
						chrome.tabs.sendMessage(tabs[0].id, { type: MessageTypes.GET_PAGE_CONTENT});
					}
				});
			}		
		  }
	})();
});


function isHttpUrl(url) {
	return url && (url.startsWith("http://") || url.startsWith("https://"));
}

// on tab switch
chrome.tabs.onActivated.addListener(activeInfo => {
	chrome.tabs.get(activeInfo.tabId, tab => {
	  if (tab && isHttpUrl(tab.url)) {
		chrome.tabs.sendMessage(activeInfo.tabId, { type: MessageTypes.GET_PAGE_CONTENT }, (response) => {
		  if (chrome.runtime.lastError) {
			console.warn(chrome.runtime.lastError);
		  } else if (response && response.text) {
			ConversationState.setNewPageConversation(true).setPageContent(response.text);
			console.log("Page content updated from tab switch", activeInfo.tabId);
		  }
		});
	  }
	});
});