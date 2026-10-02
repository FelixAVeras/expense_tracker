const DB_KEY = 'gastos_json';

function obtenerDatos() {
    const datos = localStorage.getItem(DB_KEY);
    return datos ? JSON.parse(datos) : [];
}

function guardarDatos(datos) {
    localStorage.setItem(DB_KEY, JSON.stringify(datos));
}

const form = document.getElementById('gasto-form');
const inputId = document.getElementById('gasto-id');
const inputDesc = document.getElementById('descripcion');
const inputMonto = document.getElementById('monto');
const listaGastos = document.getElementById('lista-gastos');
const totalGastosDisplay = document.getElementById('total-gastos-display');
const btnSubmit = document.getElementById('btn-submit');
const btnCancelar = document.getElementById('btn-cancelar');
const btnCancelarContainer = document.getElementById('btn-cancelar-container');
const formTitle = document.getElementById('form-title');

document.addEventListener('DOMContentLoaded', renderizarTabla);

form.addEventListener('submit', function(e) {
    e.preventDefault();

    const id = inputId.value;
    const desc = inputDesc.value;
    const monto = parseFloat(inputMonto.value);
    const gastos = obtenerDatos();

    if (id === "") {
        const nuevoGasto = {
            id: crypto.randomUUID(),
            descripcion: desc,
            monto: monto,
            fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        };
        gastos.push(nuevoGasto);
    } else {
        const indice = gastos.findIndex(g => g.id === id);
        if (indice !== -1) {
            gastos[indice].descripcion = desc;
            gastos[indice].monto = monto;
        }
    }

    guardarDatos(gastos);
    resetearFormulario();
    renderizarTabla();
});

btnCancelar.addEventListener('click', resetearFormulario);

function renderizarTabla() {
    const gastos = obtenerDatos();
    listaGastos.innerHTML = '';
    let total = 0;

    const gastosReversos = [...gastos].reverse();

    gastosReversos.forEach(gasto => {
        total += gasto.monto;
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td class="has-text-grey is-size-7">${gasto.fecha}</td>
            <td class="has-text-dark">${gasto.descripcion}</td>
            <td class="has-text-right has-text-dark">$${gasto.monto.toFixed(2)}</td>
            <td class="has-text-centered">
                <button class="action-btn" onclick="cargarEdicion('${gasto.id}')" title="Editar">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="action-btn delete-btn" onclick="eliminarGasto('${gasto.id}')" title="Eliminar">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        listaGastos.appendChild(tr);
    });

    totalGastosDisplay.textContent = `$${total.toFixed(2)}`;
}

function eliminarGasto(id) {
    if(confirm("¿Seguro que deseas eliminar este registro?")) {
        const gastos = obtenerDatos();
        const gastosFiltrados = gastos.filter(g => g.id !== id);
        guardarDatos(gastosFiltrados);
        renderizarTabla();
    }
}

function cargarEdicion(id) {
    const gastos = obtenerDatos();
    const gasto = gastos.find(g => g.id === id);
    
    if(gasto) {
        inputId.value = gasto.id;
        inputDesc.value = gasto.descripcion;
        inputMonto.value = gasto.monto;
        
        formTitle.textContent = 'Editar Registro';
        btnSubmit.textContent = 'Actualizar';
        // Cambiamos a un gris medio en lugar de negro para diferenciar la edición
        btnSubmit.classList.replace('is-dark', 'is-light'); 
        btnCancelarContainer.classList.remove('is-hidden');
    }
}

function resetearFormulario() {
    form.reset();
    inputId.value = "";
    
    formTitle.textContent = 'Nuevo Registro';
    btnSubmit.textContent = 'Guardar';
    btnSubmit.classList.replace('is-light', 'is-dark');
    btnCancelarContainer.classList.add('is-hidden');
}

// --- FUNCIONES DE IMPORTAR / EXPORTAR ---

const btnExportar = document.getElementById('btn-exportar');
const btnImportarUI = document.getElementById('btn-importar-ui');
const inputImportar = document.getElementById('input-importar');

// Exportar: Crea un archivo JSON y fuerza la descarga
btnExportar.addEventListener('click', () => {
    const datos = localStorage.getItem(DB_KEY) || "[]";
    const blob = new Blob([datos], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    // Nombra el archivo con la fecha actual
    a.download = `mis_gastos_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url); // Limpiar memoria
});

// Importar: Simula el clic en el input de archivo oculto
btnImportarUI.addEventListener('click', () => {
    inputImportar.click();
});

// Importar: Lee el archivo cuando el usuario lo selecciona
inputImportar.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = function(evento) {
        try {
            const contenido = evento.target.result;
            const datosNuevos = JSON.parse(contenido);
            
            // Validamos que sea un array
            if (!Array.isArray(datosNuevos)) {
                throw new Error("El archivo no tiene el formato correcto.");
            }
            
            const mensaje = `Se encontraron ${datosNuevos.length} registros.\n\n¿Quieres REEMPLAZAR tus datos actuales?\n(Haz clic en 'Cancelar' para COMBINARLOS con los actuales)`;
            
            if (confirm(mensaje)) {
                // Reemplazar
                guardarDatos(datosNuevos);
            } else {
                // Combinar
                const datosActuales = obtenerDatos();
                const datosCombinados = [...datosActuales, ...datosNuevos];
                guardarDatos(datosCombinados);
            }
            
            renderizarTabla();
            
        } catch (error) {
            alert("Error al leer el archivo JSON: " + error.message);
        } finally {
            // Limpiamos el input para que permita cargar el mismo archivo si se desea
            inputImportar.value = "";
        }
    };
    
    reader.readAsText(file);
});
