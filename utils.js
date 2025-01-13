const { exec } = require('child_process');
// 提取文件夹路径
function getFolderPaths(files) {
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
function executeAdbCommand(command, callback) {
    // 打印命令到命令行输出区域
    printToCommandOutput(`> ${command}\n`);

    exec(command, (err, stdout, stderr) => {
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
function printToCommandOutput(text) {
    const outputArea = document.getElementById('command-output');
    outputArea.textContent += text; // 在现有内容后追加文本
    outputArea.scrollTop = outputArea.scrollHeight; // 自动滚动到最后
}

exports.getFolderPaths = getFolderPaths;
exports.executeAdbCommand = executeAdbCommand;
exports.printToCommandOutput = printToCommandOutput;
