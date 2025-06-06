import { ElectronAPI } from 'src/types/electron';

const { contextBridge, ipcRenderer } = require('electron');

let electronAPI: ElectronAPI | null = null;
// preload.ts
function preload() {
    console.log('预加载脚本已执行！');

    // 暴露给渲染进程的 API
    electronAPI = {
        openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
        showConfirmDialog: (title: any, message: any) => ipcRenderer.invoke('show-confirm-dialog', title, message),
        showMessageBox: (title: any, message: any) => ipcRenderer.invoke('show-message-box', title, message),
    } as ElectronAPI;

    console.log('预加载脚本暴露的 API:', window);
    // 测试暴露是否成功
    window.addEventListener('DOMContentLoaded', () => {
        console.log('预加载中检测:', (window as any).electronAPI);
    });

    console.log('Preload executed:', {
        contextBridge: !!contextBridge,
        ipcRenderer: !!ipcRenderer,
        exposed: (window as any).electronAPI ? '成功' : '失败',
    });
}

export { preload, electronAPI };
