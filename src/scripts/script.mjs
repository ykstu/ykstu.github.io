//         __                     _____           _       __ 
//        / /___ __   ______ _   / ___/__________(_)___  / /_
//   __  / / __ `/ | / / __ `/   \__ \/ ___/ ___/ / __ \/ __/
//  / /_/ / /_/ /| |/ / /_/ /   ___/ / /__/ /  / / /_/ / /_  
//  \____/\__,_/ |___/\__,_/   /____/\___/_/  /_/ .___/\__/  
//                                           /_/           
"use strict"
class init{

}

/**
 * 初始化全局配置到 window.__APP_CONFIG__，供各模块读取。
 * @type {object}
 */
window.__APP_CONFIG__ = {
    MIN_WIDTH: 500,
    MIN_HEIGHT: 150,
    EDGE_SIZE: 20,
    IS_PROCESS: true
};

// 加载configs/const.json到window.__APP_CONST__，供全局读取。
fetch('./src/configs/const.json').then(r=>r.json()).then(cfg=>{window.__APP_CONST__=cfg;});

// header右侧时间显示
function updateHeaderTime() {
    const el = document.getElementById('header-time');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
}
setInterval(updateHeaderTime, 1000);
updateHeaderTime();

/**
 * 动态注入全局样式，保证所有后创建的元素（包括预览框、窗口等）都能应用样式。
 * @param {string} cssText - 需要注入的CSS内容
 */
function ensureGlobalStyle(cssText) {
    if (!document.querySelector('style[data-global-style]')) {
        const style = document.createElement('style');
        style.setAttribute('data-global-style', 'true');
        style.textContent = cssText;
        document.head.appendChild(style);
    }
}
// 保证resize预览框和move预览框样式全局可用
ensureGlobalStyle(`
.resize-preview-box, .move-preview-box {
    pointer-events: none;
    border: 2px dashed #2196f3;
    background: rgba(33,150,243,0.08);
    z-index: 99999;
    position: fixed;
    transition: all 0.15s cubic-bezier(.4,2,.6,1);
    display: none;
}
`);

// 确保主样式加载
const styleHref = './src/styles/style.css';
if (!Array.from(document.styleSheets).some(s => s.href && s.href.includes('style.css'))) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = styleHref;
    document.head.appendChild(link);
}

// 新建一个 app 显示所有进程和窗口
function showProcessManager() {
    if (document.getElementById('process-manager-app')) return;
    let html = '<h3>进程与窗口管理</h3><ul style="padding-left:1em;">';
    if (!window.Process || Process.pid === 0) {
        html += '<li>暂无进程</li>';
    } else {
        for (let i = 1; i <= Process.pid; i++) {
            const proc = window[`__proc_${i}`];
            if (!proc) continue;
            html += `<li>进程#${proc.id} - ${proc.name}<ul>`;
            proc.windows.forEach((app, idx) => {
                const title = app.querySelector('app-head span')?.textContent || '窗口'+(idx+1);
                html += `<li>窗口：${title}</li>`;
            });
            html += '</ul></li>';
        }
    }
    html += '</ul>';
    const app = document.createElement('app');
    app.id = 'process-manager-app';
    app.innerHTML = `
        <app-head>
            <img src="/src/assets/images/icon.svg" alt>
            <span>进程管理器</span>
            <control>
                <min></min>
                <max></max>
                <exit></exit>
            </control>
        </app-head>
        <app-body style="overflow:auto;max-height:60vh;">${html}</app-body>
    `;
    document.querySelector('main').appendChild(app);
    if (window.WindowApp) new window.WindowApp(app);
}

