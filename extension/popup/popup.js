/**
 * 电商助手 Chrome Extension - Popup Script v3.1
 * 功能: 采集 / 发布填表 / API对接
 */
(function() {
  'use strict';

  var CONFIG = {
    appUrl: localStorage.getItem('ecomassist_app_url') || 'http://localhost:5173',
    apiUrl: localStorage.getItem('ecomassist_api_url') || 'http://127.0.0.1:8080',
    extTokenKey: 'ecomassist_ext_token'
  };

  var state = {
    connected: false,
    lastCapture: null,
    currentTab: 'connect'
  };

  function log(msg, type) {
    console.log('[Popup] ' + msg);
    var el = document.getElementById('api-test-msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'api-test-msg';
      var panel = document.getElementById('panel-connect');
      if (panel) panel.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'msg ' + (type || 'info');
  }

  function getToken() { return localStorage.getItem(CONFIG.extTokenKey) || ''; }
  function saveToken(t) { localStorage.setItem(CONFIG.extTokenKey, t); }

  function initTabs() {
    document.querySelectorAll('.tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = tab.dataset.tab;
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
        document.querySelectorAll('.tab-panel').forEach(function(p) { p.hidden = true; p.classList.remove('active'); });
        tab.classList.add('active');
        var panel = document.getElementById('panel-' + target);
        if (panel) { panel.hidden = false; panel.classList.add('active'); }
        state.currentTab = target;
      });
    });
  }

  function updateStatus() {
    var el = document.getElementById('conn-status');
    if (el) {
      el.textContent = state.connected ? '已连接' : '未连接';
      el.className = 'status-pill' + (state.connected ? ' connected' : '');
    }
  }

  function initConnectPanel() {
    var tokenInput = document.getElementById('ext-token');
    if (tokenInput) {
      tokenInput.value = getToken();
      tokenInput.addEventListener('change', function(e) {
        saveToken(e.target.value);
        updateStatus();
      });
    }

    var testBtn = document.getElementById('btn-test-api');
    if (testBtn) {
      testBtn.addEventListener('click', async function() {
        log('测试API连接...');
        try {
          var res = await fetch(CONFIG.apiUrl + '/api/v1/health');
          if (res.ok) {
            state.connected = true;
            updateStatus();
            log('API连接成功!', 'success');
          } else {
            log('API返回错误: ' + res.status);
          }
        } catch(e) {
          log('API连接失败: ' + e.message, 'error');
        }
      });
    }

    var syncBtn = document.getElementById('btn-sync-cookies');
    if (syncBtn) {
      syncBtn.addEventListener('click', async function() {
        log('同步Cookie...');
        try {
          var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]) {
            chrome.cookies.getAll({ domain: new URL(tabs[0].url).hostname }, function(cookies) {
              log('获取到 ' + cookies.length + ' 个Cookie');
            });
          }
        } catch(e) {
          log('Cookie同步失败');
        }
      });
    }
  }

  function initCollectPanel() {
    var captureBtn = document.getElementById('btn-capture');
    if (captureBtn) {
      captureBtn.addEventListener('click', async function() {
        captureBtn.disabled = true;
        captureBtn.textContent = '采集中...';
        try {
          var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          var result = await chrome.tabs.sendMessage(tabs[0].id, { type: 'CAPTURE_PAGE' });
          if (result && result.success) {
            state.lastCapture = result.data;
            showPreview(result.data);
            log('采集成功! 平台: ' + result.platform, 'success');
          } else {
            log('采集失败: ' + (result?.error || '未知错误'), 'error');
          }
        } catch(e) {
          log('采集失败: 请在商品详情页使用', 'error');
        }
        captureBtn.disabled = false;
        captureBtn.textContent = '采集当前页';
      });
    }

    var linkBtn = document.getElementById('btn-link');
    if (linkBtn) {
      linkBtn.addEventListener('click', function() {
        var url = prompt('粘贴商品链接 (1688/淘宝/天猫):');
        if (url) { log('链接采集开发中...', 'info'); }
      });
    }

    var uploadBtn = document.getElementById('btn-upload');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', async function() {
        if (!state.lastCapture) {
          log('请先采集商品', 'error');
          return;
        }
        uploadBtn.disabled = true;
        uploadBtn.textContent = '上传中...';
        try {
          var token = getToken();
          var res = await fetch(CONFIG.apiUrl + '/api/v1/collect-jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Extension-Token': token },
            body: JSON.stringify({ payload: state.lastCapture })
          });
          if (res.ok) {
            log('上传成功!', 'success');
            document.getElementById('preview')?.classList.add('hidden');
          } else {
            log('上传失败: ' + res.status, 'error');
          }
        } catch(e) {
          log('上传失败: ' + e.message, 'error');
        }
        uploadBtn.disabled = false;
        uploadBtn.textContent = '上传到采集箱';
      });
    }
  }

  function showPreview(data) {
    var preview = document.getElementById('preview');
    var titleEl = document.getElementById('preview-title');
    var metaEl = document.getElementById('preview-meta');
    if (preview) preview.classList.remove('hidden');
    if (titleEl) titleEl.textContent = (data.title || '').substring(0, 50);
    if (metaEl) metaEl.textContent = '价格: ¥' + (data.price || 0) + ' | 图片: ' + (data.images?.length || 0) + '张 | SKU: ' + (data.skuCount || 0) + '个';
  }

  function initPublishPanel() {
    var loadBtn = document.getElementById('btn-load-fill');
    if (loadBtn) {
      loadBtn.addEventListener('click', async function() {
        var token = getToken();
        var platform = document.getElementById('platform')?.value || 'shopee';
        try {
          var res = await fetch(CONFIG.apiUrl + '/api/v1/extension/publish-fill?platform=' + platform, {
            headers: { 'X-Extension-Token': token }
          });
          if (res.ok) {
            var json = await res.json();
            showFillPreview(json.data || {});
            log('填表数据加载成功!', 'success');
          } else {
            log('加载失败: ' + res.status, 'error');
          }
        } catch(e) {
          log('加载失败: ' + e.message, 'error');
        }
      });
    }

    var publishBtn = document.getElementById('btn-publish');
    if (publishBtn) {
      publishBtn.addEventListener('click', async function() {
        try {
          var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'FILL_FORM' });
            log('已发送填表指令', 'success');
          }
        } catch(e) {
          log('发送失败', 'error');
        }
      });
    }
  }

  function showFillPreview(data) {
    var card = document.getElementById('fill-preview');
    var dl = document.getElementById('fill-dl');
    if (card) card.classList.remove('hidden');
    if (dl) {
      var html = '';
      for (var key in data) {
        var val = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key];
        html += '<dt>' + key + '</dt><dd>' + val + '</dd>';
      }
      dl.innerHTML = html || '<dt>无数据</dt><dd>-</dd>';
    }
  }

  // 主题面板
  var currentTheme = 'trello-premium';

  function initThemePanel() {
    // 加载当前主题
    chrome.storage.local.get('psa_theme_data', function(result) {
      if (result.psa_theme_data && result.psa_theme_data.presetId) {
        currentTheme = result.psa_theme_data.presetId;
        updateThemeUI();
      }
    });

    // 主题卡片点击
    document.querySelectorAll('.theme-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var themeId = card.dataset.theme;
        if (themeId) {
          selectTheme(themeId);
        }
      });
    });
  }

  function selectTheme(themeId) {
    currentTheme = themeId;
    updateThemeUI();

    // 保存到 storage
    var themeData = {
      presetId: themeId,
      timestamp: Date.now()
    };
    chrome.storage.local.set({ psa_theme_data: themeData }, function() {
      // 通知 Web 端
      chrome.runtime.sendMessage({
        type: 'THEME_UPDATED',
        presetId: themeId,
        colorOverrides: null
      });

      // 通知所有 content scripts
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'THEME_SYNC',
            themeData: themeData
          }).catch(function() {});
        });
      });

      var msgEl = document.getElementById('theme-msg');
      if (msgEl) {
        var names = {
          'trello-premium': 'Trello 高级风',
          'linear-dark': 'Linear 极客风',
          'monday-vibrant': 'Monday 活力风',
          'enterprise-classic': '企业商务风'
        };
        msgEl.textContent = '已切换到 ' + (names[themeId] || themeId);
        msgEl.className = 'msg success';
      }
    });
  }

  function updateThemeUI() {
    document.querySelectorAll('.theme-card').forEach(function(card) {
      if (card.dataset.theme === currentTheme) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  function init() {
    initTabs();
    initConnectPanel();
    initCollectPanel();
    initPublishPanel();
    initThemePanel();

    var inboxLink = document.getElementById('link-inbox');
    var publishLink = document.getElementById('link-publish');
    if (inboxLink) inboxLink.href = CONFIG.appUrl + '/#/app/inbox';
    if (publishLink) publishLink.href = CONFIG.appUrl + '/#/app/publish';

    // 自动检测连接状态
    setTimeout(async function() {
      try {
        var res = await fetch(CONFIG.apiUrl + '/api/v1/health');
        state.connected = res.ok;
      } catch(e) {
        state.connected = false;
      }
      updateStatus();
    }, 500);
  }

  document.addEventListener('DOMContentLoaded', init);

  // 监听来自content的消息
  chrome.runtime.onMessage.addListener(function(msg) {
    if (msg.type === 'CAPTURE_RESULT') {
      state.lastCapture = msg.data;
      showPreview(msg.data);
      log('采集完成!', 'success');
    }
  });
})();
