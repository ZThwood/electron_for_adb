import { executeAdbCommand } from './utils';

const { execFile } = require('child_process');
const fs = require('fs');

// 更新 apk
function updateApk(deviceId: any, apkPath: any) {
    const updateStatus = document.getElementById('update-apk-status')!;
    updateStatus.textContent = `正在更新apk ${apkPath} 到设备 ${deviceId}...`;
    const command = `adb -s ${deviceId} -d install ${apkPath}`;

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

const enableMonitorAdbPort = (deviceId: string, port: any) => {
    const ps1FilePath = path.resolve(__dirname, '..', 'business', 'shell_script', 'monitor_adb.ps1');
    if (!fs.existsSync(ps1FilePath)) {
        console.error(`文件不存在: ${ps1FilePath}`);
        return;
    }
    console.log('enableMonitorAdbPort ps1FilePath:', ps1FilePath);
    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `"${ps1FilePath}"`, '-DeviceName', deviceId, '-Port', port], (err: any, stdout: any, stderr: any) => {
        if (err) {
            console.error(`执行 PowerShell 脚本时出错: ${err}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
};

export { updateApk, enableMonitorAdbPort };
