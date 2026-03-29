import './index.css';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

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
const imageBtn = document.getElementById('image-btn');
const fileInput = document.getElementById('file-input');
const imageInput = document.getElementById('image-input');
const lightbox = document.getElementById('image-lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxFilename = document.getElementById('lightbox-filename');
const lightboxDimensions = document.getElementById('lightbox-dimensions');
const lightboxClose = document.getElementById('lightbox-close');
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
let attachedImages = [];
let uploadedImages = [];

let isRecording = false;
let recognition = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingTimerId = null;
let transcriptText = '';

const micBtn = document.getElementById('mic-btn');
const recordingBar = document.getElementById('recording-bar');
const recordingTimerEl = document.getElementById('recording-timer');
const transcriptionPreview = document.getElementById('transcription-preview');
const stopRecordingBtn = document.getElementById('stop-recording-btn');
const cancelRecordingBtn = document.getElementById('cancel-recording-btn');

let terminal = null;
let terminalFitAddon = null;
let terminalInitialized = false;
let commandHistory = [];
let commandHistoryIndex = -1;
let currentCommand = '';
let terminalHeight = 200;
let isResizing = false;

let sshConnections = [];
let currentSshConnection = null;
let sshTerminal = null;
let sshTerminalFitAddon = null;
let sshConnected = false;
let sshEditingId = null;

let chatHistory = [];
let currentChatId = null;
let selectedChatId = null;
let selectedChatData = null;
let autoSaveInterval = null;
let hasUnsavedChanges = false;
let renamingChatId = null;

const MAX_TABS = 10;

let tabs = [];
let activeTabId = null;
let tabScrollPositions = {};
let draggedTabId = null;

function generateTabId() {
  return 'tab_' + Math.random().toString(36).substr(2, 9);
}

function createTab(title = 'New Chat') {
  if (tabs.length >= MAX_TABS) {
    showToast(`Maximum ${MAX_TABS} tabs allowed`, 'warning');
    return null;
  }
  
  const tabId = generateTabId();
  const tab = {
    id: tabId,
    title: title,
    messages: [],
    chatId: null,
    hasUnsavedChanges: false,
    scrollPosition: 0
  };
  
  tabs.push(tab);
  renderTabs();
  switchToTab(tabId);
  return tabId;
}

function closeTab(tabId) {
  const tabIndex = tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1) return;
  
  const tab = tabs[tabIndex];
  
  if (tab.hasUnsavedChanges || (tab.messages.length > 0 && !tab.chatId)) {
    const shouldClose = confirm('You have unsaved changes. Close anyway?');
    if (!shouldClose) return;
  }
  
  tabs.splice(tabIndex, 1);
  delete tabScrollPositions[tabId];
  
  if (tabs.length === 0) {
    createTab('New Chat');
  } else if (activeTabId === tabId) {
    const newIndex = Math.min(tabIndex, tabs.length - 1);
    switchToTab(tabs[newIndex].id);
  }
  
  renderTabs();
}

function switchToTab(tabId) {
  if (activeTabId === tabId) return;
  
  if (activeTabId) {
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab) {
      currentTab.scrollPosition = chatMessages.scrollTop;
      currentTab.messages = messages;
      currentTab.hasUnsavedChanges = hasUnsavedChanges;
      if (messages.length > 0) {
        const firstUserMsg = messages.find(m => m.role === 'user');
        currentTab.title = firstUserMsg 
          ? firstUserMsg.content.substring(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '')
          : 'New Chat';
      }
    }
  }
  
  activeTabId = tabId;
  const tab = tabs.find(t => t.id === tabId);
  if (tab) {
    messages = tab.messages || [];
    hasUnsavedChanges = tab.hasUnsavedChanges || false;
    currentChatId = tab.chatId;
    
    setTimeout(() => {
      chatMessages.scrollTop = tab.scrollPosition || 0;
    }, 0);
    
    renderMessages();
  }
  
  renderTabs();
}

function updateActiveTabTitle() {
  if (!activeTabId) return;
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && messages.length > 0) {
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      tab.title = firstUserMsg.content.substring(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
      renderTabs();
    }
  }
}

