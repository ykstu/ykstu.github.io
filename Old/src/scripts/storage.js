/**
 * ahou_cookie() - 以 JSON 形式显示所有 Cookie 信息（含过期、SameSite、Secure等）
 * 支持读取、设置、删除 Cookie
 */
window.ahou_cookie = function(action, key, value, options) {
    // 读取所有 cookie
    if (!action || action === 'get') {
        const cookies = document.cookie.split(';').map(c => c.trim()).filter(Boolean).map(c => {
            const [k, ...v] = c.split('=');
            return { key: decodeURIComponent(k), value: decodeURIComponent(v.join('=')) };
        });
        return cookies;
    }
    // 设置 cookie
    if (action === 'set' && key) {
        let cookieStr = encodeURIComponent(key) + '=' + encodeURIComponent(value || '');
        if (options) {
            if (options.expires) cookieStr += ';expires=' + options.expires;
            if (options.path) cookieStr += ';path=' + options.path;
            if (options.domain) cookieStr += ';domain=' + options.domain;
            if (options.SameSite) cookieStr += ';SameSite=' + options.SameSite;
            if (options.Secure) cookieStr += ';Secure';
        }
        document.cookie = cookieStr;
        return true;
    }
    // 删除 cookie
    if (action === 'remove' && key) {
        document.cookie = encodeURIComponent(key) + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        return true;
    }
    return false;
};

/**
 * ahou_webstorage(type) - 以 JSON 形式显示 localStorage/sessionStorage
 * type: 'local' | 'session'
 */
window.ahou_webstorage = function(type) {
    const store = type === 'session' ? sessionStorage : localStorage;
    const result = {};
    for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        result[k] = store.getItem(k);
    }
    return result;
};

/**
 * ahou_indexeddb() - 显示所有仓库（数据库）和内容（异步，返回 Promise）
 * 支持读取所有数据库、对象仓库及其内容
 */
window.ahou_indexeddb = async function() {
    if (!window.indexedDB) return { error: 'indexedDB not supported' };
    // 仅能列举已知数据库名，无法直接遍历所有数据库（需用 window.indexedDB.databases）
    if (!indexedDB.databases) return { error: 'window.indexedDB.databases() not supported' };
    const dbs = await indexedDB.databases();
    const result = {};
    for (const dbinfo of dbs) {
        const dbname = dbinfo.name;
        if (!dbname) continue;
        result[dbname] = {};
        try {
            const db = await new Promise((resolve, reject) => {
                const req = indexedDB.open(dbname);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            for (const storeName of db.objectStoreNames) {
                result[dbname][storeName] = [];
                await new Promise((resolve, reject) => {
                    const tx = db.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const req = store.openCursor();
                    req.onsuccess = e => {
                        const cursor = e.target.result;
                        if (cursor) {
                            result[dbname][storeName].push(cursor.value);
                            cursor.continue();
                        } else {
                            resolve();
                        }
                    };
                    req.onerror = reject;
                });
            }
            db.close();
        } catch (e) {
            result[dbname]._error = e.message;
        }
    }
    return result;
};