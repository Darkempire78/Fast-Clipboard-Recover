const { app, nativeTheme, globalShortcut, clipboard, Tray, Menu, nativeImage, ipcMain, shell, BrowserWindow, dialog } = require('electron');
const { menubar } = require("menubar");
const Store = require('electron-store');
const AutoLaunch = require('auto-launch');
const path = require('path');

const store = new Store();
const appAutoLaunch = new AutoLaunch({
    name: "Fast Clipboard Recover",
    path: app.getPath('exe')
})
appAutoLaunch.isEnabled().then((isEnabled) => store.set('startOnStartup', isEnabled))

let mb;
let lastClipboardText;
let lastClipboardImage;
const iconPath = nativeTheme.shouldUseDarkColors ? path.join(__dirname, "icons", "clipboardLight.png") : path.join(__dirname, "icons", "clipboardDark.png");

app.on('ready', () => {
    const tray = new Tray(iconPath);
    tray.setTitle("Fast Clipboard Recover")
	const contextMenu = Menu.buildFromTemplate(
        [
            
            {
                label: "About",
                click: () => {
                    dialog.showMessageBox({
                        title: "Fast Clipboard Recover - About",
                        message: `A fluent open source application to recover your copy-paste easily.\n\nVersion: ${process.env.npm_package_version}\nGitHub: https://github.com/Darkempire78/Fast-Clipboard-Recover`,
                        icon: path.join(__dirname, "icons", "clipboardDark.png"),
                        buttons: ["GitHub Repository", "OK"]
                    }).then(result => {
                        if (result.response === 0) {
                            shell.openExternal("https://github.com/Darkempire78/Fast-Clipboard-Recover")
                        }
                    });
                }
            },
            {
                type: 'separator'
            },
            {
                label: "Always on top",
                type: "checkbox",
                click: (menuItem, browserWindow, event) => {
                    if (menuItem.checked) {
                        mb.showWindow();
                        mb.window.setAlwaysOnTop(true, 'screen');
                    } else {
                        mb.hideWindow();
                        mb.window.setAlwaysOnTop(false, 'screen');
                    }
                }
            },
            {
                label: "Resizable",
                type: "checkbox",
                click: (menuItem, browserWindow, event) => {
                    if (menuItem.checked) {
                        mb.showWindow();
                        mb.window.setResizable(true)
                    } else {
                        mb.window.setResizable(false)
                        size = mb.window.getSize()
                        store.set("config.width", size[0]);
                        store.set("config.height", size[1]);
                    }
                }
            },
            {
                label: "Shortcuts",
                type: "normal",
                click: (menuItem, browserWindow, event) => {
                    createShortcutManager()
                }
            },
            {
                label: "Position", 
                submenu: [
                    { label: "bottomLeft", type: "radio", checked: store.get("config.position") && store.get("config.position") == "bottomLeft" ? true : false, click: handlePositionClick },
                    { label: "trayLeft", type: "radio", checked: store.get("config.position") == "trayLeft" ? true : false, click: handlePositionClick },
                    { label: "trayBottomLeft", type: "radio", checked: store.get("config.position") == "trayBottomLeft" ? true : false, click: handlePositionClick },
                    { label: "trayRight", type: "radio", checked: store.get("config.position") == "trayRight" ? true : false, click: handlePositionClick },
                    { label: "trayBottomRight", type: "radio", checked: store.get("config.position") == "trayBottomRight" ? true : false, click: handlePositionClick },
                    { label: "trayCenter", type: "radio", checked: store.get("config.position") == "trayCenter" ? true : false, click: handlePositionClick },
                    { label: "trayBottomCenter", type: "radio", checked: store.get("config.position") == "trayBottomCenter" ? true : false, click: handlePositionClick },
                    { label: "topLeft", type: "radio", checked: store.get("config.position") == "topLeft" ? true : false, click: handlePositionClick },
                    { label: "topRight", type: "radio", checked: store.get("config.position") == "topRight" ? true : false, click: handlePositionClick },
                    { label: "bottomRight", type: "radio", checked: store.get("config.position") == "bottomRight" ? true : false, click: handlePositionClick },
                    { label: "topCenter", type: "radio", checked: store.get("config.position") == "topCenter" ? true : false, click: handlePositionClick },
                    { label: "bottomCenter", type: "radio", checked: store.get("config.position") == "bottomCenter" ? true : false, click: handlePositionClick },
                    { label: "leftCenter", type: "radio", checked: store.get("config.position") == "leftCenter" ? true : false, click: handlePositionClick },
                    { label: "rightCenter", type: "radio", checked: store.get("config.position") == "rightCenter" ? true : false, click: handlePositionClick },
                    { label: "center", type: "radio", checked: store.get("config.position") == "center" ? true : false, click: handlePositionClick },
                ]
            },
            { 
                label: "Theme", 
                submenu: [
                    { 
                        label: "Light", 
                        type: "radio",
                        checked: true ? store.get("config.theme") == "light" : false,
                        click: handleThemeClick
                    },
                    { 
                        label: "Dark", 
                        type: "radio",
                        checked: true ? store.get("config.theme") == "dark" : false,
                        click: handleThemeClick
                    }
                ]
            },
            {
                label: 'Open On Startup',
                click: () => {
                    appAutoLaunch.isEnabled().then((isEnabled) => {
                        if (isEnabled) {
                            appAutoLaunch.disable();
                            store.set('startOnStartup', false);
                        } else {
                            appAutoLaunch.enable();
                            store.set('startOnStartup', true);
                        }
                    })
                    .catch((err) => {});
                },
                type: 'checkbox',
                checked: store.get('startOnStartup')
            },
            {
                type: 'separator'
            },
            {
                label: 'Exit',
                role: 'quit'
            }
	    ]
    );
	tray.setContextMenu(contextMenu);

    mb = menubar({
        app: app,
        index: path.join(__dirname, "src", "index.html"),
        tray: tray,
        windowPosition: "bottomLeft",
        tooltip: "Fast Clipboard Recover",
        browserWindow: {
            title: "Fast Clipboard Recover",
            icon: iconPath,
            width: store.get("config.width") ? store.get("config.width") : 450,
            height: store.get("config.height") ? store.get("config.height") : 450,
            resizable: false,
            skipTaskbar: true,
            // transparent: true,
            // frame: false,
            webPreferences: {
                contextIsolation: true,
                enableRemoteModule: false,
                enableRemoteModule: false,
                preload: path.join(__dirname, "src", "preload.js"),
            },
        },
    });

    // Theme
    nativeTheme.themeSource = store.get('config.theme') || "dark";

    // create shortcut
	globalShortcut.register('CommandOrControl+Shift+X', () => {
        if (mb._isVisible) {
            mb.hideWindow();
        } else {
            mb.showWindow();
        }
    })

    mb.on('ready', () => {
        mb.showWindow();
    });

    mb.on('after-create-window', () => {
        // Handle the clipboard
        setInterval(() => {
            const text = clipboard.readText();
            if (text != lastClipboardText && text != "") {
                lastClipboardText = text;
                if (mb.window){
                    mb.window.webContents.send('newClipboardText', text);
                }
            } else {
                const image = clipboard.readImage();
                if (!image.isEmpty()) {
                    imageUrl = image.toDataURL();
                    if (imageUrl != lastClipboardImage) {
                        lastClipboardImage = imageUrl;
                        if (mb.window){
                            mb.window.webContents.send('newClipboardImage', imageUrl);
                        } 
                    }
                } 
            }
        }, 100);
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})

// ipcMain
ipcMain.on('pasteImageInTheClipboard', async (event, content) => {
    image = nativeImage.createFromDataURL(content);
    clipboard.writeImage(image)
});

const handleThemeClick = (menuItem, browserWindow, event) => {
    newTheme = menuItem.label.toLowerCase();
    store.set("config.theme", newTheme);
    nativeTheme.themeSource = newTheme;
}

const handlePositionClick = (menuItem, browserWindow, event) => {
    newPosition = menuItem.label;
    store.set("config.position", newPosition);
    // console.log(mb.positioner)
    // console.log("-----------")
    // console.log(mb)
    // mb.positioner =newPosition
}

function createShortcutManager() {
    shortcutManager = new BrowserWindow({
        title: "Fast Clipboard Recover - Shortcut Manager",
        icon: path.join(__dirname, "icons", "clipboardDark.png"), // there is no dark mode for titlebar
        parent: mb.window,
        modal: true,
        alwaysOnTop: true,
        autoHideMenuBar: true,
        width: 600,
        height: 400,
        minWidth: 400,
        minHeight: 300,
    });
    shortcutManager.loadURL(path.join(__dirname, "src", "shortcutManager.html"))

}