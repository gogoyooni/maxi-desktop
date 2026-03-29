const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const https = require('node:https');

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
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
              resolve({ done: true });
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta') {
                if (parsed.delta.type === 'text_delta') {
                  mainWindow.webContents.send('chat-stream', parsed.delta.text);
                  chunkOffset += parsed.delta.text.length;
                } else if (parsed.delta.type === 'thinking_delta') {
                  mainWindow.webContents.send('chat-thinking', parsed.delta.text);
                }
              } else if (parsed.type === 'message_delta') {
                mainWindow.webContents.send('chat-complete');
                resolve({ done: true });
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