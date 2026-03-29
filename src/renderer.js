import './index.css';

let tokens = {};
let skills = [];
let messages = [];
let currentApiKey = null;
let isStreaming = false;
let currentModel = 'MiniMax-M2.7';
let workspacePath = null;
let attachedFiles = [];
let totalTokenUsage = 0;

const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const tokenWarning = document.getElementById('token-warning');
const typingIndicator = document.getElementById('typing-indicator');
const skillsList = document.getElementById('skills-list');
const mcpServers = document.getElementById('mcp-servers');
const modelSelector = document.getElementById('model-selector');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeSettings = document.getElementById('close-settings');
const themeToggle = document.getElementById('theme-toggle');
const fileTree = document.getElementById('file-tree');
const refreshFiles = document.getElementById('refresh-files');
const dropZone = document.getElementById('drop-zone');
const attachedFilesContainer = document.getElementById('attached-files');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKey = document.getElementById('save-api-key');
const settingsModel = document.getElementById('settings-model');
const workspacePathInput = document.getElementById('workspace-path');
const browseWorkspace = document.getElementById('browse-workspace');
const saveSettingsBtn = document.getElementById('save-settings');
const clearChatBtn = document.getElementById('clear-chat');
const openSettingsBtn = document.getElementById('open-settings');
const charCount = document.getElementById('char-count');
const tokenUsageDisplay = document.getElementById('token-usage');
const modelNameDisplay = document.getElementById('model-name');
const toastContainer = document.getElementById('toast-container');
const sidebarTabs = document.querySelectorAll('.sidebar-tab');
const sidebarPanels = document.querySelectorAll('.sidebar-panel');

let assistantMsg = null;
let thinkingMsg = null;
let fullResponse = '';
let thinkingContent = '';
let contextMenu = null;
let draggedFile = null;

function getFileIcon(iconType) {
  const icons = {
    file: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
    folder: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    javascript: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f7df1e" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V9m4 8V13"/></svg>',
    json: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f7df1e" stroke-width="2"><path d="M4 6h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8a2 2 0 0 1 2-2h2"/></svg>',
    html: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e34f26" stroke-width="2"><path d="M4 3h16l-1.5 15-6.5 2-6.5-2L4 3z"/><path d="M8 8h8m-7 4h5"/></svg>',
    css: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1572b6" stroke-width="2"><path d="M4 3h16l-1.5 15-6.5 2-6.5-2L4 3z"/></svg>',
    markdown: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h12m-6 6h12"/></svg>',
    python: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3776ab" stroke-width="2"><path d="M12 2C8 2 8 4 8 4v4h4v2H6s-4 0-4 4v4s0 4 4 4h4v-4s0-2 2-2h4s2 0 2-2V6s0-4-6-4z"/></svg>',
    image: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    terminal: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  };
  return icons[iconType] || icons.file;
}

function renderFileTree(items, container) {
  container.innerHTML = '';
  
  items.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = `tree-item ${item.type}`;
    if (item.type === 'directory') {
      itemEl.classList.add('expanded');
    }
    
    const iconHtml = item.type === 'directory' 
      ? '<svg class="tree-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
      : `<span class="tree-icon">${getFileIcon(item.icon)}</span>`;
    
    itemEl.innerHTML = `${iconHtml}<span class="tree-label">${item.name}</span>`;
    
    if (item.type === 'directory' && item.children) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'tree-children';
      renderFileTree(item.children, childrenContainer);
      itemEl.appendChild(childrenContainer);
      
      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        itemEl.classList.toggle('expanded');
        childrenContainer.classList.toggle('collapsed');
      });
    } else if (item.type === 'file') {
      itemEl.addEventListener('click', () => {
        if (draggedFile) {
          attachDroppedFile(item.path, item.name);
        } else {
          selectFile(item.path, item.name);
        }
      });
      
      itemEl.addEventListener('dragstart', (e) => {
        draggedFile = { path: item.path, name: item.name };
        e.dataTransfer.setData('text/plain', item.path);
        setTimeout(() => itemEl.style.opacity = '0.5', 0);
      });
      
      itemEl.addEventListener('dragend', () => {
        draggedFile = null;
        itemEl.style.opacity = '1';
      });
    }
    
    itemEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, item);
    });
    
    container.appendChild(itemEl);
  });
}

