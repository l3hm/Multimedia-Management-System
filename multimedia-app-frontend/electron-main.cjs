const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  win.loadURL('http://localhost:5173')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (process.platform !== 'darwin') app.quit()
  }
})

ipcMain.handle('select-paths', async (_event, options = {}) => {
  const mode = options?.mode || 'both'
  const properties = ['multiSelections']

  if (mode === 'files') properties.push('openFile')
  else if (mode === 'folders') properties.push('openDirectory')
  else properties.push('openFile', 'openDirectory')

  const result = await dialog.showOpenDialog({ properties })
  if (result.canceled) return []
  return result.filePaths
})