function renderTabs() {
  const tabList = document.getElementById('tab-list');
  if (!tabList) return;
  
  tabList.innerHTML = tabs.map(tab => `
    <div class="tab ${tab.id === activeTabId ? 'active' : ''}" 
         data-id="${tab.id}"
         draggable="true">
      ${tab.hasUnsavedChanges ? '<span class="tab-unsaved"></span>' : ''}
      <span class="tab-title">${escapeHtml(tab.title || 'New Chat')}</span>
      <button class="tab-close" data-tab-id="${tab.id}" title="Close tab">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join('');
  
  tabList.querySelectorAll('.tab').forEach(tabEl => {
    const tabId = tabEl.dataset.id;
    
    tabEl.addEventListener('click', (e) => {
      if (!e.target.closest('.tab-close')) {
        switchToTab(tabId);
      }
    });
    
    tabEl.addEventListener('auxclick', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        closeTab(tabId);
      }
    });
    
    tabEl.addEventListener('dragstart', (e) => {
      draggedTabId = tabId;
      tabEl.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    tabEl.addEventListener('dragend', () => {
      tabEl.classList.remove('dragging');
      draggedTabId = null;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('drag-over'));
    });
    
    tabEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (draggedTabId && draggedTabId !== tabId) {
        tabEl.classList.add('drag-over');
      }
    });
    
    tabEl.addEventListener('dragleave', () => {
      tabEl.classList.remove('drag-over');
    });
    
    tabEl.addEventListener('drop', (e) => {
      e.preventDefault();
      if (draggedTabId && draggedTabId !== tabId) {
        const draggedIndex = tabs.findIndex(t => t.id === draggedTabId);
        const targetIndex = tabs.findIndex(t => t.id === tabId);
        
        const [draggedTab] = tabs.splice(draggedIndex, 1);
        tabs.splice(targetIndex, 0, draggedTab);
        renderTabs();
      }
    });
  });
  
  tabList.querySelectorAll('.tab-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(btn.dataset.tabId);
    });
  });
}

function initTabs() {
  createTab('New Chat');
  
  document.getElementById('new-tab-btn').addEventListener('click', () => {
    createTab('New Chat');
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
      createTab('New Chat');
    } else if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      if (activeTabId) {
        closeTab(activeTabId);
      }
    } else if (e.ctrlKey && e.key === 'Tab') {
      e.preventDefault();
      if (tabs.length > 1) {
        const currentIndex = tabs.findIndex(t => t.id === activeTabId);
        const nextIndex = (currentIndex + 1) % tabs.length;
        switchToTab(tabs[nextIndex].id);
      }
    }
  });
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported');
    return null;
  }
  
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    transcriptText = finalTranscript || interimTranscript;
    transcriptionPreview.textContent = transcriptText || 'Listening...';
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      showToast('Voice input error: ' + event.error, 'error');
    }
  };
  
  recognition.onend = () => {
    if (isRecording && recognition) {
      try {
        recognition.start();
      } catch (e) {
        console.error('Failed to restart recognition:', e);
      }
    }
  };
  
  return recognition;
}

function startRecording() {
  if (isRecording) return;
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Microphone not supported in this browser', 'error');
    return;
  }
  
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      isRecording = true;
      recordingStartTime = Date.now();
      transcriptText = '';
      
      if (!recognition) {
        initSpeechRecognition();
      }
      
      if (recognition) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to start speech recognition:', e);
        }
      }
      
      updateRecordingUI(true);
      startRecordingTimer();
      showToast('Recording started', 'info');
    })
    .catch((error) => {
      console.error('Failed to access microphone:', error);
      showToast('Failed to access microphone', 'error');
    });
}

function stopRecording() {
  if (!isRecording) return;
  
  isRecording = false;
  
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      console.error('Failed to stop recognition:', e);
    }
  }
  
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  
  stopRecordingTimer();
  updateRecordingUI(false);
  
  if (transcriptText) {
    messageInput.value = transcriptText;
    messageInput.dispatchEvent(new Event('input'));
  }
  
  showToast('Recording stopped', 'success');
}

function cancelRecording() {
  if (!isRecording) return;
  
  isRecording = false;
  
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      console.error('Failed to stop recognition:', e);
    }
  }
  
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  
  audioChunks = [];
  transcriptText = '';
  stopRecordingTimer();
  updateRecordingUI(false);
  showToast('Recording cancelled', 'info');
}

function startRecordingTimer() {
  recordingTimerEl.textContent = '00:00';
  recordingTimerInterval();
}

function recordingTimerInterval() {
  if (!isRecording) return;
  
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');
  recordingTimerEl.textContent = `${minutes}:${seconds}`;
  
  recordingTimerId = setTimeout(recordingTimerInterval, 1000);
}

function stopRecordingTimer() {
  if (recordingTimerId) {
    clearTimeout(recordingTimerId);
    recordingTimerId = null;
  }
}

function updateRecordingUI(recording) {
  if (recording) {
    recordingBar.classList.remove('hidden');
    micBtn.classList.add('recording');
    micBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    `;
  } else {
    recordingBar.classList.add('hidden');
    micBtn.classList.remove('recording');
    micBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    `;
  }
}

micBtn.addEventListener('click', () => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

stopRecordingBtn.addEventListener('click', stopRecording);
cancelRecordingBtn.addEventListener('click', cancelRecording);

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

function initTerminal() {
  if (terminalInitialized) return;
  
  const terminalContainer = document.getElementById('terminal-container');
  if (!terminalContainer) return;
  
  terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: 'block',
    fontFamily: "'Fira Code', Consolas, Monaco, monospace",
    fontSize: 13,
    theme: {
      background: '#0d1117',
      foreground: '#e0e0e0',
      cursor: '#39d353',
      cursorAccent: '#0d1117',
      selection: 'rgba(57, 211, 83, 0.3)',
      black: '#0d1117',
      red: '#ff7b72',
      green: '#39d353',
      yellow: '#d29922',
      blue: '#58a6ff',
      magenta: '#bc8cff',
      cyan: '#39c5cf',
      white: '#e0e0e0',
      brightBlack: '#6e7681',
      brightRed: '#ffa198',
      brightGreen: '#56d364',
      brightYellow: '#e3b341',
      brightBlue: '#79c0ff',
      brightMagenta: '#d2a8ff',
      brightCyan: '#56d4dd',
      brightWhite: '#ffffff'
    },
    scrollback: 1000,
    allowProposedApi: true
  });
  
  terminalFitAddon = new FitAddon();
  const webLinksAddon = new WebLinksAddon();
  
  terminal.loadAddon(terminalFitAddon);
  terminal.loadAddon(webLinksAddon);
  
  terminal.open(terminalContainer);
  terminalFitAddon.fit();
  
  const dimensions = terminalFitAddon.proposeDimensions();
  if (dimensions) {
    terminal.resize(dimensions.cols, dimensions.rows);
    document.getElementById('terminal-dimensions').textContent = `${dimensions.cols}x${dimensions.rows}`;
  }
  
  terminalInitializePTy();
  
  terminal.onData((data) => {
    window.maxi.writeTerminal(data);
  });
  
  terminal.onResize(({ cols, rows }) => {
    window.maxi.resizeTerminal({ cols, rows });
    document.getElementById('terminal-dimensions').textContent = `${cols}x${rows}`;
  });
  
  terminal.keyboard.onKey((event) => {
    if (event.key === 'ArrowUp') {
      navigateHistory(-1);
      event.domEvent.preventDefault();
    } else if (event.key === 'ArrowDown') {
      navigateHistory(1);
      event.domEvent.preventDefault();
    } else if (event.key === 'Tab') {
      handleTabComplete();
      event.domEvent.preventDefault();
    } else if (event.key === 'c' && event.ctrlKey) {
    } else if (event.key === 'v' && event.ctrlKey) {
    }
  });
  
  const clearBtn = document.getElementById('terminal-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      terminal.clear();
    });
  }
  
  const copyBtn = document.getElementById('terminal-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const selection = terminal.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
        showToast('Copied to clipboard', 'success');
      }
    });
  }
  
  setupTerminalResize();
  
  terminalInitialized = true;
  
  window.maxi.onTerminalData((data) => {
    if (terminal) {
      terminal.write(data);
    }
  });
  
  window.maxi.onTerminalExit((exitCode) => {
    if (terminal) {
      terminal.write(`\r\n[Process exited with code ${exitCode}]\r\n`);
    }
  });
}

async function terminalInitializePTy() {
  const dimensions = terminalFitAddon?.proposeDimensions();
  await window.maxi.createTerminal({
    cols: dimensions?.cols || 80,
    rows: dimensions?.rows || 24
  });
}

function navigateHistory(direction) {
  if (commandHistory.length === 0) return;
  
  if (commandHistoryIndex === -1) {
    currentCommand = terminal.buffer.active.buffer.getLine(terminal.buffer.active.cursorY)?.translateToString() || '';
  }
  
  const newIndex = commandHistoryIndex + direction;
  
  if (newIndex < -1) return;
  if (newIndex >= commandHistory.length) return;
  
  if (commandHistoryIndex === -1 && direction === -1) {
    commandHistoryIndex = commandHistory.length - 1;
  } else {
    commandHistoryIndex = Math.max(-1, Math.min(commandHistory.length - 1, newIndex));
  }
  
  const currentLine = terminal.buffer.active.cursorY;
  terminal.buffer.active.buffer.getLine(currentLine)?.reset();
  
  if (commandHistoryIndex === -1) {
    terminal.write(currentCommand);
  } else {
    terminal.write(commandHistory[commandHistory.length - 1 - commandHistoryIndex]);
  }
}

function handleTabComplete() {
  const currentLine = terminal.buffer.active.cursorY;
  const lineContent = terminal.buffer.active.buffer.getLine(currentLine)?.translateToString() || '';
  const parts = lineContent.trim().split(' ');
  
  if (parts.length === 1) {
    const partial = parts[0];
    const commands = ['ls', 'cd', 'pwd', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'find', 'chmod', 'chown', 'sudo', 'npm', 'git', 'node', 'python', 'clear', 'exit', 'echo', 'touch', 'vim', 'nano', 'ssh', 'curl', 'wget', 'tar', 'zip', 'unzip'];
    const matches = commands.filter(cmd => cmd.startsWith(partial));
    if (matches.length === 1) {
      const completion = matches[0].slice(partial.length);
      terminal.write(completion);
    } else if (matches.length > 1) {
      terminal.write('\r\n');
      matches.forEach(cmd => terminal.write(cmd + '  '));
      terminal.write('\r\n');
      terminal.write(lineContent);
    }
  }
}

function setupTerminalResize() {
  const resizeHandle = document.querySelector('.terminal-resize-handle');
  const terminalContainer = document.getElementById('terminal-container');
  const terminalPanel = document.getElementById('terminal-panel');
  
  if (!resizeHandle || !terminalContainer || !terminalPanel) return;
  
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const panelRect = terminalPanel.getBoundingClientRect();
    const newHeight = panelRect.bottom - e.clientY;
    terminalHeight = Math.max(150, Math.min(500, newHeight));
    terminalContainer.style.height = `${terminalHeight}px`;
    if (terminalFitAddon) {
      terminalFitAddon.fit();
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      if (terminalFitAddon) {
        terminalFitAddon.fit();
        const dimensions = terminalFitAddon.proposeDimensions();
        if (dimensions) {
          window.maxi.resizeTerminal({ cols: dimensions.cols, rows: dimensions.rows });
        }
      }
    }
  });
}

function parseMarkdown(text) {
  let html = text;
  
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const lines = code.trim().split('\n');
    const lineNumbers = lines.map((_, i) => `<span class="line-number">${i + 1}</span>`).join('');
    const executionId = 'exec_' + Math.random().toString(36).substr(2, 9);
    const isRunnable = ['javascript', 'js', 'python', 'py', 'node', 'nodejs', 'bash', 'shell', 'sh'].includes(lang.toLowerCase());
    return `
      <div class="code-block" data-lang="${lang}" data-code="${escapeHtml(code.trim())}" data-exec-id="${executionId}">
        <div class="code-header">
          <span class="code-language">${lang || 'code'}</span>
          <div class="code-actions">
            ${isRunnable ? `
            <button class="run-btn" title="Run code">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </button>
            ` : ''}
            <button class="copy-btn" title="Copy code">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        </div>
        <pre><code>${escapeHtml(code.trim())}</code></pre>
        ${isRunnable ? `
        <div class="code-output hidden">
          <div class="output-header">
            <span class="output-title">Output</span>
            <button class="clear-output-btn" title="Clear output">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <pre class="output-content"></pre>
          <div class="output-footer hidden">
            <span class="output-status"></span>
            <span class="output-time"></span>
          </div>
        </div>
        ` : ''}
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

function addMessage(role, content, type = 'text', images = []) {
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
    const imagesHtml = images && images.length > 0 ? `
      <div class="message-images">
        ${images.map((img, i) => `
          <div class="message-image" data-index="${i}">
            <img src="${img.dataUrl}" alt="${img.name}">
            <div class="image-meta">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              <span>${img.name}</span>
              <span>${img.width}x${img.height}</span>
              <span>${formatFileSize(img.size)}</span>
              <button class="remove-image-btn" title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';
    
    msgDiv.innerHTML = `
      <div class="message-content">${role === 'assistant' ? parseMarkdown(content) : escapeHtml(content)}</div>
      ${imagesHtml}
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

    msgDiv.querySelectorAll('.code-block').forEach((block) => {
      const runBtn = block.querySelector('.run-btn');
      const copyBtn = block.querySelector('.copy-btn');
      const clearBtn = block.querySelector('.clear-output-btn');
      const code = block.dataset.code;
      const lang = block.dataset.lang;
      const execId = block.dataset.execId;

      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(code);
          showToast('Copied to clipboard', 'success');
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          const outputPanel = block.querySelector('.code-output');
          const outputContent = outputPanel.querySelector('.output-content');
          const outputFooter = outputPanel.querySelector('.output-footer');
          outputContent.textContent = '';
          outputFooter.classList.add('hidden');
          outputPanel.classList.add('hidden');
        });
      }

      if (runBtn) {
        runBtn.addEventListener('click', () => handleRunCode(block, lang, code, execId));
      }
    });
    
    msgDiv.querySelectorAll('.message-image').forEach((imgEl, i) => {
      imgEl.addEventListener('click', (e) => {
        if (!e.target.closest('.remove-image-btn')) {
          openLightbox(images[i]);
        }
      });
    });
    
    msgDiv.querySelectorAll('.remove-image-btn').forEach((btn, i) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const imageEl = msgDiv.querySelectorAll('.message-image')[i];
        if (imageEl) {
          imageEl.remove();
          if (msgDiv.querySelectorAll('.message-image').length === 0) {
            const imagesContainer = msgDiv.querySelector('.message-images');
            if (imagesContainer) imagesContainer.remove();
          }
        }
      });
    });
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
    hasUnsavedChanges = true;
  }
  isStreaming = false;
  sendBtn.disabled = false;
  typingIndicator.classList.add('hidden');
  
  const welcome = chatMessages.querySelector('.welcome-state');
  if (welcome) {
    welcome.remove();
  }
  
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab) {
    activeTab.messages = messages;
    activeTab.hasUnsavedChanges = hasUnsavedChanges;
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
    if (tabName === 'terminal' && !sshConnected) {
      if (!terminalInitialized) {
        setTimeout(initTerminal, 100);
      }
      if (terminalFitAddon) {
        setTimeout(() => {
          terminalFitAddon.fit();
          const dimensions = terminalFitAddon.proposeDimensions();
          if (dimensions) {
            terminal.resize(dimensions.cols, dimensions.rows);
            window.maxi.resizeTerminal({ cols: dimensions.cols, rows: dimensions.rows });
          }
        }, 150);
      }
    }
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
  if (tabs.length > 1) {
    closeTab(activeTabId);
  } else {
    messages = [];
    currentChatId = null;
    hasUnsavedChanges = false;
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
      activeTab.messages = [];
      activeTab.chatId = null;
      activeTab.hasUnsavedChanges = false;
      activeTab.title = 'New Chat';
    }
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
    renderTabs();
  }
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
  const hasContent = messageInput.value.trim() || attachedFiles.length > 0 || attachedImages.length > 0;
  sendBtn.disabled = !hasContent || isStreaming;
});

document.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) {
        handleImageFile(file);
      }
      break;
    }
  }
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

imageBtn.addEventListener('click', () => {
  imageInput.click();
});

imageInput.addEventListener('change', () => {
  const files = Array.from(imageInput.files);
  files.forEach(file => {
    handleImageFile(file);
  });
  imageInput.value = '';
});

function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Only image files are supported', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const imageData = {
        name: file.name,
        type: file.type,
        size: file.size,
        width: img.width,
        height: img.height,
        dataUrl: e.target.result,
        isImage: true
      };
      attachedImages.push(imageData);
      renderImagePreviews();
      showToast(`Image attached: ${file.name}`, 'success');
    };
    img.src = e.target.result;
  };
  reader.onerror = () => {
    showToast('Failed to read image file', 'error');
  };
  reader.readAsDataURL(file);
}

function renderImagePreviews() {
  let previewContainer = document.querySelector('.attached-image-preview');
  
  if (attachedImages.length === 0) {
    if (previewContainer) {
      previewContainer.remove();
    }
    return;
  }

  if (!previewContainer) {
    previewContainer = document.createElement('div');
    previewContainer.className = 'attached-image-preview';
    const inputRow = document.getElementById('input-row');
    inputRow.parentNode.insertBefore(previewContainer, inputRow);
  }

  previewContainer.innerHTML = attachedImages.map((img, index) => `
    <div class="image-preview-chip" data-index="${index}">
      <img src="${img.dataUrl}" alt="${img.name}">
      <span>${formatFileSize(img.size)}</span>
      <span class="remove-image" data-index="${index}">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </span>
    </div>
  `).join('');

  previewContainer.querySelectorAll('.remove-image').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      attachedImages.splice(index, 1);
      renderImagePreviews();
    });
  });
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function handleRunCode(block, language, code, executionId) {
  const outputPanel = block.querySelector('.code-output');
  const outputContent = outputPanel.querySelector('.output-content');
  const outputFooter = outputPanel.querySelector('.output-footer');
  const outputStatus = outputPanel.querySelector('.output-status');
  const outputTime = outputPanel.querySelector('.output-time');
  const runBtn = block.querySelector('.run-btn');

  let isStopped = false;

  if (runBtn.classList.contains('running')) {
    const stopped = await window.maxi.stopExecution(executionId);
    if (stopped) {
      isStopped = true;
      runBtn.classList.remove('running');
      runBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      `;
      outputContent.textContent = '[Stopped by user]';
      outputStatus.innerHTML = `<span class="error-icon">⏹</span> Stopped`;
      outputStatus.className = 'output-status error';
      outputFooter.classList.remove('hidden');
    }
    return;
  }

  outputPanel.classList.remove('hidden');
  outputContent.textContent = '';
  outputFooter.classList.add('hidden');

  runBtn.classList.add('running');
  runBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    </svg>
  `;

  outputContent.textContent = 'Running...\n';

  try {
    const result = await window.maxi.executeCode({
      language,
      code,
      executionId
    });

    if (isStopped) return;

    outputContent.textContent = '';

    if (result.stdout) {
      outputContent.textContent += result.stdout + (result.stderr ? '\n' : '');
    }

    if (result.stderr) {
      outputContent.innerHTML += `<span class="stderr">${escapeHtml(result.stderr)}</span>`;
    }

    const duration = result.duration < 1000 ? `${result.duration}ms` : `${(result.duration / 1000).toFixed(2)}s`;

    if (result.success) {
      outputStatus.innerHTML = `<span class="success-icon">✓</span> Completed`;
      outputStatus.className = 'output-status success';
    } else {
      outputStatus.innerHTML = `<span class="error-icon">✗</span> Exit code: ${result.exitCode}`;
      outputStatus.className = 'output-status error';
    }

    outputTime.textContent = `in ${duration}`;
    outputFooter.classList.remove('hidden');

  } catch (err) {
    if (isStopped) return;
    outputContent.innerHTML += `<span class="stderr">Error: ${escapeHtml(err.message)}</span>`;
    outputStatus.innerHTML = `<span class="error-icon">✗</span> Failed`;
    outputStatus.className = 'output-status error';
    outputFooter.classList.remove('hidden');
  }

  runBtn.classList.remove('running');
  runBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  `;
}

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
    if (file.type.startsWith('image/')) {
      handleImageFile(file);
    } else if (file.path) {
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
  if (!content && attachedFiles.length === 0 && attachedImages.length === 0) return;
  
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
  let fullContent = userContent;
  
  if (attachedFiles.length > 0) {
    const fileAttachments = attachedFiles.map(f => {
      if (f.content) {
        return `[File: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\``;
      }
      return `[File: ${f.name}]`;
    }).join('\n\n');
    fullContent += '\n\n' + fileAttachments;
  }

  uploadedImages = [];
  if (attachedImages.length > 0) {
    for (const img of attachedImages) {
      uploadedImages.push(img);
    }
    const imageAttachments = attachedImages.map((img, i) => {
      return `[Image ${i + 1}: ${img.name} (${img.width}x${img.height}, ${formatFileSize(img.size)})]`;
    }).join('\n');
    fullContent += '\n\n' + imageAttachments;
  }
  
  messages.push({ role: 'user', content: fullContent });
  hasUnsavedChanges = true;
  
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab) {
    activeTab.hasUnsavedChanges = true;
  }
  updateActiveTabTitle();
  renderTabs();
  
  addMessage('user', userContent, 'text', attachedImages);
  attachedFiles = [];
  attachedImages = [];
  renderAttachedFiles();
  renderImagePreviews();

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

