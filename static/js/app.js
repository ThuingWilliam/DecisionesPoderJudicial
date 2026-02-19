// ============================================================
//  LexDigital - app.js
//  Maneja búsqueda por NUC en tres APIs del Poder Judicial
// ============================================================

let nucActual = '';

// ---- Tabs ----
function showTab(name, btn) {
    // Panels
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    // Buttons
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.classList.add('bg-white', 'text-slate-600');
    });
    btn.classList.add('active');
    btn.classList.remove('bg-white', 'text-slate-600');
}

// ---- Búsqueda principal ----
async function buscar(pagina = 1) {
    const nucInput = document.getElementById('nucInput');
    const skeleton = document.getElementById('skeletonLoader');
    const errorDiv = document.getElementById('error');
    const resultados = document.getElementById('resultados');
    const sinResultados = document.getElementById('sinResultados');
    const btnBuscar = document.getElementById('btnBuscar');
    const debugContent = document.getElementById('debug-content');

    if (!nucInput) return;

    const nuc = nucInput.value.trim();
    if (!nuc) { mostrarError('Por favor escribe un NUC para buscar.'); return; }

    nucActual = nuc;

    // Ocultar todo lo previo
    resultados.classList.add('hidden');
    sinResultados.classList.add('hidden');
    errorDiv.classList.add('hidden');
    skeleton.classList.remove('hidden');

    btnBuscar.disabled = true;
    btnBuscar.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    btnBuscar.classList.add('opacity-80', 'cursor-wait');

    if (debugContent) debugContent.innerHTML += `<br>> Consulta NUC: ${nuc} (pág. ${pagina})...`;

    try {
        const response = await fetch('/api/buscar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuc, pagina, registros: 15 })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error del servidor');
        }

        // Debug
        if (debugContent) {
            const { decisiones_status, casos_status, audiencias_status } = data.debug || {};
            debugContent.innerHTML += `<br>> decisiones:${decisiones_status} | casos:${casos_status} | audiencias:${audiencias_status}`;
        }

        // Renderizar las tres secciones
        renderDecisiones(data.decisiones);
        renderCasos(data.casos);
        renderAudiencias(data.audiencias);

        // Actualizar NUC badge
        const nucBadge = document.getElementById('nucBadge');
        if (nucBadge) nucBadge.textContent = nuc;

        // Función auxiliar para obtener el total de registros de forma consistente
        const getCount = (sectionData) => {
            if (!sectionData || sectionData.error) return 0;
            if (sectionData.totalRegistros !== undefined) return sectionData.totalRegistros;
            if (sectionData.TotalRegistros !== undefined) return sectionData.TotalRegistros;

            // Si es un array o tiene una propiedad data/Datos que sea array
            const lista = Array.isArray(sectionData) ? sectionData : (sectionData.data || sectionData.Datos || sectionData.datos || []);
            return Array.isArray(lista) ? lista.length : 0;
        };

        const totalDec = getCount(data.decisiones);
        const totalCas = getCount(data.casos);
        const totalAud = getCount(data.audiencias);

        if (document.getElementById('resumenTotal')) {
            document.getElementById('resumenTotal').textContent =
                `${totalDec} decisiones · ${totalCas} casos · ${totalAud} audiencias`;
        }

        // Verificar si hay al menos algo
        if (totalDec === 0 && totalCas === 0 && totalAud === 0) {
            sinResultados.classList.remove('hidden');
        } else {
            resultados.classList.remove('hidden');
        }

    } catch (error) {
        console.error(error);
        mostrarError(error.message);
        if (debugContent) debugContent.innerHTML += `<br>> <span style="color:red">Error: ${error.message}</span>`;
    } finally {
        skeleton.classList.add('hidden');
        btnBuscar.disabled = false;
        btnBuscar.innerHTML = '<span>Explorar</span>';
        btnBuscar.classList.remove('opacity-80', 'cursor-wait');
    }
}

// ============================================================
//  Renderizadores por sección
// ============================================================

