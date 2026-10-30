// Enlace CSV de tu Google Sheet
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_gJ1gJ54IEkOTwiOc2RFLEyxB1csqydki1HpIYBHEY6ujGK7uYEqd7r1VjxKdu6JO_djDiAQbg_wA/pub?output=csv";

let resumenChartInstance = null;
let gradosChartInstance = null;
let listaGanadoraNombre = "Sin votos registrados";

// DICCIONARIO DE EQUIVALENCIAS FLEXIBLE
function normalizarNombreLista(votoOriginal) {
    if (!votoOriginal) return "";
    
    const texto = votoOriginal.trim().toLowerCase();

    // Detección por palabra clave o número de lista
    if (texto.includes("progreso") || texto.includes("lista 1")) {
        return "Lista 1: Progreso Estudiantil";
    }
    if (texto.includes("auren") || texto.includes("lista 2")) {
        return "Lista 2: Auren Modelista";
    }
    if (texto.includes("cambio") || texto.includes("lista 3")) {
        return "Lista 3: Somos el Cambio";
    }

    return "";
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
            
            // Normalizar el texto del voto
            const votoVal = normalizarNombreLista(votoBruto);

            if (votoVal && votoVal !== "-") {
                result.push({ grado: gradoVal,
