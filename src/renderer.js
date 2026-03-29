import './index.css';

let tokens = {};
let skills = [];
let messages = [];
let currentApiKey = null;
let isStreaming = false;
let currentModel = 'MiniMax-M2.7';

const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const tokenWarning = document.getElementById('token-warning');
const typingIndicator = document.getElementById('typing-indicator');
const skillsList = document.getElementById('skills-list');
const mcpStatus = document.getElementById('mcp-status');
const modelSelector = document.getElementById('model-selector');

async function loadTokens() {
  try {
    tokens = await window.maxi.loadTokens();
    const tokenKeys = Object.keys(tokens);
    if (tokenKeys.length > 0) {
      currentApiKey = tokens[tokenKeys[0]];
      tokenWarning.classList.add('hidden');
    } else {
      tokenWarning.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Failed to load tokens:', error);
    tokenWarning.classList.remove('hidden');
  }
}

async function loadSkills() {
  try {
    const skillsData = await window.maxi.loadSkills();
    skillsList.innerHTML = '';
    const skillNames = Object.keys(skillsData);
    if (skillNames.length === 0) {
      skillsList.innerHTML = '<p class="empty-state">No skills loaded</p>';
      return;
    }
    skillNames.forEach(name => {
      const skillItem = document.createElement('div');
      skillItem.className = 'skill-item';
      skillItem.textContent = name;
      skillsList.appendChild(skillItem);
    });
  } catch (error) {
    console.error('Failed to load skills:', error);
  }
}

function addMessage(role, content, type = 'text') {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}-message`;
  
  if (type === 'thinking') {
    msgDiv.className = `message ${role}-message thinking-block`;
    msgDiv.innerHTML = `<div class="thinking-header">🤔 Thinking...</div><div class="thinking-content">${content}</div>`;
  } else if (type === 'tool-call') {
    msgDiv.className = `message ${role}-message tool-call`;
    msgDiv.innerHTML = `<div class="tool-header">🔧 Tool: ${content.tool}</div><pre class="tool-input">${JSON.stringify(content.input, null, 2)}</pre>`;
  } else {
    msgDiv.textContent = content;
  }
  
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msgDiv;
}

let assistantMsg = null;
let thinkingMsg = null;
let fullResponse = '';
let thinkingContent = '';

window.maxi.onChatStream((content) => {
  if (assistantMsg) {
    fullResponse += content;
    assistantMsg.textContent = fullResponse;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

window.maxi.onChatThinking((content) => {
  if (!thinkingMsg) {
    thinkingMsg = addMessage('assistant', '', 'thinking');
  }
  thinkingContent += content;
  thinkingMsg.querySelector('.thinking-content').textContent = thinkingContent;
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

window.maxi.onChatComplete(() => {
  if (thinkingMsg) {
    thinkingMsg.remove();
    thinkingMsg = null;
    thinkingContent = '';
  }
  if (fullResponse) {
    messages.push({ role: 'assistant', content: fullResponse });
  }
  isStreaming = false;
  sendBtn.disabled = false;
  typingIndicator.classList.add('hidden');
});

modelSelector.addEventListener('change', (e) => {
  currentModel = e.target.value;
});

async function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || isStreaming) return;
  
  if (!currentApiKey) {
    addMessage('assistant', 'No API token available. Please add tokens to ~/.maxi/tokens/');
    return;
  }

  messageInput.value = '';
  isStreaming = true;
  sendBtn.disabled = true;
  typingIndicator.classList.remove('hidden');

  messages.push({ role: 'user', content });
  addMessage('user', content);

  assistantMsg = addMessage('assistant', '');
  fullResponse = '';

  try {
    await window.maxi.streamChat({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      apiKey: currentApiKey,
      model: currentModel
    });
  } catch (error) {
    if (thinkingMsg) {
      thinkingMsg.remove();
      thinkingMsg = null;
    }
    assistantMsg.textContent = `Error: ${error.message}`;
    isStreaming = false;
    sendBtn.disabled = false;
    typingIndicator.classList.add('hidden');
  }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

attachBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files);
  if (files.length > 0) {
    const fileInfo = files.map(f => f.name).join(', ');
    messageInput.value += `[Attached: ${fileInfo}]`;
  }
});

loadTokens();
loadSkills();