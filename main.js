const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');
const net = require('net');
const os = require('os');
const fs = require('fs');
const https = require('https');

let mainWindow;
let tray;
let keepAliveInterval = null;
let isKeepAliveRunning = false;
let currentConfig = {
  targetIP: '172.16.130.1',
  interval: 10,
  protocol: 'tcp',
  port: 443
};

const configPath = path.join(app.getPath('userData'), 'config.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 402,
    height: 874,
    minWidth: 402,
    minHeight: 874,
    icon: path.join(__dirname, 'KeepConnect.icns'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  let iconPath;
  if (process.platform === 'darwin') {
    iconPath = path.join(__dirname, 'icon-16x16.png');
  } else {
    iconPath = path.join(__dirname, 'icon.png');
  }
  
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('KeepConnect');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

function isEasyConnectRunning() {
  return new Promise((resolve) => {
    let command;
    if (process.platform === 'win32') {
      command = 'tasklist';
    } else if (process.platform === 'darwin') {
      command = 'ps aux';
    } else {
      command = 'ps aux';
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log('ps command failed, assuming EasyConnect is running:', error.message);
        resolve(true);
        return;
      }

      const isRunning = stdout.includes('EasyConnect') || stdout.includes('EasyConnect.exe');
      console.log('EasyConnect running:', isRunning);
      resolve(isRunning);
    });
  });
}

function checkEasyConnectStatus() {
  return new Promise((resolve) => {
    const options = {
      hostname: '127.0.0.1',
      port: 54530,
      path: '/ECAgent?op=DoQueryService&arg1=QUERY%20LOGINSTATUS',
      method: 'GET',
      rejectUnauthorized: false,
      timeout: 3000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = data.trim(';').trim(')').trim('(');
          const json = JSON.parse(result);
          const status = json.data.status;
          console.log('EasyConnect API status:', status);
          resolve(status);
        } catch (error) {
          console.log('EasyConnect API parse error:', error.message);
          resolve(-1);
        }
      });
    });

    req.on('error', (error) => {
      console.log('EasyConnect API error:', error.message);
      resolve(-1);
    });

    req.on('timeout', () => {
      console.log('EasyConnect API timeout');
      req.destroy();
      resolve(-1);
    });

    req.end();
  });
}

ipcMain.handle('check-vpn-status', async () => {
  try {
    console.log('Starting VPN status check...');
    const isRunning = await isEasyConnectRunning();
    
    if (!isRunning) {
      console.log('EasyConnect not running, returning not connected');
      return { connected: false, message: 'EasyConnect未运行' };
    }

    const status = await checkEasyConnectStatus();
    
    console.log('Processing EasyConnect status:', status, 'type:', typeof status);
    
    // 确保status是数字类型
    const numericStatus = parseInt(status, 10);
    console.log('Numeric status:', numericStatus);
    
    switch (numericStatus) {
      case 0:
        console.log('EasyConnect API returns 0 - not connected');
        return { connected: false, message: 'VPN未连接' };
      case 1:
        console.log('EasyConnect API returns 1 - connected');
        return { connected: true, message: 'VPN已连接' };
      case 2:
        console.log('EasyConnect API returns 2 - connecting');
        return { connected: false, message: 'VPN连接中' };
      case 3:
        console.log('EasyConnect API returns 3 - not running');
        return { connected: false, message: 'EasyConnect未运行' };
      case 4:
        console.log('EasyConnect API returns 4 - connected (new status code)');
        return { connected: true, message: 'VPN已连接' };
      default:
        console.log('EasyConnect API returns unknown status:', status);
        break;
    }
  } catch (error) {
    console.error('VPN status check error:', error);
  }

  console.log('Falling back to network interface check...');
  return new Promise((resolve) => {
    let command;
    if (process.platform === 'win32') {
      command = 'ipconfig';
    } else {
      command = 'ifconfig';
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log('Network interface command error:', error.message);
        resolve({ connected: false, message: '无法获取网络接口信息' });
        return;
      }

      console.log('Network interfaces output:');
      console.log(stdout);
      
      const interfaces = stdout;
      let connected = false;
      
      if (process.platform === 'win32') {
        const vpnMatch = interfaces.match(/PPP adapter|Sangfor|SSL VPN/i);
        const statusMatch = interfaces.match(/Connected|已连接/i);
        connected = !!vpnMatch && !!statusMatch;
        console.log('Windows VPN check - vpnMatch:', !!vpnMatch, 'statusMatch:', !!statusMatch, 'connected:', connected);
      } else {
        const tun0Match = interfaces.match(/tun\d+:/);
        const utunMatch = interfaces.match(/utun\d+:/);
        const ppp0Match = interfaces.match(/ppp\d+:/);
        
        console.log('Checking for VPN interfaces...');
        console.log('tun0Match:', !!tun0Match, 'utunMatch:', !!utunMatch, 'ppp0Match:', !!ppp0Match);
        
        // 检查是否存在任何 VPN 相关的接口
        if (tun0Match || utunMatch || ppp0Match) {
          console.log('Found VPN interface, checking for inet address...');
          
          // 检查是否有 inet 地址（表示已连接）
          // 匹配不同格式的VPN接口IP地址
          const inetMatch = interfaces.match(/inet\s+\d+\.\d+\.\d+\.\d+/);
          console.log('inetMatch:', !!inetMatch);
          
          if (inetMatch) {
            connected = true;
            console.log('Network interface check - connected: true (found inet address)');
          } else {
            console.log('Network interface check - not connected (no inet address)');
          }
        } else {
          console.log('Network interface check - not connected (no VPN interfaces found)');
        }
      }
      
      if (connected) {
        resolve({ connected: true, message: 'VPN已连接' });
      } else {
        resolve({ connected: false, message: 'VPN未连接' });
      }
    });
  });
});

