const { executeAdbCommand } = require('../utils');

// 更新 apk
function updateApk(deviceId, apkPath) {
    const updateStatus = document.getElementById('update-apk-status');
    updateStatus.textContent = `正在更新apk ${apkPath} 到设备 ${deviceId}...`;
    const command = `adb -s ${deviceId} -d install ${apkPath}`;

    console.log('updateApk:', command);

    executeAdbCommand(command, (err, result) => {
        if (err) {
            updateStatus.textContent = `Error install files: ${err.message}`;
            return;
        }
        console.log('install apk successfully', result);

        updateStatus.textContent = 'apk 更新成功';
    });
}

exports.updateApk = updateApk;
