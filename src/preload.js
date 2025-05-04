// Preload script for Microsoft Teams Electron App
const { contextBridge, ipcRenderer } = require('electron')

// Initialize the API bridge
contextBridge.exposeInMainWorld('electronAPI', {
  // Method to set badge count on macOS
  setDockBadge: (count) => {
    ipcRenderer.send('set-badge-count', count)
  },
  
  // Method to handle notifications
  sendNotification: (title, body) => {
    ipcRenderer.send('notification', { title, body })
  },
  
  // Add Teams-specific methods if needed
  handleTeamsDeepLink: (link) => {
    ipcRenderer.send('teams-deep-link', link)
  }
})

// Add Teams web client enhancements
window.addEventListener('DOMContentLoaded', () => {
  // Force dark mode preference for Teams
  localStorage.setItem('teams.theme', 'dark')
  localStorage.setItem('teams.preferredColorScheme', 'dark')
  
  // Improve web app performance
  if (!document.querySelector('#teams-electron-styles')) {
    const style = document.createElement('style')
    style.id = 'teams-electron-styles'
    style.innerHTML = `
      :root {
        color-scheme: dark;
      }
      
      body {
        background-color: #121212;
      }
    `
    document.head.appendChild(style)
  }
})

// Inject storage persistence helper
const originalSetItem = localStorage.setItem
localStorage.setItem = function(key, value) {
  const event = new Event('itemInserted')
  event.key = key
  event.value = value
  document.dispatchEvent(event)
  originalSetItem.apply(this, arguments)
}