function showContextMenu(x, y, item) {
  closeContextMenu();
  
  contextMenu = document.createElement('div');
  contextMenu.className = 'context-menu';
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  
  contextMenu.innerHTML = `
    <div class="context-menu-item" data-action="open">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      Open
    </div>
    ${item.type === 'file' ? `
    <div class="context-menu-item" data-action="attach">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
      Attach to Chat
    </div>
    <div class="context-menu-item" data-action="copy-path">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      Copy Path
    </div>
    ` : ''}
    <div class="context-menu-separator"></div>
    <div class="context-menu-item" data-action="reveal">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      Reveal in Finder
    </div>
  `;
  
  contextMenu.addEventListener('click', (e) => {
    const action = e.target.closest('.context-menu-item')?.dataset.action;
    if (action === 'attach' && item.type === 'file') {
      attachDroppedFile(item.path, item.name);
    } else if (action === 'copy-path') {
      navigator.clipboard.writeText(item.path);
      showToast('Path copied to clipboard', 'success');
    }
    closeContextMenu();
  });
  
  document.body.appendChild(contextMenu);
  
  setTimeout(() => {
    document.addEventListener('click', closeContextMenu, { once: true });
  }, 0);
}

function closeContextMenu() {
  if (contextMenu) {
    contextMenu.remove();
    contextMenu = null;
  }
}

async function selectFile(filePath, fileName) {
  try {
    const result = await window.maxi.readFile(filePath);
    if (result.error) {
      showToast(result.error, 'error');
      return;
    }
    messageInput.value += `\n\`\`\`\n// File: ${fileName}\n${result.content}\n\`\`\`\n`;
    messageInput.focus();
  } catch (error) {
    showToast('Failed to read file', 'error');
  }
}

async function loadWorkspaceFiles() {
  if (!workspacePath) {
    const homePath = await window.maxi.getHomePath();
    workspacePath = homePath;
    workspacePathInput.value = workspacePath;
  }
  
  try {
    const files = await window.maxi.readDirectory(workspacePath);
    renderFileTree(files, fileTree);
  } catch (error) {
    console.error('Failed to load workspace files:', error);
  }
}

async function loadTokens() {
  try {
    tokens = await window.maxi.loadTokens();
    const tokenKeys = Object.keys(tokens);
    if (tokenKeys.length > 0) {
      currentApiKey = tokens[tokenKeys[0]];
      tokenWarning.classList.add('hidden');
      if (!apiKeyInput.value) {
        apiKeyInput.value = currentApiKey;
      }
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
      skillItem.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>${name}</span>
      `;
      skillItem.addEventListener('click', () => {
        document.querySelectorAll('.skill-item').forEach(el => el.classList.remove('active'));
        skillItem.classList.add('active');
        messageInput.value += `\n[Skill: ${name}]\n`;
      });
      skillsList.appendChild(skillItem);
    });
  } catch (error) {
    console.error('Failed to load skills:', error);
  }
}

function showMCPServers() {
  mcpServers.innerHTML = `
    <div class="mcp-server connected">
      <span class="status-dot"></span>
      <span>Files System</span>
    </div>
    <div class="mcp-server connected">
      <span class="status-dot"></span>
      <span>Git Integration</span>
    </div>
  `;
}

function parseMarkdown(text) {
  let html = text;
  
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const lines = code.trim().split('\n');
    const lineNumbers = lines.map((_, i) => `<span class="line-number">${i + 1}</span>`).join('');
    return `
      <div class="code-block">
        <div class="code-header">
          <span class="code-language">${lang || 'code'}</span>
          <div class="code-actions">
            <button class="copy-btn" title="Copy code">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        </div>
        <pre><code>${escapeHtml(code.trim())}</code></pre>
      </div>
    `;
  });
  
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p><\/p>/g, '');
  
  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function addMessage(role, content, type = 'text') {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}-message`;
  
  if (type === 'thinking') {
    msgDiv.className = `message ${role}-message thinking-block`;
    msgDiv.innerHTML = `
      <div class="thinking-header">
        <div class="thinking-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          Thinking
        </div>
        <button class="collapse-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
      <div class="thinking-content">${escapeHtml(content)}</div>
    `;
    
    const header = msgDiv.querySelector('.thinking-header');
    const contentEl = msgDiv.querySelector('.thinking-content');
    header.addEventListener('click', () => {
      contentEl.classList.toggle('collapsed');
      header.querySelector('.collapse-btn svg').style.transform = 
        contentEl.classList.contains('collapsed') ? 'rotate(-90deg)' : '';
    });
  } else if (type === 'tool-call') {
    msgDiv.className = `message ${role}-message tool-call`;
    msgDiv.innerHTML = `
      <div class="tool-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
        Tool: ${escapeHtml(content.tool)}
      </div>
      <div class="tool-content">
        <pre>${JSON.stringify(content.input, null, 2)}</pre>
      </div>
    `;
  } else {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msgDiv.innerHTML = `
      <div class="message-content">${role === 'assistant' ? parseMarkdown(content) : escapeHtml(content)}</div>
      ${role === 'assistant' ? `
      <div class="message-footer">
        <span class="message-time">${time}</span>
        <button class="copy-btn" title="Copy">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>
      ` : ''}
    `;
    
    const copyBtn = msgDiv.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(content);
        showToast('Copied to clipboard', 'success');
      });
    }
  }
  
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msgDiv;
}

