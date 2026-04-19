/* クエNavi Toolkit v1
 * 🧰 4-in-1: 釣銭計算 / 置き配テンプレ / オファー判定 / 週次サマリー
 * 独立モジュール - 既存 patch.js / React アプリに干渉しない
 */
(function(){
  'use strict';
  if (window.__qtKit) return;
  const NS = window.__qtKit = {};
  const LS_KEY = 'qtkit_v1';

  // ===== STATE =====
  const defaults = {
    tmpl: {
      ube: [
        '配達ありがとうございました。指定の場所に置きました。ご確認ください。',
        'お待たせしました。玄関前に置いています。温かいうちにお召し上がりください。',
        'ご注文ありがとうございました。指定の場所に置きました。'
      ],
      demae: [
        'ご注文ありがとうございました。ドアノブにかけさせていただきました。',
        '配達完了しました。ご確認お願いします。'
      ],
      rocket: [
        '配達しました。ご確認ください。'
      ],
      common: [
        'インターホン故障の案内を確認しました。ノックで対応しました。',
        '呼び出しに反応がなかったため、指定の置き配場所に置きました。'
      ]
    },
    offerHist: []  // オファー判定履歴 {time, fee, km, min, ymin, ykm, yhr, ts}
  };
  function load(){
    try{
      const s = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      return Object.assign({}, defaults, s, { tmpl: Object.assign({}, defaults.tmpl, s.tmpl || {}) });
    }catch(e){ return JSON.parse(JSON.stringify(defaults)); }
  }
  function save(s){ localStorage.setItem(LS_KEY, JSON.stringify(s)); }
  let state = load();

  // ===== STYLES =====
  const css = `
    #qtkit-fab{position:fixed;left:14px;display:inline-flex;align-items:center;gap:5px;
      bottom:calc(76px + env(safe-area-inset-bottom, 0px));padding:9px 14px;
      background:#3b82f6;color:#fff;border:none;
      border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;
      box-shadow:0 4px 14px rgba(59, 130, 246,.45);z-index:9998;line-height:1;letter-spacing:.02em;
      transition:transform .1s,opacity .15s}
    #qtkit-fab:active{transform:scale(.95);opacity:.9}
    #qtkit-modal{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:none;
      align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)}
    #qtkit-modal.open{display:flex}
    #qtkit-sheet{width:100%;max-width:560px;max-height:92vh;background:#1a1e2e;color:#e6e8ef;
      border-radius:20px 20px 0 0;display:flex;flex-direction:column;
      box-shadow:0 -10px 40px rgba(0,0,0,.6);overflow:hidden}
    #qtkit-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;
      border-bottom:1px solid #2a2f44;flex-shrink:0}
    #qtkit-head h3{margin:0;font-size:16px;font-weight:700}
    #qtkit-close{background:none;border:none;color:#9aa;font-size:22px;cursor:pointer;padding:4px 10px}
    #qtkit-tabs{display:flex;border-bottom:1px solid #2a2f44;background:#15182a;flex-shrink:0}
    .qtkit-tab{flex:1;padding:12px 4px;background:none;border:none;color:#8b92a5;font-size:12px;
      cursor:pointer;border-bottom:3px solid transparent;transition:.15s;font-weight:600}
    .qtkit-tab.active{color:#fff;border-bottom-color:#3b82f6;background:#1a1e2e}
    .qtkit-tab-emoji{display:block;font-size:18px;margin-bottom:2px}
    #qtkit-body{padding:16px;overflow-y:auto;flex:1;
      padding-bottom:calc(20px + env(safe-area-inset-bottom,0px))}
    .qtkit-pane{display:none}
    .qtkit-pane.active{display:block}
    .qtkit-label{font-size:12px;color:#9aa3b8;margin-bottom:4px;font-weight:600}
    .qtkit-input{width:100%;padding:11px 12px;background:#242940;border:1px solid #2f3550;
      border-radius:10px;color:#fff;font-size:16px;box-sizing:border-box;-webkit-appearance:none}
    .qtkit-input:focus{outline:none;border-color:#3b82f6}
    .qtkit-row{display:flex;gap:8px;margin-bottom:12px}
    .qtkit-row > *{flex:1;min-width:0}
    .qtkit-btn{padding:10px 14px;background:#3b82f6;color:#fff;border:none;border-radius:10px;
      font-size:14px;font-weight:600;cursor:pointer;width:100%}
    .qtkit-btn:active{opacity:.8}
    .qtkit-btn.ghost{background:#2a2f44;color:#c7cbe0}
    .qtkit-result{background:#242940;border-radius:12px;padding:14px;margin-top:12px}
    .qtkit-result-big{font-size:24px;font-weight:700;color:#3b82f6;margin-bottom:6px}
    .qtkit-stat{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #2f3550;font-size:14px}
    .qtkit-stat:last-child{border:none}
    .qtkit-stat-label{color:#9aa3b8}
    .qtkit-stat-value{color:#fff;font-weight:600}
    .qtkit-tmpl-item{background:#242940;border-radius:10px;padding:11px 12px;margin-bottom:8px;
      display:flex;gap:10px;align-items:flex-start}
    .qtkit-tmpl-text{flex:1;font-size:13px;line-height:1.5;color:#d8dbe8}
    .qtkit-tmpl-copy{background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:7px 11px;
      font-size:12px;cursor:pointer;font-weight:600;flex-shrink:0;min-width:52px}
    .qtkit-tmpl-copy.ok{background:#10b981}
    .qtkit-svc-chip{display:inline-block;padding:3px 10px;border-radius:10px;font-size:11px;
      font-weight:700;margin-bottom:8px}
    .qtkit-svc-ube{background:#0a5d36;color:#86efac}
    .qtkit-svc-demae{background:#7a1f1f;color:#fca5a5}
    .qtkit-svc-rocket{background:#7a3e0d;color:#fdba74}
    .qtkit-svc-common{background:#2a2f44;color:#c7cbe0}
    .qtkit-verdict{font-size:32px;text-align:center;padding:10px 0;font-weight:700}
    .qtkit-verdict.good{color:#10b981}
    .qtkit-verdict.mid{color:#f59e0b}
    .qtkit-verdict.bad{color:#ef4444}
    .qtkit-coins{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:10px}
    .qtkit-coin{background:#1a1e2e;padding:6px 4px;border-radius:6px;text-align:center;font-size:11px}
    .qtkit-coin-n{font-size:15px;font-weight:700;color:#3b82f6;display:block}
    .qtkit-bar-row{display:flex;align-items:flex-end;gap:4px;height:90px;margin:14px 0 6px}
    .qtkit-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
    .qtkit-bar-val{font-size:10px;color:#9aa3b8}
    .qtkit-bar{width:100%;background:#3b82f6;
      border-radius:4px 4px 0 0;min-height:2px;transition:height .4s}
    .qtkit-bar-lbl{font-size:10px;color:#9aa3b8}
    .qtkit-week-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px}
    .qtkit-week-lbl{font-weight:700;flex:1;text-align:center;font-size:13px}
    .qtkit-nav-btn{background:#242940;border:none;color:#c7cbe0;padding:6px 12px;
      border-radius:8px;cursor:pointer;font-size:13px}
    .qtkit-svc-bd{display:flex;justify-content:space-between;padding:7px 0;font-size:13px}
    .qtkit-empty{text-align:center;color:#6b7280;padding:24px 0;font-size:13px}
    @media (max-height:600px){
      #qtkit-sheet{max-height:98vh}
      #qtkit-head{padding:10px 14px}
    }
  `;

  // ===== DOM BUILD =====
  function h(tag, opts, children){
    const el = document.createElement(tag);
    if (opts) for (const k in opts) {
      if (k === 'class') el.className = opts[k];
      else if (k === 'text') el.textContent = opts[k];
      else if (k === 'html') el.innerHTML = opts[k];
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), opts[k]);
      else el.setAttribute(k, opts[k]);
    }
    if (children) children.forEach(c => c && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return el;
  }

  function mount(){
    // CSS
    const style = h('style', { text: css });
    document.head.appendChild(style);

    // Bottom-left pill FAB (positioned above day/night button)
    const fab = h('button', { id: 'qtkit-fab', text: '🛠 ツール', title: 'クイックツール' });
    fab.addEventListener('click', open);
    document.body.appendChild(fab);

    // Modal skeleton
    const modal = h('div', { id: 'qtkit-modal' });
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    const sheet = h('div', { id: 'qtkit-sheet' });
    const head = h('div', { id: 'qtkit-head' }, [
      h('h3', { text: '🛠 クイックツール' }),
      h('button', { id: 'qtkit-close', text: '✕', onclick: close })
    ]);

    const tabs = h('div', { id: 'qtkit-tabs' });
    const panes = { otsuri: null, tmpl: null, offer: null, week: null };
    const tabDefs = [
      { k: 'otsuri', e: '💰', l: 'おつり' },
      { k: 'tmpl', e: '📋', l: '置き配' },
      { k: 'offer', e: '🎯', l: '判定' },
      { k: 'week', e: '📊', l: 'サマリー' },
      { k: 'setting', e: '⚙️', l: '設定' }
    ];
    tabDefs.forEach((t, i) => {
      const btn = h('button', { 'class': 'qtkit-tab' + (i === 0 ? ' active' : ''), 'data-tab': t.k }, [
        h('span', { 'class': 'qtkit-tab-emoji', text: t.e }),
        document.createTextNode(t.l)
      ]);
      btn.addEventListener('click', () => switchTab(t.k));
      tabs.appendChild(btn);
    });

    const body = h('div', { id: 'qtkit-body' });
    sheet.appendChild(head);
    sheet.appendChild(tabs);
    sheet.appendChild(body);
    modal.appendChild(sheet);
    document.body.appendChild(modal);

    NS._modal = modal;
    NS._body = body;
    NS._panes = panes;
    buildPanes();
    switchTab('otsuri');
  }

  function open(){ NS._modal.classList.add('open'); }
  function close(){ NS._modal.classList.remove('open'); }

  function switchTab(k){
    document.querySelectorAll('.qtkit-tab').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === k);
    });
    Object.keys(NS._panes).forEach(p => {
      if (NS._panes[p]) NS._panes[p].classList.toggle('active', p === k);
    });
    if (k === 'week') renderWeek();
    if (k === 'setting') renderSetting();
  }

  // ===== PANE 1: おつり =====
  function buildOtsuri(){
    const pane = h('div', { 'class': 'qtkit-pane active' });
    const priceIn = h('input', { 'class': 'qtkit-input', type: 'number', inputmode: 'numeric', placeholder: '商品代金（円）' });
    const paidIn = h('input', { 'class': 'qtkit-input', type: 'number', inputmode: 'numeric', placeholder: '受け取った金額（円）' });
    const result = h('div', { 'class': 'qtkit-result', style: 'display:none' });

    function calc(){
      const price = parseInt(priceIn.value) || 0;
      const paid = parseInt(paidIn.value) || 0;
      if (!price || !paid) { result.style.display = 'none'; return; }
      const change = paid - price;
      result.style.display = 'block';
      result.innerHTML = '';
      if (change < 0) {
        result.appendChild(h('div', { 'class': 'qtkit-result-big', style: 'color:#ef4444', text: '不足: ¥' + (-change).toLocaleString() }));
        result.appendChild(h('div', { 'class': 'qtkit-stat', html: '<span class="qtkit-stat-label">あと</span><span class="qtkit-stat-value">¥' + (-change).toLocaleString() + ' 必要</span>' }));
        return;
      }
      result.appendChild(h('div', { 'class': 'qtkit-result-big', text: 'おつり ¥' + change.toLocaleString() }));
      // 最適組み合わせ
      const denoms = [10000, 5000, 1000, 500, 100, 50, 10, 5, 1];
      let rem = change;
      const counts = {};
      denoms.forEach(d => { counts[d] = Math.floor(rem / d); rem %= d; });
      const coinsGrid = h('div', { 'class': 'qtkit-coins' });
      denoms.forEach(d => {
        if (counts[d] > 0) {
          coinsGrid.appendChild(h('div', { 'class': 'qtkit-coin' }, [
            h('span', { 'class': 'qtkit-coin-n', text: counts[d] + '枚' }),
            document.createTextNode('¥' + d.toLocaleString())
          ]));
        }
      });
      if (!coinsGrid.children.length) coinsGrid.appendChild(h('div', { 'class': 'qtkit-coin', text: '—' }));
      result.appendChild(h('div', { 'class': 'qtkit-label', style: 'margin-top:10px', text: '最小枚数' }));
      result.appendChild(coinsGrid);
    }
    priceIn.addEventListener('input', calc);
    paidIn.addEventListener('input', calc);

    pane.appendChild(h('div', { 'class': 'qtkit-label', text: '商品代金' }));
    pane.appendChild(priceIn);
    pane.appendChild(h('div', { 'class': 'qtkit-label', style: 'margin-top:12px', text: 'お客様から受け取った金額' }));
    pane.appendChild(paidIn);

    // クイック金額
    const quicks = h('div', { 'class': 'qtkit-row', style: 'margin-top:10px' });
    [1000, 5000, 10000].forEach(v => {
      quicks.appendChild(h('button', {
        'class': 'qtkit-btn ghost',
        text: '¥' + v.toLocaleString(),
        onclick: () => { paidIn.value = v; calc(); }
      }));
    });
    pane.appendChild(quicks);

    pane.appendChild(h('button', {
      'class': 'qtkit-btn ghost', style: 'margin-top:8px', text: 'クリア',
      onclick: () => { priceIn.value = ''; paidIn.value = ''; result.style.display = 'none'; priceIn.focus(); }
    }));

    pane.appendChild(result);
    return pane;
  }

  // ===== PANE 2: 置き配テンプレ =====
  function buildTmpl(){
    const pane = h('div', { 'class': 'qtkit-pane' });
    function render(){
      pane.innerHTML = '';
      const sections = [
        { k: 'ube', l: 'Uber Eats', cls: 'qtkit-svc-ube' },
        { k: 'demae', l: '出前館', cls: 'qtkit-svc-demae' },
        { k: 'rocket', l: 'ロケットナウ', cls: 'qtkit-svc-rocket' },
        { k: 'common', l: '共通', cls: 'qtkit-svc-common' }
      ];
      sections.forEach(sec => {
        pane.appendChild(h('span', { 'class': 'qtkit-svc-chip ' + sec.cls, text: sec.l }));
        (state.tmpl[sec.k] || []).forEach((txt, i) => {
          const item = h('div', { 'class': 'qtkit-tmpl-item' });
          item.appendChild(h('div', { 'class': 'qtkit-tmpl-text', text: txt }));
          const copyBtn = h('button', { 'class': 'qtkit-tmpl-copy', text: 'コピー' });
          copyBtn.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(txt);
              copyBtn.classList.add('ok');
              copyBtn.textContent = '✓';
              setTimeout(() => { copyBtn.classList.remove('ok'); copyBtn.textContent = 'コピー'; }, 1200);
            } catch(e) {
              // フォールバック
              const ta = document.createElement('textarea');
              ta.value = txt; document.body.appendChild(ta); ta.select();
              document.execCommand('copy'); document.body.removeChild(ta);
              copyBtn.textContent = '✓'; setTimeout(() => copyBtn.textContent = 'コピー', 1200);
            }
          });
          item.appendChild(copyBtn);
          pane.appendChild(item);
        });
      });
      pane.appendChild(h('button', {
        'class': 'qtkit-btn ghost', style: 'margin-top:12px',
        text: '✎ テンプレを編集',
        onclick: openEditor
      }));
    }
    function openEditor(){
      const pre = prompt(
        '編集: 各行が1テンプレ\n空行で区切って【Uber】【出前館】【ロケット】【共通】の順',
        [
          state.tmpl.ube.join('\n'),
          state.tmpl.demae.join('\n'),
          state.tmpl.rocket.join('\n'),
          state.tmpl.common.join('\n')
        ].join('\n\n')
      );
      if (pre === null) return;
      const blocks = pre.split(/\n\s*\n/);
      ['ube', 'demae', 'rocket', 'common'].forEach((k, i) => {
        state.tmpl[k] = (blocks[i] || '').split('\n').map(s => s.trim()).filter(Boolean);
      });
      save(state);
      render();
    }
    render();
    return pane;
  }

  // ===== PANE 3: オファー判定 =====
  function buildOffer(){
    const pane = h('div', { 'class': 'qtkit-pane' });
    const feeIn = h('input', { 'class': 'qtkit-input', type: 'number', inputmode: 'decimal', placeholder: '350' });
    const kmIn = h('input', { 'class': 'qtkit-input', type: 'number', inputmode: 'decimal', step: '0.1', placeholder: '2.5' });
    const minIn = h('input', { 'class': 'qtkit-input', type: 'number', inputmode: 'numeric', placeholder: '15' });
    const result = h('div', { 'class': 'qtkit-result', style: 'display:none' });

    function calc(){
      const fee = parseFloat(feeIn.value) || 0;
      const km = parseFloat(kmIn.value) || 0;
      const min = parseFloat(minIn.value) || 0;
      if (!fee || !km || !min) { result.style.display = 'none'; return; }
      const ymin = fee / min;
      const ykm = fee / km;
      const yhr = (fee / min) * 60;
      // 閾値ロード (ユーザー設定優先、デフォルト時給1500/分給25)
      let thresh = { minYenPerHour: 1500, minYenPerMin: 25, enabled: true, vibrate: true, sound: false };
      try {
        const s = localStorage.getItem('alert_threshold_v1');
        if (s) thresh = Object.assign(thresh, JSON.parse(s));
      } catch(e) {}
      const yenPerMin = fee / min;
      const goodHr = thresh.minYenPerHour * 1.33;  // 良い基準 = 下限x1.33 (1500→2000)
      const goodKm = 200;
      const midKm = 150;
      // 判定（ユーザー閾値ベース）
      let verdict, cls, emoji;
      if (yhr >= goodHr && ykm >= goodKm) { verdict = '受諾推奨'; cls = 'good'; emoji = '👍'; }
      else if (yhr >= thresh.minYenPerHour || ykm >= midKm) { verdict = 'やや微妙'; cls = 'mid'; emoji = '🤔'; }
      else { verdict = '見送り推奨'; cls = 'bad'; emoji = '👎'; }
      // 🚨 bad時アラート: 分給が下限以下 かつ enabled
      if (cls === 'bad' && thresh.enabled) {
        try {
          if (thresh.vibrate && navigator.vibrate) { navigator.vibrate([200, 100, 200, 100, 200]); }
          if (thresh.sound && window.AudioContext) {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator(); const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.frequency.value = 800; osc.type = 'square';
            g.gain.setValueAtTime(.15, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .5);
            osc.start(); osc.stop(ctx.currentTime + .5);
          }
        } catch(e) {}
      }

      result.style.display = 'block';
      result.innerHTML = '';
      result.appendChild(h('div', { 'class': 'qtkit-verdict ' + cls, text: emoji + ' ' + verdict }));
      result.appendChild(h('div', { 'class': 'qtkit-stat', html:
        '<span class="qtkit-stat-label">時給換算</span><span class="qtkit-stat-value">¥' + Math.round(yhr).toLocaleString() + '</span>' }));
      result.appendChild(h('div', { 'class': 'qtkit-stat', html:
        '<span class="qtkit-stat-label">分単価</span><span class="qtkit-stat-value">¥' + ymin.toFixed(1) + ' /分</span>' }));
      result.appendChild(h('div', { 'class': 'qtkit-stat', html:
        '<span class="qtkit-stat-label">Km単価</span><span class="qtkit-stat-value">¥' + Math.round(ykm).toLocaleString() + ' /km</span>' }));

      // 履歴との比較
      if (state.offerHist.length >= 3) {
        const avg = state.offerHist.reduce((a, b) => a + b.yhr, 0) / state.offerHist.length;
        const diff = yhr - avg;
        const sign = diff >= 0 ? '＋' : '−';
        result.appendChild(h('div', { 'class': 'qtkit-stat', html:
          '<span class="qtkit-stat-label">過去' + state.offerHist.length + '件平均比</span><span class="qtkit-stat-value">' + sign + '¥' + Math.abs(Math.round(diff)).toLocaleString() + '</span>' }));
      }

      // 記録ボタン
      const saveBtn = h('button', {
        'class': 'qtkit-btn', style: 'margin-top:10px', text: '📝 この判定を記録'
      });
      saveBtn.addEventListener('click', () => {
        state.offerHist.unshift({ fee, km, min, ymin, ykm, yhr, ts: Date.now() });
        if (state.offerHist.length > 50) state.offerHist.length = 50;
        save(state);
        saveBtn.textContent = '✓ 記録しました';
        saveBtn.disabled = true;
      });
      result.appendChild(saveBtn);
    }
    [feeIn, kmIn, minIn].forEach(i => i.addEventListener('input', calc));

    const r1 = h('div', { 'class': 'qtkit-row' });
    r1.appendChild(h('div', {}, [h('div', { 'class': 'qtkit-label', text: '報酬 (円)' }), feeIn]));
    r1.appendChild(h('div', {}, [h('div', { 'class': 'qtkit-label', text: '距離 (km)' }), kmIn]));
    r1.appendChild(h('div', {}, [h('div', { 'class': 'qtkit-label', text: '想定時間 (分)' }), minIn]));
    pane.appendChild(r1);
    pane.appendChild(h('button', {
      'class': 'qtkit-btn ghost', text: 'クリア', style: 'margin-top:4px',
      onclick: () => { feeIn.value = ''; kmIn.value = ''; minIn.value = ''; result.style.display = 'none'; }
    }));
    pane.appendChild(result);
    return pane;
  }

  // ===== PANE 4: 週次サマリー =====
  let weekOffset = 0;  // 0=今週, -1=先週
  function buildWeek(){
    const pane = h('div', { 'class': 'qtkit-pane' });
    pane.innerHTML = '<div class="qtkit-empty">読み込み中…</div>';
    return pane;
  }
  function renderWeek(){
    const pane = NS._panes.week;
    if (!pane) return;
    pane.innerHTML = '';

    // 今週の月曜日を取得
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dow = today.getDay(); // 0=日
    const monOfs = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setDate(monday.getDate() + monOfs + weekOffset * 7);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    const fmtDate = d => (d.getMonth()+1) + '/' + d.getDate();
    const ymd = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');

    // qt5 データ取得
    let entries = [];
    try { entries = JSON.parse(localStorage.getItem('qt5') || '[]'); } catch(e){}

    // 週の範囲でフィルタ
    const weekStart = ymd(monday), weekEnd = ymd(sunday);
    const weekData = entries.filter(e => e.date >= weekStart && e.date <= weekEnd);
    const prevMonday = new Date(monday); prevMonday.setDate(prevMonday.getDate() - 7);
    const prevSunday = new Date(sunday); prevSunday.setDate(prevSunday.getDate() - 7);
    const prevData = entries.filter(e => e.date >= ymd(prevMonday) && e.date <= ymd(prevSunday));

    // 集計関数
    const agg = data => {
      let done = 0, bonusTotal = 0;
      const bySvc = { ubereats: 0, demae: 0, rocket: 0 };
      const byDow = [0,0,0,0,0,0,0]; // 月〜日
      data.forEach(e => {
        const d = e.done || 0;
        done += d;
        if (bySvc[e.service] !== undefined) bySvc[e.service] += d;
        // ボーナス計算: done が bonuses[i].count を超えるごとに reward 加算
        let ext = parseInt(e.bonusExtra) || 0;
        if (d >= (e.goal || 0) && ext) bonusTotal += ext;
        (e.bonuses || []).forEach(b => {
          if (d >= b.count) bonusTotal += (parseInt(b.reward) || 0);
        });
        // 曜日別
        if (e.date) {
          const dt = new Date(e.date + 'T00:00');
          const dw = dt.getDay();
          const idx = dw === 0 ? 6 : dw - 1; // 月=0, 日=6
          byDow[idx] += d;
        }
      });
      return { done, bonusTotal, bySvc, byDow };
    };
    const w = agg(weekData);
    const p = agg(prevData);

    // ナビ
    const nav = h('div', { 'class': 'qtkit-week-nav' });
    nav.appendChild(h('button', {
      'class': 'qtkit-nav-btn', text: '◀ 先週',
      onclick: () => { weekOffset--; renderWeek(); }
    }));
    const lbl = weekOffset === 0 ? '今週' : weekOffset === -1 ? '先週' : (weekOffset + '週前');
    nav.appendChild(h('div', { 'class': 'qtkit-week-lbl', text: lbl + ' (' + fmtDate(monday) + ' – ' + fmtDate(sunday) + ')' }));
    const nextBtn = h('button', { 'class': 'qtkit-nav-btn', text: '翌週 ▶' });
    nextBtn.addEventListener('click', () => { if (weekOffset < 0) { weekOffset++; renderWeek(); } });
    if (weekOffset >= 0) nextBtn.style.opacity = '.3';
    nav.appendChild(nextBtn);
    pane.appendChild(nav);

    if (!weekData.length) {
      pane.appendChild(h('div', { 'class': 'qtkit-empty', text: 'この週の記録はまだありません' }));
      return;
    }

    // サマリーカード
    const summary = h('div', { 'class': 'qtkit-result' });
    summary.appendChild(h('div', { 'class': 'qtkit-result-big', text: w.done + ' 件' }));
    summary.appendChild(h('div', { 'class': 'qtkit-stat', html:
      '<span class="qtkit-stat-label">稼いだボーナス合計</span><span class="qtkit-stat-value">¥' + w.bonusTotal.toLocaleString() + '</span>' }));
    summary.appendChild(h('div', { 'class': 'qtkit-stat', html:
      '<span class="qtkit-stat-label">稼働クエスト数</span><span class="qtkit-stat-value">' + weekData.length + '</span>' }));
    // 前週比
    if (prevData.length) {
      const diffDone = w.done - p.done;
      const pct = p.done ? Math.round((diffDone / p.done) * 100) : 0;
      const sign = diffDone >= 0 ? '＋' : '';
      const color = diffDone >= 0 ? '#10b981' : '#ef4444';
      summary.appendChild(h('div', { 'class': 'qtkit-stat', html:
        '<span class="qtkit-stat-label">前週比（件数）</span><span class="qtkit-stat-value" style="color:' + color + '">' + sign + diffDone + ' 件 (' + (diffDone >= 0 ? '+' : '') + pct + '%)</span>' }));
    }
    pane.appendChild(summary);

    // 曜日別グラフ
    pane.appendChild(h('div', { 'class': 'qtkit-label', style: 'margin-top:14px', text: '曜日別件数' }));
    const barMax = Math.max(1, ...w.byDow);
    const bars = h('div', { 'class': 'qtkit-bar-row' });
    ['月','火','水','木','金','土','日'].forEach((d, i) => {
      const col = h('div', { 'class': 'qtkit-bar-col' });
      col.appendChild(h('div', { 'class': 'qtkit-bar-val', text: w.byDow[i] || '' }));
      const bar = h('div', { 'class': 'qtkit-bar' });
      bar.style.height = (w.byDow[i] / barMax * 70) + 'px';
      col.appendChild(bar);
      col.appendChild(h('div', { 'class': 'qtkit-bar-lbl', text: d }));
      bars.appendChild(col);
    });
    pane.appendChild(bars);

    // サービス別
    pane.appendChild(h('div', { 'class': 'qtkit-label', style: 'margin-top:14px', text: 'サービス別内訳' }));
    const svcBox = h('div', { 'class': 'qtkit-result', style: 'margin-top:4px' });
    const svcMap = [
      { k: 'ubereats', l: 'Uber Eats', c: '#10b981' },
      { k: 'demae', l: '出前館', c: '#ef4444' },
      { k: 'rocket', l: 'ロケット', c: '#f59e0b' }
    ];
    svcMap.forEach(s => {
      const pct = w.done ? Math.round(w.bySvc[s.k] / w.done * 100) : 0;
      svcBox.appendChild(h('div', { 'class': 'qtkit-svc-bd', html:
        '<span style="color:' + s.c + ';font-weight:700">' + s.l + '</span>' +
        '<span class="qtkit-stat-value">' + w.bySvc[s.k] + ' 件 (' + pct + '%)</span>' }));
    });
    pane.appendChild(svcBox);
  }

  function buildPanes(){
    NS._panes.otsuri = buildOtsuri();
    NS._panes.tmpl = buildTmpl();
    NS._panes.offer = buildOffer();
    NS._panes.week = buildWeek();
    NS._panes.setting = buildSetting();
    NS._body.appendChild(NS._panes.otsuri);
    NS._body.appendChild(NS._panes.tmpl);
    NS._body.appendChild(NS._panes.offer);
    NS._body.appendChild(NS._panes.week);
    NS._body.appendChild(NS._panes.setting);
  }

  // ===== BOOT =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
  NS.open = open;
  NS.close = close;
  console.log('[qtKit] v1 loaded');

  // ===== PANE ⚙️: 設定 (アラート閾値) =====
  function buildSetting(){
    const pane = h('div', { class: 'qtkit-pane' }, []);
    pane.innerHTML = ''; // 空で開始、renderで埋める
    return pane;
  }
  function renderSetting(){
    const pane = NS._panes.setting;
    if (!pane) return;
    
    // CSS 一度だけ注入
    if (!document.getElementById('qtk-setting-css-injected')) {
      const st = document.createElement('style');
      st.id = 'qtk-setting-css-injected';
      st.textContent = `
        .qtkit-setting-wrap { padding: 4px; }
        .qtkit-setting-wrap h3 { font-size: 14px; margin: 0 0 4px; color: #e6e8ef; font-weight: 700; }
        .qtkit-setting-wrap .note { font-size: 11px; color: #94a3b8; margin: 0 0 12px; line-height: 1.5; }
        .qtkit-setting-wrap .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #2a2f44; font-size: 13px; color: #e6e8ef; }
        .qtkit-setting-wrap .row:last-of-type { border-bottom: none; }
        .qtkit-setting-wrap .row input[type="number"] { width: 90px; padding: 8px 10px; border-radius: 6px; border: 1px solid #2b3549; background: #0a0e1a; color: #fff; font-size: 14px; text-align: right; }
        .qtkit-setting-wrap .row input[type="checkbox"] { width: 22px; height: 22px; cursor: pointer; accent-color: #3b82f6; }
        .qtkit-setting-wrap .save-btn { margin-top: 14px; width: 100%; padding: 12px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
        .qtkit-setting-wrap .save-btn:hover { background: #2563eb; }
        body.light-mode .qtkit-setting-wrap .row { border-bottom-color: #e2e8f0; color: #0f172a; }
        body.light-mode .qtkit-setting-wrap .row input[type="number"] { background: #fff; border-color: #cbd5e1; color: #0f172a; }
        body.light-mode .qtkit-setting-wrap h3 { color: #0f172a; }
        body.light-mode .qtkit-setting-wrap .note { color: #64748b; }
      `;
      document.head.appendChild(st);
    }
    
    let th = { minYenPerHour: 1500, minYenPerMin: 25, enabled: false, vibrate: true, sound: false };
    try { const s = localStorage.getItem('alert_threshold_v1'); if (s) th = Object.assign(th, JSON.parse(s)); } catch(e) {}
    
    pane.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'qtkit-setting-wrap';
    wrap.innerHTML = `
      <h3>🚨 オファー判定アラート</h3>
      <p class="note">「見送り推奨」判定時にバイブ・音で通知します。判定タブで時給/Km単価を入力した時に発動。</p>
      <label class="row">
        <span>アラート有効</span>
        <input type="checkbox" id="qtk-enabled" ${th.enabled ? 'checked' : ''}>
      </label>
      <label class="row">
        <span>下限時給 (¥/h)</span>
        <input type="number" id="qtk-yhr" value="${th.minYenPerHour}" min="500" max="5000" step="100">
      </label>
      <label class="row">
        <span>下限分給 (¥/min)</span>
        <input type="number" id="qtk-ymin" value="${th.minYenPerMin}" min="10" max="100" step="1">
      </label>
      <label class="row">
        <span>バイブレーション</span>
        <input type="checkbox" id="qtk-vib" ${th.vibrate ? 'checked' : ''}>
      </label>
      <label class="row">
        <span>アラート音</span>
        <input type="checkbox" id="qtk-snd" ${th.sound ? 'checked' : ''}>
      </label>
      <button class="save-btn" id="qtk-save-btn">💾 保存</button>
    `;
    pane.appendChild(wrap);
    
    pane.querySelector('#qtk-save-btn').addEventListener('click', function(){
      const newTh = {
        enabled: document.getElementById('qtk-enabled').checked,
        minYenPerHour: parseInt(document.getElementById('qtk-yhr').value) || 1500,
        minYenPerMin: parseInt(document.getElementById('qtk-ymin').value) || 25,
        vibrate: document.getElementById('qtk-vib').checked,
        sound: document.getElementById('qtk-snd').checked
      };
      try {
        localStorage.setItem('alert_threshold_v1', JSON.stringify(newTh));
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:10px 20px;border-radius:8px;z-index:99999;font-weight:700;';
        toast.textContent = '✓ 設定を保存しました';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
        if (newTh.vibrate && navigator.vibrate) navigator.vibrate(50);
      } catch(e) {}
    });
  }
  window.__qtkSaveSetting = function(){}; // backward compat stub
  
})();
