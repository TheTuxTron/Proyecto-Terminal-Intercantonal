function loadHeader() {
    fetch('/views/headerA.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header').innerHTML = data;
        })
        .catch(error => console.error('Error al cargar el header:', error));
}

function loadFooter() {
    fetch('/views/footerA.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer').innerHTML = data;
        })
        .catch(error => console.error('Error al cargar el footer:', error));
}

loadHeader();
loadFooter();