function openLightbox(imageData) {
  lightboxImage.src = imageData.dataUrl;
  lightboxFilename.textContent = imageData.name;
  lightboxDimensions.textContent = `${imageData.width} x ${imageData.height}`;
  lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.add('hidden');
  lightboxImage.src = '';
  document.body.style.overflow = '';
}

lightboxClose.addEventListener('click', closeLightbox);

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
    closeLightbox();
  }
});

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

const sshPanel = document.getElementById('ssh-panel');
const sshConnectionList = document.getElementById('ssh-connection-list');
const sshAddBtn = document.getElementById('ssh-add-btn');
const sshModal = document.getElementById('ssh-modal');
const closeSshModal = document.getElementById('close-ssh-modal');
const sshNameInput = document.getElementById('ssh-name');
const sshHostInput = document.getElementById('ssh-host');
const sshPortInput = document.getElementById('ssh-port');
const sshUsernameInput = document.getElementById('ssh-username');
const sshPasswordInput = document.getElementById('ssh-password');
const sshPrivateKeyInput = document.getElementById('ssh-private-key');
const sshPassphraseInput = document.getElementById('ssh-passphrase');
const sshSaveBtn = document.getElementById('ssh-save-btn');
const sshTestBtn = document.getElementById('ssh-test-btn');
const sshBrowseKeyBtn = document.getElementById('ssh-browse-key');
const sshKeyInput = document.getElementById('ssh-key-input');
const sshPasswordGroup = document.getElementById('ssh-password-group');
const sshKeyGroup = document.getElementById('ssh-key-group');
const sshPassphraseGroup = document.getElementById('ssh-passphrase-group');
const sshModalTitle = document.getElementById('ssh-modal-title');