function renderDecisiones(data) {
    const tbody = document.getElementById('tabla-decisiones');
    const empty = document.getElementById('empty-decisiones');
    const errDiv = document.getElementById('error-decisiones');
    const errMsg = document.getElementById('error-decisiones-msg');
    const cntEl = document.getElementById('cnt-decisiones');

    tbody.innerHTML = '';
    empty.classList.add('hidden');
    errDiv.classList.add('hidden');

    if (!data || data.error) {
        errDiv.classList.remove('hidden');
        if (errMsg) errMsg.textContent = data && data.error ? data.error : 'La API no devolvió una respuesta válida.';
        if (cntEl) cntEl.textContent = '0';
        return;
    }

    const lista = data.datos || data.Datos || [];

    // Ordenar por fecha (más reciente primero)
    lista.sort((a, b) => {
        const d1 = new Date(a.fechaDecision || a.FechaDecision || 0);
        const d2 = new Date(b.fechaDecision || b.FechaDecision || 0);
        return d2 - d1;
    });

    const total = data.totalRegistros || data.TotalRegistros || lista.length;

    if (cntEl) cntEl.textContent = total;

    if (lista.length === 0) {
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    lista.forEach(d => {
        const fechaObj = d.fechaDecision || d.FechaDecision
            ? new Date(d.fechaDecision || d.FechaDecision) : null;
        const fechaStr = fechaObj
            ? fechaObj.toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' })
            : 'S/F';

        const url = d.urlDocumentoFirmado || d.UrlDocumentoFirmado || '';
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors group';
        tr.innerHTML = `
            <td class="p-5 align-top">
                <div class="flex flex-col">
                    <span class="text-indigo-600 font-mono font-bold text-sm mb-1">${d.numeroDecision || d.NumeroDecision || 'N/A'}</span>
                    <span class="text-slate-500 text-xs">${fechaStr}</span>
                </div>
            </td>
            <td class="p-5 align-top">
                <p class="text-slate-800 font-medium text-sm leading-relaxed whitespace-normal break-words" title="${d.asunto || d.Asunto || ''}">
                    ${d.asunto || d.Asunto || 'Sin asunto especificado'}
                </p>
            </td>
            <td class="p-5 align-top text-sm text-slate-600 whitespace-normal break-words min-w-[250px]">
                <div class="flex flex-col gap-2">
                    <span class="font-bold text-slate-800 leading-tight">
                        <i class="fas fa-landmark mr-1.5 text-indigo-400"></i>${d.tribunal || d.Tribunal || 'N/A'}
                    </span>
                    ${(d.materia || d.Materia) ? `<span class="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 inline-block w-fit text-[11px] font-medium uppercase tracking-wider text-slate-500">${d.materia || d.Materia}</span>` : ''}
                </div>
            </td>
            <td class="p-5 text-right align-middle">
                ${url
                ? `<a href="${url}" target="_blank" class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm" title="Ver Sentencia">
                           <i class="fas fa-file-pdf"></i>
                       </a>`
                : `<span class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200">
                           <i class="fas fa-lock text-xs"></i>
                       </span>`}
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Paginación
    const pagActual = data.paginaActual || data.PaginaActual || 1;
    const totalPags = data.totalPaginas || data.TotalPaginas || 1;
    renderPaginacion('pag-dec', 'pag-dec-info', pagActual, totalPags, total, 'decisiones');
}

function renderCasos(data) {
    const tbody = document.getElementById('tabla-casos');
    const empty = document.getElementById('empty-casos');
    const errDiv = document.getElementById('error-casos');
    const errMsg = document.getElementById('error-casos-msg');
    const cntEl = document.getElementById('cnt-casos');

    tbody.innerHTML = '';
    empty.classList.add('hidden');
    errDiv.classList.add('hidden');

    // API error
    if (!data || data.error) {
        errDiv.classList.remove('hidden');
        if (errMsg) errMsg.textContent = data && data.error ? data.error : 'La API no devolvió una respuesta válida.';
        if (cntEl) cntEl.textContent = '0';
        return;
    }

    // La API puede devolver un array directamente o un objeto con datos
    let lista = [];
    if (Array.isArray(data)) {
        lista = data;
    } else {
        lista = data.datos || data.Datos || data.data || data.Data || [];
        if (!Array.isArray(lista)) lista = [];
    }

    // Ordenar por NUC (asumiendo formato con año al principio o segunda parte)
    // Intentamos extraer el año del NUC para ordenar
    lista.sort((a, b) => {
        const getYear = (str) => {
            const m = (str || '').match(/\d{4}/);
            return m ? parseInt(m[0]) : 0;
        };
        const n1 = a.nuc || a.Nuc || '';
        const n2 = b.nuc || b.Nuc || '';
        return getYear(n2) - getYear(n1);
    });

    const total = data.totalRegistros || data.TotalRegistros || lista.length;
    if (cntEl) cntEl.textContent = total;

    if (total === 0) {
        empty.classList.remove('hidden');
        return;
    }

    lista.forEach(c => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors';
        const nuc = c.nuc || c.Nuc || c.numeroExpediente || c.NumeroExpediente || 'N/A';
        const tipo = c.tipo || c.Tipo || c.tipoCaso || c.TipoCaso || 'N/A';
        const mat = c.materia || c.Materia || '—';
        const trib = c.tribunal || c.Tribunal || c.juzgado || c.Juzgado || 'N/A';
        const est = c.estado || c.Estado || c.estatus || c.Estatus || 'N/A';

        tr.innerHTML = `
            <td class="p-5 align-top">
                <span class="font-mono font-bold text-indigo-600 text-sm">${nuc}</span>
            </td>
            <td class="p-5 align-top text-sm text-slate-700 whitespace-normal break-words">
                <span class="font-medium">${tipo}</span>
                ${mat !== '—' ? `<br><span class="text-xs text-slate-400">${mat}</span>` : ''}
            </td>
            <td class="p-5 align-top text-sm text-slate-700 whitespace-normal break-words min-w-[250px]">
                <div class="flex items-start">
                    <i class="fas fa-landmark mr-2 mt-0.5 text-indigo-400 text-xs"></i>
                    <span class="font-bold text-slate-800 leading-tight">${trib}</span>
                </div>
            </td>
            <td class="p-5 align-top text-center whitespace-nowrap">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${estadoBadge(est)}">${est}</span>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const pagActual = data.paginaActual || data.PaginaActual || 1;
    const totalPags = data.totalPaginas || data.TotalPaginas || 1;
    renderPaginacion('pag-cas', 'pag-cas-info', pagActual, totalPags, total, 'casos');
}

function renderAudiencias(data) {
    const tbody = document.getElementById('tabla-audiencias');
    const empty = document.getElementById('empty-audiencias');
    const errDiv = document.getElementById('error-audiencias');
    const errMsg = document.getElementById('error-audiencias-msg');
    const cntEl = document.getElementById('cnt-audiencias');

    tbody.innerHTML = '';
    empty.classList.add('hidden');
    errDiv.classList.add('hidden');

    // API error
    if (!data || data.error) {
        errDiv.classList.remove('hidden');
        if (errMsg) errMsg.textContent = data && data.error ? data.error : 'La API no devolvió una respuesta válida.';
        if (cntEl) cntEl.textContent = '0';
        return;
    }

    // Respuesta: { data: [...] }  o array directo
    let lista = [];
    if (Array.isArray(data)) lista = data;
    else if (Array.isArray(data.data)) lista = data.data;
    else {
        lista = data.datos || data.Datos || [];
        if (!Array.isArray(lista)) lista = [];
    }

    // Ordenar por fecha (más reciente primero)
    lista.sort((a, b) => {
        const d1 = a.fechaAudiencia ? new Date(a.fechaAudiencia) : new Date(0);
        const d2 = b.fechaAudiencia ? new Date(b.fechaAudiencia) : new Date(0);
        return d2 - d1;
    });

    const total = data.totalRegistros || data.TotalRegistros || lista.length;
    if (cntEl) cntEl.textContent = total;

    if (total === 0) { empty.classList.remove('hidden'); return; }

    lista.forEach(a => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors align-top';

        const fechaLet = a.fechaAudienciaLetra || '';
        const hora = a.horaAudiencia || '';
        const tipo = a.tipoAudiencia || 'N/A';
        const tribunal = a.tribunal || 'N/A';
        const sala = a.sala || '';
        const salon = a.salon || '';
        const modalidad = a.modalidad || '';
        const estado = a.estado || a.tipoResultado || 'N/A';
        const urlAud = a.urlAudiencia || '';
        const urlCel = a.urlCelebracion || '';
        const asunto = a.asunto || '';

        const note = "Este enlace solo está activo el día de la audiencia";

        tr.innerHTML = `
            <td class="p-4">
                <p class="font-semibold text-slate-800 text-sm">${fechaLet || a.fechaAudiencia || 'S/F'}</p>
                <p class="text-xs text-slate-400 mt-0.5">${hora}</p>
                ${modalidad ? `<span class="mt-1 inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">${modalidad}</span>` : ''}
            </td>
            <td class="p-4">
                <p class="font-semibold text-slate-700 text-sm whitespace-normal break-words">${tipo}</p>
                ${asunto ? `<p class="text-xs text-slate-400 mt-0.5 max-w-sm whitespace-normal break-words" title="${asunto}">${asunto}</p>` : ''}
            </td>
            <td class="p-4 text-sm text-slate-600 whitespace-normal break-words min-w-[250px]">
                <div class="flex flex-col gap-1.5">
                    <p class="font-bold text-slate-800 leading-tight">
                        <i class="fas fa-landmark mr-1.5 text-indigo-400 text-xs"></i>${tribunal}
                    </p>
                    ${sala ? `<p class="text-xs text-indigo-600 font-semibold bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100/50 w-fit">${sala}</p>` : ''}
                    ${salon ? `<p class="text-[11px] text-slate-400 flex items-center gap-1"><i class="fas fa-door-open text-[10px]"></i> ${salon}</p>` : ''}
                </div>
            </td>
            <td class="p-4 text-center whitespace-nowrap">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${estadoBadge(estado)}">${estado}</span>
            </td>
            <td class="p-4 text-right">
                <div class="flex flex-col items-end gap-2">
                    <div class="flex gap-2">
                        ${urlAud ? `<a href="${urlAud}" target="_blank" title="${note}"
                            class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm">
                            <i class="fas fa-external-link-alt"></i></a>` : ''}
                        ${urlCel ? `<a href="${urlCel}" target="_blank" title="${note}"
                            class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm">
                            <i class="fas fa-video"></i></a>` : ''}
                    </div>
                    ${!urlAud && !urlCel ? `<span class="text-slate-300 text-xs px-4">—</span>` : `
                        <p class="text-[10px] text-slate-400 font-medium italic leading-tight text-right max-w-[120px]">
                            <i class="fas fa-info-circle mr-1 text-[9px] opacity-70"></i>Activo solo el día de la cita
                        </p>
                    `}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Paginación
    const pagActual = data.paginaActual || data.PaginaActual || 1;
    const totalPags = data.totalPaginas || data.TotalPaginas || 1;
    renderPaginacion('pag-aud', 'pag-aud-info', pagActual, totalPags, total, 'audiencias');
}

// ---- Helpers ----
function estadoBadge(est) {
    const e = (est || '').toLowerCase();
    if (e.includes('activ') || e.includes('pend')) return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (e.includes('termin') || e.includes('cerr')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (e.includes('cancel') || e.includes('arch')) return 'bg-slate-100 text-slate-500 border border-slate-200';
    return 'bg-blue-50 text-blue-700 border border-blue-200';
}

function renderPaginacion(containerId, infoId, actual, total, totalReg, seccion) {
    const el = document.getElementById(containerId);
    const info = document.getElementById(infoId);
    if (!el) return;
    if (info) info.textContent = `${totalReg} registro${totalReg !== 1 ? 's' : ''}`;
    if (total <= 1) { el.innerHTML = ''; return; }

    el.innerHTML = `
        <button onclick="buscar(${actual - 1})" ${actual === 1 ? 'disabled class="opacity-30 cursor-not-allowed"' : ''}
            class="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-sm transition-colors">
            <i class="fas fa-chevron-left text-xs"></i>
        </button>
        <span class="text-sm text-slate-500 font-medium self-center px-3 border border-slate-200 rounded-lg bg-white h-8 flex items-center shadow-sm mx-1">${actual} / ${total}</span>
        <button onclick="buscar(${actual + 1})" ${actual === total ? 'disabled class="opacity-30 cursor-not-allowed"' : ''}
            class="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 shadow-sm transition-colors">
            <i class="fas fa-chevron-right text-xs"></i>
        </button>
    `;
}

function mostrarError(msg) {
    document.getElementById('errorMsg').textContent = msg;
    document.getElementById('error').classList.remove('hidden');
}

// Init
document.getElementById('nucInput')?.focus();
