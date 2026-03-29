const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const https = require('node:https');
const os = require('node:os');
const { spawn } = require('child_process');
const vm = require('vm');

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const MAXI_TOKENS_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.maxi', 'tokens');
const MAXI_SKILLS_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.maxi', 'skills');

function loadDirectoryContents(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    const contents = {};
    for (const file of files) {
      if (file.isFile()) {
        const filePath = path.join(dirPath, file.name);
        contents[file.name] = fs.readFileSync(filePath, 'utf-8');
      } else if (file.isDirectory()) {
        const subDirPath = path.join(dirPath, file.name);
        contents[file.name] = loadDirectoryContents(subDirPath);
      }
    }
    return contents;
  } catch (error) {
    console.error(`Error loading ${dirPath}:`, error);
    return [];
  }
}

ipcMain.handle('load-tokens', () => {
  return loadDirectoryContents(MAXI_TOKENS_PATH);
});

ipcMain.handle('load-skills', () => {
  return loadDirectoryContents(MAXI_SKILLS_PATH);
});

ipcMain.handle('get-home-path', () => {
  return os.homedir();
});

ipcMain.handle('select-workspace', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Workspace Folder'
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths[0];
});

function buildFileTree(dirPath, relativePath = '') {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const tree = [];
    
    const sortedItems = items.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    
    for (const item of sortedItems) {
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;
      
      const itemPath = path.join(dirPath, item.name);
      const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
      
      if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        let icon = 'file';
        
        if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
          icon = 'javascript';
        } else if (['.json'].includes(ext)) {
          icon = 'json';
        } else if (['.html', '.htm'].includes(ext)) {
          icon = 'html';
        } else if (['.css', '.scss', '.sass', '.less'].includes(ext)) {
          icon = 'css';
        } else if (['.md', '.markdown'].includes(ext)) {
          icon = 'markdown';
        } else if (['.py'].includes(ext)) {
          icon = 'python';
        } else if (['.java'].includes(ext)) {
          icon = 'java';
        } else if (['.cpp', '.c', '.h', '.hpp'].includes(ext)) {
          icon = 'cpp';
        } else if (['.go'].includes(ext)) {
          icon = 'go';
        } else if (['.rs'].includes(ext)) {
          icon = 'rust';
        } else if (['.sql'].includes(ext)) {
          icon = 'database';
        } else if (['.sh', '.bash'].includes(ext)) {
          icon = 'terminal';
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes(ext)) {
          icon = 'image';
        } else if (['.pdf'].includes(ext)) {
          icon = 'pdf';
        } else if (['.zip', '.tar', '.gz', '.rar'].includes(ext)) {
          icon = 'archive';
        } else if (['.env', '.gitignore', '.npmrc'].includes(item.name)) {
          icon = 'config';
        }
        
        tree.push({
          name: item.name,
          path: itemPath,
          relativePath: itemRelativePath,
          type: 'file',
          icon
        });
      } else if (item.isDirectory()) {
        const children = buildFileTree(itemPath, itemRelativePath);
        tree.push({
          name: item.name,
          path: itemPath,
          relativePath: itemRelativePath,
          type: 'directory',
          icon: 'folder',
          children
        });
      }
    }
    
    return tree;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

ipcMain.handle('read-directory', (event, dirPath) => {
  return buildFileTree(dirPath);
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > 1024 * 1024) {
      return { error: 'File too large', size: stats.size };
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return { content, size: stats.size };
  } catch (error) {
    return { error: error.message };
  }
});

let totalTokens = 0;

ipcMain.handle('stream-chat', async (event, { messages, apiKey, model }) => {
  const targetModel = model || 'MiniMax-M2.7';
  const postData = JSON.stringify({
    model: targetModel,
    messages,
    stream: true
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.minimax.io',
      path: '/anthropic/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let buffer = '';
      let chunkOffset = 0;
      let inputTokens = 0;
      let outputTokens = 0;

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              mainWindow.webContents.send('chat-complete');
              totalTokens += outputTokens;
              mainWindow.webContents.send('token-usage', { 
                input: inputTokens, 
                output: outputTokens,
                total: totalTokens 
              });
              resolve({ done: true, inputTokens, outputTokens });
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta') {
                if (parsed.delta.type === 'text_delta') {
                  mainWindow.webContents.send('chat-stream', parsed.delta.text);
                  chunkOffset += parsed.delta.text.length;
                  if (parsed.usage) {
                    inputTokens = parsed.usage.input_tokens || 0;
                    outputTokens = parsed.usage.output_tokens || 0;
                  }
                } else if (parsed.delta.type === 'thinking_delta') {
                  mainWindow.webContents.send('chat-thinking', parsed.delta.text);
                }
              } else if (parsed.type === 'message_delta') {
                if (parsed.usage) {
                  inputTokens = parsed.usage.input_tokens || 0;
                  outputTokens = parsed.usage.output_tokens || 0;
                }
                mainWindow.webContents.send('chat-complete');
                totalTokens += outputTokens;
                mainWindow.webContents.send('token-usage', { 
                  input: inputTokens, 
                  output: outputTokens,
                  total: totalTokens 
                });
                resolve({ done: true, inputTokens, outputTokens });
              } else if (parsed.type === 'message_start') {
                if (parsed.message?.usage) {
                  inputTokens = parsed.message.usage.input_tokens || 0;
                }
              }
            } catch (e) {
            }
          }
        }
      });

      res.on('end', () => {
        mainWindow.webContents.send('chat-complete');
        resolve({ done: true });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
});