const terminalContainer = document.getElementById('terminal-container');

function renderSshConnections() {
  if (sshConnections.length === 0) {
    sshConnectionList.innerHTML = `
      <div class="ssh-empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <p>No SSH connections configured</p>
        <button class="btn primary" id="ssh-add-first-btn">Add Connection</button>
      </div>
    `;
    document.getElementById('ssh-add-first-btn')?.addEventListener('click', openSshModal);
    return;
  }

  sshConnectionList.innerHTML = sshConnections.map(conn => `
    <div class="ssh-connection-item ${conn.id === currentSshConnection?.id ? 'active' : ''} ${conn.status || 'disconnected'}" data-id="${conn.id}">
      <span class="ssh-status-dot ${conn.status || 'disconnected'}"></span>
      <div class="ssh-connection-info">
        <div class="ssh-connection-name">${escapeHtml(conn.name)}</div>
        <div class="ssh-connection-host">${escapeHtml(conn.username)}@${escapeHtml(conn.host)}:${conn.port || 22}</div>
      </div>
      <div class="ssh-connection-actions">
        ${conn.status === 'connected' ? `
          <button class="ssh-action-btn disconnect" title="Disconnect">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        ` : `
          <button class="ssh-action-btn connect" title="Connect">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>
        `}
        <button class="ssh-action-btn edit" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="ssh-action-btn delete" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('') + `
    <div class="ssh-add-connection" id="ssh-add-another">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Add New
    </div>
  `;

  document.getElementById('ssh-add-another')?.addEventListener('click', () => openSshModal());

  sshConnectionList.querySelectorAll('.ssh-connection-item').forEach(item => {
    const connId = item.dataset.id;
    const conn = sshConnections.find(c => c.id === connId);

    item.querySelector('.connect')?.addEventListener('click', (e) => {
      e.stopPropagation();
      connectSsh(conn);
    });

    item.querySelector('.disconnect')?.addEventListener('click', (e) => {
      e.stopPropagation();
      disconnectSsh();
    });

    item.querySelector('.edit')?.addEventListener('click', (e) => {
      e.stopPropagation();
      editSshConnection(conn);
    });

    item.querySelector('.delete')?.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSshConnection(connId);
    });
  });
}

async function loadSshConnections() {
  try {
    sshConnections = await window.maxi.sshLoadConnections();
    renderSshConnections();
  } catch (error) {
    console.error('Failed to load SSH connections:', error);
  }
}

function openSshModal(connection = null) {
  sshEditingId = connection?.id || null;
  sshModalTitle.textContent = connection ? 'Edit SSH Connection' : 'Add SSH Connection';
  sshNameInput.value = connection?.name || '';
  sshHostInput.value = connection?.host || '';
  sshPortInput.value = connection?.port || 22;
  sshUsernameInput.value = connection?.username || '';
  sshPasswordInput.value = connection?.password || '';
  sshPrivateKeyInput.value = connection?.privateKey || '';
  sshPassphraseInput.value = connection?.passphrase || '';

  const authMethod = connection?.authMethod || 'password';
  document.querySelectorAll('input[name="ssh-auth"]').forEach(input => {
    input.checked = input.value === authMethod;
  });
  updateAuthFields(authMethod);

  sshModal.classList.remove('hidden');
}

function closeSshModalFn() {
  sshModal.classList.add('hidden');
  sshEditingId = null;
}

function updateAuthFields(method) {
  if (method === 'password') {
    sshPasswordGroup.classList.remove('hidden');
    sshKeyGroup.classList.add('hidden');
    sshPassphraseGroup.classList.add('hidden');
  } else {
    sshPasswordGroup.classList.add('hidden');
    sshKeyGroup.classList.remove('hidden');
    sshPassphraseGroup.classList.remove('hidden');
  }
}

document.querySelectorAll('input[name="ssh-auth"]').forEach(input => {
  input.addEventListener('change', (e) => {
    updateAuthFields(e.target.value);
  });
});

sshBrowseKeyBtn.addEventListener('click', async () => {
  const keyPath = await window.maxi.sshSelectKey();
  if (keyPath) {
    sshPrivateKeyInput.value = keyPath;
  }
});

sshAddBtn.addEventListener('click', () => openSshModal());
closeSshModal.addEventListener('click', closeSshModalFn);
sshModal.querySelector('.modal-backdrop').addEventListener('click', closeSshModalFn);

sshSaveBtn.addEventListener('click', async () => {
  const name = sshNameInput.value.trim();
  const host = sshHostInput.value.trim();
  const port = parseInt(sshPortInput.value) || 22;
  const username = sshUsernameInput.value.trim();
  const authMethod = document.querySelector('input[name="ssh-auth"]:checked').value;

  if (!name || !host || !username) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  const connection = {
    id: sshEditingId,
    name,
    host,
    port,
    username,
    authMethod,
  };

  if (authMethod === 'password') {
    connection.password = sshPasswordInput.value;
  } else {
    connection.privateKey = sshPrivateKeyInput.value;
    connection.passphrase = sshPassphraseInput.value;
  }

  try {
    await window.maxi.sshSaveConnection(connection);
    await loadSshConnections();
    closeSshModalFn();
    showToast('Connection saved', 'success');
  } catch (error) {
    showToast('Failed to save connection: ' + error.message, 'error');
  }
});

sshTestBtn.addEventListener('click', async () => {
  const host = sshHostInput.value.trim();
  const port = parseInt(sshPortInput.value) || 22;
  const username = sshUsernameInput.value.trim();
  const authMethod = document.querySelector('input[name="ssh-auth"]:checked').value;

  if (!host || !username) {
    showToast('Please fill in host, port, and username', 'error');
    return;
  }

  sshTestBtn.disabled = true;
  sshTestBtn.textContent = 'Testing...';

  const testConnection = {
    host,
    port,
    username,
    authMethod,
  };

  if (authMethod === 'password') {
    testConnection.password = sshPasswordInput.value;
  } else {
    testConnection.privateKey = sshPrivateKeyInput.value;
    testConnection.passphrase = sshPassphraseInput.value;
  }

  try {
    await window.maxi.sshConnect(testConnection);
    await window.maxi.sshDisconnect();
    showToast('Connection successful!', 'success');
  } catch (error) {
    showToast('Connection failed: ' + error.message, 'error');
  } finally {
    sshTestBtn.disabled = false;
    sshTestBtn.textContent = 'Test Connection';
  }
});

async function connectSsh(connection) {
  const connIndex = sshConnections.findIndex(c => c.id === connection.id);
  if (connIndex >= 0) {
    sshConnections[connIndex].status = 'connecting';
    renderSshConnections();
  }

  try {
    await window.maxi.sshConnect(connection);
    currentSshConnection = connection;
    if (connIndex >= 0) {
      sshConnections[connIndex].status = 'connected';
    }
    sshConnected = true;
    sshPanel.classList.add('ssh-connected');
    renderSshConnections();
    initSshTerminal();
    showToast('Connected to ' + connection.name, 'success');
  } catch (error) {
    if (connIndex >= 0) {
      sshConnections[connIndex].status = 'error';
    }
    renderSshConnections();
    showToast('Connection failed: ' + error.message, 'error');
  }
}

async function disconnectSsh() {
  try {
    await window.maxi.sshDisconnect();
  } catch (error) {
    console.error('Disconnect error:', error);
  }
  currentSshConnection = null;
  sshConnected = false;
  sshPanel.classList.remove('ssh-connected');
  if (sshTerminal) {
    sshTerminal.dispose();
    sshTerminal = null;
  }
  sshConnections.forEach(c => c.status = 'disconnected');
  renderSshConnections();
  showToast('Disconnected', 'info');
}

function editSshConnection(connection) {
  openSshModal(connection);
}

async function deleteSshConnection(connectionId) {
  if (!confirm('Are you sure you want to delete this connection?')) {
    return;
  }
  try {
    await window.maxi.sshDeleteConnection(connectionId);
    await loadSshConnections();
    showToast('Connection deleted', 'success');
  } catch (error) {
    showToast('Failed to delete connection: ' + error.message, 'error');
  }
}

function initSshTerminal() {
  if (sshTerminal) {
    sshTerminal.dispose();
  }

  const wrapper = document.getElementById('ssh-terminal-wrapper');
  const container = document.getElementById('ssh-terminal-container');
  
  wrapper.style.display = 'flex';
  container.innerHTML = '';
  
  sshTerminal = new Terminal({
    cursorBlink: true,
    cursorStyle: 'block',
    fontFamily: "'Fira Code', Consolas, Monaco, monospace",
    fontSize: 13,
    theme: {
      background: '#0d1117',
      foreground: '#e0e0e0',
      cursor: '#39d353',
      cursorAccent: '#0d1117',
      selection: 'rgba(57, 211, 83, 0.3)',
      black: '#0d1117',
      red: '#ff7b72',
      green: '#39d353',
      yellow: '#d29922',
      blue: '#58a6ff',
      magenta: '#bc8cff',
      cyan: '#39c5cf',
      white: '#e0e0e0',
      brightBlack: '#6e7681',
      brightRed: '#ffa198',
      brightGreen: '#56d364',
      brightYellow: '#e3b341',
      brightBlue: '#79c0ff',
      brightMagenta: '#d2a8ff',
      brightCyan: '#56d4dd',
      brightWhite: '#ffffff'
    },
    scrollback: 1000,
    allowProposedApi: true
  });

  sshTerminalFitAddon = new FitAddon();
  const webLinksAddon = new WebLinksAddon();

  sshTerminal.loadAddon(sshTerminalFitAddon);
  sshTerminal.loadAddon(webLinksAddon);

  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'ssh-terminal-header';
  header.innerHTML = `
    <div class="ssh-terminal-info">
      <span class="status-dot connected"></span>
      <span>${escapeHtml(currentSshConnection?.username)}@${escapeHtml(currentSshConnection?.host)}:${currentSshConnection?.port || 22}</span>
    </div>
    <button class="ssh-disconnect-btn" id="ssh-disconnect-btn">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
      Disconnect
    </button>
  `;
  container.appendChild(header);

  const terminalEl = document.createElement('div');
  terminalEl.style.flex = '1';
  terminalEl.style.padding = '0.5rem';
  container.appendChild(terminalEl);

  sshTerminal.open(terminalEl);
  sshTerminalFitAddon.fit();

  sshTerminal.onData((data) => {
    window.maxi.sshWrite(data);
  });

  sshTerminal.onResize(({ cols, rows }) => {
  });

  document.getElementById('ssh-disconnect-btn').addEventListener('click', disconnectSsh);

  window.maxi.onSshData((data) => {
    if (sshTerminal) {
      sshTerminal.write(data);
    }
  });

  window.maxi.onSshClose(() => {
    if (sshConnected) {
      disconnectSsh();
    }
  });

  window.maxi.onSshError((error) => {
    showToast('SSH Error: ' + error, 'error');
  });
}

loadSshConnections();
loadTokens();
loadSkills();
loadWorkspaceFiles();
showMCPServers();
initChatHistory();
initTabs();

const saveChatBtn = document.getElementById('save-chat-btn');
const loadChatBtn = document.getElementById('load-chat-btn');
const chatHistoryModal = document.getElementById('chat-history-modal');
const closeChatHistoryBtn = document.getElementById('close-chat-history');
const chatSearchInput = document.getElementById('chat-search-input');
const chatHistoryList = document.getElementById('chat-history-list');
const chatPreview = document.getElementById('chat-preview');
const chatPreviewTitle = document.getElementById('chat-preview-title');
const chatPreviewContent = document.getElementById('chat-preview-content');
const closePreviewBtn = document.getElementById('close-preview');
const loadChatActionBtn = document.getElementById('load-chat-action');
const mergeChatActionBtn = document.getElementById('merge-chat-action');
const renameChatModal = document.getElementById('rename-chat-modal');
const closeRenameModalBtn = document.getElementById('close-rename-modal');
const renameChatInput = document.getElementById('rename-chat-input');
const cancelRenameBtn = document.getElementById('cancel-rename');
const confirmRenameBtn = document.getElementById('confirm-rename');

saveChatBtn.addEventListener('click', saveCurrentChat);
loadChatBtn.addEventListener('click', openChatHistoryModal);
closeChatHistoryBtn.addEventListener('click', closeChatHistoryModalFn);
chatHistoryModal.querySelector('.modal-backdrop').addEventListener('click', closeChatHistoryModalFn);
chatSearchInput.addEventListener('input', filterChatHistory);
closePreviewBtn.addEventListener('click', closePreviewFn);
loadChatActionBtn.addEventListener('click', () => loadSelectedChat(false));
mergeChatActionBtn.addEventListener('click', () => loadSelectedChat(true));
closeRenameModalBtn.addEventListener('click', closeRenameModalFn);
renameChatModal.querySelector('.modal-backdrop').addEventListener('click', closeRenameModalFn);
cancelRenameBtn.addEventListener('click', closeRenameModalFn);
confirmRenameBtn.addEventListener('click', confirmRename);

const shortcutsModal = document.getElementById('shortcuts-modal');
const closeShortcutsBtn = document.getElementById('close-shortcuts');
const shortcutsSearchInput = document.getElementById('shortcuts-search-input');
const shortcutsList = document.getElementById('shortcuts-list');
const shortcutsBtn = document.getElementById('shortcuts-btn');

const shortcutsData = [
  {
    category: 'Chat',
    items: [
      { keys: ['Ctrl', 'Enter'], desc: 'Send message', action: () => sendMessage() },
      { keys: ['Ctrl', 'Shift', 'C'], desc: 'Clear chat', action: () => clearChatAction() },
      { keys: ['Ctrl', 'T'], desc: 'New tab', action: () => createTab('New Chat') },
      { keys: ['Ctrl', 'W'], desc: 'Close tab', action: () => activeTabId && closeTab(activeTabId) }
    ]
  },
  {
    category: 'Navigation',
    items: [
      { keys: ['Ctrl', 'B'], desc: 'Toggle sidebar', action: () => sidebar.classList.toggle('sidebar-open') },
      { keys: ['Ctrl', '`'], desc: 'Toggle terminal', action: () => toggleTerminal() },
      { keys: ['Ctrl', 'Tab'], desc: 'Next tab', action: () => cycleTab(1) },
      { keys: ['Ctrl', 'Shift', 'Tab'], desc: 'Previous tab', action: () => cycleTab(-1) }
    ]
  },
  {
    category: 'Files',
    items: [
      { keys: ['Ctrl', 'N'], desc: 'New file', action: () => createNewFile() },
      { keys: ['Ctrl', 'S'], desc: 'Save file', action: () => saveCurrentFile() },
      { keys: ['Ctrl', 'O'], desc: 'Open folder', action: () => browseWorkspace.click() }
    ]
  },
  {
    category: 'Editing',
    items: [
      { keys: ['Ctrl', 'C'], desc: 'Copy', action: () => document.execCommand('copy') },
      { keys: ['Ctrl', 'V'], desc: 'Paste', action: () => document.execCommand('paste') },
      { keys: ['Ctrl', 'Z'], desc: 'Undo', action: () => document.execCommand('undo') },
      { keys: ['Ctrl', 'Shift', 'Z'], desc: 'Redo', action: () => document.execCommand('redo') }
    ]
  },
  {
    category: 'Settings',
    items: [
      { keys: ['Ctrl', ','], desc: 'Open settings', action: () => settingsModal.classList.remove('hidden') },
      { keys: ['Ctrl', 'Shift', 'T'], desc: 'Toggle theme', action: () => themeToggle.click() }
    ]
  },
  {
    category: 'Voice',
    items: [
      { keys: ['Ctrl', 'Shift', 'M'], desc: 'Start/stop recording', action: () => toggleRecording() }
    ]
  },
  {
    category: 'Chat History',
    items: [
      { keys: ['Ctrl', 'Shift', 'S'], desc: 'Save chat', action: () => saveCurrentChat() },
      { keys: ['Ctrl', 'Shift', 'O'], desc: 'Load chat', action: () => openChatHistoryModal() }
    ]
  },
  {
    category: 'General',
    items: [
      { keys: ['Ctrl', '/'], desc: 'Keyboard shortcuts', action: () => {} },
      { keys: ['Ctrl', 'K'], desc: 'Keyboard shortcuts', action: () => {} },
      { keys: ['?'], desc: 'Keyboard shortcuts', action: () => openShortcutsModal() }
    ]
  }
];

