// ==UserScript==
// @name        bilibili Player NO SSL
// @namespace   https://github.com/tiansh
// @description 使用 HTTP 页面显示 bilibili 的播放器而不是使用 HTTPS 页面，适用于一些因故不能访问 HTTPS 的情况。
// @updateURL   https://tiansh.github.io/us-blbl/bilibili_player_no_ssl/bilibili_player_no_ssl.meta.js
// @downloadURL https://tiansh.github.io/us-blbl/bilibili_player_no_ssl/bilibili_player_no_ssl.user.js
// @include     /^http://([^/]*\.)?bilibili\.com(/.*)?$/
// @include     /^http://([^/]*\.)?bilibili\.tv(/.*)?$/
// @include     /^http://([^/]*\.)?bilibili\.kankanews\.com(/.*)?$/
// @version     1.5
// @copyright   MIT License
// @author      田生
// @run-at      document-start
// @grant       unsafeWindow
// ==/UserScript==

// 参数：第一个参数为对应的函数名（String，如"ping"、"getCid"）
//      后面的若干个参数为传给这个函数的参数
var rbb = function () {
  if (!unsafeWindow.replaceBilibiliBofqi) unsafeWindow.replaceBilibiliBofqi = [];
  unsafeWindow.replaceBilibiliBofqi.push(Array.apply(Array, arguments));
  return unsafeWindow.replaceBilibiliBofqi.constructor.name !== 'Array';
};

var bilibili = {
  'url': {
    'av': [
      'http://www.bilibili.tv/video/av',
      'http://bilibili.kankanews.com/video/av',
      'http://acg.tv/av',
    ],
  }
};

var showStaticPlayer = function (aid, cid) {
  document.querySelector('#bofqi').innerHTML = [
    '<embed height="482" width="950" class="player" ',
      'allowFullScreenInteractive="true" ',
      'pluginspage="http://www.adobe.com/shockwave/download/',
        'download.cgi?P1_Prod_Version=ShockwaveFlash" ',
      'AllowScriptAccess="always" rel="noreferrer" ',
      'flashvars="cid=', cid, '&aid=', aid, '" ',
      'src="http://static.hdslb.com/play.swf" ',
      'type="application/x-shockwave-flash" ',
      'allowfullscreen="true" quality="high" wmode="window" />'
  ].join('');
};

// 显示链接
var addLink = (function () {
  var noSSL = null;
  var init = function () {
    var d = document.createElement('div');
    d.innerHTML = ['<div id="bilibili-player-no-ssl">',
      '<a href="javascript:void(0);" target="_blank"></a>',
    '</div>'].join('');
    document.querySelector('.alist').appendChild(d.firstChild);
    noSSL = document.querySelector('#bilibili-player-no-ssl a');
  }
  return function (href, innerHTML) {
    if (!noSSL) init();
    var a = document.createElement('a'); a.href = href;
    if (noSSL.href !== a.href) noSSL.href = href;
    if (noSSL.innerHTML !== innerHTML) noSSL.innerHTML = innerHTML;
  };
}());

// 从URL中截取aid(av), pid号
var videoPage = function (href, nullpage) {
  var aid, pid;
  if (typeof href !== 'string') return null;
  if (!bilibili.url.av.map(function (h) { return href.indexOf(h) === 0; })
    .reduce(function (x, y) { return x || y; })) return null;
  if (!(aid = Number(href.replace(/^[^#]*av(\d+).*$/, '$1')))) return null;
  pid = Number(href.replace(/^[^#]*av\d+\/index_(\d+)\.html(\?.*)?(#.*)?$/, '$1')) || null;
  if (!nullpage && pid === null) pid = 1;
  return { 'aid': aid, 'pid': pid };
};

// 获取当前cid
var getCid = function (callback) {
  var cid = null;
  try {
    cid = Number(
      document.querySelector('#bofqi iframe').src
      .match(/cid=(\d+)/)[1]);
  } catch (e) { }
  if (!cid) try {
    cid = Number(
      document.querySelector('#bofqi embed').getAttribute('flashvars')
      .match(/cid=(\d+)/)[1]);
  } catch (e) { }
  setTimeout(function () { callback(cid || undefined); }, 0);
};

// 主程序
var mina = function () {
  var prefix = 'https://secure.bilibili.tv/secure,';
  var id = videoPage(location.href);
  getCid(function (cid) {
    if (cid)
      addLink('http://static.hdslb.com/play.swf?aid=' + id.aid + '&cid=' + cid, '非加密链接播放器');
  });
};

document.addEventListener('DOMContentLoaded', mina);
rbb('replaced', mina);
