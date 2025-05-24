// appControl.js
// 进程窗口控制相关

/**
 * 移除当前激活进程（或指定进程）
 * @param {object=} proc - 进程对象，默认当前进程
 */
window.Process_Remove = function(proc) {
    if (!proc && window.Process && window.Process.current) proc = window.Process.current;
    if (!proc) return;
    if (typeof proc.exit === 'function') proc.exit();
    if (window.renderTaskbar) window.renderTaskbar();
};

/**
 * 向进程添加窗口
 * @param {object} proc - 进程对象
 * @param {object} winOptions - 窗口参数（title, icon, content等）
 * @returns {HTMLElement|null} 新窗口
 */
window.Process_AddWindow = function(proc, winOptions) {
    if (!proc || typeof proc.createWindow !== 'function') return null;
    const app = proc.createWindow(winOptions || {});
    if (window.attachAppEvents) window.attachAppEvents(app);
    if (window.renderTaskbar) window.renderTaskbar();
    return app;
};
