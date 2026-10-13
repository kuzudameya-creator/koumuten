// 無料相談・資料請求フォーム（入力 → 確認 → 完了）
(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const confirmSec = document.getElementById('confirm');
  const doneSec = document.getElementById('done');
  const summary = document.getElementById('error-summary');
  const steps = document.querySelectorAll('.steps__item');
  const groups = form.querySelectorAll('[data-show-for]');
  const typeLabels = { visit: '来場・相談予約', document: '資料請求', other: 'その他' };
  let submitted = false;

  // ---------- 種類に応じて項目を出し分け ----------
  const getType = () => form.querySelector('input[name="type"]:checked')?.value || '';

  const updateGroups = () => {
    const type = getType();
    groups.forEach((group) => {
      group.hidden = group.dataset.showFor !== type;
    });
  };
  form.querySelectorAll('input[name="type"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      updateGroups();
      if (submitted) validate();
    });
  });

  // URLの ?type=visit などで初期選択
  const param = new URLSearchParams(location.search).get('type');
  const preset = form.querySelector(`input[name="type"][value="${param}"]`);
  if (preset) preset.checked = true;
  updateGroups();

  // 希望日は今日以降のみ
  const today = new Date();
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  form.querySelectorAll('input[type="date"]').forEach((input) => { input.min = ymd(today); });

  // ---------- バリデーション ----------
  const val = (name) => (form.elements[name]?.value || '').trim();
  const isVisible = (el) => !el.closest('[hidden]');

  const rules = [
    { name: 'type', label: 'お問い合わせの種類', check: () => getType() ? '' : 'お問い合わせの種類を選択してください' },
    { name: 'name', label: 'お名前', check: () => val('name') ? '' : 'お名前を入力してください' },
    {
      name: 'kana', label: 'フリガナ', check: () => {
        if (!val('kana')) return 'フリガナを入力してください';
        return /^[ァ-ヶー\s　]+$/.test(val('kana')) ? '' : 'フリガナはカタカナで入力してください';
      }
    },
    {
      name: 'email', label: 'メールアドレス', check: () => {
        if (!val('email')) return 'メールアドレスを入力してください';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email')) ? '' : 'メールアドレスの形式が正しくありません';
      }
    },
    {
      name: 'tel', label: '電話番号', check: () => {
        const digits = val('tel').replace(/[-‐ー－\s]/g, '');
        if (!digits) return '電話番号を入力してください';
        return /^0\d{9,10}$/.test(digits) ? '' : '電話番号は10〜11桁の数字で入力してください';
      }
    },
    {
      name: 'zip', label: '郵便番号', check: () => {
        const digits = val('zip').replace(/[-‐ー－]/g, '');
        if (!digits) return '郵便番号を入力してください';
        return /^\d{7}$/.test(digits) ? '' : '郵便番号は7桁の数字で入力してください';
      }
    },
    { name: 'address', label: 'ご住所', check: () => val('address') ? '' : 'ご住所を入力してください' },
    {
      name: 'date1', label: '第1希望', check: () => {
        if (!val('date1')) return '第1希望の日付を選択してください';
        const d = new Date(val('date1') + 'T00:00:00');
        if (val('date1') < ymd(today)) return '今日以降の日付を選択してください';
        return d.getDay() === 3 ? '水曜日は定休日です。別の日を選択してください' : '';
      }
    },
    { name: 'agree', label: '個人情報の取り扱い', check: () => form.elements.agree.checked ? '' : '個人情報の取り扱いへの同意が必要です' }
  ];

  const fieldOf = (name) => {
    const el = form.elements[name];
    return el instanceof RadioNodeList ? el[0] : el;
  };

  const validate = () => {
    const errors = [];
    rules.forEach((rule) => {
      const field = fieldOf(rule.name);
      const errorEl = document.getElementById(`${rule.name}-error`);
      const message = isVisible(field) ? rule.check() : '';
      if (errorEl) errorEl.textContent = message;
      if (field.type !== 'radio' && field.type !== 'checkbox') {
        field.setAttribute('aria-invalid', message ? 'true' : 'false');
      }
      if (message) errors.push({ id: field.id || `${rule.name}-error`, message });
    });
    return errors;
  };

  const showSummary = (errors) => {
    const list = summary.querySelector('.error-summary__list');
    list.innerHTML = '';
    errors.forEach(({ id, message }) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${id}`;
      a.textContent = message;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(id);
        const focusTarget = target?.matches('input, select, textarea') ? target : target?.closest('fieldset')?.querySelector('input');
        focusTarget?.focus();
        focusTarget?.scrollIntoView({ block: 'center' });
      });
      li.appendChild(a);
      list.appendChild(li);
    });
    summary.hidden = false;
    summary.focus();
    summary.scrollIntoView({ block: 'start' });
  };

  // 一度送信を試したあとは、入力のたびにチェック
  form.addEventListener('input', () => { if (submitted) validate(); });
  form.addEventListener('change', () => { if (submitted) validate(); });

  // ---------- 画面切り替え ----------
  const setStep = (name) => {
    let reached = false;
    steps.forEach((step) => {
      const current = step.dataset.step === name;
      step.classList.toggle('is-current', current);
      step.classList.toggle('is-done', !reached && !current);
      if (current) { step.setAttribute('aria-current', 'step'); reached = true; } else { step.removeAttribute('aria-current'); }
    });
  };

  const show = (section, focusEl) => {
    [form, confirmSec, doneSec].forEach((el) => { el.hidden = el !== section; });
    document.querySelector('.steps').scrollIntoView({ block: 'start' });
    focusEl?.focus({ preventScroll: true });
  };

  // ---------- 確認画面 ----------
  const formatDate = (dateStr, time) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const w = '日月火水木金土'[d.getDay()];
    return `${d.getMonth() + 1}月${d.getDate()}日（${w}） ${time}`;
  };

  const buildConfirm = () => {
    const type = getType();
    const plans = [...form.querySelectorAll('input[name="plan"]:checked')].map((c) => c.value).join('、');
    const rows = [
      ['お問い合わせの種類', typeLabels[type]],
      ['お名前', val('name')],
      ['フリガナ', val('kana')],
      ['メールアドレス', val('email')],
      ['電話番号', val('tel')]
    ];
    if (type === 'document') {
      rows.push(['資料の送付先', `〒${val('zip')}\n${val('address')}`]);
    }
    if (type === 'visit') {
      rows.push(['第1希望', formatDate(val('date1'), val('time1'))]);
      rows.push(['第2希望', formatDate(val('date2'), val('time2')) || '指定なし']);
    }
    rows.push(['ご検討の内容', plans || '未選択']);
    rows.push(['ご質問・ご要望', val('message') || 'なし']);

    const list = confirmSec.querySelector('.confirm__list');
    list.innerHTML = '';
    rows.forEach(([label, value]) => {
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value; // textContentで入れてHTMLとして解釈させない
      list.append(dt, dd);
    });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitted = true;
    const errors = validate();
    if (errors.length) {
      showSummary(errors);
      return;
    }
    summary.hidden = true;
    buildConfirm();
    setStep('confirm');
    show(confirmSec, document.getElementById('confirm-title'));
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    setStep('input');
    show(form, form.querySelector('input[name="type"]:checked') || form.elements.name);
  });

  // ---------- 送信 ----------
  const sendBtn = document.getElementById('send-btn');
  sendBtn.addEventListener('click', async () => {
    sendBtn.disabled = true;
    sendBtn.textContent = '送信中…';
    try {
      const action = form.getAttribute('action');
      if (action && action !== '#') {
        // 送信先（Formspreeなど）が設定されている場合のみ実際に送信
        const res = await fetch(action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error('送信に失敗しました');
      } else {
        // ポートフォリオ用のデモ：送信したことにして完了画面へ
        await new Promise((r) => setTimeout(r, 600));
      }
      setStep('done');
      show(doneSec, document.getElementById('done-title'));
      form.reset();
    } catch (err) {
      alert('送信できませんでした。時間をおいて再度お試しいただくか、お電話でお問い合わせください。');
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = '送信する';
    }
  });
})();
