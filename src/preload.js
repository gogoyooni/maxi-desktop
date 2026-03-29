const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('maxi', {
  loadTokens: () => ipcRenderer.invoke('load-tokens'),
  loadSkills: () => ipcRenderer.invoke('load-skills'),
  streamChat: (options) => ipcRenderer.invoke('stream-chat', options),
  onChatStream: (callback) => {
    ipcRenderer.on('chat-stream', (_, content) => callback(content));
  },
  onChatThinking: (callback) => {
    ipcRenderer.on('chat-thinking', (_, content) => callback(content));
  },
  onChatComplete: (callback) => {
    ipcRenderer.on('chat-complete', () => callback());
  }
});