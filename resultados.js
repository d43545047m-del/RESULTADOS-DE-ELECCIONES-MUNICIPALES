const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzIM_LWSnbePRLDPV4fPBKdVzivluPoG-JvGqF-tQV_2jaSX6RRSh_s33M6nZpuHtQ0fw/exec";

let resumenChartInstance = null;
let gradosChartInstance = null;
let listaGanadoraNombre = "Sin votos registrados";

document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
});

async function cargarDatos() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();

        procesarYGraficar(data);
    } catch (error) {
        console.error("Error al cargar los votos de Google Sheets:", error);
    }
}

function procesarYGraficar(data) {
    const conteoListas = {};
    const conteoGrados = {}; 
    const todasLasListas = new Set();
    const todosLosGrados = ["Primero 1°", "Segundo 2°", "Tercero 3°", "Cuarto 4°", "Quinto 5°", "Sexto 6°"];

    // Procesar filas de Google Sheets
    data.forEach(item => {
        const voto = item.voto;
        const grado = item.grado || "No especificado";

        if (voto) {
            conteoListas[voto] = (conteoListas[voto] || 0) + 1;
            todasLasListas.add(voto);

            if (!conteoGrados[grado]) conteoGrados[grado] = {};
            conteoGrados[grado][voto] = (conteoGrados[grado][voto] || 0) + 1;
        }
    });

    // Determinar la lista ganadora
    let maxVotos = 0;
    Object.keys(conteoListas).forEach(lista => {
        if (conteoListas[lista] > maxVotos) {
            maxVotos = conteoListas[lista];
            listaGanadoraNombre = `${lista} (${maxVotos} votos)`;
        }
    });

    // 1. Gráfico Total de Votos
    const labelsTotales = Array.from(todasLasListas);
    const valoresTotales = labelsTotales.map(l => conteoListas[l] || 0);

    const ctxResumen = document.getElementById("resumenChart").getContext("2d");
    if (resumenChartInstance) resumenChartInstance.destroy();

    resumenChartInstance = new Chart(ctxResumen, {
        type: 'bar',
        data: {
            labels: labelsTotales,
            datasets: [{
                label: 'Total de Votos',
                data: valoresTotales,
                backgroundColor: ['#00AEEF', '#FFD700', '#2ECC71', '#E74C3C', '#9B59B6'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    // 2. Gráfico por Grado
    const arrayListas = Array.from(todasLasListas);
    const colores = ['#00AEEF', '#FFD700', '#2ECC71', '#E74C3C', '#9B59B6'];
    
    const datasetsGrados = arrayListas.map((lista, index) => {
        return {
            label: lista,
            data: todosLosGrados.map(g => (conteoGrados[g] && conteoGrados[g][lista]) ? conteoGrados[g][lista] : 0),
            backgroundColor: colores[index % colores.length],
            borderRadius: 6
        };
    });

    const ctxGrados = document.getElementById("gradosChart").getContext("2d");
    if (gradosChartInstance) gradosChartInstance.destroy();

    gradosChartInstance = new Chart(ctxGrados, {
        type: 'bar',
        data: {
            labels: todosLosGrados,
            datasets: datasetsGrados
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function mostrarGanador() {
    document.getElementById("winnerName").innerText = listaGanadoraNombre;
    const modal = document.getElementById("winnerModal");
    modal.style.display = "flex";

    // Efecto Confeti
    if (typeof confetti === "function") {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

function cerrarGanador() {
    document.getElementById("winnerModal").style.display = "none";
}