ipcMain.handle('add-log', async (event, message, type) => {
  return { success: true };
});

ipcMain.handle('launch-easyconnect', async () => {
  return new Promise((resolve, reject) => {
    let easyConnectPath;
    
    if (process.platform === 'darwin') {
      easyConnectPath = '/Applications/EasyConnect.app/Contents/MacOS/EasyConnect';
    } else if (process.platform === 'win32') {
      const possiblePaths = [
        'C:\\Program Files (x86)\\Sangfor\\SSL\\EasyConnect\\EasyConnect.exe',
        'C:\\Program Files\\Sangfor\\SSL\\EasyConnect\\EasyConnect.exe',
        'C:\\Program Files (x86)\\Sangfor\\EasyConnect\\EasyConnect.exe',
        'C:\\Program Files\\Sangfor\\EasyConnect\\EasyConnect.exe'
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          easyConnectPath = p;
          break;
        }
      }
      
      if (!easyConnectPath) {
        easyConnectPath = possiblePaths[0];
      }
    } else {
      easyConnectPath = '/usr/local/bin/EasyConnect';
    }

    const easyConnect = spawn(easyConnectPath, [], { detached: true });
    
    easyConnect.on('error', (error) => {
      reject({ success: false, message: `启动EasyConnect失败: ${error.message}` });
    });

    easyConnect.on('spawn', () => {
      easyConnect.unref();
      resolve({ success: true, message: 'EasyConnect已启动' });
    });
  });
});

ipcMain.handle('start-keep-alive', async (event, config) => {
  const { targetIP, interval, protocol, port } = config;
  currentConfig = config;
  
  if (isKeepAliveRunning) {
    return { success: false, message: '保活服务已在运行' };
  }

  isKeepAliveRunning = true;
  const intervalMs = interval * 60 * 1000;

  keepAliveInterval = setInterval(() => {
    if (protocol === 'icmp') {
      sendIcmpPacket(targetIP);
    } else {
      sendTcpPacket(targetIP, port);
    }
  }, intervalMs);

  if (protocol === 'icmp') {
    await sendIcmpPacket(targetIP);
  } else {
    await sendTcpPacket(targetIP, port);
  }
  
  return { success: true, message: `保活服务已启动，每${interval}分钟发送一次${protocol.toUpperCase()}包到${targetIP}${protocol === 'tcp' ? ':' + port : ''}` };
});

ipcMain.handle('stop-keep-alive', async () => {
  if (!isKeepAliveRunning) {
    return { success: false, message: '保活服务未运行' };
  }

  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }

  isKeepAliveRunning = false;
  return { success: true, message: '保活服务已停止' };
});

ipcMain.handle('get-keep-alive-status', async () => {
  return { running: isKeepAliveRunning };
});

function sendTcpPacket(targetIP, port = 80) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(5000);

    socket.connect(port, targetIP, () => {
      const message = `TCP包已发送到 ${targetIP}:${port}`;
      console.log(message);
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('log-message', message, 'success');
      }
      socket.destroy();
      resolve({ success: true });
    });

    socket.on('error', (error) => {
      const message = `发送TCP包失败: ${error.message}`;
      console.error(message);
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('log-message', message, 'error');
      }
      socket.destroy();
      resolve({ success: false, error: error.message });
    });

    socket.on('timeout', () => {
      const message = `连接超时: ${targetIP}:${port}`;
      console.error(message);
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('log-message', message, 'error');
      }
      socket.destroy();
      resolve({ success: false, error: 'Connection timeout' });
    });
  });
}

function sendIcmpPacket(targetIP) {
  return new Promise((resolve) => {
    let command;
    if (process.platform === 'win32') {
      command = `ping -n 1 ${targetIP}`;
    } else {
      command = `ping -c 1 ${targetIP}`;
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        const message = `发送ICMP包失败: ${error.message}`;
        console.error(message);
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('log-message', message, 'error');
        }
        resolve({ success: false, error: error.message });
      } else {
        const message = `ICMP包已发送到 ${targetIP}`;
        console.log(message);
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('log-message', message, 'success');
        }
        resolve({ success: true });
      }
    });
  });
}

ipcMain.handle('test-connection', async (event, config) => {
  const { targetIP, protocol, port } = config;
  
  if (protocol === 'icmp') {
    return await sendIcmpPacket(targetIP);
  } else {
    return await sendTcpPacket(targetIP, port);
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    currentConfig = config;
    return { success: true, message: '配置已保存' };
  } catch (error) {
    return { success: false, message: `保存配置失败: ${error.message}` };
  }
});

ipcMain.handle('load-config', async () => {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configData);
      currentConfig = config;
      return { success: true, config };
    } else {
      return { success: true, config: currentConfig };
    }
  } catch (error) {
    return { success: false, message: `加载配置失败: ${error.message}`, config: currentConfig };
  }
});