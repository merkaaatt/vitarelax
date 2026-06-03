function renderBookingSection() {
    const section = document.getElementById('booking-section');
    if (!section) return;

    const user = Auth.getCurrentUser();

    if (!user) {
        section.innerHTML = `
            <div style="background:#fff3cd; border:1px solid #ffc107; border-radius:6px; padding:20px; text-align:center; margin:16px 0;">
                <p style="margin:0 0 12px 0; color:#856404; font-size:15px;">
                     Для бронювання номера необхідно увійти до акаунта
                </p>
                <a href="login.html" style="background:#4a7c59; color:white; text-decoration:none; padding:10px 24px; border-radius:4px; margin-right:10px; font-size:14px;">Увійти</a>
                <a href="register.html" style="background:white; color:#4a7c59; text-decoration:none; padding:10px 24px; border-radius:4px; border:1px solid #4a7c59; font-size:14px;">Зареєструватись</a>
            </div>
        `;
        return;
    }

    const prices = (function() {
        const saved = localStorage.getItem('vitarelax_prices');
        return saved ? JSON.parse(saved) : { rooms: { standard: 1000, improved: 1500, lux: 2000 } };
    })();

    const today = new Date().toISOString().split('T')[0];

    section.innerHTML = `
        <div style="background:#f0f7f2; border:1px solid #c8dece; border-radius:8px; padding:28px; margin:16px 0;">
            <h2 style="color:#4a7c59; margin-top:0; border:none;">Забронювати номер</h2>
            <p style="color:#777; font-size:14px; margin-top:0;">Бронювання для: <strong>${user.name}</strong></p>
            <form id="booking-form" style="max-width:500px;">
                <label for="book-room">Тип номера</label>
                <select id="book-room" style="padding:10px 12px; border:1px solid #c8dece; border-radius:4px; font-size:14px; width:100%; box-sizing:border-box; margin-bottom:8px; background:white;">
                    <option value="standard" data-price="${prices.rooms.standard}">Стандарт — ${prices.rooms.standard} грн/доба</option>
                    <option value="improved" data-price="${prices.rooms.improved}">Покращений — ${prices.rooms.improved} грн/доба</option>
                    <option value="lux" data-price="${prices.rooms.lux}">Люкс — ${prices.rooms.lux} грн/доба</option>
                </select>

                <label for="book-from">Дата заїзду</label>
                <input type="date" id="book-from" min="${today}" style="padding:10px 12px; border:1px solid #c8dece; border-radius:4px; font-size:14px; width:100%; box-sizing:border-box; margin-bottom:8px;">

                <label for="book-to">Дата виїзду</label>
                <input type="date" id="book-to" min="${today}" style="padding:10px 12px; border:1px solid #c8dece; border-radius:4px; font-size:14px; width:100%; box-sizing:border-box; margin-bottom:8px;">

                <div id="booking-price-preview" style="background:white; border:2px solid #4a7c59; border-radius:6px; padding:14px 18px; margin:12px 0; text-align:center; min-height:48px; display:none;">
                    <span style="font-size:13px; color:#777;">Орієнтовна вартість: </span>
                    <strong id="booking-price-amount" style="color:#4a7c59; font-size:20px;"></strong>
                </div>

                <input type="submit" value="Підтвердити бронювання"
                    style="background:#4a7c59; color:white; border:none; padding:12px; border-radius:4px; font-size:15px; cursor:pointer; width:100%; box-sizing:border-box; margin-top:4px;">
            </form>
        </div>
    `;

    const fromInput = document.getElementById('book-from');
    const toInput   = document.getElementById('book-to');
    const roomSel   = document.getElementById('book-room');
    const preview   = document.getElementById('booking-price-preview');
    const priceAmt  = document.getElementById('booking-price-amount');

    function updatePreview() {
        const from = new Date(fromInput.value);
        const to   = new Date(toInput.value);
        if (!fromInput.value || !toInput.value || to <= from) {
            preview.style.display = 'none';
            return;
        }
        const days  = Math.round((to - from) / (1000 * 60 * 60 * 24));
        const price = parseInt(roomSel.selectedOptions[0].dataset.price);
        const total = days * price;
        priceAmt.textContent = total.toLocaleString('uk-UA') + ' грн (' + days + ' діб)';
        preview.style.display = 'block';
    }

    fromInput.addEventListener('change', updatePreview);
    toInput.addEventListener('change', updatePreview);
    roomSel.addEventListener('change', updatePreview);

    document.getElementById('booking-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const roomVal  = roomSel.value;
        const roomText = roomSel.selectedOptions[0].text.split('—')[0].trim();
        const fromVal  = fromInput.value;
        const toVal    = toInput.value;

        if (!fromVal || !toVal) {
            showToast('Оберіть дати заїзду та виїзду', 'error');
            return;
        }

        const fromDate = new Date(fromVal);
        const toDate   = new Date(toVal);

        if (toDate <= fromDate) {
            showToast('Дата виїзду має бути пізніше дати заїзду', 'error');
            return;
        }

        const days  = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));
        const price = parseInt(roomSel.selectedOptions[0].dataset.price);
        const total = days * price;

        const bookings = JSON.parse(localStorage.getItem('vr_bookings') || '[]');
        const newBooking = {
            id:        Date.now(),
            userEmail: user.email,
            userName:  user.name,
            room:      roomText,
            roomKey:   roomVal,
            dateFrom:  fromVal,
            dateTo:    toVal,
            days:      days,
            total:     total,
            status:    'Очікує підтвердження',
            createdAt: new Date().toLocaleDateString('uk-UA')
        };

        bookings.push(newBooking);
        localStorage.setItem('vr_bookings', JSON.stringify(bookings));

        showToast('Бронювання успішно створено! ✓', 'success');

        fromInput.value = '';
        toInput.value   = '';
        preview.style.display = 'none';

        setTimeout(() => {
            if (confirm('Бронювання збережено. Перейти до "Мої бронювання"?')) {
                window.location.href = 'bookings.html';
            }
        }, 1500);
    });
}

document.addEventListener('DOMContentLoaded', renderBookingSection);