function cycleTab(direction) {
  if (tabs.length <= 1) return;
  const currentIndex = tabs.findIndex(t => t.id === activeTabId);
  const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
  switchToTab(tabs[nextIndex].id);
}

function clearChatAction() {
  if (tabs.length > 1) {
    closeTab(activeTabId);
  } else {
    messages = [];
    currentChatId = null;
    hasUnsavedChanges = false;
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
      activeTab.messages = [];
      activeTab.chatId = null;
      activeTab.hasUnsavedChanges = false;
      activeTab.title = 'New Chat';
    }
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
    renderTabs();
  }
}

function createNewFile() {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab) {
    activeTab.content = '';
    activeTab.filePath = null;
    activeTab.hasUnsavedChanges = true;
    showToast('New file created', 'success');
  }
}

function saveCurrentFile() {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab && activeTab.hasUnsavedChanges) {
    if (activeTab.filePath) {
      window.maxi.saveFile(activeTab.filePath, activeTab.content);
      activeTab.hasUnsavedChanges = false;
      showToast('File saved', 'success');
    }
  }
}

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function renderShortcutsList(filter = '') {
  shortcutsList.innerHTML = '';
  const lowerFilter = filter.toLowerCase();

  shortcutsData.forEach(section => {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'shortcut-section';

    const titleEl = document.createElement('div');
    titleEl.className = 'shortcut-section-title';
    titleEl.textContent = section.category;
    sectionEl.appendChild(titleEl);

    let hasVisibleItems = false;

    section.items.forEach(item => {
      const matchesFilter = filter === '' || 
        item.desc.toLowerCase().includes(lowerFilter) ||
        item.keys.join(' ').toLowerCase().includes(lowerFilter);

      if (!matchesFilter) return;
      hasVisibleItems = true;

      const itemEl = document.createElement('div');
      itemEl.className = 'shortcut-item';

      const descEl = document.createElement('span');
      descEl.className = 'shortcut-desc';
      descEl.textContent = item.desc;

      const keysEl = document.createElement('span');
      keysEl.className = 'shortcut-keys';

      item.keys.forEach((key, idx) => {
        if (idx > 0) {
          const plusEl = document.createElement('span');
          plusEl.className = 'shortcut-plus';
          plusEl.textContent = '+';
          keysEl.appendChild(plusEl);
        }
        const kbdEl = document.createElement('span');
        kbdEl.className = 'kbd';
        kbdEl.textContent = key;
        keysEl.appendChild(kbdEl);
      });

      itemEl.appendChild(descEl);
      itemEl.appendChild(keysEl);

      itemEl.addEventListener('click', () => {
        item.action();
        closeShortcutsModalFn();
      });

      sectionEl.appendChild(itemEl);
    });

    if (hasVisibleItems) {
      shortcutsList.appendChild(sectionEl);
    }
  });
}

