// Enlace CSV de tu Google Sheet
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_gJ1gJ54IEkOTwiOc2RFLEyxB1csqydki1HpIYBHEY6ujGK7uYEqd7r1VjxKdu6JO_djDiAQbg_wA/pub?output=csv";

let resumenChartInstance = null;
let gradosChartInstance = null;
let listaGanadoraNombre = "Sin votos registrados";

// Normalización ultra flexible
function normalizarNombreLista(votoOriginal) {
    if (!votoOriginal) return "";
    const texto = votoOriginal.toString().toLowerCase();

    if (texto.includes("progreso") || texto.includes("lista 1")) return "Lista 1: Progreso Estudiantil";
    if (texto.includes("auren") || texto.includes("lista 2")) return "Lista 2: Auren Modelista";
    if (texto.includes("cambio") || texto.includes("lista 3")) return "Lista 3: Somos el Cambio";

    return "";
}

document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
});

async function cargarDatos() {
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        const data = parseCSV(csvText);
        procesarYGraficar(data);
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
}

function parseCSV(text) {
    const lines = text.trim().split("\n");
    if (lines.length <= 1) return [];

    const result = [];
    for (let i = 1; i < lines.length; i++) {
        // Limpiar comillas y dividir por comas
        const currentline = lines[i].replace(/"/g, '').split(",");
        if (currentline.length >= 2) {
            const gradoVal = currentline[1] ? currentline[1].trim() : "No especificado";
            const votoBruto = currentline[2] ? currentline[2].trim() : (currentline[1] ? currentline[1].trim() : "");
            
            const votoVal = normalizarNombreLista(votoBruto);
            if (votoVal) {
                result.push({ grado: gradoVal, voto: votoVal });
            }
        }
    }
    return result;
}

function procesarYGraficar(data) {
    const conteoListas = {
        "Lista 1: Progreso Estudiantil": 0,
        "Lista 2: Auren Modelista": 0,
        "Lista 3: Somos el Cambio": 0
    };

    const conteoGrados = {};
    const todasLasListas = Object.keys(conteoListas);
    const todosLosGrados = ["Primero 1°", "Segundo 2°", "Tercero 3°", "Cuarto 4°", "Quinto 5°", "Sexto 6°"];

    data.forEach(item => {
        if (conteoListas.hasOwnProperty(item.voto)) {
            conteoListas[item.voto]++;
            if (!conteoGrados[item.grado]) conteoGrados[item.grado] = {};
            conteoGrados[item.grado][item.voto] = (conteoGrados[item.grado][item.voto] || 0) + 1;
        }
    });

    // Determinar ganador
    let maxVotos = -1;
    todasLasListas.forEach(lista => {
        if (conteoListas[lista] > maxVotos) {
            maxVotos = conteoListas[lista];
            listaGanadoraNombre = `${lista} (${maxVotos} votos)`;
        }
    });

    // Gráfico 1: Resumen
    const ctxResumen = document.getElementById("resumenChart");
    if (ctxResumen) {
        if (resumenChartInstance) resumenChartInstance.destroy();
        resumenChartInstance = new Chart(ctxResumen.getContext("2d"), {
            type: 'bar',
            data: {
                labels: todasLasListas,
                datasets: [{
                    label: 'Total Votos',
                    data: todasLasListas.map(l => conteoListas[l]),
                    backgroundColor: ['#00AEEF', '#FFD700', '#E74C3C'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }

    // Gráfico 2: Por Grado
    const ctxGrados = document.getElementById("gradosChart");
    if (ctxGrados) {
        if (gradosChartInstance) gradosChartInstance.destroy();
        const colores = ['#00AEEF', '#FFD700', '#E74C3C'];
        
        const datasetsGrados = todasLasListas.map((lista, index) => ({
            label: lista,
            data: todosLosGrados.map(g => (conteoGrados[g] && conteoGrados[g][lista]) ? conteoGrados[g][lista] : 0),
            backgroundColor: colores[index],
            borderRadius: 6
        }));

        gradosChartInstance = new Chart(ctxGrados.getContext("2d"), {
            type: 'bar',
            data: { labels: todosLosGrados, datasets: datasetsGrados },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }
}

function mostrarGanador() {
    const elemWinner = document.getElementById("winnerName");
    const elemModal = document.getElementById("winnerModal");
    if (elemWinner) elemWinner.innerText = listaGanadoraNombre;
    if (elemModal) elemModal.style.display = "flex";
    if (typeof confetti === "function") confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
}

function cerrarGanador() {
    const elemModal = document.getElementById("winnerModal");
    if (elemModal) elemModal.style.display = "none";
}
