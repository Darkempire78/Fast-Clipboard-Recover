const { app, nativeTheme, globalShortcut, clipboard, Tray, Menu } = require('electron');
const { menubar } = require("menubar");
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mb;
let lastClipboardText;
const iconPath = path.join(__dirname, "icons", "clipboardLight.png");

const handleThemeClick = (menuItem, browserWindow, event) => {
    newTheme = menuItem.label.toLowerCase();
    store.set("config.theme", newTheme);
    nativeTheme.themeSource = newTheme;
}

app.on('ready', () => {
    const tray = new Tray(iconPath);
    tray.setTitle("Fast Clipboard Recover")
	const contextMenu = Menu.buildFromTemplate(
        [
            { 
                label: 'Theme', 
                submenu: [
                    { 
                        label: 'Light', 
                        type: 'radio',
                        checked: true ? store.get('config.theme') == 'light' : false,
                        click: handleThemeClick
                    },
                    { 
                        label: 'Dark', 
                        type: 'radio',
                        checked: true ? store.get('config.theme') == 'dark' : false,
                        click: handleThemeClick
                    }
                ]
            }
	    ]
    );
	tray.setContextMenu(contextMenu);

    mb = menubar({
        app: app,
        index: path.join(__dirname, "src", "index.html"),
        windowPosition: "trayBottomRight",
        tray: tray,
        browserWindow: {
            title: "Fast Clipboard Recover",
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

    // Theme
    nativeTheme.themeSource = store.get('config.theme') || "dark";

    // create shortcut
	globalShortcut.register('CommandOrControl+Shift+X', () => {
        if (mb._isVisible) {
            mb.hideWindow()
        } else {
            mb.showWindow()
        }
    })

    mb.on('ready', () => {
        mb.showWindow()
    });

    mb.on('after-create-window', () => {
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
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})