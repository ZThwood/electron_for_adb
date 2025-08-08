import { ElectronAPI } from 'src/types/electron';

const { exec } = require('child_process');
// 提取文件夹路径
function getFolderPaths(files: { path: string }[]) {
    const filePath = files[0].path; // 获取文件路径
    // 转换为标准路径格式
    const normalizedPath = filePath.replace(/\\/g, '/'); // 将反斜杠转换为正斜杠

    // 分割路径，去掉最后一个部分（文件名）
    const pathParts = normalizedPath.split('/');
    pathParts.pop(); // 移除文件名部分

    // 拼接文件夹路径
    const folderPath = pathParts.join('/') + '/';

    // 将路径中的斜杠转换回反斜杠
    return folderPath.replace(/\//g, '\\');
}

// 执行 ADB 命令并回调
function executeAdbCommand(command: string, callback: Function) {
    // 打印命令到命令行输出区域
    printToCommandOutput(`> ${command}\n`);

    exec(command, (err: { message: any }, stdout: any, stderr: string | undefined) => {
        if (err) {
            console.error('Error executing command:', err);
            printToCommandOutput(`Error: ${err.message}\n`);
            callback(err, null);
        } else if (stderr) {
            console.error('stderr:', stderr);
            printToCommandOutput(`stderr: ${stderr}\n`);
            callback(new Error(stderr), null);
        } else {
            // 打印标准输出到命令行输出区域
            printToCommandOutput(`Success: ${stdout}\n`);
            callback(null, stdout);
        }
    });
}

// 将输出内容打印到命令行输出区域
function printToCommandOutput(text: string) {
    const outputArea = document.getElementById('command-output');
    if (!outputArea) {
        return;
    }
    outputArea.textContent += text; // 在现有内容后追加文本
    outputArea.scrollTop = outputArea.scrollHeight; // 自动滚动到最后
}

const getDeviceName = () => {
    const selectHtml = document.getElementById('device-select') as HTMLSelectElement;
    return selectHtml.value ?? '';
};

function pullDeviceLog(deviceName: string, path: string, remotePath: string, successMsg: string) {
    const updateStatus = document.getElementById('update-log-status')!;
    updateStatus.textContent = `正在拉取 ${deviceName} 日志到 ${path}...`;

    const command = `adb -s ${deviceName} pull ${remotePath} ${path}`;
    console.log('pullLog:', command);

    // adb root
    executeAdbCommand(`adb -s ${deviceName} root`, (err: { message: any }, result: any) => {
        if (err) {
            updateStatus.textContent = `Error: ${err.message}`;
            return;
        }
        console.log('Root success', result);

        // adb remount
        executeAdbCommand(`adb -s ${deviceName} remount`, (err: { message: any }, result: any) => {
            if (err) {
                updateStatus.textContent = `Error: ${err.message}`;
                return;
            }
            console.log('Remount success', result);

            // adb pull
            executeAdbCommand(command, (err: { message: any }, result: any) => {
                if (err) {
                    updateStatus.textContent = `Error pull files: ${err.message}`;
                    return;
                }
                console.log('Successfully pull', result);
                updateStatus.textContent = successMsg;
            });
        });
    });
}

function registerLogButton(buttonId: string, pullFunc: (deviceId: string, path: string) => void, confirmMsg: string, electronAPI: ElectronAPI | null) {
    document.getElementById(buttonId)?.addEventListener('click', async () => {
        const isConfirm = await electronAPI?.showConfirmDialog('日志导出', confirmMsg);
        if (!isConfirm) return;

        const result = await electronAPI?.openDirectoryDialog();
        if (!result || result.canceled) return;

        const selectedDir = result.filePaths[0];
        console.log('用户选择的目录:', selectedDir);

        if (!selectedDir) {
            alert('请指定目录');
            return;
        }

        const deviceId = getDeviceName();
        if (!deviceId) {
            alert('请选择设备');
            return;
        }

        pullFunc(deviceId, selectedDir);
        electronAPI?.showMessageBox('导出完成', `日志已保存到: ${selectedDir}`);
    });
}

export { getFolderPaths, executeAdbCommand, printToCommandOutput, getDeviceName, pullDeviceLog, registerLogButton };
