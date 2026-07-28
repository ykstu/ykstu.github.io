/**
 * Ahou System
 * */
"use strict";
const BOOT_COMMANDLINE = {
    "OS_Name":"Ahou System",
    "OS_Kernel":"XXIX",
    "OS_Version":"0",
    "OS_Developer":"YKSD",
}

const BUILD = function () {
        async function to_tag(location) {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = blob(rf(location)).toString();
            document.head.appendChild(script);
        }
        async function to_win(location,name) {
            const blob = await blob(rf(location));
            const url = URL.createObjectURL(blob);
            const module = await import(url);
            URL.revokeObjectURL(url);
            window[name] = module.default || module;
            return window[name];
        }
        async function rf(path) {
            const segments = path.split('/').filter(s => s);
            const fileName = segments.pop();
            let dir = await navigator.storage.getDirectory();
            for (const seg of segments) {
                dir = await dir.getDirectoryHandle(seg.toString());
            }
            const fileHandle = await dir.getFileHandle(fileName.toString());
            return await fileHandle.getFile();
        }
        async function blob(file) {
            return new Blob([file], { type: 'application/javascript' });
        }

}

