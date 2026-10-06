// Estado y elementos DOM
let gastos = JSON.parse(localStorage.getItem('gastos_v2')) || [];

const form = document.getElementById('gasto-form');
const fechaInput = document.getElementById('fecha');
const descInput = document.getElementById('descripcion');
const montoInput = document.getElementById('monto');
const idInput = document.getElementById('gasto-id');
const btnSubmit = document.getElementById('btn-submit');
const formTitle = document.getElementById('form-title');
const btnCancelarContainer = document.getElementById('btn-cancelar-container');
const btnCancelar = document.getElementById('btn-cancelar');

const listaGastos = document.getElementById('lista-gastos');
const totalGastosDisplay = document.getElementById('total-gastos-display');
const tablaMesesBody = document.getElementById('tabla-meses-body');

const btnExportar = document.getElementById('btn-exportar');
const btnImportarUI = document.getElementById('btn-importar-ui');
const inputImportar = document.getElementById('input-importar');

// Inicializar fecha por defecto (hoy)
const getTodayString = () => new Date().toISOString().split('T')[0];
fechaInput.value = getTodayString();

// Formateadores
const formatMoney = (val) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(val);

const formatDateReadable = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const formatMonthReadable = (yearMonthStr) => {
    const [y, m] = yearMonthStr.split('-');
    const date = new Date(y, m - 1, 1);
    const monthName = date.toLocaleDateString('es-ES', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${y}`;
};

const escapeHtml = (str) => {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
};

// Renderizado Principal
function render() {
    localStorage.setItem('gastos_v2', JSON.stringify(gastos));

    // 1. Acumulado General
    const totalGeneral = gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
    totalGastosDisplay.textContent = formatMoney(totalGeneral);

    // 2. Renderizar Registros Agrupados por Día
    renderGastosPorDia();

    // 3. Renderizar Historial de Totales por Mes
    renderTotalesMensuales();
}

function renderGastosPorDia() {
    listaGastos.innerHTML = '';

    if (gastos.length === 0) {
        listaGastos.innerHTML = `<tr><td colspan="4" class="has-text-centered text-muted py-4">No hay gastos registrados.</td></tr>`;
        return;
    }

    // Ordenar de más reciente a más antiguo
    const ordenados = [...gastos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Agrupar por fecha
    const grupos = {};
    ordenados.forEach(g => {
        const f = g.fecha || getTodayString();
        if (!grupos[f]) grupos[f] = [];
        grupos[f].push(g);
    });

    // Dibujar por día
    Object.keys(grupos).forEach(fechaKey => {
        const items = grupos[fechaKey];
        const subtotalDia = items.reduce((sum, g) => sum + parseFloat(g.monto), 0);

        // Cabecera del día
        const trHeader = document.createElement('tr');
        trHeader.className = 'day-group-header';
        trHeader.innerHTML = `
            <td colspan="2" class="has-text-weight-bold color-primary">
                <i class="fa-regular fa-calendar mr-2"></i>${formatDateReadable(fechaKey)}
            </td>
            <td class="has-text-right has-text-weight-bold color-primary">
                ${formatMoney(subtotalDia)}
            </td>
            <td></td>
        `;
        listaGastos.appendChild(trHeader);

        // Filas del día
        items.forEach(gasto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="is-size-7 text-muted pl-4">${gasto.fecha}</td>
                <td>${escapeHtml(gasto.descripcion)}</td>
                <td class="has-text-right has-text-weight-bold">${formatMoney(gasto.monto)}</td>
                <td class="has-text-centered">
                    <button class="action-btn" onclick="editarGasto('${gasto.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete-btn" onclick="eliminarGasto('${gasto.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            listaGastos.appendChild(tr);
        });
    });
}

function renderTotalesMensuales() {
    tablaMesesBody.innerHTML = '';

    if (gastos.length === 0) {
        tablaMesesBody.innerHTML = `<tr><td colspan="2" class="has-text-centered text-muted py-3">Sin historial</td></tr>`;
        return;
    }

    // Agrupar por YYYY-MM
    const meses = {};
    gastos.forEach(g => {
        const f = g.fecha || getTodayString();
        const mesKey = f.substring(0, 7);
        if (!meses[mesKey]) meses[mesKey] = 0;
        meses[mesKey] += parseFloat(g.monto || 0);
    });

    const mesesOrdenados = Object.keys(meses).sort().reverse();

    mesesOrdenados.forEach((mesKey, index) => {
        const tr = document.createElement('tr');
        if (index === 0) tr.className = 'current-month-row';

        tr.innerHTML = `
            <td class="has-text-weight-semibold">
                ${formatMonthReadable(mesKey)}
                ${index === 0 ? '<span class="month-badge ml-2">Actual</span>' : ''}
            </td>
            <td class="has-text-right has-text-weight-bold color-success">
                ${formatMoney(meses[mesKey])}
            </td>
        `;
        tablaMesesBody.appendChild(tr);
    });
}

// Guardar / Editar Gasto
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = idInput.value;
    const fecha = fechaInput.value || getTodayString();
    const descripcion = descInput.value.trim();
    const monto = parseFloat(montoInput.value);

    if (!descripcion || isNaN(monto) || monto <= 0) return;

    if (id) {
        // Editar
        gastos = gastos.map(g => g.id === id ? { id, fecha, descripcion, monto } : g);
    } else {
        // Nuevo
        gastos.push({
            id: Date.now().toString(),
            fecha,
            descripcion,
            monto
        });
    }

    resetForm();
    render();
});

function editarGasto(id) {
    const gasto = gastos.find(g => g.id === id);
    if (!gasto) return;

    idInput.value = gasto.id;
    fechaInput.value = gasto.fecha;
    descInput.value = gasto.descripcion;
    montoInput.value = gasto.monto;

    formTitle.textContent = "Editar Registro";
    btnSubmit.textContent = "Actualizar Gasto";
    btnCancelarContainer.classList.remove('is-hidden');
}

function eliminarGasto(id) {
    if (confirm("¿Estás seguro de eliminar este registro?")) {
        gastos = gastos.filter(g => g.id !== id);
        render();
    }
}

function resetForm() {
    idInput.value = '';
    fechaInput.value = getTodayString();
    descInput.value = '';
    montoInput.value = '';

    formTitle.textContent = "Nuevo Registro";
    btnSubmit.textContent = "Guardar Gasto";
    btnCancelarContainer.classList.add('is-hidden');
}

btnCancelar.addEventListener('click', resetForm);

// Importar / Exportar
btnExportar.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gastos, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gastos_backup_${getTodayString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

btnImportarUI.addEventListener('click', () => inputImportar.click());

inputImportar.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
                gastos = imported.map(item => ({
                    ...item,
                    fecha: item.fecha || getTodayString()
                }));
                render();
                alert('Gastos importados con éxito.');
            }
        } catch (err) {
            alert('Error al leer el archivo JSON.');
        }
    };
    reader.readAsText(file);
    inputImportar.value = '';
});

// Carga Inicial
render();
