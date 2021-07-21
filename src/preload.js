const {
    contextBridge,
    ipcRenderer,
    shell
} = require("electron");


// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => {
            let validChannels = [
                "pasteImageInTheClipboard"
            ];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        receive: (channel, func) => {
            let validChannels = [
                "error",
                "newClipboardText",
                "newClipboardImage",
                "setCustomTheme"
            ];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (event, args) => func(args));
            }
        },
        shell: (link) => {
            shell.openExternal(link);
        }
    }
);

window.addEventListener('DOMContentLoaded', () => {})