function openShortcutsModal() {
  shortcutsModal.classList.remove('hidden');
  shortcutsSearchInput.value = '';
  renderShortcutsList();
  shortcutsSearchInput.focus();
}

function closeShortcutsModalFn() {
  shortcutsModal.classList.add('hidden');
}

shortcutsBtn.addEventListener('click', openShortcutsModal);
closeShortcutsBtn.addEventListener('click', closeShortcutsModalFn);
shortcutsModal.querySelector('.modal-backdrop').addEventListener('click', closeShortcutsModalFn);
shortcutsSearchInput.addEventListener('input', (e) => renderShortcutsList(e.target.value));

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.key === 'k')) {
    e.preventDefault();
    if (shortcutsModal.classList.contains('hidden')) {
      openShortcutsModal();
    } else {
      closeShortcutsModalFn();
    }
  }
  if (e.key === '?' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    openShortcutsModal();
  }
  if (e.key === 'Escape' && !shortcutsModal.classList.contains('hidden')) {
    closeShortcutsModalFn();
  }
});

startAutoSave();
checkForAutosave();

function initChatHistory() {
  loadChatHistoryList();
}

function startAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }
  autoSaveInterval = setInterval(() => {
    if (hasUnsavedChanges && messages.length > 0) {
      performAutoSave();
    }
  }, 5 * 60 * 1000);
}

