const { app, nativeTheme, globalShortcut, clipboard, Tray, Menu, nativeImage, ipcMain } = require('electron');
const { menubar } = require("menubar");
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mb;
let lastClipboardText;
let lastClipboardImage;
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
                        mb.hideWindow();
                        mb.window.setResizable(false)
                        size = mb.window.getSize()
                        store.set("config.width", size[0]);
                        store.set("config.height", size[1]);
                    }
                }
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
            width: store.get("config.width") ? store.get("config.width") : 450,
            height: store.get("config.height") ? store.get("config.height") : 450,
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