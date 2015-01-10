// ==UserScript==
// @name        Bilibili Show Hidden Bangumi
// @namespace   https://github.com/tiansh
// @description 修正哔哩哔哩新番二次元视频列表页面，显示隐藏的视频。注意，这些链接会显示404，所以请配合恢复播放器的相关脚本使用。
// @include     http://www.bilibili.com/video/bangumi-two-*.html
// @include     http://www.bilibili.tv/video/bangumi-two-*.html
// @include     http://bilibili.kankanews.com/video/bangumi-two-*.html
// @version     2.51
// @updateURL   https://tiansh.github.io/us-blbl/bilibili_show_hidden_bangumi/bilibili_show_hidden_bangumi.meta.js
// @downloadURL https://tiansh.github.io/us-blbl/bilibili_show_hidden_bangumi/bilibili_show_hidden_bangumi.user.js
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @copyright   GNU GPL v3 or CC BY-SA 4.0
// @author      田生
// @run-at      document-start
// ==/UserScript==

// 修正新番列表中部分视频不显示的问题
(function fixBangumiTwoList() {

  var page = (function () {
    var r = location.href.match(/http:\/\/[^\/]*\/video\/bangumi-two-(\d+).html/);
    return r && r[1] && Number(r[1]);
  }());
  if (!page) return;

  var bilibili = {
    'url': {
      'host': [
        'www.bilibili.com',
        'bilibili.kankanews.com',
        'www.bilibili.tv',
        'www.bilibili.cn',
      ],
    },
    'host': location.host,
  };
  if (bilibili.url.host.indexOf(bilibili.host) === -1)
    bilibili.host = bilibili.url.host[0];

  var loaded = !!document.body, data = null;

  // 将数字转换成以万为单位计数的形式
  // http://static.hdslb.com/js/base.core.v2.js
  var formatFriendlyNumber = function (b) {
    if ('number' === typeof b) b = String(b);
    if (!(0 <= b.indexOf("\u4e07") || 0 <= b.indexOf(","))) {
      return (b = parseInt(b)) ? 10000 <= b && (b = (b / 10000).toFixed(1) + "\u4e07") : b = "--", b
    }
  };
  // 转义XML字符
  var xmlEscape = function (s) {
    return String(s).replace(/./g, function (c) { return '&#' + c.charCodeAt(0) + ';'; });
  };
  var xmlUnescape = function (s) {
    var d = document.createElement('div');
    d.innerHTML = s;
    return d.textContent;
  };

  // 显示新番列表
  var showList = function () {
    GM_addStyle('.video_list ul.vd_list { visibility: visible; }')
  };

  // 将获取的数据添加到网页上
  var addList = function () {
    var i;
    var ul = document.createElement('ul');
    ul.className = 'vd_list';
    var listtype = document.querySelector('.vd_list li').className;
    data.forEach(function (video) {
      var c = document.createElement('ul');
      c.innerHTML = [
        '<li class="', listtype, '" bangumi-visable="', video.visible, '">',
          '<a class="preview" target="_blank" href="/video/av', video.aid, '/">',
            '<img src="', xmlEscape(video.pic), '">',
          '</a>',
          '<a class="title" target="_blank" href="/video/av', video.aid, '/">', xmlEscape(video.title), '</a>',
          '<div class="w_info">',
            '<i class="gk" title="观看">', formatFriendlyNumber(video.play), '</i>',
            '<i class="sc" title="收藏">', formatFriendlyNumber(video.favorites), '</i>',
            '<i class="dm" title="弹幕">', formatFriendlyNumber(video.video_review), '</i>',
            '<i class="date" title="日期">', xmlEscape(video.create), '</i>',
          '</div>',
          '<div class="info">', xmlEscape(video.description), '</div>',
          '<a class="up r10000" target="_blank" href="http://space.bilibili.com/', video.mid, '">', xmlEscape(video.author), '</a>',
        '</li>',
      ].join('');
      ul.appendChild(c.firstChild);
    });
    var cnt = document.querySelector('.video_list .vd_list_cnt');
    cnt.removeChild(cnt.firstChild);
    cnt.insertBefore(ul, cnt.firstChild);
  };

  var hideNextPage = function () {
    GM_xmlhttpRequest({
      'method': 'GET',
      'url': 'http://' + bilibili.host + '/video/bangumi-two-' + (page + 1) + '.html',
      'onload': function (resp) {
        var doc = (new DOMParser()).parseFromString(resp.responseText, 'text/html');
        dataFromDocument(doc).map(function (video) {
          var cnt = Array.apply(Array, document.querySelectorAll('.vd_list li'));
          cnt.map(function (li) {
            if (~li.querySelector('.title').href.match(/\/av(\d+)/)[1] === ~video.aid)
              li.parentNode.removeChild(li);
          });
        });
      },
    });
  };

  var active = function () {
    if (!loaded || !data) return;
    data = mergeData(data);
    try { addList(); } catch (e) { }
    showList();
    hideNextPage();
  };

  var dataFromDocument = function (doc) {
    var cnt = Array.apply(Array, doc.querySelectorAll('.vd_list li'));
    return cnt.map(function (li) {
      try {
        var qs = li.querySelector.bind(li);
        return {
          'aid': qs('.title').href.match(/\/av(\d+)/)[1],
          'pic': qs('.preview img').src,
          'title': qs('.title').textContent,
          'play': qs('.gk').textContent,
          'favorites': qs('.sc').textContent,
          'video_review': qs('.dm').textContent,
          'create': qs('.date').textContent,
          'description': qs('.info').textContent,
          'mid': qs('.up').href.match(/\/(\d+)/)[1],
          'author': qs('.up').textContent,
          'visible': 'web',
        };
      } catch (e) { }
    }).filter(function (x) { return x; });
  };

  // 将返回的结果和页面上已有的视频拼合，显示尽可能多的视频
  var mergeData = function (data) {
    var add2Data = function (video) {
      var found = -1;
      data.forEach(function (v, i) {
        if (Number(v.aid) == Number(video.aid)) found = i;
      });
      if (found === -1) data.push(video);
      else if (data[found].visible !== video.visible)
        data[found].visible = 'all';
    };
    dataFromDocument(document).forEach(add2Data);
    data.sort(function (x, y) { return Number(y.aid) - Number(x.aid); })
    return data;
  };

  // 使用手机的API获取数据
  var getData = function () {
    GM_xmlhttpRequest({
      'method': 'GET',
      'url': 'http://api.bilibili.com/list?pagesize=24&type=json&page=' + page +
        '&order=default&appkey=8e9fc618fbd41e28&tid=33',
      'onload': function (resp) {
        var respData, i;
        try {
          respData = JSON.parse(resp.responseText).list;
          for (data = [], i = 0; i < 24; i++) {
            data[i] = respData[i];
            data[i].title = xmlUnescape(data[i].title);
            data[i].visible = 'mobile'
          }
          active();
        } catch (e) { showList(); }
      },
      'onerror': showList,
      'timeout': 3000,
      'ontimeout': showList,
    });
  };

  (function () {
    // 先隐藏已有的新番列表
    GM_addStyle('.video_list ul.vd_list { visibility: hidden; }')
    // 检查文档树是否已经被解析出
    if (!loaded) document.addEventListener('DOMContentLoaded', function () {
      loaded = true;
      active();
    });
    getData();
  }());


}());
