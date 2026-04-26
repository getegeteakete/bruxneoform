(function () {
  'use strict';

  var container = document.getElementById('brux-neoform');
  if (!container) return;

  var formId = container.getAttribute('data-form-id') || 'demo';
  var scriptSrc = document.currentScript ? document.currentScript.src : '';
  var baseUrl = scriptSrc ? scriptSrc.replace('/embed.js', '') : '';

  // iframeを作成
  var iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/form/' + formId + '?embed=1';
  iframe.style.width = '100%';
  iframe.style.minHeight = '600px';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.style.borderRadius = '12px';
  iframe.style.display = 'block';
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('title', 'お問い合わせフォーム');

  container.innerHTML = '';
  container.style.maxWidth = '720px';
  container.style.margin = '0 auto';
  container.appendChild(iframe);

  // 高さ自動調整
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'brux-neoform-resize') {
      iframe.style.height = (event.data.height + 40) + 'px';
    }
  });
})();
