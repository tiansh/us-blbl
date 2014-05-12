// ==UserScript==
// @name        Bilibili Show Hidden Bangumi
// @namespace   https://github.com/tiansh
// @description 修正哔哩哔哩新番二次元视频列表页面，显示隐藏的视频。注意，这些链接会显示404，所以请配合恢复播放器的相关脚本使用。
// @include     http://www.bilibili.tv/video/bangumi-two-*.html
// @include     http://bilibili.kankanews.com/video/bangumi-two-*.html
// @version     2.33
// @updateURL   https://tiansh.github.io/us-blbl/bilibili_show_hidden_bangumi/bilibili_show_hidden_bangumi.meta.js
// @downloadURL https://tiansh.github.io/us-blbl/bilibili_show_hidden_bangumi/bilibili_show_hidden_bangumi.user.js
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @copyright   GNU GPL v3 or CC BY-SA 4.0
// @author      田生
// ==/UserScript==

// 本脚本是Replace bilibili bofqi的一部分
// 如果安装了该脚本请勿再安装本脚本

// 修正新番列表中部分视频不显示的问题
(function fixBangumiTwoList() {
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
    for (i = 0; i < 24; i++) (function (video) {
      var c = document.createElement('ul');
      c.innerHTML = [
        '<li class="', listtype, '">',
          '<a class="preview" target="_blank" href="/video/av', video.aid, '/">',
            '<img src="', video.pic, '">',
          '</a>',
          '<a class="title" target="_blank" href="/video/av', video.aid, '/">', video.title, '</a>',
          '<div class="w_info">',
            '<i class="gk" title="观看">', video.play, '</i>',
            '<i class="sc" title="收藏">', video.favorites, '</i>',
            '<i class="dm" title="弹幕">', video.video_review, '</i>',
            '<i class="date" title="日期">', video.create, '</i>',
          '</div>',
          '<div class="info">', video.description, '</div>',
          '<a class="up r10000" target="_blank" href="http://space.bilibili.tv/', video.mid, '">', video.author, '</a>',
        '</li>',
      ].join('');
      ul.appendChild(c.firstChild);
    }(data[i]));
    var cnt = document.querySelector('.video_list .vd_list_cnt');
    cnt.removeChild(cnt.firstChild);
    cnt.insertBefore(ul, cnt.firstChild);
  };

  var active = function () {
    if (!loaded || !data) return;
    try { addList(); } catch (e) { }
    showList();
  };

  // 使用手机的API获取数据
  GM_xmlhttpRequest({
    'method': 'GET',
    'url': 'http://api.bilibili.cn/list?pagesize=24&type=json&page=' + r[1] +
      '&ios=0&order=default&appkey=0a99fa1d87fdd38c&platform=ios&tid=33',
    'headers': { 'User-Agent': 'bilianime/570 CFNetwork/672.0.8 Darwin/14.0.0' },
    'onload': function (resp) {
      try { data = JSON.parse(resp.responseText).list; }
      catch (e) { showList(); }
      active();
    },
    'onerror': showList,
  });

}());

