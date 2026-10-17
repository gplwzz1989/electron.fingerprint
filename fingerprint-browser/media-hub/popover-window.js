const path = require('node:path')
const { BrowserWindow } = require('electron')

class PopoverWindow {
  constructor (parentWindow) {
    this.parentWindow = parentWindow
    this.window = null
  }

  ensureWindow () {
    if (this.window && !this.window.isDestroyed()) {
      return this.window
    }

    this.window = new BrowserWindow({
      parent: this.parentWindow,
      width: 440,
      height: 520,
      show: false,
      frame: false,
      resizable: false,
      skipTaskbar: true,
      backgroundColor: '#ffffff',
      webPreferences: {
        preload: path.join(__dirname, 'popover-preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })

    this.window.loadFile(path.join(__dirname, 'popover.html'))

    // 点击外部失去焦点自动隐藏
    this.window.on('blur', () => {
      if (this.window && !this.window.isDestroyed() && this.window.isVisible()) {
        this.window.hide()
      }
    })

    return this.window
  }

  toggle (anchorBounds) {
    const win = this.ensureWindow()
    if (win.isVisible()) {
      win.hide()
      return false
    }

    this.positionNear(anchorBounds)
    win.show()
    win.focus()
    return true
  }

  hide () {
    if (this.window && !this.window.isDestroyed() && this.window.isVisible()) {
      this.window.hide()
    }
  }

  positionNear (anchorBounds) {
    if (!this.parentWindow || this.parentWindow.isDestroyed()) return
    const [parentX, parentY] = this.parentWindow.getPosition()
    const [parentW] = this.parentWindow.getSize()
    const win = this.ensureWindow()
    const [popW] = win.getSize()

    let posX = parentX + parentW - popW - 20
    let posY = parentY + 88

    if (anchorBounds && typeof anchorBounds.x === 'number') {
      posX = Math.round(parentX + anchorBounds.x + (anchorBounds.width || 0) - popW)
      posY = Math.round(parentY + anchorBounds.y + (anchorBounds.height || 30) + 4)
    }

    win.setPosition(Math.max(0, posX), Math.max(0, posY))
  }

  sendExtraction (data) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('media:extraction-changed', data)
    }
  }

  sendTasks (tasks) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('media:tasks-changed', tasks)
    }
  }
}

module.exports = {
  PopoverWindow
}
