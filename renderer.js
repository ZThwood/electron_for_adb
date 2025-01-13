const { getFolderPaths, executeAdbCommand, printToCommandOutput } = require('./utils');
const { updateApk } = require('./business');

// 获取设备列表
function getDeviceList() {
    executeAdbCommand('adb devices', (err, result) => {
        if (err) {
            console.error('Error getting device list:', err);
            document.getElementById('device-list').innerText = `Error: ${err.message}`;
        } else {
            const deviceList = result
                .split('\n')
                .slice(1)
                .filter(line => line.trim() !== '')
                .map(line => line.split('\t')[0]);
            console.log('Device List:', deviceList);

            // 填充设备列表到 <select> 下拉框
            const deviceSelect = document.getElementById('device-select');
            deviceSelect.innerHTML = '<option value="">请选择设备</option>'; // 清空旧的列表

            deviceList.forEach((deviceId, i) => {
                const option = document.createElement('option');
                option.value = deviceId;
                option.textContent = deviceId;
                if (i === 0) {
                    option.selected = true; // 默认选中第一个设备
                }
                deviceSelect.appendChild(option);
            });

            document.getElementById('device-list').innerText = `Device List: \n${deviceList.join('\n')}`;
        }
    });
}

// 重启设备
function restartDevice(deviceId) {
    executeAdbCommand(`adb -s ${deviceId} reboot`, (err, result) => {
        if (err) {
            console.error('Error rebooting device:', err);
            printToCommandOutput(`Error rebooting device: ${err.message}\n`);
        } else {
            console.log('Device rebooted');
            printToCommandOutput('Device rebooted successfully\n');
        }
    });
}

// 反向映射端口
function reversePort(deviceId, localPort, devicePort) {
    executeAdbCommand(`adb -s ${deviceId} reverse tcp:${devicePort} tcp:${localPort}`, (err, result) => {
        if (err) {
            console.error('Error reversing port:', err);
            printToCommandOutput(`Error reversing port: ${err.message}\n`);
        } else {
            console.log('Port reverse successful');
            printToCommandOutput('Port reverse successful\n');
        }
    });
}

// 页面加载完毕时
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    // 显示 Electron、Node 和 Chrome 版本
    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }

    // 获取设备列表
    getDeviceList();

    // 监听重启按钮点击事件
    document.getElementById('restart').addEventListener('click', () => {
        const deviceId = document.getElementById('device-select').value;
        if (!deviceId) {
            alert('请选择设备');
            return;
        }
        console.log('Restart button clicked for device:', deviceId);
        restartDevice(deviceId);
    });

    // 监听反向端口映射按钮点击事件
    document.getElementById('reverse').addEventListener('click', () => {
        const deviceId = document.getElementById('device-select').value;
        const port = document.getElementById('port').value;
        if (!deviceId) {
            alert('请选择设备');
            return;
        }
        if (!port) {
            alert('请输入端口号');
            return;
        }
        console.log('Reverse port button clicked for device:', deviceId, 'with port:', port);
        reversePort(deviceId, port, port); // 使用相同的端口号进行反向映射
    });

    document.getElementById('openSetting').addEventListener('click', () => {
        const deviceId = document.getElementById('device-select').value;
        if (!deviceId) {
            alert('请选择设备');
            return;
        }
        console.log('open setting for device:', deviceId);
        openSetting(deviceId);
    });

    // 新增的功能：更新中间件文件
    document.getElementById('update-middleware').addEventListener('click', () => {
        const middlewareDirectory = document.getElementById('middleware-directory').files;
        // 判断是否选择了目录
        if (!middlewareDirectory.length) {
            alert('请选择中间件文件目录');
            return;
        }

        const deviceId = document.getElementById('device-select').value;
        if (!deviceId) {
            alert('请选择设备');
            return;
        }

        const middlewarePath = getFolderPaths(middlewareDirectory); // 获取中间件文件夹路径

        updateMiddleware(deviceId, middlewarePath);
    });

    document.getElementById('openWebView').addEventListener('click', () => {
        const deviceId = document.getElementById('device-select').value;
        if (!deviceId) {
            alert('请选择设备');
            return;
        }
        console.log('openWebView for device:', deviceId);
        openWebView(deviceId);
    });
    document.getElementById('openAppAnalyze').addEventListener('click', () => {
        const deviceId = document.getElementById('device-select').value;
        if (!deviceId) {
            alert('请选择设备');
            return;
        }
        console.log('openWebView for device:', deviceId);
        openAppAnalyze(deviceId);
    });

    document.getElementById('refresh').addEventListener('click', () => {
        console.log('refresh for device:');
        getDeviceList();
    });

    // 新增的功能：更新中间件文件
    document.getElementById('update-apk').addEventListener('click', () => {
        const apkFiles = document.getElementById('apk-directory').files[0];

        // 判断是否选择了目录
        if (!apkFiles) {
            alert('请选择 apk');
            return;
        }

        const deviceId = document.getElementById('device-select').value;
        if (!deviceId) {
            alert('请选择设备');
            return;
        }

        console.log('apkDirectory', apkFiles);

        updateApk(deviceId, apkFiles.path);
    });
});

