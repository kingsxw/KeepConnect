const { ipcRenderer } = require('electron');

const vpnStatusEl = document.getElementById('vpnStatus');
const keepAliveStatusEl = document.getElementById('keepAliveStatus');
const launchBtn = document.getElementById('launchBtn');
const checkStatusBtn = document.getElementById('checkStatusBtn');
const startKeepAliveBtn = document.getElementById('startKeepAliveBtn');
const stopKeepAliveBtn = document.getElementById('stopKeepAliveBtn');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const targetIPInput = document.getElementById('targetIP');
const intervalInput = document.getElementById('interval');
const protocolSelect = document.getElementById('protocol');
const portInput = document.getElementById('port');
const portGroup = document.getElementById('portGroup');
const logContainer = document.getElementById('logContainer');

let isKeepAliveRunning = false;
let currentConfig = {
  targetIP: '172.16.130.1',
  interval: 10,
  protocol: 'tcp',
  port: 443
};

function addLog(message, type = 'info') {
  const time = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  
  let typeClass = 'log-info';
  if (type === 'success') typeClass = 'log-success';
  if (type === 'error') typeClass = 'log-error';
  
  logEntry.innerHTML = `<span class="log-time">[${time}]</span> <span class="${typeClass}">${message}</span>`;
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

ipcRenderer.on('log-message', (event, message, type) => {
  addLog(message, type);
});

async function checkVPNStatus() {
  try {
    const result = await ipcRenderer.invoke('check-vpn-status');
    if (result.connected) {
      vpnStatusEl.textContent = result.message;
      vpnStatusEl.className = 'status-value status-connected';
      addLog(result.message, 'success');
    } else {
      vpnStatusEl.textContent = result.message;
      vpnStatusEl.className = 'status-value status-disconnected';
      addLog(result.message, 'info');
    }
    return result.connected;
  } catch (error) {
    vpnStatusEl.textContent = '状态检测失败';
    vpnStatusEl.className = 'status-value status-disconnected';
    addLog(`状态检测失败: ${error.message}`, 'error');
    return false;
  }
}

async function checkKeepAliveStatus() {
  try {
    const result = await ipcRenderer.invoke('get-keep-alive-status');
    isKeepAliveRunning = result.running;
    
    if (isKeepAliveRunning) {
      keepAliveStatusEl.textContent = '运行中';
      keepAliveStatusEl.className = 'status-value status-connected';
      startKeepAliveBtn.disabled = true;
      stopKeepAliveBtn.disabled = false;
    } else {
      keepAliveStatusEl.textContent = '未启动';
      keepAliveStatusEl.className = 'status-value status-disconnected';
      startKeepAliveBtn.disabled = false;
      stopKeepAliveBtn.disabled = true;
    }
  } catch (error) {
    addLog(`获取保活状态失败: ${error.message}`, 'error');
  }
}

function getConfig() {
  return {
    targetIP: targetIPInput.value.trim(),
    interval: parseInt(intervalInput.value),
    protocol: protocolSelect.value,
    port: parseInt(portInput.value)
  };
}

function setConfig(config) {
  if (config.targetIP !== undefined) targetIPInput.value = config.targetIP;
  if (config.interval !== undefined) intervalInput.value = config.interval;
  if (config.protocol !== undefined) protocolSelect.value = config.protocol;
  if (config.port !== undefined) portInput.value = config.port;
  currentConfig = { ...currentConfig, ...config };
}

function updatePortVisibility() {
  if (protocolSelect.value === 'tcp') {
    portGroup.classList.add('visible');
  } else {
    portGroup.classList.remove('visible');
  }
}

launchBtn.addEventListener('click', async () => {
  try {
    addLog('正在启动EasyConnect...', 'info');
    const result = await ipcRenderer.invoke('launch-easyconnect');
    if (result.success) {
      addLog(result.message, 'success');
      setTimeout(checkVPNStatus, 2000);
    } else {
      addLog(result.message, 'error');
    }
  } catch (error) {
    addLog(`启动失败: ${error.message}`, 'error');
  }
});

checkStatusBtn.addEventListener('click', async () => {
  addLog('正在刷新VPN状态...', 'info');
  await checkVPNStatus();
});

protocolSelect.addEventListener('change', updatePortVisibility);

startKeepAliveBtn.addEventListener('click', async () => {
  const config = getConfig();
  
  if (!config.targetIP) {
    addLog('请输入目标IP地址', 'error');
    return;
  }
  
  if (isNaN(config.interval) || config.interval < 1) {
    addLog('请输入有效的发送间隔（分钟）', 'error');
    return;
  }
  
  if (config.protocol === 'tcp') {
    if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
      addLog('请输入有效的TCP端口（1-65535）', 'error');
      return;
    }
  }
  
  try {
    addLog('正在启动保活服务...', 'info');
    const result = await ipcRenderer.invoke('start-keep-alive', config);
    if (result.success) {
      addLog(result.message, 'success');
      currentConfig = config;
      
      addLog('正在测试连接...', 'info');
      const testResult = await ipcRenderer.invoke('test-connection', config);
      if (testResult.success) {
        addLog(`连接测试成功: ${config.targetIP}`, 'success');
      } else {
        addLog(`连接测试失败: ${testResult.error}`, 'error');
        addLog('连接测试失败，自动停止保活服务', 'info');
        await ipcRenderer.invoke('stop-keep-alive');
      }
      
      await checkKeepAliveStatus();
    } else {
      addLog(result.message, 'error');
    }
  } catch (error) {
    addLog(`启动保活服务失败: ${error.message}`, 'error');
  }
});

stopKeepAliveBtn.addEventListener('click', async () => {
  try {
    addLog('正在停止保活服务...', 'info');
    const result = await ipcRenderer.invoke('stop-keep-alive');
    if (result.success) {
      addLog(result.message, 'success');
      await checkKeepAliveStatus();
    } else {
      addLog(result.message, 'error');
    }
  } catch (error) {
    addLog(`停止保活服务失败: ${error.message}`, 'error');
  }
});

saveConfigBtn.addEventListener('click', async () => {
  const config = getConfig();
  
  if (!config.targetIP) {
    addLog('请输入目标IP地址', 'error');
    return;
  }
  
  if (isNaN(config.interval) || config.interval < 1) {
    addLog('请输入有效的发送间隔（分钟）', 'error');
    return;
  }
  
  if (config.protocol === 'tcp') {
    if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
      addLog('请输入有效的TCP端口（1-65535）', 'error');
      return;
    }
  }
  
  try {
    addLog('正在保存配置...', 'info');
    const result = await ipcRenderer.invoke('save-config', config);
    if (result.success) {
      addLog(result.message, 'success');
      currentConfig = config;
      addLog('配置已生效', 'info');
    } else {
      addLog(result.message, 'error');
    }
  } catch (error) {
    addLog(`保存配置失败: ${error.message}`, 'error');
  }
});

async function init() {
  addLog('KeepConnect 已启动', 'success');
  
  try {
    const result = await ipcRenderer.invoke('load-config');
    if (result.success) {
      setConfig(result.config);
      addLog('已加载上次保存的配置', 'info');
      currentConfig = result.config;
    }
  } catch (error) {
    addLog(`加载配置失败: ${error.message}`, 'error');
  }
  
  await checkVPNStatus();
  await checkKeepAliveStatus();
}

init();