const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectPaths: (options) => ipcRenderer.invoke('select-paths', options),
})

function toFileUrl(absolutePath) {
  const p = absolutePath.replace(/\\/g, '/')
  const withLeadingSlash = p.match(/^[A-Za-z]:\//) ? `/${p}` : p
  return `file://${withLeadingSlash}`
}

contextBridge.exposeInMainWorld('mediaAPI', {
  toFileUrl,
})
