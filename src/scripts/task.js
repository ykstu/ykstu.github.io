/**
 * 进程管理器，支持唯一id、窗口创建、事件分发。
 */
class Process {
    static pid = 0;
    constructor(options = {}) {
        this.id = ++Process.pid;
        this.name = options.name || 'Process-' + this.id;
        this.windows = [];
        window[`__proc_${this.id}`] = this;
    }
    /**
     * 创建窗口
     * @param {object} appOptions - 窗口参数
     * @returns {HTMLElement} app元素
     */
    createWindow(appOptions = {}) {
        const uuid = appOptions.uuid || crypto.randomUUID?.() || Math.random().toString(36).slice(2);
        appOptions.uuid = uuid;
        const existingApp = this.windows.find(app => app.dataset.uuid === uuid);
        if (existingApp) return existingApp;
        const app = document.createElement('app');
        app.dataset.uuid = uuid;
        app.dataset.processName = this.name;
        app.setAttribute('data-app', JSON.stringify(appOptions));
        if (appOptions.style) Object.assign(app.style, appOptions.style);
        app.innerHTML = appOptions.innerHTML || `
            <app-head>
                <img src="${appOptions.icon || ''}" alt="${this.name}">
                <span>${appOptions.title || uuid}</span>
                <control><min></min><max></max><exit></exit></control>
            </app-head>
            <app-body>${appOptions.content || ''}</app-body>
        `;
        document.querySelector('main').appendChild(app);
        this.windows.push(app);
        window.attachAppEvents?.(app);
        if (typeof appOptions.onCreate === 'function') appOptions.onCreate(app);
        app.dispatchEvent(new CustomEvent('created', { detail: { process: this, app } }));
        return app;
    }
}
window.Process = Process;
window.attachAppEvents = function(app) {
    if (window.WindowApp && !app.WindowAppInstance) app.WindowAppInstance = new window.WindowApp(app);
    app.dispatchEvent(new CustomEvent('created', { detail: { app } }));
};
const main = document.querySelector('main');
if (main && window.MutationObserver) {
    new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(node => {
        if (node.tagName === 'APP') window.attachAppEvents(node);
    }))).observe(main, { childList: true });
}
