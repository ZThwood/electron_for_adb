import { pullLog, clearCommandOutput, enableMonitorAdbPort, killMonitorAdbPort, openAppAnalyze, openSetting, openWebView, updateApk, updateMiddleware, pullMqttLog, pullZ2MLog, openZ2MLog, clearZ2MCache } from './feature';
import { updateZ2M } from './installZ2M';
import { preload, electronAPI } from './preload';
import { executeAdbCommand, getDeviceName, getFolderPaths, printToCommandOutput, registerLogButton } from './utils';

// index.ts
preload();
// 获取设备列表
function getDeviceList() {
    executeAdbCommand('adb devices', (err: { message: any }, result: string) => {
        if (err) {
            console.error('Error getting device list:', err);
            document.getElementById('device-list')!.innerText = `Error: ${err.message}`;
        } else {
            const deviceList = result
                .split('\n')
                .slice(1)
                .filter((line: string) => line.trim() !== '')
                .map((line: string) => line.split('\t')[0]);
            console.log('Device List:', deviceList);

            // 填充设备列表到 <select> 下拉框
            const deviceSelect = document.getElementById('device-select');
            if (!deviceSelect) {
                return;
            }
            deviceSelect.innerHTML = '<option value="">请选择设备</option>'; // 清空旧的列表

            deviceList.forEach((deviceId: string, i: number) => {
                const option = document.createElement('option') as HTMLOptionElement;
                option.value = deviceId;
                option.textContent = deviceId;
                if (i === 0) {
                    option.selected = true; // 默认选中第一个设备
                }
                deviceSelect.appendChild(option);
            });

            document.getElementById('device-list')!.innerText = `Device List: \n${deviceList.join('\n')}`;
        }
    });
}

