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
    // Procesar encabezados
    text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    
    // Procesar negritas
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Procesar listas numeradas
    text = text.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="numbered-item"><strong>$1.</strong> $2</li>');
    
    // Procesar sub-listas con indentación
    text = text.replace(/^\*\s{3}(.+)$/gm, '<li class="sub-item">$1</li>');
    
    // Procesar listas normales
    text = text.replace(/^\*\s+(.+)$/gm, '<li>$1</li>');
    
    // Envolver listas numeradas
    text = text.replace(/(<li class="numbered-item">.*?<\/li>\n?)+/gs, '<ol>$&</ol>');
    
    // Envolver sub-listas
    text = text.replace(/(<li class="sub-item">.*?<\/li>\n?)+/gs, '<ul class="sub-list">$&</ul>');
    
    // Envolver listas normales
    text = text.replace(/(<li>.*?<\/li>\n?)+/gs, '<ul>$&</ul>');
    
    // Procesar cursivas
    text = text.replace(/\*([^\*\n]+?)\*/g, '<em>$1</em>');
    
    // Párrafos
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
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function sendMessage(message) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) {
            throw new Error('Server response error');
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
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

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});