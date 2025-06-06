const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'business', 'index.js'),
        },
    });

    mainWindow.loadFile('src/ui/index.html');
    console.log('process.platform', process.env.NODE_ENV);

    // 打开开发工具
    if (process.env.NODE_ENV !== 'production') {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    // 主进程注册 IPC 处理方法
    ipcMain.handle('open-directory-dialog', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'], // 只允许选目录
        });
        return result;
    });

    ipcMain.handle('show-confirm-dialog', (_: any, title: any, message: any) => {
        return dialog
            .showMessageBox({
                type: 'question',
                title,
                message,
                buttons: ['取消', '确认'],
            })
            .then((res: { response: number }) => res.response === 1); // 确认按钮返回 true
    });

    ipcMain.handle('show-message-box', (_: any, title: any, message: any) => {
        return dialog.showMessageBox({ title, message });
    });

    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
