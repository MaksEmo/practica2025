// загрузка dom
document.addEventListener('DOMContentLoaded', function () {
    const burgerMenu = document.getElementById('burger-menu');
    const navList = document.querySelector('.nav-list');
    console.log("DOM загружен");

    // функция переключения активного класса у меню
    function toggleMenu() {
        navList.classList.toggle('active');
    }

    // обработчик события клика на бургер
    if (burgerMenu) {
        burgerMenu.addEventListener('click', toggleMenu);
    }

    // Закрывать меню при клике на ссылку
    document.querySelectorAll('.nav-list a').forEach(link => {
        link.addEventListener('click', () => {
            if (navList.classList.contains('active')) {
                navList.classList.remove('active');
            }
        });
    });
});