// 重启设备
function restartDevice(deviceId: any) {
    executeAdbCommand(`adb -s ${deviceId} reboot`, (err: { message: any }, result: any) => {
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
function reversePort(deviceId: any, localPort: any, devicePort: any) {
    executeAdbCommand(`adb -s ${deviceId} reverse tcp:${devicePort} tcp:${localPort}`, (err: { message: any }, result: any) => {
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
    const replaceText = (selector: string, text: string) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    // 显示 Electron、Node 和 Chrome 版本
    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency]!);
    }

    // 获取设备列表
    getDeviceList();

    // 监听重启按钮点击事件
    document.getElementById('restart')?.addEventListener('click', () => {
        const deviceId = getDeviceName();
        if (!deviceId) {
            alert('请选择设备');
            return;
        }
        console.log('Restart button clicked for device:', deviceId);
        restartDevice(deviceId);
    });

    // 监听反向端口映射按钮点击事件
    document.getElementById('reverse')?.addEventListener('click', () => {
        const deviceId = getDeviceName();
        const port = (document.getElementById('port') as HTMLInputElement).value;
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

    document.getElementById('openSetting')?.addEventListener('click', () => {
        const deviceId = getDeviceName();
        if (!deviceId) {
            alert('请选择设备');
            return;
        }
        console.log('open setting for device:', deviceId);
        openSetting(deviceId);
    });

    // 新增的功能：更新中间件文件
    document.getElementById('update-middleware')?.addEventListener('click', () => {
        const middlewareDirectory: any = (document.getElementById('middleware-directory') as HTMLInputElement).files;
        // 判断是否选择了目录
        if (!middlewareDirectory.length) {
            alert('请选择中间件文件目录');
            return;
        }

        const deviceId = getDeviceName();
        if (!deviceId) {
            alert('请选择设备');
            return;
        }

        const middlewarePath = getFolderPaths(middlewareDirectory); // 获取中间件文件夹路径

        updateMiddleware(deviceId, middlewarePath);
    });

    document.getElementById('openWebView')?.addEventListener('click', () => {
        const deviceId = getDeviceName();
        if (!deviceId) {
            alert('请选择设备');
            return;
        }
        console.log('openWebView for device:', deviceId);
        openWebView(deviceId);
    });
    document.getElementById('openAppAnalyze')?.addEventListener('click', () => {
        const deviceId = getDeviceName();
        if (!deviceId) {
            alert('请选择设备');
            return;
        }
        console.log('openWebView for device:', deviceId);
        openAppAnalyze(deviceId);
    });

    document.getElementById('refresh')?.addEventListener('click', () => {
        console.log('refresh for device:');
        getDeviceList();
    });

    // 新增的功能：更新中间件文件
    document.getElementById('update-apk')?.addEventListener('click', () => {
        const inputElement = document.getElementById('apk-directory') as HTMLInputElement;
        const apkFiles = inputElement.files![0] as any;

        // 判断是否选择了目录
        if (!apkFiles) {
            alert('请选择 apk');
            return;
        }

        const deviceId = getDeviceName();
        if (!deviceId) {
            alert('请选择设备');
            return;
        }

        console.log('apkDirectory', apkFiles);

        updateApk(deviceId, apkFiles.path);
    });

    document.getElementById('duration-reverse')?.addEventListener('click', () => {
        const deviceId = getDeviceName();
        const port = (document.getElementById('port') as HTMLInputElement).value;
        if (!deviceId) {
            alert('请选择设备');
            return;
        }
        if (!port) {
            alert('请输入端口号');
            return;
        }
        console.log('Duration reverse port button clicked for device:', deviceId, 'with port:', port);

        enableMonitorAdbPort(deviceId, port); // 使用相同的端口号进行反向映射
    });

    document.getElementById('kill-duration-reverse')?.addEventListener('click', () => {
        const deviceId = getDeviceName();
        const port = (document.getElementById('port') as HTMLInputElement).value;
        if (!deviceId) {
            alert('请选择设备');
            return;
        }
        if (!port) {
            alert('请输入端口号');
            return;
        }
        console.log('kill Duration reverse port button clicked for device:', deviceId, 'with port:', port);
        killMonitorAdbPort(deviceId, port);
    });

    document.getElementById('command-clear')?.addEventListener('click', () => {
        console.log('clearCommandOutput');
        clearCommandOutput();
    });

    registerLogButton('pullLog', pullLog, '请选择一个目录保存日志文件。点击确认后将会弹出目录选择窗口。', electronAPI);

    registerLogButton('pullMqttLog', pullMqttLog, '请选择一个目录保存日志文件。点击确认后将会弹出目录选择窗口(路径不能包含中文)', electronAPI);

    registerLogButton('pullZ2MLog', pullZ2MLog, '请选择一个目录保存日志文件。点击确认后将会弹出目录选择窗口(路径不能包含中文)', electronAPI);

    document.getElementById('openZ2MLog')?.addEventListener('click', () => {
        console.log('openZ2MLog');
        const deviceId = getDeviceName();
        if (!deviceId) {
            alert('请选择设备');
            return;
        }

        openZ2MLog(deviceId);
    });

    document.getElementById('clearZ2MCache')?.addEventListener('click', () => {
        console.log('clearZ2MCache');
        const deviceId = getDeviceName();
        if (!deviceId) {
            alert('请选择设备');
            return;
        }

        clearZ2MCache(deviceId);
    });

    // 新增的功能：更新中间件文件
    document.getElementById('update-Z2M')?.addEventListener('click', () => {
        const z2mFilePath: any = (document.getElementById('Z2M-directory') as HTMLInputElement).files;
        // 判断是否选择了目录
        if (!z2mFilePath.length) {
            alert('请选择Z2M文件目录');
            return;
        }

        const deviceId = getDeviceName();
        if (!deviceId) {
            alert('请选择设备');
            return;
        }

        const filePath = z2mFilePath[0].path;
        console.log('z2mFilePath', filePath);

        updateZ2M(deviceId, filePath);
    });
});
