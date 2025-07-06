if (document.readyState !== 'loading') { 
    console.log('document is already ready');
    sendBackgroundWorkerPageContext();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        console.log('document was not ready, place code here');
        sendBackgroundWorkerPageContext();
    });
} 

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`Received message ${message.type}`)
    switch (message.type) {
        case MessageTypes.GET_PAGE_CONTENT:
            sendBackgroundWorkerPageContext()
            break;
        default:
            console.error(`Received unknown message type ${message.type}`)
            break;
    }
});

function sendBackgroundWorkerPageContext() {
    const pageText = document.body.innerText;  
    console.log("sending message to service worker")
    chrome.runtime.sendMessage({
      type: MessageTypes.PAGE_CONTENT,
      text: pageText
    });
}
