// 定义 Electron API 的类型
interface ElectronAPI {
    openDirectoryDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
    showConfirmDialog: (title: string, message: string) => Promise<boolean>;
    showMessageBox: (title: string, message: string) => Promise<void>;
    pullLog: (dirPath: string) => Promise<void>;
}

// 扩展 Window 接口
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export { ElectronAPI }; // Ensure this file is treated as a module
