import { executeAdbCommand, printToCommandOutput } from './utils';

const { spawn } = require('child_process');
const fs = require('fs');

// 更新 apk
function updateApk(deviceName: string, apkPath: string) {
    const updateStatus = document.getElementById('update-apk-status')!;
    updateStatus.textContent = `正在更新apk ${apkPath} 到设备 ${deviceName}...`;
    const command = `adb -s ${deviceName} -d install ${apkPath}`;

    console.log('updateApk:', command);

    executeAdbCommand(command, (err: { message: any }, result: any) => {
        if (err) {
            updateStatus.textContent = `Error install files: ${err.message}`;
            return;
        }
        console.log('install apk successfully', result);

        updateStatus.textContent = 'apk 更新成功';
    });
}

const powershellTarget: Record<string, any> = {};
const enableMonitorAdbPort = (deviceName: string, port: number | string) => {
    // 定义脚本路径和参数
    const scriptPath = './src/business/shell_script/monitor_adb.ps1';

    // 使用 PowerShell 执行脚本
    const powershell = spawn('powershell.exe', [
        '-ExecutionPolicy',
        'Bypass', // 允许执行脚本
        '-File',
        scriptPath, // 脚本路径
        '-DeviceName',
        deviceName, // 参数
        '-Port',
        port,
    ]);

    // 捕获标准输出
    powershell.stdout.on('data', (data: any) => {
        console.log(`enableMonitorAdbPort Output: ${data}`);
        printToCommandOutput('enable monitor adb Port for device successful\n' + data);
    });

    // 捕获标准错误输出
    powershell.stderr.on('data', (data: any) => {
        console.error(`enableMonitorAdbPort Error: ${data}`);
        printToCommandOutput('enable monitor adb Port for device Error\n' + data);
    });

    // 监听脚本执行结束
    powershell.on('close', (code: any) => {
        console.log(`enableMonitorAdbPort Script exited with code: ${code}`);
        printToCommandOutput('enable monitor adb Port for device code\n' + code);
    });

    powershellTarget[deviceName + '_' + port + '_powershell'] = powershell;
};

const killMonitorAdbPort = (deviceName: string, port: number | string) => {
    const key = deviceName + '_' + port + '_powershell';
    if (!key) {
        printToCommandOutput('kill monitor adb Port for device code\n' + 'no device name or port');
    }
    powershellTarget[key].kill(); // 停止子进程
    powershellTarget[key] = null;
    delete powershellTarget[key];
    printToCommandOutput('kill monitor adb Port for device code\n' + 'kill success');
};

const openAppAnalyze = (deviceName: any) => {
    executeAdbCommand(`adb -s ${deviceName} shell am start -n com.absinthe.libchecker/.features.home.ui.MainActivity`, (err: { message: any }, result: any) => {
        if (err) {
            console.error('Error open setting for device:', err);
            printToCommandOutput(`Error open setting for device: ${err.message}\n`);
        } else {
            console.log('open setting for device successful');
            printToCommandOutput('open setting for device successful\n');
        }
    });
};

const openSetting = (deviceName: any) => {
    executeAdbCommand(`adb -s ${deviceName} shell am start -a android.settings.SETTINGS`, (err: { message: any }, result: any) => {
        if (err) {
            console.error('Error open setting for device:', err);
            printToCommandOutput(`Error open setting for device: ${err.message}\n`);
        } else {
            console.log('open setting for device successful');
            printToCommandOutput('open setting for device successful\n');
        }
    });
};

const openWebView = (deviceName: any) => {
    executeAdbCommand(`adb -s ${deviceName} shell am start -n com.example.webviewapp/.MainActivity`, (err: { message: any }, result: any) => {
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
const updateMiddleware = (deviceName: string, middlewarePath: string) => {
    const updateStatus = document.getElementById('update-status')!;
    updateStatus.textContent = `正在更新中间件文件 ${middlewarePath} 到设备 ${deviceName}...`;

    // Step 1: 执行 adb root 命令
    executeAdbCommand(`adb -s ${deviceName} root`, (err: { message: any }, result: any) => {
        if (err) {
            updateStatus.textContent = `Error: ${err.message}`;
            return;
        }
        console.log('Root success', result);

        // Step 2: 执行 adb remount 命令
        executeAdbCommand(`adb -s ${deviceName} remount`, (err: { message: any }, result: any) => {
            if (err) {
                updateStatus.textContent = `Error: ${err.message}`;
                return;
            }
            console.log('Remount success', result);

            // Step 3: 执行 adb push 命令，推送中间件文件
            const pushCommand = `adb -s ${deviceName} push ${middlewarePath} /vendor/bin/`;

            console.log('Pushing middleware files:', pushCommand);

            executeAdbCommand(pushCommand, (err: { message: any }, result: any) => {
                if (err) {
                    updateStatus.textContent = `Error pushing files: ${err.message}`;
                    return;
                }
                console.log('Middleware files pushed successfully', result);

                // Step 4: 执行 adb reboot 命令
                executeAdbCommand(`adb -s ${deviceName} reboot`, (err: { message: any }, result: any) => {
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
};

const clearCommandOutput = () => {
    const outputArea = document.getElementById('command-output');
    if (!outputArea) {
        return;
    }
    outputArea.textContent = '';
    outputArea.scrollTop = outputArea.scrollHeight; // 自动滚动到最后
};

export { clearCommandOutput, updateApk, enableMonitorAdbPort, openAppAnalyze, openSetting, openWebView, updateMiddleware, killMonitorAdbPort };
