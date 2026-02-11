import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { Client } from 'ssh2';
import fs from 'fs';
import { executeAdbCommand, printToCommandOutput } from './utils';
const execPromise = promisify(exec);

const DEFAULT_Z2M_PATH = '/sdcard/cube.tar.gz';

interface InstallZ2MResult {
    success: boolean;
    error?: string;
}

interface TermuxCommandOptions {
    context?: any;
    userId?: string;
}

/**
 * 执行root命令的实现
 * @param command 要执行的命令
 * @returns Promise<string> 命令输出
 */
async function execRootCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const process = spawn('su', [], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let output = '';

        // 处理标准输出
        process.stdout.on('data', data => {
            output += data.toString();
        });
        // 处理错误输出
        process.stderr.on('data', data => {
            console.error('Root command stderr:', data.toString());
        });
        // 处理进程退出
        process.on('close', code => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(`Root command failed with code ${code}`));
            }
        });
        // 写入命令并退出
        process.stdin.write(`${command}\n`);
        process.stdin.write('exit\n');
        process.stdin.end();
    });
}
/**
 * 执行Termux命令的实现(通过SSH)
 * @param options SSH连接选项
 * @param commands 要执行的命令列表
 * @returns Promise<string[]> 命令输出数组
 */
async function execTermuxCommand(
    options: {
        host: string;
        username: string;
        password?: string;
        port?: number;
    },
    commands: string[]
): Promise<string[]> {
    const { host, username, password = '123456', port = 8022 } = options;
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const outputs: string[] = [];
        conn.on('ready', () => {
            console.log('SSH连接已建立');
            // 顺序执行所有命令
            const execCommands = async () => {
                try {
                    for (const cmd of commands) {
                        const output = await new Promise<string>((cmdResolve, cmdReject) => {
                            conn.exec(cmd, (err, stream) => {
                                if (err) {
                                    cmdReject(err);
                                    return;
                                }
                                let cmdOutput = '';
                                stream
                                    .on('data', (data: Buffer) => {
                                        cmdOutput += data.toString();
                                    })
                                    .on('close', () => {
                                        cmdResolve(cmdOutput.trim());
                                    })
                                    .stderr.on('data', data => {
                                        console.error('Command stderr:', data.toString());
                                    });
                            });
                        });

                        console.log(`[${cmd}] 输出:\n${output}`);
                        outputs.push(output);
                    }

                    conn.end();
                    resolve(outputs);
                } catch (error) {
                    conn.end();
                    reject(error);
                }
            };
            execCommands().catch(reject);
        });
        conn.on('error', err => {
            console.error('SSH连接错误:', err);
            reject(err);
        });
        conn.connect({
            host,
            port,
            username,
            password,
            readyTimeout: 3000,
            algorithms: {
                serverHostKey: ['ssh-rsa', 'ssh-dss'],
            },
        });
    });
}

async function installZ2M(deviceName: string, z2mTar: string = DEFAULT_Z2M_PATH, needRestart: boolean = true): Promise<InstallZ2MResult> {
    const updateStatusElement = document.getElementById('update-Z2M_status')!;
    const host = '12';
    const updateStatus = (textContent: string) => {
        if (updateStatusElement) {
            updateStatusElement.textContent = textContent;
        }
    };

    try {
        printToCommandOutput(`开始安装 Z2M path=${z2mTar}`);
        updateStatus(`开始安装 Z2M path=${z2mTar}`);

        // 检查文件是否存在
        const fileExists = await fs.promises
            .access(z2mTar, fs.constants.F_OK)
            .then(() => true)
            .catch(() => false);

        if (!fileExists) {
            printToCommandOutput('错误: z2mTar 不存在');
            return { success: false, error: 'z2mTar 不存在' };
        }

        // 获取用户ID
        const userID = await execRootCommand("stat -c '%U' /data/data/com.termux/cache");
        printToCommandOutput(`userID: ${userID}`);
        updateStatus(`userID: ${userID}`);
        var termuxConfig = {
            host: host,
            username: userID,
        };

        // 停止服务
        printToCommandOutput('正在停止 cube 服务...');
        await execTermuxCommand(termuxConfig, ['sv down /data/data/com.termux/files/usr/var/service/cube']);
        printToCommandOutput('cube 服务已停止');
        updateStatus('cube 服务已停止');

        // 等待2秒确保进程关闭
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 检查进程是否关闭
        const checkDown = await execTermuxCommand(termuxConfig, ['ps -A | grep node || true']);
        printToCommandOutput(`进程检查结果: ${checkDown || '无node进程'}`);

        // 删除旧代码
        printToCommandOutput('正在删除旧版Z2M代码...');
        await execRootCommand('rm -rf /data/data/com.termux/files/usr/z2m/*');
        printToCommandOutput('旧版Z2M代码已删除');
        updateStatus('旧版Z2M代码已删除');

        // 解压新包
        printToCommandOutput('正在解压Z2M安装包...');
        await execRootCommand(`tar -zxf ${z2mTar} -C /data/data/com.termux/files/usr/z2m`);
        printToCommandOutput('Z2M安装包解压完成');
        updateStatus('Z2M安装包解压完成');

        // 修改所有者
        printToCommandOutput('正在设置文件权限...');
        await execRootCommand(`chown -R ${userID}:${userID} /data/data/com.termux/files/usr/z2m`);
        printToCommandOutput('文件权限设置完成');
        updateStatus('文件权限设置完成');

        // 如果需要重启服务
        if (needRestart) {
            printToCommandOutput('正在启动 cube 服务...');
            await execTermuxCommand(termuxConfig, ['sv up /data/data/com.termux/files/usr/var/service/cube']);
            printToCommandOutput('cube 服务已启动');

            // 检查进程是否运行
            const checkUp = await execTermuxCommand(
                {
                    host: host,
                    username: userID,
                },
                ['ps -A | grep node || true']
            );
            printToCommandOutput(`服务启动检查: ${checkUp || '无node进程'}`);
            updateStatus(`服务启动检查: ${checkUp || '无node进程'}`);
        }

        printToCommandOutput('Z2M安装成功!');
        updateStatus('Z2M安装成功!');
        return { success: true };
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        printToCommandOutput(`Z2M安装失败: ${errMsg}`);
        updateStatus(`Z2M安装失败: ${errMsg}`);

        console.error('Z2M安装失败:', error);
        return { success: false, error: errMsg };
    }
}

// 更新Z2M的函数
const updateZ2M = (deviceName: string, path: string) => {
    const updateStatus = document.getElementById('update-Z2M_status')!;
    updateStatus.textContent = `正在更新Z2M文件 ${path} 到设备 ${deviceName}...`;

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
            const pushCommand = `adb -s ${deviceName} push ${path} /sdcard/`;

            console.log('Pushing middleware files:', pushCommand);

            executeAdbCommand(pushCommand, (err: { message: string }, result: any) => {
                if (err && !err.message.concat('pushed')) {
                    updateStatus.textContent = `Error pushing files: ${err.message}`;
                    return;
                }
                console.log('Middleware files pushed successfully', result);
                updateStatus.textContent = `pushed successfully: ${err.message}`;

                // Step 4: 执行 adb reboot 命令
                installZ2M(deviceName);
            });
        });
    });
};

export { updateZ2M };
