const MessageTypes = Object.freeze({
    OPEN_SIDE_PANEL: "open_side_panel",
    ASK_LLM: "askLLM",
    HIGHLIGHT: "highlight",
    LLM_RESPONSE: "llmResponse",
    GET_PAGE_CONTENT: "getPageContent",
    PAGE_CONTENT: "pageContent",
    SIDE_PANEL_REFRESHED: "sidePanelRefreshed",
});

// Attach globally for both content scripts/service workers and sidepanel pages
if (typeof window !== "undefined") {
    window.MessageTypes = MessageTypes;
} 
if (typeof self !== "undefined") {
    self.MessageTypes = MessageTypes;
}

  