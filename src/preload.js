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
  
  createTerminal: (options) => ipcRenderer.invoke('create-terminal', options),
  writeTerminal: (data) => ipcRenderer.invoke('write-terminal', data),
  resizeTerminal: (options) => ipcRenderer.invoke('resize-terminal', options),
  killTerminal: () => ipcRenderer.invoke('kill-terminal'),
  
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
  onTerminalData: (callback) => {
    ipcRenderer.on('terminal-data', (_, data) => callback(data));
  },
  onTerminalExit: (callback) => {
    ipcRenderer.on('terminal-exit', (_, exitCode) => callback(exitCode));
  },
  
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});