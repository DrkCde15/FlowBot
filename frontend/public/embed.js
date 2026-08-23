(function () {
  var scripts = document.getElementsByTagName("script");
  var self = scripts[scripts.length - 1];
  var slug = self.getAttribute("data-slug");
  if (!slug) {
    console.error("[FlowBot] missing data-slug");
    return;
  }
  var type = self.getAttribute("data-type") || "bubble";
  var bubbleText = self.getAttribute("data-bubble-text") || "Chat with us";
  var position = self.getAttribute("data-position") || "right";
  var origin =
    self.getAttribute("data-origin") ||
    (self.src ? new URL(self.src).origin : window.location.origin);

  var style = document.createElement("style");
  style.textContent =
    ".fb-bubble-btn{position:fixed;bottom:20px;" +
    (position === "left" ? "left:20px;" : "right:20px;") +
    "z-index:2147483000;background:#4f46e5;color:#fff;border:none;border-radius:999px;padding:14px 18px;font:600 14px/1 sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.2)}" +
    ".fb-panel{position:fixed;bottom:80px;" +
    (position === "left" ? "left:20px;" : "right:20px;") +
    "width:380px;max-width:calc(100vw - 40px);height:600px;max-height:calc(100vh - 120px);z-index:2147483000;border:none;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.25);display:none}" +
    ".fb-panel.fb-open{display:block}";
  document.head.appendChild(style);

  if (type === "bubble") {
    var btn = document.createElement("button");
    btn.className = "fb-bubble-btn";
    btn.textContent = bubbleText;
    document.body.appendChild(btn);

    var panel = document.createElement("iframe");
    panel.className = "fb-panel";
    panel.src = origin + "/b/" + encodeURIComponent(slug) + "?embed=1";
    document.body.appendChild(panel);

    btn.addEventListener("click", function () {
      panel.classList.toggle("fb-open");
    });
  } else {
    // popup: open automatically once
    var panel2 = document.createElement("iframe");
    panel2.className = "fb-panel fb-open";
    panel2.src = origin + "/b/" + encodeURIComponent(slug) + "?embed=1";
    document.body.appendChild(panel2);
  }
})();
