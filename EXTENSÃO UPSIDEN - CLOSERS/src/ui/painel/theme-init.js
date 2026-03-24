(function() {
  var theme = localStorage.getItem('upsiden_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
})();