async function performAutoSave() {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (!activeTab || activeTab.messages.length === 0) return;
  try {
    const title = activeTab.title || 'Untitled';
    await window.maxi.saveAutosave({
      id: activeTab.chatId,
      title: title,
      messages: activeTab.messages
    });
  } catch (error) {
    console.error('Auto-save failed:', error);
  }
}

async function checkForAutosave() {
  try {
    const autosave = await window.maxi.loadAutosave();
    if (autosave && autosave.messages && autosave.messages.length > 0) {
      const shouldRestore = confirm('Unsaved chat found. Would you like to restore it?');
      if (shouldRestore) {
        const newTabId = createTab(autosave.title || 'Recovered Chat');
        if (newTabId) {
          const newTab = tabs.find(t => t.id === newTabId);
          if (newTab) {
            newTab.messages = autosave.messages;
            newTab.hasUnsavedChanges = true;
            messages = newTab.messages;
            currentChatId = autosave.id;
          }
        }
        renderMessages();
        renderTabs();
        showToast('Chat restored from autosave', 'success');
        await window.maxi.clearAutosave();
      } else {
        await window.maxi.clearAutosave();
      }
    }
  } catch (error) {
    console.error('Error checking autosave:', error);
  }
}

async function saveCurrentChat() {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (!activeTab || activeTab.messages.length === 0) {
    showToast('No messages to save', 'warning');
    return;
  }
  try {
    const title = activeTab.title || 'Untitled';
    const result = await window.maxi.saveChat({
      id: activeTab.chatId,
      title: title,
      messages: activeTab.messages
    });
    if (result.success) {
      activeTab.chatId = result.id;
      activeTab.hasUnsavedChanges = false;
      currentChatId = result.id;
      hasUnsavedChanges = false;
      showToast('Chat saved successfully', 'success');
      await loadChatHistoryList();
      renderTabs();
    } else {
      showToast('Failed to save chat: ' + result.error, 'error');
    }
  } catch (error) {
    showToast('Failed to save chat', 'error');
  }
}