const runningProcesses = new Map();

const EXECUTION_TIMEOUT = 30000;

ipcMain.handle('execute-code', async (event, { language, code, executionId }) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let processRef = null;

    const cleanup = () => {
      if (processRef) {
        try {
          processRef.kill('SIGTERM');
        } catch (e) {}
        processRef = null;
      }
      runningProcesses.delete(executionId);
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve({
        success: false,
        stdout,
        stderr: stderr + '\n[TIMEOUT: Execution exceeded 30 seconds]',
        exitCode: -1,
        duration: Date.now() - startTime
      });
    }, EXECUTION_TIMEOUT);

    runningProcesses.set(executionId, { kill: cleanup });

    try {
      if (language === 'javascript' || language === 'js') {
        const log = { stdout: [], stderr: [] };
        const sandbox = {
          console: {
            log: (...args) => log.stdout.push(args.map(String).join(' ')),
            error: (...args) => log.stderr.push(args.map(String).join(' ')),
            warn: (...args) => log.stdout.push('[WARN] ' + args.map(String).join(' ')),
            info: (...args) => log.stdout.push('[INFO] ' + args.map(String).join(' ')),
          },
          setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 5000)),
          setInterval: (fn, ms) => setInterval(fn, Math.min(ms, 5000)),
          Math,
          Date,
          JSON,
          Array,
          Object,
          String,
          Number,
          Boolean,
          RegExp,
          Error,
          Map,
          Set,
          Promise
        };

        try {
          const script = new vm.Script(code);
          const context = vm.createContext(sandbox);
          script.runInContext(context, { timeout: 10000 });
          
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: log.stderr.length === 0,
            stdout: log.stdout.join('\n'),
            stderr: log.stderr.join('\n'),
            exitCode: 0,
            duration: Date.now() - startTime
          });
        } catch (err) {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: false,
            stdout: log.stdout.join('\n'),
            stderr: err.message,
            exitCode: 1,
            duration: Date.now() - startTime
          });
        }

      } else if (language === 'python' || language === 'py') {
        processRef = spawn('python3', ['-c', code], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        processRef.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        processRef.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        processRef.on('close', (code) => {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code,
            duration: Date.now() - startTime
          });
        });

        processRef.on('error', (err) => {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: false,
            stdout,
            stderr: err.message,
            exitCode: 1,
            duration: Date.now() - startTime
          });
        });

      } else if (language === 'node' || language === 'nodejs') {
        processRef = spawn('node', ['-e', code], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        processRef.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        processRef.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        processRef.on('close', (code) => {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code,
            duration: Date.now() - startTime
          });
        });

        processRef.on('error', (err) => {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: false,
            stdout,
            stderr: err.message,
            exitCode: 1,
            duration: Date.now() - startTime
          });
        });

      } else if (language === 'bash' || language === 'shell' || language === 'sh') {
        processRef = spawn('/bin/sh', ['-c', code], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        processRef.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        processRef.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        processRef.on('close', (code) => {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: code === 0,
            stdout,
            stderr,
            exitCode: code,
            duration: Date.now() - startTime
          });
        });

        processRef.on('error', (err) => {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: false,
            stdout,
            stderr: err.message,
            exitCode: 1,
            duration: Date.now() - startTime
          });
        });

      } else {
        clearTimeout(timeoutId);
        cleanup();
        resolve({
          success: false,
          stdout: '',
          stderr: `Unsupported language: ${language}`,
          exitCode: 1,
          duration: Date.now() - startTime
        });
      }
    } catch (err) {
      clearTimeout(timeoutId);
      cleanup();
      resolve({
        success: false,
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        duration: Date.now() - startTime
      });
    }
  });
});

ipcMain.handle('stop-execution', (event, executionId) => {
  const proc = runningProcesses.get(executionId);
  if (proc) {
    proc.kill();
    runningProcesses.delete(executionId);
    return true;
  }
  return false;
});