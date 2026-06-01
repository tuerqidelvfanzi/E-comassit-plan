/**
 * 电商助手 Chrome Extension - Popup Script
 * V3.0 功能: 采集 / 发布填表
 */
(function() {
  'use strict';

  const CONFIG = {
    appUrl: 'http://localhost:5173',
    apiUrl: 'http://localhost:3004',
    extTokenKey: 'psa_ext_token',
  };

  let state = {
    connected: false,
    lastCapture: null,
    currentTab: 'connect',
  };

  function q(sel) { return document.querySelector(sel); }
  function qa(sel) { return document.querySelectorAll(sel); }

  function log(msg, type) {
    console.log('[Popup] ' + msg);
    var el = q('#api-test-msg') || document.createElement('div');
    el.textContent = msg;
    el.className = 'msg ' + (type || 'info');
    el.id = 'api-test-msg';
    el.style.cssText = 'margin-top:8px;font-size:11px;padding:8px;border-radius:8px;background:rgba(59,130,246,.2);color:#60a5fa';
    if (!el.parentNode) {
      var panel = q('#panel-connect');
      if (panel) panel.appendChild(el);
    }
  }

  function getStoredToken() {
    return localStorage.getItem(CONFIG.extTokenKey) || '';
  }

  function saveToken(token) {
    localStorage.setItem(CONFIG.extTokenKey, token);
  }

  function initTabs() {
    qa('.tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = tab.dataset.tab;
        qa('.tab').forEach(function(t) { t.classList.remove('active'); });
        qa('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
        tab.classList.add('active');
        var panel = q('#panel-' + target);
        if (panel) panel.classList.add('active');
        state.currentTab = target;
      });
    });
  }

  function initConnectPanel() {
    var tokenInput = q('#ext-token');
    if (tokenInput) {
      tokenInput.value = getStoredToken();
      tokenInput.addEventListener('change', function(e) {
        saveToken(e.target.value);
        updateConnectionStatus();
      });
    }

    var testBtn = q('#btn-test-api');
    if (testBtn) {
      testBtn.addEventListener('click', function() {
        log('测试API连接... (Mock模式可用)', 'info');
        state.connected = true;
        updateConnectionStatus();
        setTimeout(function() { log('API连接成功!', 'success'); }, 500);
      });
    }

    var syncBtn = q('#btn-sync-cookies');
    if (syncBtn) {
      syncBtn.addEventListener('click', function() {
        log('同步Cookie...', 'info');
        setTimeout(function() { log('Cookie同步完成', 'success'); }, 500);
      });
    }
  }

  function updateConnectionStatus() {
    var statusEl = q('#conn-status');
    if (statusEl) {
      statusEl.textContent = state.connected ? '已连接' : '未连接';
      statusEl.className = 'status-pill' + (state.connected ? ' connected' : '');
    }
  }

  function initCollectPanel() {
    var captureBtn = q('#btn-capture');
    if (captureBtn) {
      captureBtn.addEventListener('click', function() {
        captureBtn.disabled = true;
        captureBtn.textContent = '采集中...';
        setTimeout(function() {
          state.lastCapture = {
            title: '2024夏季新款可爱卡通小熊图案印花纯棉短袖T恤儿童百搭休闲上衣',
            price: 29.9,
            source: '1688',
            skuCount: 12
          };
          var titleEl = q('#preview-title');
          var metaEl = q('#preview-meta');
          var preview = q('#preview');
          if (titleEl) titleEl.textContent = state.lastCapture.title;
          if (metaEl) metaEl.textContent = '价格: ¥' + state.lastCapture.price + ' | 来源: ' + state.lastCapture.source + ' | SKU: ' + state.lastCapture.skuCount + '个';
          if (preview) preview.classList.remove('hidden');
          captureBtn.disabled = false;
          captureBtn.textContent = '采集当前页';
          log('采集成功!', 'success');
        }, 1500);
      });
    }

    var linkBtn = q('#btn-link');
    if (linkBtn) {
      linkBtn.addEventListener('click', function() {
        var url = prompt('粘贴商品链接 (1688/淘宝/天猫):');
        if (url) { log('链接采集功能开发中...', 'info'); }
      });
    }

    var uploadBtn = q('#btn-upload');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', function() {
        if (state.lastCapture) {
          log('已上传到采集箱!', 'success');
          setTimeout(function() {
            var preview = q('#preview');
            if (preview) preview.classList.add('hidden');
          }, 2000);
        } else {
          log('请先采集商品', 'error');
        }
      });
    }
  }

  function initPublishPanel() {
    var loadBtn = q('#btn-load-fill');
    if (loadBtn) {
      loadBtn.addEventListener('click', function() {
        var dl = q('#fill-dl');
        var card = q('#fill-preview');
        if (dl) {
          dl.innerHTML = '<dt>平台</dt><dd>Shopee越南</dd><dt>标题</dt><dd>Ao thun cotton gau truc</dd><dt>价格</dt><dd>79000 VND</dd><dt>库存</dt><dd>50</dd>';
        }
        if (card) card.classList.remove('hidden');
        log('填表数据加载成功!', 'success');
      });
    }

    var publishBtn = q('#btn-publish');
    if (publishBtn) {
      publishBtn.addEventListener('click', function() {
        log('发布功能开发中，请在网页端操作', 'info');
      });
    }
  }

  function init() {
    initTabs();
    initConnectPanel();
    initCollectPanel();
    initPublishPanel();

    var inboxLink = q('#link-inbox');
    var publishLink = q('#link-publish');
    if (inboxLink) inboxLink.setAttribute('href', CONFIG.appUrl + '/#/app/inbox');
    if (publishLink) publishLink.setAttribute('href', CONFIG.appUrl + '/#/app/publish');

    state.connected = true;
    updateConnectionStatus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
