(function () {
    var W = 720, H = 280, PAD_L = 40, PAD_R = 10, PAD_T = 12, PAD_B = 30;
    var monthCount = (window.__CHART_VARS__ && window.__CHART_VARS__.monthCount) || 12;
    var monthLabels = (window.__CHART_VARS__ && window.__CHART_VARS__.monthLabels) || [];

    var section = document.getElementById('commit-activity');
    if (!section) return;
    var totalEl = document.getElementById('commits-total');
    var legend = document.getElementById('chart-legend');
    if (!totalEl || !legend) return;

    function fmt(n) { return n.toLocaleString('en-US'); }

    function reveal() { section.classList.add('in-view'); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { reveal(); io.disconnect(); }
        });
      }, { threshold: 0.15 });
      io.observe(section);
    } else {
      reveal();
    }

    function esc(id) {
      return (window.CSS && CSS.escape) ? CSS.escape(id) : id.replace(/["\\]/g, '');
    }

    // Stacked area mode with range views (12m / last / pick)
    var svg = document.getElementById('area-svg');
    if (svg) {
      var NS = 'http://www.w3.org/2000/svg';
      var PLOT_W = W - PAD_L - PAD_R;
      var PLOT_H = H - PAD_T - PAD_B;
      var buttons = Array.prototype.slice.call(legend.querySelectorAll('.legend-btn'));
      var rangeBtns = Array.prototype.slice.call(section.querySelectorAll('.range-btn'));
      var pickWrap = document.getElementById('month-pick-wrap');
      var pickSelect = document.getElementById('month-pick');
      var peakNote = document.getElementById('peak-note');
      var wrap = document.getElementById('area-wrap');
      var weekStamps = JSON.parse(svg.getAttribute('data-weeks') || '[]');
      var view = '12m';
      var tip = document.getElementById('chart-tip');
      var lastFrame = null;
      var SW = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];

      function f(n) { return (Math.round(n * 10) / 10).toString(); }
      function xPos(j, m) {
        if (m <= 1) return PAD_L + PLOT_W / 2;
        return PAD_L + (PLOT_W * j) / (m - 1);
      }
      function yPos(v, peak) {
        if (peak <= 0) return PAD_T + PLOT_H;
        return PAD_T + PLOT_H * (1 - v / peak);
      }
      function smoothThrough(pts) {
        if (pts.length <= 1) return pts.length ? 'M ' + f(pts[0].x) + ' ' + f(pts[0].y) : '';
        if (pts.length === 2) return 'M ' + f(pts[0].x) + ' ' + f(pts[0].y) + ' L ' + f(pts[1].x) + ' ' + f(pts[1].y);
        var d = 'M ' + f(pts[0].x) + ' ' + f(pts[0].y);
        for (var i = 0; i < pts.length - 1; i++) {
          var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
          var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
          var c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
          d += ' C ' + f(c1x) + ' ' + f(c1y) + ', ' + f(c2x) + ' ' + f(c2y) + ', ' + f(p2.x) + ' ' + f(p2.y);
        }
        return d;
      }
      function areaPath(top, bot) {
        if (!top.length) return '';
        if (top.length === 1) return 'M ' + f(top[0].x) + ' ' + f(top[0].y) + ' L ' + f(bot[0].x) + ' ' + f(bot[0].y) + ' Z';
        var d = smoothThrough(top);
        var rev = bot.slice().reverse();
        d += ' L ' + f(rev[0].x) + ' ' + f(rev[0].y);
        if (rev.length === 2) {
          d += ' L ' + f(rev[1].x) + ' ' + f(rev[1].y);
        } else {
          for (var i = 0; i < rev.length - 1; i++) {
            var p0 = rev[Math.max(0, i - 1)], p1 = rev[i], p2 = rev[i + 1], p3 = rev[Math.min(rev.length - 1, i + 2)];
            var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
            var c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
            d += ' C ' + f(c1x) + ' ' + f(c1y) + ', ' + f(c2x) + ' ' + f(c2y) + ', ' + f(p2.x) + ' ' + f(p2.y);
          }
        }
        return d + ' Z';
      }
      function monthKeyOf(stamp) {
        var d = new Date(stamp * 1000);
        return d.getFullYear() * 12 + d.getMonth();
      }
      function weekLabel(stamp) {
        return new Date(stamp * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric' });
      }
      function keyOfValue(val) {
        var parts = String(val).split('-');
        return parseInt(parts[0], 10) * 12 + (parseInt(parts[1], 10) - 1);
      }

      function monthFull(key) {
        return new Date(Math.floor(key / 12), key % 12, 1)
          .toLocaleString('en-US', { month: 'short', year: 'numeric' });
      }

      function currentFrame() {
        var monthlyMode = view === '12m';
        var targetKey;
        if (view === 'last') {
          targetKey = -Infinity;
          weekStamps.forEach(function (s) { targetKey = Math.max(targetKey, monthKeyOf(s)); });
        } else if (view === 'pick' && pickSelect) {
          targetKey = keyOfValue(pickSelect.value);
        }
        var labels, idx, targetLabel = '';
        if (monthlyMode) {
          labels = monthLabels.slice();
          idx = null;
        } else {
          idx = [];
          labels = [];
          weekStamps.forEach(function (s, j) {
            if (monthKeyOf(s) === targetKey) { idx.push(j); labels.push(weekLabel(s)); }
          });
          targetLabel = monthFull(targetKey);
          if (pickSelect && view === 'pick' && pickSelect.selectedOptions.length) {
            targetLabel = pickSelect.selectedOptions[0].textContent;
          }
        }
        var cols = buttons.map(function (b) {
          var full = monthlyMode
            ? JSON.parse(b.getAttribute('data-monthly') || '[]')
            : JSON.parse(b.getAttribute('data-weekly') || '[]');
          var arr = monthlyMode ? full.slice() : idx.map(function (j) { return full[j] || 0; });
          return { id: b.getAttribute('data-legend'), arr: arr, btn: b };
        });
        // Weekly views: pad domain with zero anchors at both edges so the
        // stacked area always has width. A month with one data point
        // otherwise collapses to a single vertical line. Anchors carry no
        // label and no commits, so totals and badges stay exact.
        var real = null, realCount = labels.length, emptyMonth = false;
        if (!monthlyMode) {
          if (idx.length === 0) {
            emptyMonth = true;
            cols = cols.map(function (c) { return { id: c.id, arr: [], btn: c.btn }; });
            labels = [];
          } else {
            real = [false].concat(idx.map(function () { return true; }), [false]);
            labels = [''].concat(labels, ['']);
            cols = cols.map(function (c) { return { id: c.id, arr: [0].concat(c.arr, [0]), btn: c.btn }; });
          }
          realCount = idx.length;
        }
        return { labels: labels, cols: cols, monthlyMode: monthlyMode, weekly: !monthlyMode, real: real, realCount: realCount, emptyMonth: emptyMonth, targetLabel: targetLabel };
      }

      function render() {
        var frame = currentFrame();
        var m = frame.monthlyMode ? monthCount : frame.labels.length;
        hideTip();
        // Per-series view totals -> badges + data-n
        frame.cols.forEach(function (c) {
          var t = c.arr.reduce(function (a, b) { return a + b; }, 0);
          c.btn.setAttribute('data-n', String(t));
          var badge = c.btn.querySelector('.legend-n');
          if (badge) badge.textContent = fmt(t);
          c.btn.title = c.btn.querySelector('.legend-label').textContent + ' — ' + fmt(t) + ' commits in view';
        });
        var visible = frame.cols.filter(function (c) { return c.btn.getAttribute('aria-pressed') === 'true'; });
        var totals = new Array(m).fill(0);
        visible.forEach(function (c) {
          for (var j = 0; j < m; j++) totals[j] += c.arr[j] || 0;
        });
        var peak = Math.max.apply(null, totals.concat([1]));
        // Rebuild SVG: grid + areas + x labels
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        var tickVals = [0, Math.ceil(peak / 3), Math.ceil((2 * peak) / 3), peak];
        var uniq = Array.from(new Set(tickVals)).sort(function (a, b) { return a - b; });
        uniq.forEach(function (v) {
          var g = document.createElementNS(NS, 'g');
          g.setAttribute('class', 'grid');
          var line = document.createElementNS(NS, 'line');
          line.setAttribute('x1', PAD_L); line.setAttribute('x2', W - PAD_R);
          var y = yPos(v, peak);
          line.setAttribute('y1', y); line.setAttribute('y2', y);
          var tx = document.createElementNS(NS, 'text');
          tx.setAttribute('x', PAD_L - 6); tx.setAttribute('y', y + 4);
          tx.setAttribute('text-anchor', 'end');
          tx.textContent = fmt(v);
          g.appendChild(line); g.appendChild(tx);
          svg.appendChild(g);
        });
        var cum = new Array(m).fill(0);
        var dots = [];
        visible.forEach(function (c) {
          var idx = c.btn.getAttribute('data-idx') || '0';
          var top = [], bot = [];
          for (var j = 0; j < m; j++) {
            var y0 = cum[j], y1 = cum[j] + (c.arr[j] || 0);
            bot.push({ x: xPos(j, m), y: yPos(y0, peak) });
            top.push({ x: xPos(j, m), y: yPos(y1, peak) });
            cum[j] = y1;
          }
          var path = document.createElementNS(NS, 'path');
          path.setAttribute('class', 'area area-' + idx);
          path.setAttribute('data-area', c.id);
          path.setAttribute('d', areaPath(top, bot));
          svg.appendChild(path);
          // Dot markers on real (non-anchor) points so single-point and
          // sparse months read clearly. Zero values skipped to cut clutter.
          if (frame.weekly) {
            for (var k = 0; k < m; k++) {
              if (frame.real && !frame.real[k]) continue;
              if ((c.arr[k] || 0) <= 0) continue;
              dots.push({ x: top[k].x, y: top[k].y, idx: idx });
            }
          }
        });
        dots.forEach(function (dt) {
          var c = document.createElementNS(NS, 'circle');
          c.setAttribute('class', 'dot dot-' + dt.idx);
          c.setAttribute('cx', dt.x);
          c.setAttribute('cy', dt.y);
          c.setAttribute('r', 5);
          svg.appendChild(c);
        });
        frame.labels.forEach(function (label, j) {
          var tx = document.createElementNS(NS, 'text');
          tx.setAttribute('class', 'x-label');
          tx.setAttribute('x', xPos(j, m));
          tx.setAttribute('y', H - 8);
          tx.setAttribute('text-anchor', j === 0 ? 'start' : j === m - 1 ? 'end' : 'middle');
          tx.textContent = label;
          svg.appendChild(tx);
        });
        // Totals + peak + aria
        var sum = 0, projectCount = 0;
        // Month index for weekly views: find which monthLabels entry matches targetLabel.
        var monthIdx = -1;
        if (!frame.monthlyMode) {
          var shortMonth = (frame.targetLabel || '').split(' ')[0];
          monthIdx = monthLabels.indexOf(shortMonth);
        }
        visible.forEach(function (c) {
          var seriesSum = c.arr.reduce(function (a, b) { return a + b; }, 0);
          sum += seriesSum;
          var isOthers = c.btn.getAttribute('data-legend') === '__others__';
          if (isOthers) {
            if (frame.monthlyMode) {
              // full window: all distinct others projects
              if (seriesSum > 0) projectCount += parseInt(c.btn.getAttribute('data-projects') || '0', 10);
            } else {
              // weekly: distinct others in this month
              var pmArr = JSON.parse(c.btn.getAttribute('data-projects-monthly') || '[]');
              if (monthIdx >= 0 && monthIdx < pmArr.length) {
                projectCount += (pmArr[monthIdx] || 0);
              }
            }
          } else {
            // named series: count 1 if it has any commits in this view
            if (seriesSum > 0) projectCount += 1;
          }
        });
        var rangeText;
        if (frame.monthlyMode) {
          rangeText = 'in the last ' + monthCount + ' months';
        } else if (frame.emptyMonth) {
          rangeText = 'in ' + frame.targetLabel;
        } else {
          rangeText = 'in ' + frame.targetLabel + ' (' + frame.realCount + (frame.realCount === 1 ? ' week)' : ' weeks)');
        }
        if (frame.emptyMonth && sum === 0) {
          totalEl.textContent = 'No commits ' + rangeText;
        } else if (sum === 0) {
          totalEl.textContent = 'All hidden — toggle a project to show commits';
        } else {
          totalEl.textContent = fmt(sum) + ' commits ' + rangeText + ' across ' + fmt(projectCount) + ' projects';
        }
        var peakShown = frame.emptyMonth ? 0 : peak;
        if (peakNote) {
          peakNote.textContent = frame.monthlyMode
            ? 'Peak month: ' + fmt(peakShown) + ' commits'
            : 'Peak week: ' + fmt(peakShown) + ' commits';
        }
        if (wrap) {
          wrap.setAttribute('aria-label', 'Stacked commits ' + rangeText + '. Peak ' + fmt(peakShown) + ' commits. Total ' + fmt(sum) + ' commits.');
        }
        storeFrame(frame, visible, m);
      }

      // Hover tooltip: per-project breakdown at nearest point
      function escHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
      }
      function swColor(idx) { return idx >= 0 && idx < 8 ? SW[idx] : 'var(--muted)'; }
      function hideTip() { if (tip) tip.hidden = true; }
      function storeFrame(frame, visible, m) {
        lastFrame = {
          labels: frame.labels.slice(),
          m: m,
          real: frame.real ? frame.real.slice() : null,
          rows: visible.map(function (c) {
            var lbl = c.btn.querySelector('.legend-label');
            return {
              title: lbl ? lbl.textContent : c.id,
              idx: parseInt(c.btn.getAttribute('data-idx') || '0', 10),
              arr: c.arr.slice()
            };
          })
        };
      }
      function nearestReal(j) {
        var real = lastFrame.real;
        if (!real) return j;
        if (real[j]) return j;
        for (var d = 1; d < lastFrame.m; d++) {
          if (j - d >= 0 && real[j - d]) return j - d;
          if (j + d < lastFrame.m && real[j + d]) return j + d;
        }
        return j;
      }
      function showTip(j) {
        if (!tip || !lastFrame) return false;
        var m = lastFrame.m, labels = lastFrame.labels;
        if (!m || j < 0 || j >= m) return false;
        j = nearestReal(j);
        var total = 0, rowsHtml = '';
        lastFrame.rows.forEach(function (r) {
          var n = r.arr[j] || 0;
          total += n;
          if (n > 0) {
            rowsHtml += '<div class="tip-row"><span class="tip-swatch" style="background:' + swColor(r.idx) + '"></span>' +
              '<span class="tip-name">' + escHtml(r.title) + '</span>' +
              '<span class="tip-val">' + fmt(n) + '</span></div>';
          }
        });
        tip.innerHTML = '<div class="tip-head">' + escHtml(labels[j]) + ' · ' + fmt(total) + '</div>' +
          (rowsHtml || '<div class="tip-row tip-empty">No commits</div>');
        tip.hidden = false;
        return true;
      }
      function placeTip(clientX, clientY) {
        if (!tip || !wrap) return;
        var wr = wrap.getBoundingClientRect();
        var tw = tip.offsetWidth, th = tip.offsetHeight;
        var x = clientX - wr.left, y = clientY - wr.top;
        var left = x + 14, top = y - th - 14;
        if (left + tw > wr.width - 8) left = x - tw - 14;
        if (left < 8) left = 8;
        if (top < 8) top = 8;
        if (top + th > wr.height - 8) top = Math.max(8, wr.height - th - 8);
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
      }
      function pointFromEvent(e) {
        if (!lastFrame || !lastFrame.m) return -1;
        var m = lastFrame.m;
        if (m <= 1) return 0;
        var r = svg.getBoundingClientRect();
        var px = (e.clientX - r.left) * (W / r.width);
        return Math.max(0, Math.min(m - 1, Math.round((px - PAD_L) / (PLOT_W / (m - 1)))));
      }
      function hoverAt(e) {
        var j = pointFromEvent(e);
        if (j < 0 || !showTip(j)) return;
        placeTip(e.clientX, e.clientY);
      }
      svg.addEventListener('mousemove', hoverAt);
      svg.addEventListener('click', hoverAt);
      svg.addEventListener('mouseleave', hideTip);
      // Snapshot server-rendered 12m view so hover works before any switch
      (function () {
        var frame = currentFrame();
        var m = frame.monthlyMode ? monthCount : frame.labels.length;
        if (!m) return;
        var visible = frame.cols.filter(function (c) { return c.btn.getAttribute('aria-pressed') === 'true'; });
        storeFrame(frame, visible, m);
      })();

      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var on = btn.getAttribute('aria-pressed') === 'true';
          btn.setAttribute('aria-pressed', on ? 'false' : 'true');
          render();
        });
      });
      rangeBtns.forEach(function (rb) {
        rb.addEventListener('click', function () {
          view = rb.getAttribute('data-view');
          rangeBtns.forEach(function (o) {
            o.setAttribute('aria-pressed', o === rb ? 'true' : 'false');
          });
          if (pickWrap) pickWrap.hidden = view !== 'pick';
          render();
        });
      });
      if (pickSelect) {
        pickSelect.addEventListener('change', function () {
          if (view !== 'pick') {
            view = 'pick';
            rangeBtns.forEach(function (o) {
              o.setAttribute('aria-pressed', o.getAttribute('data-view') === 'pick' ? 'true' : 'false');
            });
            if (pickWrap) pickWrap.hidden = false;
          }
          render();
        });
      }
      return;
    }

    // Snapshot mode: toggle bars
    var barsEl = document.getElementById('chart-bars');
    if (!barsEl) return;
    var rows = Array.prototype.slice.call(barsEl.querySelectorAll('.bar-row'));
    var snapBtns = Array.prototype.slice.call(legend.querySelectorAll('.legend-btn'));
    snapBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-legend');
        var on = btn.getAttribute('aria-pressed') === 'true';
        btn.setAttribute('aria-pressed', on ? 'false' : 'true');
        var row = barsEl.querySelector('[data-bar="' + esc(id) + '"]');
        if (row) row.hidden = on;
        var sum = 0, projectCount = 0;
        rows.forEach(function (r) {
          if (!r.hidden) {
            sum += parseInt(r.getAttribute('data-commits') || '0', 10);
            projectCount += parseInt(r.getAttribute('data-projects') || '1', 10);
          }
        });
        if (sum === 0) {
          totalEl.textContent = 'All hidden — toggle a project to show commits';
        } else {
          totalEl.textContent = fmt(sum) + ' commits across ' + fmt(projectCount) + ' projects';
        }
      });
    });
  })();
