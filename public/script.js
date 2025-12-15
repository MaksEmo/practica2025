document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('applicationForm');

    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault(); // 1. Останавливаем стандартную отправку

            // 2. Сбрасываем стили ошибок Bootstrap
            const inputs = form.querySelectorAll('.form-control, .form-select');
            inputs.forEach(input => {
                input.classList.remove('is-invalid');
                const feedback = input.parentNode.querySelector('.invalid-feedback');
                if (feedback) feedback.style.display = 'none';
            });

            // 3. Проверяем, проходит ли форма валидацию браузера (required, pattern)
            // Это важно для соответствия дорожной карте (8 декабря: клиентская валидация)
            if (!form.checkValidity()) {
                // Если форма не проходит валидацию, вызываем reportValidity(),
                // чтобы браузер показал стандартные сообщения об ошибках.
                // Это может перекрыть кастомные сообщения, но гарантирует, что пользователь увидит ошибку.
                // Альтернатива - ручная проверка каждого поля, но checkValidity + reportValidity проще.
                form.reportValidity();
                // Не продолжаем выполнение, если форма не валидна
                return;
            }

            // 4. Проверка антиспам-поля
            const formData = new FormData(form);
            if (formData.get('bot-field')) {
                 alert('Обнаружен спам!');
                 return; // Прерываем отправку, если поле заполнено
            }

            try {
                const response = await fetch('/submit', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    // 5. Отправка события в Яндекс.Метрику при успешной отправке (11 декабря)
                    // Проверяем, существует ли функция ym (чтобы не было ошибки, если код аналитики не загрузился)
                    if (typeof ym === 'function') {
                        ym(XXXXXXX, 'reachGoal', 'form_submit'); // Замените XXXXXXX на ID вашего счётчика
                    }
                    // Перенаправление на страницу успеха
                    window.location.href = '/thank-you';

                } else {
                    // 6. Обработка ошибок от сервера (валидация, БД и т.д.)
                    const errorResult = await response.json();
                    console.error('Ошибка отправки:', errorResult);

                    if (errorResult.errors) {
                        // Показываем ошибки под соответствующими полями
                        errorResult.errors.forEach(errorMsg => {
                            if (errorMsg.includes('Имя')) {
                                const nameInput = document.getElementById('name');
                                nameInput.classList.add('is-invalid');
                                const feedback = nameInput.parentNode.querySelector('.invalid-feedback');
                                if (feedback) {
                                    feedback.textContent = errorMsg;
                                    feedback.style.display = 'block';
                                }
                            }
                            if (errorMsg.includes('Телефон')) {
                                const phoneInput = document.getElementById('phone');
                                phoneInput.classList.add('is-invalid');
                                const feedback = phoneInput.parentNode.querySelector('.invalid-feedback');
                                if (feedback) {
                                    feedback.textContent = errorMsg;
                                    feedback.style.display = 'block';
                                }
                            }
                            // Можно добавить проверки для других полей по аналогии
                        });
                    } else {
                         // Если сервер не вернул конкретных ошибок, показываем общее сообщение
                         alert('Произошла ошибка при отправке формы. Попробуйте позже.');
                    }
                }
            } catch (error) {
                // 7. Обработка ошибок сети или других JS-ошибок
                console.error('Ошибка сети или парсинга:', error);
                alert('Произошла ошибка при отправке формы. Проверьте подключение к интернету.');
            }
        });
    }

    // Логика для бургер-меню не нужна, так как Bootstrap её предоставляет
});
// Весь код находится внутри DOMContentLoaded, лишних блоков нет.