document.addEventListener('DOMContentLoaded', function () {

    const user = Auth.getCurrentUser();
    if (!user) {
        showToast('Для перегляду бронювань потрібно увійти', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    renderBookings();
});

function renderBookings() {
    const user    = Auth.getCurrentUser();
    const container = document.getElementById('bookings-list');
    const all     = JSON.parse(localStorage.getItem('vr_bookings') || '[]');
    const mine    = all.filter(b => b.userEmail === user.email);

    if (mine.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:48px 0; color:#777;">
                <div style="font-size:48px; margin-bottom:16px;">🗓️</div>
                <p style="font-size:16px; margin-bottom:20px;">У вас ще немає жодного бронювання</p>
                <a href="rooms.html" style="background:#4a7c59; color:white; text-decoration:none;
                   padding:12px 28px; border-radius:4px; font-size:14px;">Переглянути номери</a>
            </div>
        `;
        return;
    }

    const sorted = [...mine].sort((a, b) => b.id - a.id);

    container.innerHTML = sorted.map(b => {
        const statusColor = {
            'Очікує підтвердження': { bg: '#fff3cd', color: '#856404' },
            'Підтверджено':         { bg: '#d4edda', color: '#2f5239' },
            'Скасовано':            { bg: '#f8d7da', color: '#721c24' },
        }[b.status] || { bg: '#eee', color: '#555' };

        const canCancel = b.status === 'Очікує підтвердження';

        return `
            <div style="border:1px solid #ddd; border-radius:8px; padding:20px 24px;
                        margin-bottom:16px; background:white; transition: box-shadow .2s;"
                 onmouseover="this.style.boxShadow='0 2px 12px rgba(0,0,0,0.08)'"
                 onmouseout="this.style.boxShadow='none'">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                    <h3 style="margin:0; color:#4a7c59; font-size:18px;">${b.room}</h3>
                    <span style="background:${statusColor.bg}; color:${statusColor.color};
                                 padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold;">
                        ${b.status}
                    </span>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:14px; color:#555; margin-bottom:14px;">
                    <div><strong>Заїзд:</strong> ${formatDate(b.dateFrom)}</div>
                    <div><strong>Виїзд:</strong> ${formatDate(b.dateTo)}</div>
                    <div><strong>Кількість діб:</strong> ${b.days}</div>
                    <div><strong>Вартість:</strong> ${b.total.toLocaleString('uk-UA')} грн</div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <span style="font-size:12px; color:#aaa;">Створено: ${b.createdAt} · ID: ${b.id}</span>
                    ${canCancel
                        ? `<button onclick="cancelBooking(${b.id})"
                              style="background:white; color:#c0392b; border:1px solid #c0392b;
                                     padding:7px 18px; border-radius:4px; font-size:13px; cursor:pointer;
                                     transition:background .2s;"
                              onmouseover="this.style.background='#fdf0f0'"
                              onmouseout="this.style.background='white'">
                              Скасувати
                           </button>`
                        : ''
                    }
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(str) {
    if (!str) return '—';
    const [y, m, d] = str.split('-');
    return `${d}.${m}.${y}`;
}

function cancelBooking(id) {
    if (!confirm('Ви впевнені, що хочете скасувати це бронювання?')) return;

    const all = JSON.parse(localStorage.getItem('vr_bookings') || '[]');
    const idx = all.findIndex(b => b.id === id);
    if (idx !== -1) {
        all[idx].status = 'Скасовано';
        localStorage.setItem('vr_bookings', JSON.stringify(all));
        showToast('Бронювання скасовано', 'info');
        renderBookings();
    }
}