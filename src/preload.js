const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('maxi', {
  loadTokens: () => ipcRenderer.invoke('load-tokens'),
  loadSkills: () => ipcRenderer.invoke('load-skills'),
  streamChat: (options) => ipcRenderer.invoke('stream-chat', options),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  getHomePath: () => ipcRenderer.invoke('get-home-path'),
  selectWorkspace: () => ipcRenderer.invoke('select-workspace'),
  executeCode: (options) => ipcRenderer.invoke('execute-code', options),
  stopExecution: (executionId) => ipcRenderer.invoke('stop-execution', executionId),
  
  onChatStream: (callback) => {
    ipcRenderer.on('chat-stream', (_, content) => callback(content));
  },
  onChatThinking: (callback) => {
    ipcRenderer.on('chat-thinking', (_, content) => callback(content));
  },
  onChatComplete: (callback) => {
    ipcRenderer.on('chat-complete', () => callback());
  },
  onTokenUsage: (callback) => {
    ipcRenderer.on('token-usage', (_, data) => callback(data));
  },
  
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});