// header左侧窗口按钮增加“进程管理器”入口
const showAppsBtn = document.getElementById('show-apps-btn');
if (showAppsBtn) {
    showAppsBtn.onclick = function() {
        const apps = Array.from(document.querySelectorAll('app'));
        const list = apps.map((app, i) => {
            const title = app.querySelector('app-head span')?.textContent || '窗口'+(i+1);
            return `<li data-idx="${i}">${title}</li>`;
        }).join('');
        let panel = document.getElementById('app-list-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'app-list-panel';
            panel.style.position = 'fixed';
            panel.style.left = '16px';
            panel.style.top = '48px';
            panel.style.background = '#fff';
            panel.style.color = '#222';
            panel.style.border = '1px solid #2196f3';
            panel.style.borderRadius = '8px';
            panel.style.zIndex = 9999;
            panel.style.minWidth = '120px';
            panel.style.boxShadow = '0 2px 8px #0002';
            panel.style.padding = '0.5em 1em';
            panel.innerHTML = `<ul style='margin:0;padding:0;list-style:none;'>${list}</ul><hr><button id='show-proc-mgr-btn'>进程管理器</button>`;
            document.body.appendChild(panel);
        } else {
            panel.innerHTML = `<ul style='margin:0;padding:0;list-style:none;'>${list}</ul><hr><button id='show-proc-mgr-btn'>进程管理器</button>`;
            panel.style.display = 'block';
        }
        panel.onclick = function(e) {
            if (e.target.id === 'show-proc-mgr-btn') {
                showProcessManager();
                panel.style.display = 'none';
                return;
            }
            const li = e.target.closest('li');
            if (!li) return;
            const idx = +li.dataset.idx;
            const app = apps[idx];
            if (app) {
                if (window.WindowApp && app.WindowAppInstance) app.WindowAppInstance.bringToFront();
                app.focus();
            }
            panel.style.display = 'none';
        };
        document.addEventListener('mousedown', function hidePanel(ev) {
            if (!panel.contains(ev.target) && ev.target !== showAppsBtn) {
                panel.style.display = 'none';
                document.removeEventListener('mousedown', hidePanel);
            }
        }, { capture: true }); // 增加 capture:true，防止冒泡冲突
    };
}

// 全局变量：是否允许开发者工具
window.ARE_DEVTOOLS_ENABLE = true;

// 反复debbuger防止devtools被断点修改
if (!window.ARE_DEVTOOLS_ENABLE) {
    setInterval(() => { debugger; }, 500);
    window.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
    window.addEventListener('contextmenu', function(e) {
        if (!e.target.closest('.window-context-menu')) {
            e.preventDefault();
            return false;
        }
    }, true);
}

// 新建进程窗口按钮修复
if (!window.createDemoProcess) {
    window.createDemoProcess = function() {
        if (!window.Process) return;
        const proc = new window.Process({ name: 'Demo' });
        const app = proc.createWindow({
            title: '新进程窗口',
            icon: '/src/assets/images/icon.svg',
            content: '<p>这是一个新建的进程窗口。</p>'
        });
        if (window.attachAppEvents) window.attachAppEvents(app);
        if (window.renderTaskbar) window.renderTaskbar();
    };
}
const createBtn = document.getElementById('create-process-btn');
if (createBtn) {
    createBtn.onclick = function() {
        if (window.createDemoProcess) window.createDemoProcess();
    };
}

// ahou-icon展位修正
const ahouIcons = document.querySelectorAll('ahou-icon');
ahouIcons.forEach(icon => {
    if (!icon.innerHTML.trim()) {
        icon.innerHTML = '<span class="ahou-icon-inner">A</span>';
    }
});

// 任务栏窗口列表渲染
function renderTaskbar() {
    const bar = document.getElementById('taskbar');
    if (!bar) return;
    const apps = Array.from(document.querySelectorAll('app'));
    bar.innerHTML = '';
    apps.forEach((app, i) => {
        const title = app.querySelector('app-head span')?.textContent || '窗口'+(i+1);
        const btn = document.createElement('button');
        btn.textContent = title;
        btn.style.marginRight = '8px';
        btn.onclick = () => {
            if (window.WindowApp && app.WindowAppInstance) app.WindowAppInstance.bringToFront();
            app.style.display = '';
            app.focus();
        };
        bar.appendChild(btn);
    });
}
window.renderTaskbar = renderTaskbar;
if (main && window.MutationObserver) {
    new MutationObserver(renderTaskbar).observe(main, { childList: true, subtree: true });
}
document.addEventListener('DOMContentLoaded', renderTaskbar);

// 引入 dock.js 增强 Dock 动画与交互
const dockScript = document.createElement('script');
dockScript.src = './src/scripts/dock.js';
dockScript.type = 'text/javascript';
document.head.appendChild(dockScript);