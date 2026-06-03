document.addEventListener('DOMContentLoaded', function () {

    // Перевірка авторизації
    const user = Auth.getCurrentUser();
    if (!user) {
        showToast('Для доступу до кабінету потрібно увійти', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    // Відображення поточних даних
    document.getElementById('profile-name-display').textContent = user.name;
    document.getElementById('profile-email-display').textContent = user.email;

    // --- Зміна імені ---
    const changeNameForm = document.getElementById('change-name-form');
    changeNameForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const newName = document.getElementById('new-name').value.trim();

        if (newName.length < 2) {
            showToast("Ім'я має містити щонайменше 2 символи", 'error');
            return;
        }

        // Оновити в масиві користувачів
        const users = Auth.getUsers();
        const idx = users.findIndex(u => u.email === user.email);
        if (idx !== -1) {
            users[idx].name = newName;
            Auth.saveUsers(users);
        }

        // Оновити поточну сесію
        const updatedUser = { name: newName, email: user.email };
        localStorage.setItem('vr_current_user', JSON.stringify(updatedUser));

        document.getElementById('profile-name-display').textContent = newName;
        document.getElementById('new-name').value = '';

        // Оновити навігацію
        const navName = document.querySelector('.nav-user-name');
        if (navName) navName.textContent = '👤 ' + newName;

        showToast("Ім'я успішно змінено!", 'success');
    });

    // --- Зміна пароля ---
    const changePassForm = document.getElementById('change-password-form');
    changePassForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const oldPass     = document.getElementById('old-password').value;
        const newPass     = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;

        const users = Auth.getUsers();
        const idx = users.findIndex(u => u.email === user.email);

        if (idx === -1 || users[idx].password !== oldPass) {
            showToast('Поточний пароль введено невірно', 'error');
            return;
        }
        if (newPass.length < 6) {
            showToast('Новий пароль має бути не менше 6 символів', 'error');
            return;
        }
        if (newPass !== confirmPass) {
            showToast('Паролі не збігаються', 'error');
            return;
        }

        users[idx].password = newPass;
        Auth.saveUsers(users);

        document.getElementById('old-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';

        showToast('Пароль успішно змінено!', 'success');
    });
});