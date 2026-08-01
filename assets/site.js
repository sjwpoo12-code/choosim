document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const topbar = document.getElementById('topbar');
  const updateHeader = () => topbar?.classList.toggle('is-scrolled', window.scrollY > 12);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  document.querySelectorAll('[data-current-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const filterRow = document.getElementById('filterRow');
  const postList = document.getElementById('postList');
  if (filterRow && postList) {
    filterRow.addEventListener('click', (event) => {
      const button = event.target.closest('.chip');
      if (!button) return;
      filterRow.querySelectorAll('.chip').forEach((chip) => chip.classList.remove('on'));
      button.classList.add('on');
      const category = button.dataset.cat;
      postList.querySelectorAll('.post-card').forEach((card) => {
        card.hidden = category !== '*' && card.dataset.cat !== category;
      });
    });
  }

  const leadForm = document.getElementById('leadForm');
  if (leadForm) initLeadForm(leadForm);
});

function initLeadForm(form) {
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyhmMoDHrBFY3IbnCvQabrLrBbhM7W_iYiIHYAQ16sx5uNuGz_nf64hMg-QNnZXGXNiCQ/exec';
  const message = document.getElementById('formMsg');
  const submitButton = form.querySelector('button[type="submit"]');

  const showMessage = (text, type) => {
    message.textContent = text;
    message.className = `form-msg ${type}`;
    message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.className = 'form-msg';
    message.textContent = '';

    const name = document.getElementById('f-name').value.trim();
    const phone = document.getElementById('f-phone').value.trim();
    const consent = document.getElementById('f-consent').checked;

    if (!name || !phone) {
      showMessage('이름과 연락처를 입력해 주세요.', 'err');
      return;
    }
    if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(phone)) {
      showMessage('연락처 형식을 확인해 주세요. 예) 010-0000-0000', 'err');
      return;
    }
    if (!consent) {
      showMessage('개인정보 수집·이용에 동의해 주셔야 상담 신청을 보낼 수 있습니다.', 'err');
      return;
    }

    const data = {
      name,
      phone,
      type: document.getElementById('f-type').value,
      memo: document.getElementById('f-memo').value.trim(),
      submittedAt: new Date().toLocaleString('ko-KR')
    };

    try {
      submitButton.disabled = true;
      submitButton.innerHTML = '전송 중입니다…';
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(data)
      });

      form.reset();
      showMessage('전송 요청을 보냈습니다. 이 화면에서는 실제 저장 여부를 확인할 수 없으므로, 1영업일 안에 연락이 없으면 010-3054-9755로 전화나 문자를 부탁드립니다.', 'ok');
      if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead');
    } catch (error) {
      showMessage('전송 중 문제가 발생했습니다. 010-3054-9755로 전화나 문자를 부탁드립니다.', 'err');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '상담 신청 보내기 <span aria-hidden="true">→</span>';
    }
  });
}