async function loadChatHistoryList() {
  try {
    chatHistory = await window.maxi.loadChatHistory();
    renderChatHistoryList('');
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
}

function renderChatHistoryList(searchTerm = '') {
  const filteredChats = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (filteredChats.length === 0) {
    chatHistoryList.innerHTML = `
      <div class="chat-history-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <p>${searchTerm ? 'No chats match your search' : 'No saved chats yet'}</p>
      </div>
    `;
    return;
  }
  
  const groupedChats = groupChatsByDate(filteredChats);
  let html = '';
  
  for (const [dateGroup, chats] of Object.entries(groupedChats)) {
    html += `<div class="chat-date-group">${dateGroup}</div>`;
    for (const chat of chats) {
      const timeAgo = getTimeAgo(new Date(chat.updated));
      html += `
        <div class="chat-item ${chat.id === selectedChatId ? 'active' : ''}" data-id="${chat.id}">
          <div class="chat-item-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="chat-item-info">
            <div class="chat-item-title">${escapeHtml(chat.title)}</div>
            <div class="chat-item-meta">
              <span>${chat.messageCount} messages</span>
              <span>•</span>
              <span>${timeAgo}</span>
            </div>
          </div>
          <div class="chat-item-actions">
            <button class="chat-action-btn rename" title="Rename" data-action="rename">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="chat-action-btn delete" title="Delete" data-action="delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }
  }
  
  chatHistoryList.innerHTML = html;
  
  chatHistoryList.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.chat-action-btn')) return;
      selectChatItem(item.dataset.id);
    });
  });
  
  chatHistoryList.querySelectorAll('.chat-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const chatId = btn.closest('.chat-item').dataset.id;
      const action = btn.dataset.action;
      if (action === 'rename') {
        openRenameModal(chatId);
      } else if (action === 'delete') {
        deleteChatItem(chatId);
      }
    });
  });
}

function groupChatsByDate(chats) {
  const groups = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const formatDate = (date) => {
    const d = new Date(date);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  chats.forEach(chat => {
    const dateGroup = formatDate(chat.updated);
    if (!groups[dateGroup]) {
      groups[dateGroup] = [];
    }
    groups[dateGroup].push(chat);
  });
  
  return groups;
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function selectChatItem(chatId) {
  selectedChatId = chatId;
  renderChatHistoryList(chatSearchInput.value);
  
  try {
    const result = await window.maxi.loadChat(chatId);
    if (result.success) {
      selectedChatData = result.chat;
      showChatPreview(result.chat);
    } else {
      showToast('Failed to load chat', 'error');
    }
  } catch (error) {
    showToast('Failed to load chat', 'error');
  }
}

function showChatPreview(chat) {
  chatPreviewTitle.textContent = chat.title;
  
  const previewMessages = chat.messages.slice(0, 5);
  let html = '';
  
  previewMessages.forEach(msg => {
    html += `
      <div class="chat-preview-message ${msg.role}">
        <div class="role">${msg.role}</div>
        <div class="content">${escapeHtml(msg.content.substring(0, 200))}${msg.content.length > 200 ? '...' : ''}</div>
      </div>
    `;
  });
  
  if (chat.messages.length > 5) {
    html += `<div class="chat-preview-message" style="text-align: center; color: var(--text-muted);">... and ${chat.messages.length - 5} more messages</div>`;
  }
  
  chatPreviewContent.innerHTML = html;
  chatPreview.classList.remove('hidden');
}

function closePreviewFn() {
  selectedChatId = null;
  selectedChatData = null;
  chatPreview.classList.add('hidden');
  renderChatHistoryList(chatSearchInput.value);
}

async function loadSelectedChat(merge = false) {
  if (!selectedChatData) return;
  
  const activeTab = tabs.find(t => t.id === activeTabId);
  
  if (merge) {
    messages = [...messages, ...selectedChatData.messages];
    if (activeTab) {
      activeTab.messages = messages;
      activeTab.hasUnsavedChanges = true;
    }
    showToast('Chat merged successfully', 'success');
  } else {
    if (activeTab && activeTab.messages.length > 0) {
      createTab(selectedChatData.title || 'Loaded Chat');
    }
    const newActiveTab = tabs.find(t => t.id === activeTabId);
    if (newActiveTab) {
      newActiveTab.messages = selectedChatData.messages;
      newActiveTab.chatId = selectedChatId;
      newActiveTab.hasUnsavedChanges = false;
      newActiveTab.title = selectedChatData.title || 'Loaded Chat';
      messages = newActiveTab.messages;
      currentChatId = selectedChatId;
      hasUnsavedChanges = false;
    }
    showToast('Chat loaded successfully', 'success');
  }
  
  renderMessages();
  renderTabs();
  closeChatHistoryModalFn();
}

function renderMessages() {
  chatMessages.innerHTML = '';
  
  if (messages.length === 0) {
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
    return;
  }
  
  messages.forEach(msg => {
    addMessage(msg.role, msg.content, 'text', []);
  });
}

function filterChatHistory() {
  renderChatHistoryList(chatSearchInput.value);
}

function openChatHistoryModal() {
  chatHistoryModal.classList.remove('hidden');
  loadChatHistoryList();
  closePreviewFn();
}

function closeChatHistoryModalFn() {
  chatHistoryModal.classList.add('hidden');
  closePreviewFn();
}

function openRenameModal(chatId) {
  renamingChatId = chatId;
  const chat = chatHistory.find(c => c.id === chatId);
  if (chat) {
    renameChatInput.value = chat.title;
  }
  renameChatModal.classList.remove('hidden');
}

function closeRenameModalFn() {
  renameChatModal.classList.add('hidden');
  renamingChatId = null;
}

async function confirmRename() {
  if (!renamingChatId) return;
  const newTitle = renameChatInput.value.trim();
  if (!newTitle) {
    showToast('Please enter a title', 'warning');
    return;
  }
  
  try {
    const result = await window.maxi.renameChat({ chatId: renamingChatId, newTitle });
    if (result.success) {
      showToast('Chat renamed successfully', 'success');
      await loadChatHistoryList();
      closeRenameModalFn();
    } else {
      showToast('Failed to rename chat: ' + result.error, 'error');
    }
  } catch (error) {
    showToast('Failed to rename chat', 'error');
  }
}

async function deleteChatItem(chatId) {
  if (!confirm('Are you sure you want to delete this chat?')) {
    return;
  }
  
  try {
    const result = await window.maxi.deleteChat(chatId);
    if (result.success) {
      showToast('Chat deleted successfully', 'success');
      if (selectedChatId === chatId) {
        closePreviewFn();
      }
      await loadChatHistoryList();
    } else {
      showToast('Failed to delete chat: ' + result.error, 'error');
    }
  } catch (error) {
    showToast('Failed to delete chat', 'error');
  }
}

window.addEventListener('beforeunload', async () => {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab && activeTab.hasUnsavedChanges && activeTab.messages.length > 0) {
    const currentActiveId = activeTabId;
    tabs.forEach(async (tab) => {
      if (tab.hasUnsavedChanges && tab.messages.length > 0) {
        activeTabId = tab.id;
        messages = tab.messages;
        hasUnsavedChanges = true;
        await performAutoSave();
      }
    });
    activeTabId = currentActiveId;
  }
});