const { app, BrowserWindow, globalShortcut, clipboard } = require('electron');
const { menubar } = require("menubar");
const path = require('path');

let mb;
let lastClipboardText;

app.on('ready', () => {

    mb = menubar({
        app: app,
        index: path.join(__dirname, "src", "index.html"),
        windowPosition: "trayBottomRight",
        browserWindow: {
            width: 450,
            height: 450,
            resizable: false,
            webPreferences: {
                contextIsolation: true,
                enableRemoteModule: false,
                enableRemoteModule: false,
                preload: path.join(__dirname, "src", "preload.js"),
            },
        }
    });

    // create shortcut
	globalShortcut.register('CommandOrControl+Shift+X', () => {
        if (mb._isVisible) {
            mb.hideWindow()
        } else {
            mb.showWindow()
        }
    })

    // Handle the clipboard
    setInterval(() => {
        const text = clipboard.readText()
        if (text != lastClipboardText) {
            lastClipboardText = text
            if (mb.window){
                mb.window.webContents.send('newClipboardText', text)
            }
        }
    }, 100);

    mb.on('ready', () => {
        mb.showWindow()
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})