window.maxi.onChatStream((content) => {
  if (assistantMsg) {
    fullResponse += content;
    const contentDiv = assistantMsg.querySelector('.message-content');
    if (contentDiv) {
      contentDiv.innerHTML = parseMarkdown(fullResponse);
    }
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
  
  const welcome = chatMessages.querySelector('.welcome-state');
  if (welcome) {
    welcome.remove();
  }
});

window.maxi.onTokenUsage((data) => {
  totalTokenUsage = data.total || 0;
  tokenUsageDisplay.textContent = `Tokens: ${data.output || 0} out / ${data.total || 0} total`;
});

modelSelector.addEventListener('change', (e) => {
  currentModel = e.target.value;
  settingsModel.value = currentModel;
  modelNameDisplay.textContent = currentModel;
});

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('sidebar-open');
});

sidebarTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    sidebarTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    sidebarPanels.forEach(p => {
      p.classList.toggle('active', p.id === `${tabName}-panel`);
    });
  });
});

settingsBtn.addEventListener('click', () => {
  settingsModal.classList.remove('hidden');
});

closeSettings.addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

settingsModal.querySelector('.modal-backdrop').addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

themeToggle.addEventListener('click', () => {
  const app = document.getElementById('app');
  app.classList.toggle('light');
  localStorage.setItem('theme', app.classList.contains('light') ? 'light' : 'dark');
});

document.querySelectorAll('.theme-option').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const theme = btn.dataset.theme;
    const app = document.getElementById('app');
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      app.classList.toggle('light', !prefersDark);
    } else {
      app.classList.toggle('light', theme === 'light');
    }
    localStorage.setItem('theme', theme);
  });
});

saveApiKey.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (key) {
    currentApiKey = key;
    tokenWarning.classList.add('hidden');
    showToast('API key saved', 'success');
  }
});

browseWorkspace.addEventListener('click', async () => {
  const path = await window.maxi.selectWorkspace();
  if (path) {
    workspacePath = path;
    workspacePathInput.value = workspacePath;
    loadWorkspaceFiles();
  }
});

saveSettingsBtn.addEventListener('click', () => {
  currentModel = settingsModel.value;
  modelSelector.value = currentModel;
  modelNameDisplay.textContent = currentModel;
  settingsModal.classList.add('hidden');
  showToast('Settings saved', 'success');
});

clearChatBtn.addEventListener('click', () => {
  messages = [];
  chatMessages.innerHTML = `
    <div class="welcome-state">
      <div class="welcome-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <h2>Welcome to Maxi</h2>
      <p>Ask me anything, or drag files into the chat to get started.</p>
    </div>
  `;
  settingsModal.classList.add('hidden');
  showToast('Chat cleared', 'success');
});

openSettingsBtn.addEventListener('click', () => {
  settingsModal.classList.remove('hidden');
});

