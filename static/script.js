// Elementos del DOM
const inputImagen = document.getElementById('inputImagen');
const dropzoneBox = document.getElementById('dropzoneBox');
const uploadIdleState = document.getElementById('uploadIdleState');
const previewContainer = document.getElementById('previewContainer');
const previewImg = document.getElementById('previewImg');
const btnCambiarImagen = document.getElementById('btnCambiarImagen');
const formulario = document.getElementById('formulario');
const btnEnviar = document.getElementById('btnEnviar');
const mensajeAlerta = document.getElementById('mensajeAlerta');

// Elementos del panel de resultados
const resThumbImg = document.getElementById('resThumbImg');
const resThumbPlaceholder = document.getElementById('resThumbPlaceholder');
const resNumeroGrande = document.getElementById('resNumeroGrande');
const resConfianzaTexto = document.getElementById('resConfianzaTexto');
const resConfianzaBarra = document.getElementById('resConfianzaBarra');

// Historial
const historialLista = document.getElementById('historialLista');
const historialEmpty = document.getElementById('historialEmpty');
const btnClearHistory = document.getElementById('btnClearHistory');
const historial = [];

// Mostrar imagen previa cuando el usuario selecciona un archivo
function cargarImagenEnPreview(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        uploadIdleState.style.display = 'none';
        previewContainer.style.display = 'flex';
        mensajeAlerta.innerHTML = '';
    };
    reader.readAsDataURL(file);
}

// Evento al elegir archivo mediante el input
inputImagen.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        cargarImagenEnPreview(this.files[0]);
    }
});

// Botón para cambiar o limpiar la imagen seleccionada
btnCambiarImagen.addEventListener('click', (e) => {
    e.stopPropagation();
    inputImagen.value = '';
    previewImg.src = '';
    uploadIdleState.style.display = 'flex';
    previewContainer.style.display = 'none';
});

// Soporte para Arrastrar y Soltar (Drag & Drop)
['dragenter', 'dragover'].forEach(eventType => {
    dropzoneBox.addEventListener(eventType, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneBox.classList.add('dragover');
    });
});

['dragleave', 'drop'].forEach(eventType => {
    dropzoneBox.addEventListener(eventType, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneBox.classList.remove('dragover');
    });
});

dropzoneBox.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files[0]) {
        inputImagen.files = files;
        cargarImagenEnPreview(files[0]);
    }
});

// Actualizar la interfaz del resultado
function mostrarResultado(numero, confianza, imgSrc) {
    // Miniatura
    resThumbImg.src = imgSrc;
    resThumbImg.style.display = 'block';
    resThumbPlaceholder.style.display = 'none';

    // Número predicho
    resNumeroGrande.textContent = numero;

    // Nivel de confianza
    resConfianzaTexto.textContent = `${confianza}%`;
    resConfianzaBarra.style.width = `${Math.min(confianza, 100)}%`;

    // Guardar en el historial reciente
    agregarAlHistorial(numero, confianza, imgSrc);
}

// Agregar elemento al historial reciente (hasta 5 items)
function agregarAlHistorial(numero, confianza, imgSrc) {
    historial.unshift({ numero, confianza, imgSrc });
    if (historial.length > 5) {
        historial.pop();
    }
    renderHistorial();
}

function renderHistorial() {
    if (historial.length === 0) {
        historialLista.innerHTML = `
            <div class="historial-empty" id="historialEmpty">
                Aún no se han realizado análisis en esta sesión.
            </div>
        `;
        return;
    }

    historialLista.innerHTML = historial.map(item => `
        <div class="historial-item">
            <div class="historial-left">
                <div class="historial-thumb-box">
                    <img src="${item.imgSrc}" alt="Número">
                </div>
                <span class="historial-pred-text">Predicción: <strong>${item.numero}</strong></span>
            </div>
            <span class="historial-confianza">${item.confianza}%</span>
        </div>
    `).join('');
}

// Botón para borrar el historial
btnClearHistory.addEventListener('click', () => {
    historial.length = 0;
    renderHistorial();
});

// Envío del formulario al backend Flask mediante Fetch
formulario.addEventListener('submit', async function(e) {
    e.preventDefault();

    const file = inputImagen.files[0];
    if (!file) {
        mensajeAlerta.innerHTML = `
            <div class="alerta-error">Por favor selecciona o arrastra una imagen antes de analizar.</div>
        `;
        return;
    }

    btnEnviar.disabled = true;
    btnEnviar.innerHTML = `
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        <span>Analizando...</span>
    `;
    mensajeAlerta.innerHTML = '';

    const formData = new FormData();
    formData.append('imagen', file);

    try {
        const response = await fetch('/predecir', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.numero_predicho !== undefined) {
            mostrarResultado(data.numero_predicho, data.confianza, previewImg.src);
        } else {
            mensajeAlerta.innerHTML = `
                <div class="alerta-error">Error: ${data.error || 'No se pudo procesar la imagen.'}</div>
            `;
        }
    } catch (error) {
        mensajeAlerta.innerHTML = `
            <div class="alerta-error">Error al conectar con el servidor Flask. Verifica que app.py esté corriendo.</div>
        `;
    } finally {
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = `
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>Analizar Imagen</span>
        `;
    }
});
