// ==UserScript==
// @name        bilibili QR Code for Client
// @namespace   https://github.com/tiansh
// @description 在手机浏览器中扫描 bilibili 网页上的 QR 码后使用客户端而非浏览器打开对应视频
// @updateURL   https://tiansh.github.io/us-blbl/bilibili_qr_code_for_client/bilibili_QR_Code_for_Client.meta.js
// @downloadURL https://tiansh.github.io/us-blbl/bilibili_qr_code_for_client/bilibili_QR_Code_for_Client.user.js
// @include     /^http://([^/]*\.)?bilibili\.com(/.*)?$/
// @include     /^http://([^/]*\.)?bilibili\.tv(/.*)?$/
// @include     /^http://([^/]*\.)?bilibili\.kankanews\.com(/.*)?$/
// @version     1.0
// @author      田生
// @copyright   2013+, 田生
// @license     Mozilla Public License
// @grant       none
// @run-at      document-end
// ==/UserScript==

// 请不要吐槽这混乱的代码，嗯。

location.href = "javascript:void(" + function () {
  var h = $("#app_qrcode_box"), g;
  if (!h.length) return;
  h.hide(), h.after(g = $('<div class="app" id="app_qrcode_box"><a class="app-link"></a><div class="qr-code-box"><a href="http://app.bilibili.com/" target="_blank"><div class="qr-code" id="qr_code"></div><p>用手机客户端扫一扫</p></a></div></div>'));
  var f = g.find(".qr-code-box"), l = g.find("#qr_code"), j = { width: 100, height: 100, typeNumber: -1, correctLevel: 0, background: "#fff", foreground: "#000" };
  "undefined" != typeof document.createElement("canvas")
      .getContext("2d") ? j.render = "canvas" : j.render = "table";
  g.click(function () {
    var p = ($("#bofqi embed").prop("flashvars") || "").match(/aid=(\d+)/),
      q = ($("#bofqi iframe").prop("src") || "").match(/aid=(\d+)/),
      a = p || q || location.href.match(/av(\d+)/) || [];
    if (!a[1]) return;
    j.text = "bilibili://?av=" + a[1];
    f.is(":visible") ? f.stop(!1, !0).slideUp(200)
        : (l.empty(), l.qrcode(j), f.stop(!1, !0).slideDown(200))
  })
} + "());";
