(function() {
    const CHATBOT_API = window.location.origin || 'http://localhost:8000';
    
    const styles = document.createElement('link');
    styles.rel = 'stylesheet';
    styles.href = `${CHATBOT_API}/static/css/chat.css`;
    document.head.appendChild(styles);
    
    const chatHTML = `
        <div class="chat-bubble" id="chatBubble">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        </div>
        <div class="chat-container" id="chatContainer">
            <div class="chat-header">
                <div class="chat-header-content">
                    <div class="chat-status">
                        <span class="status-dot"></span>
                        <span class="status-text">Online</span>
                    </div>
                    <h3>Exoplanet Chatbot</h3>
                    <p>Specialized assistant for exoplanets</p>
                </div>
                <button class="close-button" id="closeButton">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="message bot-message">
                    <div class="message-content">
                        <p>Welcome to the Exoplanet Chatbot. You can ask me about exoplanets, detection methods, and related concepts.</p>
                    </div>
                </div>
            </div>
            <div class="chat-input-container">
                <form id="chatForm" class="chat-form">
                    <input type="text" id="messageInput" class="chat-input" placeholder="Type your message..." autocomplete="off" required>
                    <button type="submit" class="send-button" id="sendButton">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatHTML);
    
    const chatBubble = document.getElementById('chatBubble');
    const chatContainer = document.getElementById('chatContainer');
    const closeButton = document.getElementById('closeButton');
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    const sendButton = document.getElementById('sendButton');
    
    chatBubble.addEventListener('click', () => {
        chatContainer.classList.add('active');
        chatBubble.style.display = 'none';
        messageInput.focus();
    });
    
    closeButton.addEventListener('click', () => {
        chatContainer.classList.remove('active');
        chatBubble.style.display = 'flex';
    });
    
    function formatMessage(text) {
        text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="numbered-item"><strong>$1.</strong> $2</li>');
        text = text.replace(/^\*\s{3}(.+)$/gm, '<li class="sub-item">$1</li>');
        text = text.replace(/^\*\s+(.+)$/gm, '<li>$1</li>');
        text = text.replace(/(<li class="numbered-item">.*?<\/li>\n?)+/gs, '<ol>$&</ol>');
        text = text.replace(/(<li class="sub-item">.*?<\/li>\n?)+/gs, '<ul class="sub-list">$&</ul>');
        text = text.replace(/(<li>.*?<\/li>\n?)+/gs, '<ul>$&</ul>');
        text = text.replace(/\*([^\*\n]+?)\*/g, '<em>$1</em>');
        text = text.replace(/\n\n/g, '</p><p>');
        text = text.replace(/\n/g, '<br>');
        if (!text.startsWith('<h3>') && !text.startsWith('<ol>') && !text.startsWith('<ul>')) {
            text = '<p>' + text + '</p>';
        }
        return text;
    }
    
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ' + (isUser ? 'user-message' : 'bot-message');
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (isUser) {
            const paragraph = document.createElement('p');
            paragraph.textContent = content;
            messageContent.appendChild(paragraph);
        } else {
            messageContent.innerHTML = formatMessage(content);
        }
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message';
        typingDiv.id = 'typingIndicator';
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        typingDiv.appendChild(indicator);
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) typingIndicator.remove();
    }
    
    async function sendMessage(message) {
        const response = await fetch(`${CHATBOT_API}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });
        if (!response.ok) throw new Error('Server response error');
        const data = await response.json();
        return data.response;
    }
    
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (!message) return;
        
        addMessage(message, true);
        messageInput.value = '';
        sendButton.disabled = true;
        messageInput.disabled = true;
        showTypingIndicator();
        
        try {
            const response = await sendMessage(message);
            removeTypingIndicator();
            addMessage(response, false);
        } catch (error) {
            removeTypingIndicator();
            addMessage('Error processing request. Please try again.', false);
        } finally {
            sendButton.disabled = false;
            messageInput.disabled = false;
            messageInput.focus();
        }
    });
})();