const openAppAnalyze = deviceId => {
    executeAdbCommand(`adb -s ${deviceId} shell am start -n com.absinthe.libchecker/.features.home.ui.MainActivity`, (err, result) => {
        if (err) {
            console.error('Error open setting for device:', err);
            printToCommandOutput(`Error open setting for device: ${err.message}\n`);
        } else {
            console.log('open setting for device successful');
            printToCommandOutput('open setting for device successful\n');
        }
    });
};

const openSetting = deviceId => {
    executeAdbCommand(`adb -s ${deviceId} shell am start -a android.settings.SETTINGS`, (err, result) => {
        if (err) {
            console.error('Error open setting for device:', err);
            printToCommandOutput(`Error open setting for device: ${err.message}\n`);
        } else {
            console.log('open setting for device successful');
            printToCommandOutput('open setting for device successful\n');
        }
    });
};

const openWebView = deviceId => {
    executeAdbCommand(`adb -s ${deviceId} shell am start -n com.example.webviewapp/.MainActivity`, (err, result) => {
        if (err) {
            console.error('Error open setting for device:', err);
            printToCommandOutput(`Error open setting for device: ${err.message}\n`);
        } else {
            console.log('open setting for device successful');
            printToCommandOutput('open setting for device successful\n');
        }
    });
};

// 更新中间件文件的函数
function updateMiddleware(deviceId, middlewarePath) {
    const updateStatus = document.getElementById('update-status');
    updateStatus.textContent = `正在更新中间件文件 ${middlewarePath} 到设备 ${deviceId}...`;

    // Step 1: 执行 adb root 命令
    executeAdbCommand(`adb -s ${deviceId} root`, (err, result) => {
        if (err) {
            updateStatus.textContent = `Error: ${err.message}`;
            return;
        }
        console.log('Root success', result);

        // Step 2: 执行 adb remount 命令
        executeAdbCommand(`adb -s ${deviceId} remount`, (err, result) => {
            if (err) {
                updateStatus.textContent = `Error: ${err.message}`;
                return;
            }
            console.log('Remount success', result);

            // Step 3: 执行 adb push 命令，推送中间件文件
            const pushCommand = `adb -s ${deviceId} push ${middlewarePath} /vendor/bin/`;

            console.log('Pushing middleware files:', pushCommand);

            executeAdbCommand(pushCommand, (err, result) => {
                if (err) {
                    updateStatus.textContent = `Error pushing files: ${err.message}`;
                    return;
                }
                console.log('Middleware files pushed successfully', result);

                // Step 4: 执行 adb reboot 命令
                executeAdbCommand(`adb -s ${deviceId} reboot`, (err, result) => {
                    if (err) {
                        updateStatus.textContent = `Error rebooting device: ${err.message}`;
                        return;
                    }
                    console.log('Device rebooted successfully');
                    updateStatus.textContent = '中间件更新成功，设备正在重启...';
                });
            });
        });
    });
}
