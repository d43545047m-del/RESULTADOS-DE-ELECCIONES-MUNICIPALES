// Enlace CSV de tu Google Sheet
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_gJ1gJ54IEkOTwiOc2RFLEyxB1csqydki1HpIYBHEY6ujGK7uYEqd7r1VjxKdu6JO_djDiAQbg_wA/pub?output=csv";

let resumenChartInstance = null;
let gradosChartInstance = null;
let listaGanadoraNombre = "Sin votos registrados";

// DICCIONARIO DE EQUIVALENCIAS (Convierte nombres antiguos a los nuevos)
function normalizarNombreLista(votoOriginal) {
    if (!votoOriginal) return "";
    
    const texto = votoOriginal.trim().toLowerCase();

    // Mapeo a las 3 nuevas candidaturas
    if (texto.includes("progreso") || texto.includes("lista 1") || texto.includes("todas las sangres")) {
        return "Lista 1: Progreso Estudiantil";
    }
    if (texto.includes("auren") || texto.includes("lista 2") || texto.includes("líderes en acción") || texto.includes("lideres")) {
        return "Lista 2: Auren Modelista";
    }
    if (texto.includes("cambio") || texto.includes("lista 3") || texto.includes("alianza e identidad") || texto.includes("juventud modelo")) {
        return "Lista 3: Somos el Cambio";
    }

    return votoOriginal; // Retorna el texto tal cual si no coincide con las reglas anteriores
}

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
        // Columna B (index 1) = Grado | Columna C (index 2) = Voto
        if (currentline.length >= 3) {
            const gradoVal = currentline[1] ? currentline[1].replace(/"/g, '').trim() : "No especificado";
            const votoBruto = currentline[2] ? currentline[2].replace(/"/g, '').trim() : "";
            
            // Transformar el nombre antiguo al nuevo
            const votoVal = normalizarNombreLista(votoBruto);

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
    
    // Fijamos las 3 listas oficiales
    const todasLasListas = [
        "Lista 1: Progreso Estudiantil",
        "Lista 2: Auren Modelista",
        "Lista 3: Somos el Cambio"
    ];
    
    // Inicializar contadores en 0
    todasLasListas.forEach(l => conteoListas[l] = 0);

    const todosLosGrados = ["Primero 1°", "Segundo 2°", "Tercero 3°", "Cuarto 4°", "Quinto 5°", "Sexto 6°"];

    data.forEach(item => {
        const voto = item.voto;
        const grado = item.grado;

        if (voto) {
            conteoListas[voto] = (conteoListas[voto] || 0) + 1;

            if (!conteoGrados[grado]) conteoGrados[grado] = {};
            conteoGrados[grado][voto] = (conteoGrados[grado][voto] || 0) + 1;
        }
    });

    // Calcular Lista Ganadora
    let maxVotos = -1;
    todasLasListas.forEach(lista => {
        if (conteoListas[lista] > maxVotos) {
            maxVotos = conteoListas[lista];
            listaGanadoraNombre = `${lista} (${maxVotos} votos)`;
        }
    });

    // Chart 1: Resumen General
    const valoresTotales = todasLasListas.map(l => conteoListas[l] || 0);

    const ctxResumen = document.getElementById("resumenChart").getContext("2d");
    if (resumenChartInstance) resumenChartInstance.destroy();

    resumenChartInstance = new Chart(ctxResumen, {
        type: 'bar',
        data: {
            labels: todasLasListas,
            datasets: [{
                label: 'Total Votos',
                data: valoresTotales,
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

    // Chart 2: Participación por Grado
    const colores = ['#00AEEF', '#FFD700', '#E74C3C'];

    const datasetsGrados = todasLasListas.map((lista, index) => ({
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
