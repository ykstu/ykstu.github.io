/**
 * 创建一个示例窗口（app）
 * @param {Object} options - 可选参数：title, icon, content
 * @returns {HTMLElement} 新建的app元素
 */
window.createExampleApp = function(options = {}) {
    const app = document.createElement('app');
    app.innerHTML = `
        <app-head>
            <img src="${options.icon || '/src/assets/images/icon.svg'}" alt>
            <span>${options.title || '示例窗口'}</span>
            <control>
                <min></min>
                <max></max>
                <exit></exit>
            </control>
        </app-head>
        <app-body style="padding:2em 1.5em;min-width:320px;min-height:120px;">
            ${options.content || '<p>这是一个通过 example.js 创建的窗口。</p>'}
        </app-body>
    `;
    document.querySelector('main').appendChild(app);
    if (window.attachAppEvents) window.attachAppEvents(app);
    if (window.renderTaskbar) window.renderTaskbar();
    return app;
};

window.createExampleApp({ title: 'Hello', icon: '/src/assets/images/icon.svg', content: '<b>内容</b>' });

