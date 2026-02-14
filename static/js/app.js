// Variables globales
let datosActuales = null;
let nucActual = '';

/**
 * Función principal para búsqueda
 */
async function buscar(pagina = 1) {
    // Referencias DOM
    const nucInput = document.getElementById('nucInput');
    const skeleton = document.getElementById('skeletonLoader'); // Nuevo Skeleton
    const errorDiv = document.getElementById('error');
    const errorMsg = document.getElementById('errorMsg');
    const resultados = document.getElementById('resultados');
    const sinResultados = document.getElementById('sinResultados');
    const btnBuscar = document.getElementById('btnBuscar');
    const debugContent = document.getElementById('debug-content');

    if (!nucInput) return; // Seguridad básica

    const nuc = nucInput.value.trim();
    if (!nuc) {
        mostrarError('Por favor escribe un NUC para buscar.');
        return;
    }

    nucActual = nuc;

    // --- ESTADO: CARGANDO ---
    // Ocultar todo lo previo
    resultados.classList.add('hidden');
    sinResultados.classList.add('hidden');
    errorDiv.classList.add('hidden');

    // Mostrar Skeleton Loader
    skeleton.classList.remove('hidden');
    // skeleton.classList.add('grid'); // REMOVED: Skeleton is now a block/stack

    // UI Botón
    btnBuscar.disabled = true;
    const originalBtnContent = btnBuscar.innerHTML;
    btnBuscar.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    btnBuscar.classList.add('opacity-80', 'cursor-wait');

    // Debug log
    if (debugContent) debugContent.innerHTML += `<br>> Iniciando consulta para NUC: ${nuc}...`;

    try {
        const response = await fetch('/api/buscar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuc: nuc, pagina: pagina, registros: 15 }) // 15 para tabla
        });

        const data = await response.json();

        // Validar respuesta
        if (!response.ok || (data.debug && data.debug.status_code !== 200)) {
            throw new Error(data.error || 'Error del servidor remoto');
        }

        datosActuales = data.data;

        // Simular un pequeño delay para que se aprecie la animación (opcional, UX)
        // await new Promise(r => setTimeout(r, 800)); 

        mostrarResultadosModernos(data.data);

        if (debugContent) debugContent.innerHTML += `<br>> <span class="text-green-400">Éxito: ${data.data.totalRegistros} registros.</span>`;

    } catch (error) {
        console.error(error);
        mostrarError(error.message);
        if (debugContent) debugContent.innerHTML += `<br>> <span class="text-red-400">Error: ${error.message}</span>`;
    } finally {
        // --- ESTADO: FINALIZADO ---
        skeleton.classList.add('hidden');
        // skeleton.classList.remove('grid'); // REMOVED

        btnBuscar.disabled = false;
        btnBuscar.innerHTML = '<span>Explorar</span>';
        btnBuscar.classList.remove('opacity-80', 'cursor-wait');
    }
}

/**
 * Renderiza TABLA Moderna (Corporate Style)
 */
function mostrarResultadosModernos(data) {
    const datos = data.datos || [];
    const tbody = document.getElementById('tableBody');

    // Validar si hay datos
    if (datos.length === 0) {
        document.getElementById('sinResultados').classList.remove('hidden');
        return;
    }

    // Actualizar contadores
    document.getElementById('totalRegistros').textContent = data.totalRegistros || 0;

    // Limpiar tabla
    tbody.innerHTML = '';

    // Generar Filas
    datos.forEach((d) => {
        // Formateo de fecha
        const fechaObj = d.fechaDecision ? new Date(d.fechaDecision) : null;
        const fechaStr = fechaObj ? fechaObj.toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' }) : 'S/F';

        // Crear TR Element
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors group';

        tr.innerHTML = `
            <td class="p-5 align-top">
                <div class="flex flex-col">
                    <span class="text-indigo-600 font-mono font-bold text-sm mb-1">${d.numeroDecision || 'N/A'}</span>
                    <span class="text-slate-500 text-xs">${fechaStr}</span>
                </div>
            </td>
            
            <td class="p-5 align-top">
                <div class="max-w-md">
                    <p class="text-slate-800 font-medium text-sm leading-relaxed line-clamp-2 group-hover:text-indigo-900 transition-colors" title="${d.asunto || ''}">
                        ${d.asunto || 'Sin asunto especificado'}
                    </p>
                </div>
            </td>

            <td class="p-5 align-top">
                <div class="flex flex-col gap-2">
                    <div class="flex items-start text-xs text-slate-500">
                        <i class="fas fa-landmark mt-0.5 mr-2 w-4 text-center text-slate-400"></i>
                        <span>${d.tribunal || 'Tribunal no listado'}</span>
                    </div>
                    ${d.materia ? `
                    <div class="flex items-center text-xs text-slate-500">
                        <i class="fas fa-book mt-0.5 mr-2 w-4 text-center text-slate-400"></i>
                        <span class="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-medium">
                            ${d.materia}
                        </span>
                    </div>` : ''}
                </div>
            </td>

            <td class="p-5 align-middle text-right">
                ${d.urlDocumentoFirmado ? `
                    <a href="${d.urlDocumentoFirmado}" target="_blank" 
                       class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm"
                       title="Ver Sentencia">
                       <i class="fas fa-file-pdf"></i>
                    </a>
                ` : `
                    <span class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200">
                        <i class="fas fa-lock text-xs"></i>
                    </span>
                `}
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Renderizar Paginación
    generarPaginacionModern(data);

    // Mostrar contenedor
    document.getElementById('resultados').classList.remove('hidden');
}

/**
 * Paginación estilo Dots / Minimal
 */
function generarPaginacionModern(data) {
    const actual = data.paginaActual || 1;
    const total = data.totalPaginas || 1;
    const contenedor = document.getElementById('paginacion');
    const contenedorBottom = document.getElementById('paginacionBottom');

    // Lógica simple de botones Prev/Next
    const htmlBotones = `
        <button onclick="buscar(${actual - 1})" ${actual === 1 ? 'disabled class="opacity-30 cursor-not-allowed"' : ''} class="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors text-slate-600 shadow-sm">
            <i class="fas fa-chevron-left text-xs"></i>
        </button>
        <span class="text-sm text-slate-500 font-medium self-center px-3 border border-slate-200 rounded-lg bg-white h-8 flex items-center shadow-sm mx-1">${actual} / ${total}</span>
        <button onclick="buscar(${actual + 1})" ${actual === total ? 'disabled class="opacity-30 cursor-not-allowed"' : ''} class="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors text-slate-600 shadow-sm">
            <i class="fas fa-chevron-right text-xs"></i>
        </button>
    `;

    if (contenedor) contenedor.innerHTML = htmlBotones;
    if (contenedorBottom) contenedorBottom.innerHTML = htmlBotones;
}

function mostrarError(msg) {
    const errorDiv = document.getElementById('error');
    document.getElementById('errorMsg').textContent = msg;
    errorDiv.classList.remove('hidden');
}

// Init
document.getElementById('nucInput')?.focus();
