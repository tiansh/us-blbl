// ==UserScript==
// @name        Bilibili Show Hidden Bangumi
// @namespace   https://github.com/tiansh
// @description 修正哔哩哔哩新番二次元视频列表页面，显示隐藏的视频。注意，这些链接会显示404，所以请配合恢复播放器的相关脚本使用。
// @include     http://www.bilibili.tv/video/bangumi-two-*.html
// @include     http://bilibili.kankanews.com/video/bangumi-two-*.html
// @version     2.36
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

  // 将数字转换成以万为单位计数的形式
  // http://static.hdslb.com/js/base.core.v2.js
  var formatFriendlyNumber = function (b) {
    if ('number' === typeof b) b = String(b);
    if (!(0 <= b.indexOf("\u4e07") || 0 <= b.indexOf(","))) {
      return (b = parseInt(b)) ? 10000 <= b && (b = (b / 10000).toFixed(1) + "\u4e07"): b = "--", b
    }
  };
  // 转义XML字符
  var xmlEscape = function (s) {
    return String(s).replace(/./g, function (c) { return '&#' + c.charCodeAt(0) + ';'; });
  };


  var r = location.href.match(/http:\/\/[^\/]*\/video\/bangumi-two-(\d+).html/);
  if (!r || !r[1]) return;
  // 先隐藏已有的新番列表
  GM_addStyle('.video_list ul.vd_list { visibility: hidden; }')
  var loaded = !!document.body, data = null;
  // 检查文档树是否已经被解析出
  if (!loaded) document.addEventListener('DOMContentLoaded', function () {
    loaded = true;
    active();
  });
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
        '<li class="', listtype, '">',
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
          '<a class="up r10000" target="_blank" href="http://space.bilibili.tv/', video.mid, '">', xmlEscape(video.author), '</a>',
        '</li>',
      ].join('');
      ul.appendChild(c.firstChild);
    });
    var cnt = document.querySelector('.video_list .vd_list_cnt');
    cnt.removeChild(cnt.firstChild);
    cnt.insertBefore(ul, cnt.firstChild);
  };

  var active = function () {
    if (!loaded || !data) return;
    data = mergeData(data);
    try { addList(); } catch (e) { }
    showList();
  };

  // 将返回的结果和页面上已有的视频拼合，显示尽可能多的视频
  var mergeData = function (data) {
    var cnt = Array.apply(Array, document.querySelectorAll('.vd_list li'));
    var add2Data = function (video) {
      var found = -1;
      data.forEach(function (v, i) {
        if (Number(v.aid) == Number(video.aid)) found = i;
      });
      if (found === -1) data.push(video);
    };
    cnt.forEach(function (li) { 
      try{
        var qs = li.querySelector.bind(li);
        var video = {
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
        };
        add2Data(video);
      } catch (e) {}
    });
    data.sort(function (x, y) { return Number(x.aid) < Number(y.aid); })
    return data;
  };

  // 使用手机的API获取数据
  GM_xmlhttpRequest({
    'method': 'GET',
    'url': 'http://api.bilibili.cn/list?pagesize=24&type=json&page=' + r[1] +
      '&ios=0&order=default&appkey=0a99fa1d87fdd38c&platform=ios&tid=33',
    'headers': { 'User-Agent': 'bilianime/570 CFNetwork/672.0.8 Darwin/14.0.0' },
    'onload': function (resp) {
      var respData, i;
      try {
        respData = JSON.parse(resp.responseText).list;
        for (data = [], i = 0; i < 24; i++) data[i] = respData[i];
      } catch (e) { showList(); }
      active();
    },
    'onerror': showList,
  });

}());
