// Reemplaza esta URL con el enlace CSV que copiaste en el Paso 1
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_gJ1gJ54IEkOTwi0c2RFLEyxB1csqydki1HplYBHEY6ujGK7uYEqd7r1VjxKdu6JO_djDiAQbg_wA/pub?output=csv";

let resumenChartInstance = null;
let gradosChartInstance = null;
let listaGanadoraNombre = "Sin votos registrados";

document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
});

async function cargarDatos() {
    const elemEstado = document.getElementById("estadoCarga");
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        
        if (elemEstado) elemEstado.style.display = "none";

        const data = parseCSV(csvText);
        procesarYGraficar(data);
    } catch (error) {
        console.error("Error al cargar datos:", error);
        if (elemEstado) {
            elemEstado.innerText = "❌ Error al conectar con Google Sheets. Verifica que la hoja esté publicada en la web.";
            elemEstado.style.color = "#E74C3C";
        }
    }
}

// Convertidor de CSV a Array de Objetos
function parseCSV(text) {
    const lines = text.trim().split("\n");
    if (lines.length <= 1) return [];

    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const currentline = lines[i].split(",");
        // Columna B (índice 1) = Grado | Columna C (índice 2) = Voto
        if (currentline.length >= 3) {
            const gradoVal = currentline[1] ? currentline[1].replace(/"/g, '').trim() : "No especificado";
            const votoVal = currentline[2] ? currentline[2].replace(/"/g, '').trim() : "";
            
            if (votoVal && votoVal !== "-") {
                result.push({ grado: gradoVal, voto: votoVal });
            }
        }
    }
    return result;
}

function procesarYGraficar(data) {
    if (!Array.isArray(data) || data.length === 0) {
        const elemEstado = document.getElementById("estadoCarga");
        if (elemEstado) {
            elemEstado.innerText = "ℹ️ No hay votos registrados aún.";
            elemEstado.style.display = "block";
        }
        return;
    }

    const conteoListas = {};
    const conteoGrados = {};
    const todasLasListas = new Set();
    const todosLosGrados = ["Primero 1°", "Segundo 2°", "Tercero 3°", "Cuarto 4°", "Quinto 5°", "Sexto 6°"];

    data.forEach(item => {
        const voto = item.voto;
        const grado = item.grado;

        if (voto) {
            conteoListas[voto] = (conteoListas[voto] || 0) + 1;
            todasLasListas.add(voto);

            if (!conteoGrados[grado]) conteoGrados[grado] = {};
            conteoGrados[grado][voto] = (conteoGrados[grado][voto] || 0) + 1;
        }
    });

    // Calcular Lista Ganadora
    let maxVotos = 0;
    Object.keys(conteoListas).forEach(lista => {
        if (conteoListas[lista] > maxVotos) {
            maxVotos = conteoListas[lista];
            listaGanadoraNombre = `${lista} (${maxVotos} votos)`;
        }
    });

    // Chart 1: Resumen General
    const labelsTotales = Array.from(todasLasListas);
    const valoresTotales = labelsTotales.map(l => conteoListas[l] || 0);

    const ctxResumen = document.getElementById("resumenChart").getContext("2d");
    if (resumenChartInstance) resumenChartInstance.destroy();

    resumenChartInstance = new Chart(ctxResumen, {
        type: 'bar',
        data: {
            labels: labelsTotales,
            datasets: [{
                label: 'Total Votos',
                data: valoresTotales,
                backgroundColor: ['#00AEEF', '#FFD700', '#2ECC71', '#E74C3C', '#9B59B6'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    // Chart 2: Participación por Grado
    const arrayListas = Array.from(todasLasListas);
    const colores = ['#00AEEF', '#FFD700', '#2ECC71', '#E74C3C', '#9B59B6'];

    const datasetsGrados = arrayListas.map((lista, index) => ({
        label: lista,
        data: todosLosGrados.map(g => (conteoGrados[g] && conteoGrados[g][lista]) ? conteoGrados[g][lista] : 0),
        backgroundColor: colores[index % colores.length],
        borderRadius: 6
    }));

    const ctxGrados = document.getElementById("gradosChart").getContext("2d");
    if (gradosChartInstance) gradosChartInstance.destroy();

    gradosChartInstance = new Chart(ctxGrados, {
        type: 'bar',
        data: { labels: todosLosGrados, datasets: datasetsGrados },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function mostrarGanador() {
    document.getElementById("winnerName").innerText = listaGanadoraNombre;
    document.getElementById("winnerModal").style.display = "flex";
    if (typeof confetti === "function") {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
}

function cerrarGanador() {
    document.getElementById("winnerModal").style.display = "none";
}
