// 判断IE浏览器并跳转到Edge下载页
(function() {
    var ua = navigator.userAgent;
    if (/MSIE|Trident/.test(ua)) {
        window.location.href = 'https://www.microsoft.com/edge';
        return;
    }
    // 检查主流浏览器及版本
    var minSupport = {
        Chrome: 80,
        Firefox: 78,
        Edge: 80,
        Safari: 13,
        Opera: 67
    };
    var matched = ua.match(/(Chrome|Firefox|Edg|Safari|Opera)[\/]([\d.]+)/);
    var ok = false;
    if (matched) {
        var name = matched[1];
        var ver = parseInt(matched[2]);
        if (name === 'Edg') name = 'Edge';
        if (minSupport[name] && ver >= minSupport[name]) ok = true;
    }
    // 查询页面js/css/html文件内容，推断是否有'mozilla'等特征
    // 简化处理：如未通过则提示
    if (!ok) {
        alert('您的浏览器版本过低，推荐使用最新版 Chrome/Edge/Firefox/Safari 浏览本页面。');
    }
})();
window.RunJavaScriptFile = function(filePath, callback) {
    if (!filePath) return;
    const script = document.createElement('script');
    script.src = filePath;
    script.type = 'text/javascript';
    script.onload = () => { if (typeof callback === 'function') callback(); };
    script.onerror = () => { console.error('加载js失败:', filePath); };
    document.head.appendChild(script);
};

/**
 * 动态加载 JS 文件并执行（支持多次调用）
 * @param {string} path - JS 文件路径
 * @param {function=} callback - 加载完成后回调
 */
window.Ahou_Add_JS = function(path, callback) {
    if (!path) return;
    const script = document.createElement('script');
    script.src = path;
    script.type = 'text/javascript';
    script.onload = function() { if (typeof callback === 'function') callback(); };
    script.onerror = function() { console.error('JS 加载失败:', path); };
    document.head.appendChild(script);
};

/**
 * 创建进程并可传递参数
 * @param {string} Pname - 进程名
 * @param {object=} json - 附加参数
 * @returns {object|null} 进程对象
 */
window.Ahou_Creat_Process = function(Pname, json) {
    if (!window.Process) return null;
    const proc = new window.Process(Object.assign({ name: Pname || '进程' }, json||{}));
    if (window.renderTaskbar) window.renderTaskbar();
    return proc;
};