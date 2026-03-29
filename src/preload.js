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
  
  sshLoadConnections: () => ipcRenderer.invoke('ssh-load-connections'),
  sshSaveConnection: (connection) => ipcRenderer.invoke('ssh-save-connection', connection),
  sshDeleteConnection: (id) => ipcRenderer.invoke('ssh-delete-connection', id),
  sshConnect: (connection) => ipcRenderer.invoke('ssh-connect', connection),
  sshWrite: (data) => ipcRenderer.invoke('ssh-write', data),
  sshDisconnect: () => ipcRenderer.invoke('ssh-disconnect'),
  sshSelectKey: () => ipcRenderer.invoke('ssh-select-key'),
  
  saveChat: (chatData) => ipcRenderer.invoke('save-chat', chatData),
  loadChatHistory: () => ipcRenderer.invoke('load-chat-history'),
  loadChat: (chatId) => ipcRenderer.invoke('load-chat', chatId),
  deleteChat: (chatId) => ipcRenderer.invoke('delete-chat', chatId),
  renameChat: (data) => ipcRenderer.invoke('rename-chat', data),
  saveAutosave: (chatData) => ipcRenderer.invoke('save-autosave', chatData),
  loadAutosave: () => ipcRenderer.invoke('load-autosave'),
  clearAutosave: () => ipcRenderer.invoke('clear-autosave'),
  
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  writeFile: (data) => ipcRenderer.invoke('write-file', data),
  
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
  onSshData: (callback) => {
    ipcRenderer.on('ssh-data', (_, data) => callback(data));
  },
  onSshClose: (callback) => {
    ipcRenderer.on('ssh-close', () => callback());
  },
  onSshError: (callback) => {
    ipcRenderer.on('ssh-error', (_, err) => callback(err));
  },
  
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  plugins: {
    loadPlugins: () => ipcRenderer.invoke('plugins-load'),
    enablePlugin: (name) => ipcRenderer.invoke('plugins-enable', name),
    disablePlugin: (name) => ipcRenderer.invoke('plugins-disable', name),
    getConfig: (name) => ipcRenderer.invoke('plugins-get-config', name),
    setConfig: (name, config) => ipcRenderer.invoke('plugins-set-config', { pluginName: name, config }),
    uninstall: (name) => ipcRenderer.invoke('plugins-uninstall', name),
    installFolder: () => ipcRenderer.invoke('plugins-install-folder'),
    readFile: (name, filePath) => ipcRenderer.invoke('plugins-read-file', { pluginName: name, filePath }),
    writeFile: (name, filePath, content) => ipcRenderer.invoke('plugins-write-file', { pluginName: name, filePath, content }),
    requestPermissions: (name, permissions) => ipcRenderer.invoke('plugins-request-permissions', { pluginName: name, permissions }),
    grantPermissions: (name, permissions) => ipcRenderer.invoke('plugins-grant-permissions', { pluginName: name, permissions }),
    onPermissionRequest: (callback) => {
      ipcRenderer.on('plugin-permission-request', (_, data) => callback(data));
    }
  }
});