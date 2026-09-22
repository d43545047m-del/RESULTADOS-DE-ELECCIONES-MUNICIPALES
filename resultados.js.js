document.addEventListener('DOMContentLoaded', function () {
    // Reemplaza esta URL con la Web App URL de tu Google Apps Script
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzIM_LWSnbePRLDPV4fPBKdVzivluPoG-JvGqF-tQV_2jaSX6RRSh_s33M6nZpuHtQ0fw/exec";

    let resumenChart = null;

    // Cargar los resultados al entrar
    cargarResultados();

    function cargarResultados() {
        fetch(SCRIPT_URL)
            .then(response => response.json())
            .then(data => {
                // Estructura esperada del JSON: {"Lista 1": 15, "Lista 2": 20, "Lista 3": 8, "Lista 4": 12, "Lista 5": 30}
                const etiquetas = Object.keys(data);
                const votos = Object.values(data);

                renderizarGrafico(etiquetas, votos);
            })
            .catch(error => {
                console.error('Error al cargar resultados:', error);
            });
    }

    function renderizarGrafico(labels, dataValues) {
        const ctx = document.getElementById('resumenChart');
        if (!ctx) return;

        if (resumenChart) {
            resumenChart.destroy();
        }

        resumenChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total de Votos',
                    data: dataValues,
                    backgroundColor: [
                        '#00AAEE', // Lista 1
                        '#FFC107', // Lista 2
                        '#4CAF50', // Lista 3
                        '#E53935', // Lista 4
                        '#9C27B0'  // Lista 5
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
});

// Función para el botón "Ver Ganador"
function mostrarGanador() {
    const modal = document.getElementById('winnerModal');
    const winnerName = document.getElementById('winnerName');
    
    // Muestra el modal con animación y confeti
    if (modal) {
        modal.style.display = 'flex';
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }
}

function cerrarGanador() {
    const modal = document.getElementById('winnerModal');
    if (modal) {
        modal.style.display = 'none';
    }
}