messageInput.addEventListener('input', () => {
  charCount.textContent = messageInput.value.length;
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
  sendBtn.disabled = !messageInput.value.trim() || isStreaming;
});

attachBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files);
  files.forEach(file => {
    addAttachedFile(file);
  });
});

function addAttachedFile(fileData) {
  const file = {
    name: fileData.name || fileData.path.split('/').pop(),
    path: fileData.path || null,
    size: fileData.size || 0,
    type: fileData.type || 'application/octet-stream'
  };
  
  attachedFiles.push(file);
  renderAttachedFiles();
}

function renderAttachedFiles() {
  if (attachedFiles.length === 0) {
    attachedFilesContainer.classList.add('hidden');
    return;
  }
  
  attachedFilesContainer.classList.remove('hidden');
  attachedFilesContainer.innerHTML = attachedFiles.map((file, index) => `
    <div class="attached-file">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
      </svg>
      <span>${file.name}</span>
      <span class="remove-file" data-index="${index}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </span>
    </div>
  `).join('');
  
  attachedFilesContainer.querySelectorAll('.remove-file').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      attachedFiles.splice(index, 1);
      renderAttachedFiles();
    });
  });
}

chatMessages.addEventListener('dragover', (e) => {
  e.preventDefault();
  if (e.dataTransfer.types.includes('Files')) {
    dropZone.classList.remove('hidden');
  }
});

chatMessages.addEventListener('dragleave', (e) => {
  if (e.relatedTarget === null || !chatMessages.contains(e.relatedTarget)) {
    dropZone.classList.add('hidden');
  }
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.add('hidden');
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.add('hidden');
  
  const files = Array.from(e.dataTransfer.files);
  files.forEach(file => {
    if (file.path) {
      attachDroppedFile(file.path, file.name);
    }
  });
});

async function attachDroppedFile(filePath, fileName) {
  try {
    const result = await window.maxi.readFile(filePath);
    if (result.error) {
      showToast(`Error: ${result.error}`, 'error');
      return;
    }
    
    const size = result.size || 0;
    addAttachedFile({
      name: fileName,
      path: filePath,
      size: size,
      content: result.content
    });
    
    showToast(`Attached: ${fileName}`, 'success');
  } catch (error) {
    showToast('Failed to attach file', 'error');
  }
}

async function sendMessage() {
  let content = messageInput.value.trim();
  if (!content && attachedFiles.length === 0) return;
  
  if (!currentApiKey) {
    addMessage('assistant', 'No API token available. Please configure your API key in Settings.');
    return;
  }

  messageInput.value = '';
  charCount.textContent = '0';
  messageInput.style.height = 'auto';
  isStreaming = true;
  sendBtn.disabled = true;
  typingIndicator.classList.remove('hidden');

  const userContent = content;
  if (attachedFiles.length > 0) {
    const fileAttachments = attachedFiles.map(f => {
      if (f.content) {
        return `[File: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\``;
      }
      return `[File: ${f.name}]`;
    }).join('\n\n');
    messages.push({ role: 'user', content: `${userContent}\n\n${fileAttachments}` });
  } else {
    messages.push({ role: 'user', content: userContent });
  }
  
  addMessage('user', userContent);
  attachedFiles = [];
  renderAttachedFiles();

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
    assistantMsg.querySelector('.message-content').innerHTML = `
      <p style="color: var(--error);">Error: ${error.message}</p>
      <p>Please check your API key and try again.</p>
    `;
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

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
    <span class="toast-close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </span>
  `;
  
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const app = document.getElementById('app');
  
  if (savedTheme === 'light') {
    app.classList.add('light');
  } else if (savedTheme === 'dark') {
    app.classList.remove('light');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    app.classList.toggle('light', !prefersDark);
  }
  
  const themeOption = document.querySelector(`.theme-option[data-theme="${savedTheme || 'system'}"]`);
  if (themeOption) {
    document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
    themeOption.classList.add('active');
  }
}

refreshFiles.addEventListener('click', () => {
  loadWorkspaceFiles();
});

initTheme();
loadTokens();
loadSkills();
loadWorkspaceFiles();
showMCPServers();