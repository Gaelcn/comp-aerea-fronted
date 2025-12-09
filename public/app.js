const GRAPHQL_URL = 'https://comp-aerea-backend.onrender.com/graphql';

// Estado global para almacenar datos
let appState = {
    aviones: [],
    pilotos: [],
    tripulacion: [],
    vuelos: [],
    bases: [],
    tiposAvion: []
};

// Función para mostrar mensajes de error
function showErrorMessage(title, message, details = null) {
    const modalContent = `
        <div class="alert alert-danger">
            <h5 class="alert-heading">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${title}
            </h5>
            <p>${message}</p>
            ${details ? `<p class="mb-0"><strong>Detalles:</strong> ${details}</p>` : ''}
        </div>
    `;
    
    showModal('Error', modalContent, null);
}

async function ensureVueloDataLoaded() {
    // Si ya tenemos datos, no hacer nada
    if (appState.aviones.length > 0 && appState.pilotos.length > 0) {
        return true;
    }
    
    try {
        // Cargar datos necesarios
        const query = `
            query {
                aviones {
                    codigo_avion
                    codigo_tipo
                }
                pilotos {
                    codigo_piloto
                    nombre
                }
            }
        `;
        
        const data = await graphqlQuery(query);
        appState.aviones = data.aviones || [];
        appState.pilotos = data.pilotos || [];
        
        return appState.aviones.length > 0 && appState.pilotos.length > 0;
    } catch (error) {
        console.error('Error cargando datos para formulario de vuelo:', error);
        return false;
    }
}

// Variables globales para filtros de vuelos
let todosLosVuelosDashboard = [];
let filtroEstadoActual = 'todos';

// Función para cargar vuelos en el dashboard
function loadDashboardVuelos(vuelos) {
    // Guardar todos los vuelos para filtrado
    todosLosVuelosDashboard = vuelos || [];
    
    // Aplicar filtro actual
    aplicarFiltroDashboard();
}

// Función para aplicar filtro a los vuelos del dashboard
function aplicarFiltroDashboard() {
    const table = document.getElementById('dashboardVuelosTable');
    
    console.log('Aplicando filtro:', filtroEstadoActual);
    console.log('Vuelos disponibles:', vuelosDashboard);
    
    if (!vuelosDashboard || vuelosDashboard.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <div class="alert alert-info mb-0" role="alert">
                        <i class="fas fa-plane-slash me-2"></i>
                        No hay vuelos registrados
                    </div>
                </td>
            </tr>
        `;
        actualizarContadorVuelos(0, 0);
        return;
    }
    
    // Filtrar vuelos según estado seleccionado
    let vuelosFiltrados;
    if (filtroEstadoActual === 'todos') {
        vuelosFiltrados = vuelosDashboard;
    } else {
        vuelosFiltrados = vuelosDashboard.filter(vuelo => {
            const estadoVuelo = (vuelo.estado || '').toLowerCase();
            const estadoFiltro = filtroEstadoActual.toLowerCase();
            return estadoVuelo === estadoFiltro;
        });
    }
    
    console.log('Vuelos filtrados:', vuelosFiltrados);
    
    // Ordenar vuelos por fecha (más recientes primero)
    const vuelosOrdenados = [...vuelosFiltrados].sort((a, b) => {
        try {
            const fechaA = new Date(a.fecha_vuelo || 0);
            const fechaB = new Date(b.fecha_vuelo || 0);
            return fechaB - fechaA;
        } catch (e) {
            return 0;
        }
    });
    
    // Tomar solo los últimos 10 vuelos para el dashboard
    const vuelosMostrar = vuelosOrdenados.slice(0, 10);
    
    console.log('Vuelos a mostrar:', vuelosMostrar);
    
    // Renderizar tabla
    renderizarTablaVuelos(vuelosMostrar, vuelosFiltrados.length);
    
    // Actualizar contador
    actualizarContadorVuelos(vuelosMostrar.length, vuelosFiltrados.length);
    
    // Mostrar/ocultar botón de quitar filtro
    const resetBtn = document.getElementById('resetFiltroBtn');
    if (resetBtn) {
        resetBtn.style.display = filtroEstadoActual === 'todos' ? 'none' : 'inline-block';
    }
}

// Función para renderizar la tabla de vuelos
function renderizarTablaVuelos(vuelos, totalFiltrados) {
    const table = document.getElementById('dashboardVuelosTable');
    
    console.log('Renderizando tabla con', vuelos.length, 'vuelos');
    
    if (vuelos.length === 0) {
        let mensaje = 'No hay vuelos registrados';
        if (filtroEstadoActual !== 'todos' && totalFiltrados === 0) {
            const estadoTexto = getEstadoText(filtroEstadoActual).toLowerCase();
            mensaje = `No hay vuelos ${estadoTexto}`;
        }
        
        table.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <div class="alert alert-info mb-0" role="alert">
                        <i class="fas fa-plane-slash me-2"></i>
                        ${mensaje}
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    table.innerHTML = '';
    
    vuelos.forEach(vuelo => {
        const row = document.createElement('tr');
        
        // Asegurarnos de que los valores no sean undefined
        const numeroVuelo = vuelo.numero_vuelo || 'N/A';
        const origen = vuelo.origen || 'N/A';
        const destino = vuelo.destino || 'N/A';
        const estado = vuelo.estado || 'desconocido';
        
        row.innerHTML = `
            <td>
                <strong>${numeroVuelo}</strong>
            </td>
            <td>${origen}</td>
            <td>${destino}</td>
            <td>
                <span class="badge bg-light text-dark">
                    <i class="fas fa-calendar-alt me-1"></i>
                    ${formatFechaVuelo(vuelo.fecha_vuelo)}
                </span>
            </td>
            <td>
                <span class="badge bg-secondary">
                    <i class="fas fa-clock me-1"></i>
                    ${formatHora(vuelo.hora_salida)}
                </span>
            </td>
            <td>
                <span class="badge bg-${getEstadoBadgeColor(estado)}">
                    ${getEstadoText(estado)}
                </span>
            </td>
            <td class="table-actions">
                <button class="btn btn-sm btn-outline-primary" 
                        onclick="viewVuelo('${numeroVuelo}')" 
                        title="Ver detalles del vuelo"
                        data-bs-toggle="tooltip">
                    <i class="fas fa-eye"></i>
                    <span class="d-none d-md-inline"> Detalles</span>
                </button>
            </td>
        `;
        table.appendChild(row);
    });
    
    // Inicializar tooltips
    initTooltips();
}

// Función para actualizar el contador de vuelos
function actualizarContadorVuelos(mostrando, total) {
    const contador = document.getElementById('contadorVuelos');
    if (contador) {
        let texto = `Mostrando ${mostrando} de ${total} vuelos`;
        
        if (filtroEstadoActual !== 'todos') {
            const estadoTexto = getEstadoText(filtroEstadoActual).toLowerCase();
            texto += ` (filtrado por: ${estadoTexto})`;
        }
        
        contador.textContent = texto;
    }
}

// Función para filtrar vuelos por estado
function filtrarVuelos(estado) {
    console.log('Filtrando por estado:', estado);
    
    // Actualizar estado actual
    filtroEstadoActual = estado;
    
    // Actualizar botones activos
    const botonesFiltro = document.querySelectorAll('#filtroEstados .btn');
    botonesFiltro.forEach(boton => {
        const botonEstado = boton.getAttribute('data-estado');
        if (botonEstado === estado) {
            boton.classList.add('active');
        } else {
            boton.classList.remove('active');
        }
    });
    
    // Aplicar filtro
    aplicarFiltroDashboard();
}
// Función para mostrar todos los vuelos (quitar filtro)
function mostrarTodosVuelos() {
    filtrarVuelos('todos');
}

// Función para obtener texto de estado
function getEstadoText(estado) {
    const estados = {
        'programado': 'Programado',
        'realizado': 'Realizado',
        'cancelado': 'Cancelado',
        'todos': 'Todos'
    };
    return estados[estado] || estado;
}

// Función para refrescar datos del dashboard periódicamente
let dashboardRefreshInterval;

function startDashboardRefresh() {
    // Refrescar cada 30 segundos
    dashboardRefreshInterval = setInterval(() => {
        const currentSection = document.querySelector('.content-section[style="display: block;"]');
        if (currentSection && currentSection.id === 'dashboard') {
            loadDashboard();
        }
    }, 30000);
}

function stopDashboardRefresh() {
    if (dashboardRefreshInterval) {
        clearInterval(dashboardRefreshInterval);
    }
}

function showSection(sectionName) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar la sección seleccionada
    const section = document.getElementById(sectionName);
    if (section) {
        section.style.display = 'block';
    }
    
    // Cargar datos según la sección
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'aviones':
            loadAviones();
            break;
        case 'pilotos':
            loadPilotos();
            break;
        case 'tripulacion':
            loadTripulacion();
            break;
        case 'vuelos':
            // Solo cargar vuelos - loadVuelos() ya carga aviones y pilotos también
            loadVuelos();
            break;
        case 'bases':
            loadBases();
            break;
    }
    
    // Actualizar menú activo
    updateActiveMenu(sectionName);
}

// Función para actualizar el menú activo
function updateActiveMenu(activeSection) {
    // Desktop menu
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mobile menu
    document.querySelectorAll('.sidebar-mobile .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Activar el correspondiente
    const sectionMap = {
        'dashboard': 'Dashboard',
        'aviones': 'Aviones',
        'pilotos': 'Pilotos',
        'tripulacion': 'Tripulación',
        'vuelos': 'Vuelos',
        'bases': 'Bases'
    };
    
    const sectionName = sectionMap[activeSection];
    if (sectionName) {
        // Desktop
        const desktopLink = Array.from(document.querySelectorAll('.sidebar .nav-link')).find(link => 
            link.textContent.includes(sectionName)
        );
        if (desktopLink) desktopLink.classList.add('active');
        
        // Mobile
        const mobileLink = Array.from(document.querySelectorAll('.sidebar-mobile .nav-link')).find(link => 
            link.textContent.includes(sectionName)
        );
        if (mobileLink) mobileLink.classList.add('active');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar dashboard por defecto
    showSection('dashboard');
    
    // Cargar datos iniciales necesarios
    loadBases();
    
    // Inicializar tooltips
    initTooltips();
});

// Limpiar intervalos cuando se cierre la página
window.addEventListener('beforeunload', function() {
    stopDashboardRefresh();
});

// Función de validación reutilizable
// Función de validación reutilizable (agrega esto para checkboxes)
function validateForm(formId) {
    const form = document.getElementById(formId);
    
    if (!form) {
        console.error('Formulario no encontrado:', formId);
        return false;
    }
    
    // Limpiar errores previos
    form.classList.remove('was-validated');
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    
    // Validar todos los campos estándar
    const isValidStandard = form.checkValidity();
    
    // Validación especial para checkboxes de tripulación
    let isValidTripulacion = true;
    const checkboxesTripulacion = form.querySelectorAll('.tripulacion-checkbox');
    if (checkboxesTripulacion.length > 0) {
        const seleccionados = form.querySelectorAll('.tripulacion-checkbox:checked').length;
        const errorElement = document.getElementById('codigos_tripulacion_error');
        
        if (seleccionados === 0) {
            isValidTripulacion = false;
            if (errorElement) {
                errorElement.style.display = 'block';
                errorElement.textContent = 'Por favor seleccione al menos un tripulante.';
            }
        } else {
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    }
    
    if (!isValidStandard || !isValidTripulacion) {
        form.classList.add('was-validated');
        
        // Mostrar mensajes de error específicos
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.classList.add('is-invalid');
                
                const errorElement = document.getElementById(`${input.name}_error`);
                if (errorElement) {
                    if (input.validity.valueMissing) {
                        errorElement.textContent = input.tagName === 'SELECT' 
                            ? 'Por favor seleccione una opción.' 
                            : 'Este campo es requerido.';
                    } else if (input.validity.typeMismatch) {
                        errorElement.textContent = 'Formato incorrecto.';
                    } else if (input.validity.rangeUnderflow) {
                        errorElement.textContent = `El valor mínimo es ${input.min}.`;
                    } else if (input.validity.rangeOverflow) {
                        errorElement.textContent = `El valor máximo es ${input.max}.`;
                    } else if (input.validity.patternMismatch) {
                        errorElement.textContent = 'No coincide con el formato requerido.';
                    }
                }
            }
        });
        
        // Enfocar el primer campo inválido
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) {
            firstInvalid.focus();
        }
        
        return false;
    }
    
    return true;
}

// Validación en tiempo real para formularios (versión mejorada)
function setupRealTimeValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) {
        console.error('Formulario no encontrado:', formId);
        return;
    }
    
    // Limpiar event listeners previos si los hay
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        // Remover event listeners previos
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
    });
    
    // Agregar nuevos event listeners
    const newInputs = form.querySelectorAll('input, select, textarea');
    
    newInputs.forEach(input => {
        input.addEventListener('input', function() {
            console.log('Input cambiado:', this.name, this.value);
            
            // Validar este campo específico
            const isValid = this.checkValidity();
            const errorElement = document.getElementById(`${this.name}_error`);
            
            if (isValid) {
                this.classList.remove('is-invalid');
                if (errorElement) {
                    errorElement.textContent = '';
                    errorElement.style.display = 'none';
                }
            } else {
                this.classList.add('is-invalid');
                if (errorElement) {
                    if (this.validity.valueMissing) {
                        errorElement.textContent = this.tagName === 'SELECT' 
                            ? 'Por favor seleccione una opción.' 
                            : 'Este campo es requerido.';
                    }
                    errorElement.style.display = 'block';
                }
            }
            
            // Actualizar estado del formulario
            if (form.checkValidity()) {
                form.classList.remove('was-validated');
            }
        });
        
        input.addEventListener('blur', function() {
            if (!this.checkValidity()) {
                this.classList.add('is-invalid');
                const errorElement = document.getElementById(`${this.name}_error`);
                if (errorElement) {
                    errorElement.style.display = 'block';
                }
            }
        });
        
        input.addEventListener('change', function() {
            console.log('Cambio en:', this.name, this.value);
            this.dispatchEvent(new Event('input'));
        });
    });
}

// Utilidad para hacer queries GraphQL con spinner
async function graphqlQuery(query, variables = {}) {
    showSpinner();
    try {
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables
            })
        });
        
        const result = await response.json();
        if (result.errors) {
            console.error('GraphQL Error:', result.errors);
            throw new Error(result.errors[0].message);
        }
        return result.data;
    } catch (error) {
        console.error('Error en la consulta GraphQL:', error);
        throw error;
    } finally {
        hideSpinner();
    }
}

// Función para formatear fechas para mostrar (MySQL YYYY-MM-DD -> DD/MM/YYYY)
function formatFecha(fecha) {
    if (!fecha) return 'N/A';
    
    console.log('Formateando fecha para mostrar:', fecha, 'Tipo:', typeof fecha);
    
    try {
        // Si es formato MySQL YYYY-MM-DD
        if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [año, mes, dia] = fecha.split('-');
            return `${dia}/${mes}/${año}`;
        }
        
        // Si es timestamp (número o string numérico)
        if ((typeof fecha === 'string' && !isNaN(fecha)) || typeof fecha === 'number') {
            const fechaObj = new Date(parseInt(fecha));
            if (!isNaN(fechaObj.getTime())) {
                const dia = fechaObj.getDate().toString().padStart(2, '0');
                const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
                const año = fechaObj.getFullYear();
                return `${dia}/${mes}/${año}`;
            }
        }
        
        // Si es cualquier otro string de fecha
        if (typeof fecha === 'string') {
            const fechaObj = new Date(fecha);
            if (!isNaN(fechaObj.getTime())) {
                const dia = fechaObj.getDate().toString().padStart(2, '0');
                const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
                const año = fechaObj.getFullYear();
                return `${dia}/${mes}/${año}`;
            }
        }
        
        // Devolver el valor original si no podemos formatearlo
        return fecha;
        
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return fecha; // Devolver el valor original si hay error
    }
}

// Función para formatear fecha de vuelos (maneja diferentes formatos)
function formatFechaVuelo(fecha) {
    if (!fecha) return 'N/A';
    
    try {
        // Intentar parsear como timestamp primero
        let fechaObj;
        
        if (typeof fecha === 'string' && !isNaN(fecha)) {
            // Es un timestamp en string
            fechaObj = new Date(parseInt(fecha));
        } else if (typeof fecha === 'number') {
            // Es un timestamp numérico
            fechaObj = new Date(fecha);
        } else if (typeof fecha === 'string') {
            // Intentar parsear como string de fecha
            fechaObj = new Date(fecha);
        } else {
            return 'Formato inválido';
        }
        
        // Verificar si la fecha es válida
        if (isNaN(fechaObj.getTime())) {
            return 'Fecha inválida';
        }
        
        // Formatear a DD/MM/YYYY
        const dia = fechaObj.getDate().toString().padStart(2, '0');
        const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
        const año = fechaObj.getFullYear();
        
        return `${dia}/${mes}/${año}`;
    } catch (error) {
        console.error('Error formateando fecha de vuelo:', error);
        return 'Error fecha';
    }
}

// Función para formatear hora (mejorada)
function formatHora(hora) {
    if (!hora) return 'N/A';
    
    console.log('Hora recibida para formatear:', hora, 'Tipo:', typeof hora);
    
    try {
        // Caso 1: Ya es una hora formateada correctamente
        if (typeof hora === 'string') {
            // Verificar si es formato HH:MM o HH:MM:SS
            const horaMatch = hora.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
            if (horaMatch) {
                const horas = horaMatch[1].padStart(2, '0');
                const minutos = horaMatch[2];
                return `${horas}:${minutos}`;
            }
            
            // Verificar si es formato 24h (14:30:00)
            if (hora.includes(':')) {
                const partes = hora.split(':');
                if (partes.length >= 2) {
                    const horas = partes[0].padStart(2, '0');
                    const minutos = partes[1].padStart(2, '0');
                    return `${horas}:${minutos}`;
                }
            }
            
            // Verificar si es un timestamp numérico en string
            if (!isNaN(hora) && hora.trim() !== '') {
                const fecha = new Date(parseInt(hora));
                if (!isNaN(fecha.getTime())) {
                    const horas = fecha.getHours().toString().padStart(2, '0');
                    const minutos = fecha.getMinutes().toString().padStart(2, '0');
                    return `${horas}:${minutos}`;
                }
            }
        }
        
        // Caso 2: Es un número (timestamp)
        if (typeof hora === 'number') {
            const fecha = new Date(hora);
            if (!isNaN(fecha.getTime())) {
                const horas = fecha.getHours().toString().padStart(2, '0');
                const minutos = fecha.getMinutes().toString().padStart(2, '0');
                return `${horas}:${minutos}`;
            }
        }
        
        // Caso 3: Es un objeto Date
        if (hora instanceof Date) {
            if (!isNaN(hora.getTime())) {
                const horas = hora.getHours().toString().padStart(2, '0');
                const minutos = hora.getMinutes().toString().padStart(2, '0');
                return `${horas}:${minutos}`;
            }
        }
        
        return 'Formato desconocido';
        
    } catch (error) {
        console.error('Error formateando hora:', error, 'Hora original:', hora);
        return 'Error formato';
    }
}

// Función para formatear fecha para input type="date" (YYYY-MM-DD)
function formatFechaForInput(fecha) {
    if (!fecha) return '';
    
    console.log('Preparando fecha para input:', fecha, 'Tipo:', typeof fecha);
    
    try {
        // Si ya está en formato YYYY-MM-DD de MySQL, devolverlo tal cual
        if (typeof fecha === 'string') {
            // Verificar si es formato MySQL YYYY-MM-DD
            if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return fecha;
            }
            
            // Verificar si es timestamp
            if (!isNaN(fecha)) {
                const fechaObj = new Date(parseInt(fecha));
                if (!isNaN(fechaObj.getTime())) {
                    const año = fechaObj.getFullYear();
                    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
                    const dia = fechaObj.getDate().toString().padStart(2, '0');
                    return `${año}-${mes}-${dia}`;
                }
            }
            
            // Intentar parsear como fecha general
            const fechaObj = new Date(fecha);
            if (!isNaN(fechaObj.getTime())) {
                const año = fechaObj.getFullYear();
                const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
                const dia = fechaObj.getDate().toString().padStart(2, '0');
                return `${año}-${mes}-${dia}`;
            }
        }
        
        // Si es número (timestamp)
        if (typeof fecha === 'number') {
            const fechaObj = new Date(fecha);
            if (!isNaN(fechaObj.getTime())) {
                const año = fechaObj.getFullYear();
                const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
                const dia = fechaObj.getDate().toString().padStart(2, '0');
                return `${año}-${mes}-${dia}`;
            }
        }
        
        return '';
    } catch (error) {
        console.error('Error formateando fecha para input:', error);
        return '';
    }
}

// Función para el menú hamburguesa en móvil
function toggleMobileMenu() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const body = document.body;

    mobileSidebar.classList.toggle('open');
    overlay.classList.toggle('open');
    body.classList.toggle('menu-open');

    // Prevenir scroll del body cuando el menú está abierto
    if (mobileSidebar.classList.contains('open')) {
        body.style.overflow = 'hidden';
    } else {
        body.style.overflow = '';
    }
}

// Cerrar menú al hacer clic fuera de él
document.addEventListener('click', function(event) {
    const mobileSidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    
    if (mobileSidebar.classList.contains('open') && 
        !mobileSidebar.contains(event.target) && 
        event.target !== hamburgerBtn && 
        !hamburgerBtn.contains(event.target)) {
        toggleMobileMenu();
    }
});

// Cerrar menú al presionar ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const mobileSidebar = document.getElementById('mobileSidebar');
        if (mobileSidebar.classList.contains('open')) {
            toggleMobileMenu();
        }
    }
});

// Ajustar comportamiento en redimensionamiento
window.addEventListener('resize', function() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    if (window.innerWidth > 768 && mobileSidebar.classList.contains('open')) {
        toggleMobileMenu();
    }
});

// Control del spinner
function showSpinner() {
    document.getElementById('spinner').classList.remove('hidden');
}

function hideSpinner() {
    document.getElementById('spinner').classList.add('hidden');
}

// Navegación entre secciones
function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById(sectionName).style.display = 'block';
    
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'aviones':
            loadAviones();
            break;
        case 'pilotos':
            loadPilotos();
            break;
        case 'tripulacion':
            loadTripulacion();
            break;
        case 'vuelos':
            loadVuelos();
            break;
        case 'bases':
            loadBases();
            break;
    }
}

// Variable global para almacenar vuelos del dashboard
let vuelosDashboard = [];

// Dashboard
async function loadDashboard() {
    try {
        // Mostrar estado de carga en ambos botones
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        const refreshVuelosBtn = document.getElementById('refreshVuelosBtn');
        
        const loadingHTML = '<i class="fas fa-spinner fa-spin"></i>';
        const normalHTML = '<i class="fas fa-sync-alt"></i>';
        
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = loadingHTML + ' <span class="d-none d-md-inline">Cargando...</span>';
        }
        
        if (refreshVuelosBtn) {
            refreshVuelosBtn.disabled = true;
            refreshVuelosBtn.innerHTML = loadingHTML;
        }
        
        // Query para los contadores
        const countersQuery = `
            query {
                aviones { codigo_avion }
                pilotos { codigo_piloto }
                tripulacion { codigo_tripulante }
                vuelos { numero_vuelo }
            }
        `;
        
        // Query para los vuelos recientes
        const vuelosQuery = `
            query {
                vuelos {
                    numero_vuelo
                    origen
                    destino
                    fecha_vuelo
                    hora_salida
                    estado
                }
            }
        `;
        
        // Ejecutar ambas queries
        const [countersData, vuelosData] = await Promise.all([
            graphqlQuery(countersQuery),
            graphqlQuery(vuelosQuery)
        ]);
        
        // Actualizar contadores
        document.getElementById('totalAviones').textContent = countersData.aviones.length;
        document.getElementById('totalPilotos').textContent = countersData.pilotos.length;
        document.getElementById('totalTripulacion').textContent = countersData.tripulacion.length;
        document.getElementById('totalVuelos').textContent = countersData.vuelos.length;
        
        // Guardar vuelos en variable global para filtrado
        vuelosDashboard = vuelosData.vuelos || [];
        
        // Actualizar tabla de vuelos en dashboard con filtro actual
        aplicarFiltroDashboard();
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        
        // Mostrar error en la tabla
        document.getElementById('dashboardVuelosTable').innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    <div class="alert alert-danger py-2 my-0" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error cargando vuelos: ${error.message || 'Error desconocido'}
                    </div>
                </td>
            </tr>
        `;
        
    } finally {
        // Restaurar botones
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        const refreshVuelosBtn = document.getElementById('refreshVuelosBtn');
        
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> <span class="d-none d-md-inline">Refrescar</span>';
        }
        
        if (refreshVuelosBtn) {
            refreshVuelosBtn.disabled = false;
            refreshVuelosBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        }
    }
}

// Función para refrescar el dashboard manualmente
function refreshDashboard() {
    console.log('Refrescando dashboard...');
    
    // Solo recargar datos, no resetear filtro
    loadDashboard();
}

// Función para refrescar solo los vuelos (botón pequeño)
function refreshVuelos() {
    console.log('Refrescando solo vuelos...');
    
    // Mantener el filtro actual pero recargar datos
    const estadoActual = filtroEstadoActual;
    loadDashboard().then(() => {
        // Restaurar el filtro después de cargar
        if (estadoActual !== 'todos') {
            filtrarVuelos(estadoActual);
        }
    });
}

// Función para refrescar el dashboard manualmente
function refreshDashboard() {
    console.log('Refrescando dashboard...');
    loadDashboard();
}

// Función para cargar vuelos en el dashboard
function loadDashboardVuelos(vuelos) {
    const table = document.getElementById('dashboardVuelosTable');
    
    if (!vuelos || vuelos.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <div class="alert alert-info mb-0" role="alert">
                        <i class="fas fa-plane-slash me-2"></i>
                        No hay vuelos registrados
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Ordenar vuelos por fecha (más recientes primero)
    const vuelosOrdenados = [...vuelos].sort((a, b) => {
        const fechaA = new Date(a.fecha_vuelo || 0);
        const fechaB = new Date(b.fecha_vuelo || 0);
        return fechaB - fechaA;
    });
    
    // Tomar solo los últimos 10 vuelos para el dashboard
    const vuelosRecientes = vuelosOrdenados.slice(0, 10);
    
    table.innerHTML = '';
    
    vuelosRecientes.forEach(vuelo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${vuelo.numero_vuelo}</strong>
            </td>
            <td>${vuelo.origen}</td>
            <td>${vuelo.destino}</td>
            <td>
                <span class="badge bg-light text-dark">
                    <i class="fas fa-calendar-alt me-1"></i>
                    ${formatFechaVuelo(vuelo.fecha_vuelo)}
                </span>
            </td>
            <td>
                <span class="badge bg-secondary">
                    <i class="fas fa-clock me-1"></i>
                    ${formatHora(vuelo.hora_salida)}
                </span>
            </td>
            <td>
                <span class="badge bg-${getEstadoBadgeColor(vuelo.estado)}">
                    ${getEstadoText(vuelo.estado)}
                </span>
            </td>
            <td class="table-actions">
                <button class="btn btn-sm btn-outline-primary" 
                        onclick="viewVuelo('${vuelo.numero_vuelo}')" 
                        title="Ver detalles del vuelo"
                        data-bs-toggle="tooltip">
                    <i class="fas fa-eye"></i>
                    <span class="d-none d-md-inline"> Detalles</span>
                </button>
            </td>
        `;
        table.appendChild(row);
    });
    
    // Inicializar tooltips
    initTooltips();
}

// Función para inicializar tooltips
function initTooltips() {
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipTriggerList.forEach(tooltipTriggerEl => {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

// Función para obtener texto de estado
function getEstadoText(estado) {
    const estados = {
        'programado': 'Programado',
        'realizado': 'Realizado',
        'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
}

// Función para cargar vuelos en el dashboard
function loadDashboardVuelos(vuelos) {
    const table = document.getElementById('dashboardVuelosTable');
    
    if (!vuelos || vuelos.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="fas fa-plane-slash"></i> No hay vuelos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    // Ordenar vuelos por fecha (más recientes primero)
    const vuelosOrdenados = [...vuelos].sort((a, b) => {
        const fechaA = new Date(a.fecha_vuelo || 0);
        const fechaB = new Date(b.fecha_vuelo || 0);
        return fechaB - fechaA;
    });
    
    // Tomar solo los últimos 10 vuelos para el dashboard
    const vuelosRecientes = vuelosOrdenados.slice(0, 10);
    
    table.innerHTML = '';
    
    vuelosRecientes.forEach(vuelo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vuelo.numero_vuelo}</td>
            <td>${vuelo.origen}</td>
            <td>${vuelo.destino}</td>
            <td>${formatFechaVuelo(vuelo.fecha_vuelo)}</td>
            <td>${formatHora(vuelo.hora_salida)}</td>
            <td>
                <span class="badge bg-${getEstadoBadgeColor(vuelo.estado)}">
                    ${getEstadoText(vuelo.estado)}
                </span>
            </td>
            <td class="table-actions">
                <button class="btn btn-sm btn-info" onclick="viewVuelo('${vuelo.numero_vuelo}')" 
                        title="Ver detalles" data-bs-toggle="tooltip">
                    <i class="fas fa-eye"></i> Ver
                </button>
            </td>
        `;
        table.appendChild(row);
    });
    
    // Inicializar tooltips si es necesario
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(table.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

// Función para obtener texto de estado
function getEstadoText(estado) {
    const estados = {
        'programado': 'Programado',
        'realizado': 'Realizado',
        'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
}

// Aviones
async function loadAviones() {
    try {
        const query = `
            query {
                aviones {
                    codigo_avion
                    codigo_tipo
                    codigo_base
                    fecha_adquisicion
                    tipo { nombre_tipo }
                    base { nombre_base }
                }
                tiposAvion {
                    codigo_tipo
                    nombre_tipo
                }
                bases {
                    codigo_base
                    nombre_base
                }
            }
        `;
        
        const data = await graphqlQuery(query);
        appState.aviones = data.aviones;
        appState.tiposAvion = data.tiposAvion;
        appState.bases = data.bases;
        
        const table = document.getElementById('avionesTable');
        table.innerHTML = '';
        
        data.aviones.forEach(avion => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${avion.codigo_avion}</td>
                <td>${avion.tipo?.nombre_tipo || avion.codigo_tipo}</td>
                <td>${avion.base?.nombre_base || avion.codigo_base}</td>
                <td>${formatFecha(avion.fecha_adquisicion)}</td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-warning" onclick="editAvion('${avion.codigo_avion}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAvion('${avion.codigo_avion}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            table.appendChild(row);
        });
    } catch (error) {
        alert('Error cargando aviones: ' + error.message);
    }
}

function showAvionForm(avion = null) {
    const isEdit = !!avion;
    const title = isEdit ? 'Editar Avión' : 'Nuevo Avión';
    
    const tiposOptions = appState.tiposAvion.map(tipo => 
        `<option value="${tipo.codigo_tipo}" ${avion?.codigo_tipo === tipo.codigo_tipo ? 'selected' : ''}>
            ${tipo.nombre_tipo}
        </option>`
    ).join('');
    
    const basesOptions = appState.bases.map(base => 
        `<option value="${base.codigo_base}" ${avion?.codigo_base === base.codigo_base ? 'selected' : ''}>
            ${base.nombre_base}
        </option>`
    ).join('');
    
    const form = `
        <form id="avionForm" novalidate>
            <div class="mb-3">
                <label class="form-label">Código Avión <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="codigo_avion" 
                       value="${avion?.codigo_avion || ''}" ${isEdit ? 'readonly' : ''} required>
                <div class="invalid-feedback" id="codigo_avion_error">
                    Por favor ingrese el código del avión.
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Tipo de Avión <span class="text-danger">*</span></label>
                <select class="form-control" name="codigo_tipo" required>
                    <option value="">Seleccionar tipo</option>
                    ${tiposOptions}
                </select>
                <div class="invalid-feedback" id="codigo_tipo_error">
                    Por favor seleccione un tipo de avión.
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Base <span class="text-danger">*</span></label>
                <select class="form-control" name="codigo_base" required>
                    <option value="">Seleccionar base</option>
                    ${basesOptions}
                </select>
                <div class="invalid-feedback" id="codigo_base_error">
                    Por favor seleccione una base.
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Fecha Adquisición <span class="text-danger">*</span></label>
                <input type="date" class="form-control" name="fecha_adquisicion" 
                       value="${avion?.fecha_adquisicion ? formatFechaForInput(avion.fecha_adquisicion) : ''}" required>
                <div class="invalid-feedback" id="fecha_adquisicion_error">
                    Por favor seleccione una fecha de adquisición.
                </div>
            </div>
        </form>
    `;
    
    showModal(title, form, () => submitAvionForm(avion));
    
    // Configurar validación en tiempo real después de que el modal se muestre
    const modal = document.getElementById('formModal');
    
    // Opción A: Usar evento show.bs.modal de Bootstrap
    modal.addEventListener('shown.bs.modal', function () {
        setTimeout(() => {
            console.log('Configurando validación para avionForm');
            setupRealTimeValidation('avionForm');
        }, 50);
    });
    
    // Opción B: Timeout seguro
    setTimeout(() => {
        console.log('Configurando validación (timeout) para avionForm');
        setupRealTimeValidation('avionForm');
    }, 300);
}

async function submitAvionForm(avion) {
    // Validar el formulario antes de proceder
    if (!validateForm('avionForm')) {
        return; // Detener si no es válido
    }
    
    // Si es válido, proceder con el envío
    const form = document.getElementById('avionForm');
    const formData = new FormData(form);
    const fechaInput = formData.get('fecha_adquisicion');
    
    const input = {
        codigo_avion: formData.get('codigo_avion'),
        codigo_tipo: formData.get('codigo_tipo'),
        codigo_base: formData.get('codigo_base'),
        fecha_adquisicion: fechaInput || null
    };
    
    try {
        if (avion) {
            const mutation = `
                mutation ActualizarAvion($codigoAvion: String!, $input: AvionInput!) {
                    actualizarAvion(codigo_avion: $codigoAvion, input: $input) {
                        codigo_avion
                    }
                }
            `;
            await graphqlQuery(mutation, { codigoAvion: avion.codigo_avion, input });
        } else {
            const mutation = `
                mutation CrearAvion($input: AvionInput!) {
                    crearAvion(input: $input) {
                        codigo_avion
                    }
                }
            `;
            await graphqlQuery(mutation, { input });
        }
        
        bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
        loadAviones();
        alert('Avión guardado exitosamente');
    } catch (error) {
        alert('Error guardando avión: ' + error.message);
    }
}

async function editAvion(codigoAvion) {
    try {
        const query = `
            query GetAvion($codigoAvion: String!) {
                avion(codigo_avion: $codigoAvion) {
                    codigo_avion
                    codigo_tipo
                    codigo_base
                    fecha_adquisicion
                }
            }
        `;
        
        const data = await graphqlQuery(query, { codigoAvion });
        showAvionForm(data.avion);
    } catch (error) {
        alert('Error cargando avión: ' + error.message);
    }
}

async function deleteAvion(codigoAvion) {
    try {
        // Primero verificar si el avión tiene vuelos asignados
        const checkQuery = `
            query AvionTieneVuelos($codigoAvion: String!) {
                avionTieneVuelos(codigo_avion: $codigoAvion)
            }
        `;
        
        const checkData = await graphqlQuery(checkQuery, { codigoAvion });
        
        if (checkData.avionTieneVuelos) {
            // Obtener información del avión para mostrar en el mensaje
            const avionQuery = `
                query GetAvion($codigoAvion: String!) {
                    avion(codigo_avion: $codigoAvion) {
                        codigo_avion
                        codigo_tipo
                    }
                }
            `;
            
            const avionData = await graphqlQuery(avionQuery, { codigoAvion });
            const avion = avionData.avion;
            
            // Obtener vuelos asignados (sin parámetro, filtramos en el frontend)
            const vuelosQuery = `
                query {
                    vuelos {
                        numero_vuelo
                        origen
                        destino
                        estado
                        fecha_vuelo
                        codigo_avion
                    }
                }
            `;
            
            const vuelosData = await graphqlQuery(vuelosQuery);
            const vuelosAsignados = vuelosData.vuelos.filter(v => v.codigo_avion === codigoAvion);
            
            const mensaje = `
                <div class="alert alert-danger">
                    <h5 class="alert-heading">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        No se puede eliminar el avión <strong>${avion?.codigo_avion || codigoAvion}</strong>
                    </h5>
                    <p>Este avión tiene <strong>${vuelosAsignados.length}</strong> vuelo(s) asignado(s).</p>
                    <hr>
                    <p class="mb-1"><strong>Vuelos asignados:</strong></p>
                    <ul class="small">
                        ${vuelosAsignados.map(v => 
                            `<li>${v.numero_vuelo}: ${v.origen} → ${v.destino} (${v.estado}) - ${formatFechaVuelo(v.fecha_vuelo)}</li>`
                        ).join('')}
                    </ul>
                    <p class="mb-0 mt-2">
                        Para eliminar este avión, primero debe reasignar o eliminar sus vuelos.
                        <br>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="showSection('vuelos'); bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();">
                            <i class="fas fa-route me-1"></i> Ir a Vuelos
                        </button>
                    </p>
                </div>
            `;
            
            showModal('No se puede eliminar', mensaje, null);
            return;
        }
        
        // Si no tiene vuelos, proceder con la eliminación
        if (confirm('¿Está seguro de eliminar este avión? Esta acción no se puede deshacer.')) {
            const mutation = `
                mutation EliminarAvion($codigoAvion: String!) {
                    eliminarAvion(codigo_avion: $codigoAvion)
                }
            `;
            await graphqlQuery(mutation, { codigoAvion });
            loadAviones();
            
            // También actualizar dashboard si está visible
            const currentSection = document.querySelector('.content-section[style="display: block;"]');
            if (currentSection && currentSection.id === 'dashboard') {
                loadDashboard();
            }
            
            alert('Avión eliminado exitosamente');
        }
    } catch (error) {
        console.error('Error eliminando avión:', error);
        alert('Error eliminando avión: ' + error.message);
    }
}

// Pilotos
async function loadPilotos() {
    try {
        const query = `
            query {
                pilotos {
                    codigo_piloto
                    nombre
                    horas_vuelo
                    codigo_base
                    fecha_contratacion
                    base {
                        codigo_base
                        nombre_base
                        ubicacion
                    }
                }
                bases {
                    codigo_base
                    nombre_base
                }
            }
        `;
        
        const data = await graphqlQuery(query);
        appState.pilotos = data.pilotos;
        
        const table = document.getElementById('pilotosTable');
        table.innerHTML = '';
        
        data.pilotos.forEach(piloto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${piloto.codigo_piloto}</td>
                <td>${piloto.nombre}</td>
                <td>${piloto.horas_vuelo}</td>
                <td>${piloto.base?.nombre_base || piloto.codigo_base}</td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-warning" onclick="editPiloto('${piloto.codigo_piloto}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deletePiloto('${piloto.codigo_piloto}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            table.appendChild(row);
        });
    } catch (error) {
        alert('Error cargando pilotos: ' + error.message);
    }
}

function showPilotoForm(piloto = null) {
    const isEdit = !!piloto;
    const title = isEdit ? 'Editar Piloto' : 'Nuevo Piloto';
    
    const basesOptions = appState.bases.map(base => 
        `<option value="${base.codigo_base}" ${piloto?.codigo_base === base.codigo_base ? 'selected' : ''}>
            ${base.nombre_base}
        </option>`
    ).join('');
    
    const form = `
        <form id="pilotoForm" novalidate>
            <div class="mb-3">
                <label class="form-label">Código Piloto <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="codigo_piloto" 
                       value="${piloto?.codigo_piloto || ''}" ${isEdit ? 'readonly' : ''} required>
                <div class="invalid-feedback" id="codigo_piloto_error">
                    Por favor ingrese el código del piloto.
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Nombre <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="nombre" 
                       value="${piloto?.nombre || ''}" required>
                <div class="invalid-feedback" id="nombre_error">
                    Por favor ingrese el nombre del piloto.
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Horas de Vuelo <span class="text-danger">*</span></label>
                <input type="number" class="form-control" name="horas_vuelo" 
                       value="${piloto?.horas_vuelo || 0}" min="0" required>
                <div class="invalid-feedback" id="horas_vuelo_error">
                    Por favor ingrese las horas de vuelo.
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Base <span class="text-danger">*</span></label>
                <select class="form-control" name="codigo_base" required>
                    <option value="">Seleccionar base</option>
                    ${basesOptions}
                </select>
                <div class="invalid-feedback" id="codigo_base_error">
                    Por favor seleccione una base.
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Fecha Contratación <span class="text-danger">*</span></label>
                <input type="date" class="form-control" name="fecha_contratacion" 
                       value="${piloto?.fecha_contratacion ? formatFechaForInput(piloto.fecha_contratacion) : ''}" required>
                <div class="invalid-feedback" id="fecha_contratacion_error">
                    Por favor seleccione una fecha de contratación.
                </div>
            </div>
        </form>
    `;
    
    showModal(title, form, () => submitPilotoForm(piloto));
    
    // Configurar validación en tiempo real después de mostrar el modal
    setTimeout(() => {
        setupRealTimeValidation('pilotoForm');
    }, 100);
}

async function submitPilotoForm(piloto) {
    // Validar el formulario antes de proceder
    if (!validateForm('pilotoForm')) {
        return;
    }
    
    const form = document.getElementById('pilotoForm');
    const formData = new FormData(form);
    const fechaInput = formData.get('fecha_contratacion');
    
    const input = {
        codigo_piloto: formData.get('codigo_piloto'),
        nombre: formData.get('nombre'),
        horas_vuelo: parseInt(formData.get('horas_vuelo')),
        codigo_base: formData.get('codigo_base'),
        fecha_contratacion: fechaInput || null
    };
    
    try {
        if (piloto) {
            const mutation = `
                mutation ActualizarPiloto($codigoPiloto: String!, $input: PilotoInput!) {
                    actualizarPiloto(codigo_piloto: $codigoPiloto, input: $input) {
                        codigo_piloto
                    }
                }
            `;
            await graphqlQuery(mutation, { codigoPiloto: piloto.codigo_piloto, input });
        } else {
            const mutation = `
                mutation CrearPiloto($input: PilotoInput!) {
                    crearPiloto(input: $input) {
                        codigo_piloto
                    }
                }
            `;
            await graphqlQuery(mutation, { input });
        }
        
        bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
        loadPilotos();
        alert('Piloto guardado exitosamente');
    } catch (error) {
        alert('Error guardando piloto: ' + error.message);
    }
}

async function editPiloto(codigoPiloto) {
    try {
        const query = `
            query GetPiloto($codigoPiloto: String!) {
                piloto(codigo_piloto: $codigoPiloto) {
                    codigo_piloto
                    nombre
                    horas_vuelo
                    codigo_base
                    fecha_contratacion
                }
            }
        `;
        
        const data = await graphqlQuery(query, { codigoPiloto });
        showPilotoForm(data.piloto);
    } catch (error) {
        alert('Error cargando piloto: ' + error.message);
    }
}

async function deletePiloto(codigoPiloto) {
    try {
        // Primero verificar si el piloto tiene vuelos asignados
        const checkQuery = `
            query PilotoTieneVuelos($codigoPiloto: String!) {
                pilotoTieneVuelos(codigo_piloto: $codigoPiloto)
            }
        `;
        
        const checkData = await graphqlQuery(checkQuery, { codigoPiloto });
        
        if (checkData.pilotoTieneVuelos) {
            // Obtener información del piloto para mostrar en el mensaje
            const pilotoQuery = `
                query GetPiloto($codigoPiloto: String!) {
                    piloto(codigo_piloto: $codigoPiloto) {
                        codigo_piloto
                        nombre
                    }
                }
            `;
            
            const pilotoData = await graphqlQuery(pilotoQuery, { codigoPiloto });
            const piloto = pilotoData.piloto;
            
            // Obtener vuelos asignados (sin parámetro, filtramos en el frontend)
            const vuelosQuery = `
                query {
                    vuelos {
                        numero_vuelo
                        origen
                        destino
                        estado
                        fecha_vuelo
                        codigo_piloto
                    }
                }
            `;
            
            const vuelosData = await graphqlQuery(vuelosQuery);
            const vuelosAsignados = vuelosData.vuelos.filter(v => v.codigo_piloto === codigoPiloto);
            
            const mensaje = `
                <div class="alert alert-danger">
                    <h5 class="alert-heading">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        No se puede eliminar el piloto <strong>${piloto?.nombre || 'Desconocido'} (${piloto?.codigo_piloto || codigoPiloto})</strong>
                    </h5>
                    <p>Este piloto tiene <strong>${vuelosAsignados.length}</strong> vuelo(s) asignado(s).</p>
                    <hr>
                    <p class="mb-1"><strong>Vuelos asignados:</strong></p>
                    <ul class="small">
                        ${vuelosAsignados.map(v => 
                            `<li>${v.numero_vuelo}: ${v.origen} → ${v.destino} (${v.estado}) - ${formatFechaVuelo(v.fecha_vuelo)}</li>`
                        ).join('')}
                    </ul>
                    <p class="mb-0 mt-2">
                        Para eliminar este piloto, primero debe reasignar o eliminar sus vuelos.
                        <br>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="showSection('vuelos'); bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();">
                            <i class="fas fa-route me-1"></i> Ir a Vuelos
                        </button>
                    </p>
                </div>
            `;
            
            showModal('No se puede eliminar', mensaje, null);
            return;
        }
        
        // Si no tiene vuelos, proceder con la eliminación
        if (confirm('¿Está seguro de eliminar este piloto? Esta acción no se puede deshacer.')) {
            const mutation = `
                mutation EliminarPiloto($codigoPiloto: String!) {
                    eliminarPiloto(codigo_piloto: $codigoPiloto)
                }
            `;
            await graphqlQuery(mutation, { codigoPiloto });
            loadPilotos();
            
            // También actualizar dashboard si está visible
            const currentSection = document.querySelector('.content-section[style="display: block;"]');
            if (currentSection && currentSection.id === 'dashboard') {
                loadDashboard();
            }
            
            alert('Piloto eliminado exitosamente');
        }
    } catch (error) {
        console.error('Error eliminando piloto:', error);
        alert('Error eliminando piloto: ' + error.message);
    }
}

// Tripulación
async function loadTripulacion() {
    try {
        const query = `
            query {
                tripulacion {
                    codigo_tripulante
                    nombre
                    codigo_base
                    fecha_contratacion
                    base {
                        codigo_base
                        nombre_base
                        ubicacion
                    }
                }
            }
        `;
        
        const data = await graphqlQuery(query);
        appState.tripulacion = data.tripulacion;
        
        const table = document.getElementById('tripulacionTable');
        table.innerHTML = '';
        
        data.tripulacion.forEach(tripulante => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tripulante.codigo_tripulante}</td>
                <td>${tripulante.nombre}</td>
                <td>${tripulante.base?.nombre_base || tripulante.codigo_base}</td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-warning" onclick="editTripulante('${tripulante.codigo_tripulante}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTripulante('${tripulante.codigo_tripulante}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            table.appendChild(row);
        });
    } catch (error) {
        alert('Error cargando tripulación: ' + error.message);
    }
}

function showTripulanteForm(tripulante = null) {
    const isEdit = !!tripulante;
    const title = isEdit ? 'Editar Tripulante' : 'Nuevo Tripulante';
    
    const basesOptions = appState.bases.map(base => 
        `<option value="${base.codigo_base}" ${tripulante?.codigo_base === base.codigo_base ? 'selected' : ''}>
            ${base.nombre_base}
        </option>`
    ).join('');
    
    const form = `
        <form id="tripulanteForm" novalidate>
            <div class="mb-3">
                <label class="form-label">Código Tripulante <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="codigo_tripulante" 
                       value="${tripulante?.codigo_tripulante || ''}" ${isEdit ? 'readonly' : ''} required>
                <div class="invalid-feedback" id="codigo_tripulante_error">
                    Por favor ingrese el código del tripulante.
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Nombre <span class="text-danger">*</span></label>
                <input type="text" class="form-control" name="nombre" 
                       value="${tripulante?.nombre || ''}" required>
                <div class="invalid-feedback" id="nombre_error">
                    Por favor ingrese el nombre del tripulante.
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Base <span class="text-danger">*</span></label>
                <select class="form-control" name="codigo_base" required>
                    <option value="">Seleccionar base</option>
                    ${basesOptions}
                </select>
                <div class="invalid-feedback" id="codigo_base_error">
                    Por favor seleccione una base.
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Fecha Contratación <span class="text-danger">*</span></label>
                <input type="date" class="form-control" name="fecha_contratacion" 
                       value="${tripulante?.fecha_contratacion ? formatFechaForInput(tripulante.fecha_contratacion) : ''}" required>
                <div class="invalid-feedback" id="fecha_contratacion_error">
                    Por favor seleccione una fecha de contratación.
                </div>
            </div>
        </form>
    `;
    
    showModal(title, form, () => submitTripulanteForm(tripulante));
    
    // Configurar validación en tiempo real después de mostrar el modal
    setTimeout(() => {
        setupRealTimeValidation('tripulanteForm');
    }, 100);
}

async function submitTripulanteForm(tripulante) {
    // Validar el formulario antes de proceder
    if (!validateForm('tripulanteForm')) {
        return;
    }
    
    const form = document.getElementById('tripulanteForm');
    const formData = new FormData(form);
    const fechaInput = formData.get('fecha_contratacion');
    
    const input = {
        codigo_tripulante: formData.get('codigo_tripulante'),
        nombre: formData.get('nombre'),
        codigo_base: formData.get('codigo_base'),
        fecha_contratacion: fechaInput || null
    };
    
    try {
        if (tripulante) {
            const mutation = `
                mutation ActualizarTripulante($codigoTripulante: String!, $input: TripulanteInput!) {
                    actualizarTripulante(codigo_tripulante: $codigoTripulante, input: $input) {
                        codigo_tripulante
                    }
                }
            `;
            await graphqlQuery(mutation, { codigoTripulante: tripulante.codigo_tripulante, input });
        } else {
            const mutation = `
                mutation CrearTripulante($input: TripulanteInput!) {
                    crearTripulante(input: $input) {
                        codigo_tripulante
                    }
                }
            `;
            await graphqlQuery(mutation, { input });
        }
        
        bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
        loadTripulacion();
        alert('Tripulante guardado exitosamente');
    } catch (error) {
        alert('Error guardando tripulante: ' + error.message);
    }
}

async function editTripulante(codigoTripulante) {
    try {
        const query = `
            query GetTripulante($codigoTripulante: String!) {
                tripulante(codigo_tripulante: $codigoTripulante) {
                    codigo_tripulante
                    nombre
                    codigo_base
                    fecha_contratacion
                }
            }
        `;
        
        const data = await graphqlQuery(query, { codigoTripulante });
        showTripulanteForm(data.tripulante);
    } catch (error) {
        alert('Error cargando tripulante: ' + error.message);
    }
}

async function deleteTripulante(codigoTripulante) {
    try {
        // Primero verificar si el tripulante tiene vuelos asignados
        const checkQuery = `
            query TripulanteTieneVuelos($codigoTripulante: String!) {
                tripulanteTieneVuelos(codigo_tripulante: $codigoTripulante)
            }
        `;
        
        const checkData = await graphqlQuery(checkQuery, { codigoTripulante });
        
        if (checkData.tripulanteTieneVuelos) {
            // Obtener información del tripulante para mostrar en el mensaje
            const tripulanteQuery = `
                query GetTripulante($codigoTripulante: String!) {
                    tripulante(codigo_tripulante: $codigoTripulante) {
                        codigo_tripulante
                        nombre
                    }
                }
            `;
            
            const tripulanteData = await graphqlQuery(tripulanteQuery, { codigoTripulante });
            const tripulante = tripulanteData.tripulante;
            
            // Obtener vuelos asignados (sin parámetro, filtramos en el frontend)
            const vuelosQuery = `
                query {
                    vuelos {
                        numero_vuelo
                        origen
                        destino
                        estado
                        fecha_vuelo
                        tripulacion {
                            codigo_tripulante
                        }
                    }
                }
            `;
            
            const vuelosData = await graphqlQuery(vuelosQuery);
            const vuelosAsignados = vuelosData.vuelos.filter(v => 
                v.tripulacion && v.tripulacion.some(t => t.codigo_tripulante === codigoTripulante)
            );
            
            const mensaje = `
                <div class="alert alert-danger">
                    <h5 class="alert-heading">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        No se puede eliminar el tripulante <strong>${tripulante?.nombre || 'Desconocido'} (${tripulante?.codigo_tripulante || codigoTripulante})</strong>
                    </h5>
                    <p>Este tripulante está asignado a <strong>${vuelosAsignados.length}</strong> vuelo(s).</p>
                    <hr>
                    <p class="mb-1"><strong>Vuelos asignados:</strong></p>
                    <ul class="small">
                        ${vuelosAsignados.map(v => 
                            `<li>${v.numero_vuelo}: ${v.origen} → ${v.destino} (${v.estado}) - ${formatFechaVuelo(v.fecha_vuelo)}</li>`
                        ).join('')}
                    </ul>
                    <p class="mb-0 mt-2">
                        Para eliminar este tripulante, primero debe removerlo de sus vuelos asignados.
                        <br>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="showSection('vuelos'); bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();">
                            <i class="fas fa-route me-1"></i> Ir a Vuelos
                        </button>
                    </p>
                </div>
            `;
            
            showModal('No se puede eliminar', mensaje, null);
            return;
        }
        
        // Si no tiene vuelos, proceder con la eliminación
        if (confirm('¿Está seguro de eliminar este tripulante? Esta acción no se puede deshacer.')) {
            const mutation = `
                mutation EliminarTripulante($codigoTripulante: String!) {
                    eliminarTripulante(codigo_tripulante: $codigoTripulante)
                }
            `;
            await graphqlQuery(mutation, { codigoTripulante });
            loadTripulacion();
            
            // También actualizar dashboard si está visible
            const currentSection = document.querySelector('.content-section[style="display: block;"]');
            if (currentSection && currentSection.id === 'dashboard') {
                loadDashboard();
            }
            
            alert('Tripulante eliminado exitosamente');
        }
    } catch (error) {
        console.error('Error eliminando tripulante:', error);
        alert('Error eliminando tripulante: ' + error.message);
    }
}

// Vuelos
async function loadVuelos() {
    try {
        console.log('Cargando vuelos...');
        
        const query = `
            query {
                vuelos {
                    numero_vuelo
                    origen
                    destino
                    fecha_vuelo
                    hora_salida
                    estado
                    codigo_avion
                    codigo_piloto
                    tripulacion {
                        codigo_tripulante
                        nombre
                    }
                }
            }
        `;
        
        const data = await graphqlQuery(query);
        console.log('Vuelos recibidos del backend:', data.vuelos);
        
        appState.vuelos = data.vuelos || [];
        
        // Ahora cargar información COMPLETA de aviones, pilotos y tripulación
        if (!appState.aviones || appState.aviones.length === 0) {
            console.log('Cargando aviones con información de base...');
            try {
                const avionesQuery = `
                    query {
                        aviones {
                            codigo_avion
                            codigo_tipo
                            codigo_base
                            base {
                                codigo_base
                                nombre_base
                                ubicacion
                            }
                        }
                    }
                `;
                const avionesData = await graphqlQuery(avionesQuery);
                appState.aviones = avionesData.aviones || [];
                console.log('Aviones cargados con base:', appState.aviones);
            } catch (error) {
                console.error('Error cargando aviones:', error);
                appState.aviones = [];
            }
        }
        
        if (!appState.pilotos || appState.pilotos.length === 0) {
            console.log('Cargando pilotos con información de base...');
            try {
                const pilotosQuery = `
                    query {
                        pilotos {
                            codigo_piloto
                            nombre
                            horas_vuelo
                            codigo_base
                            base {
                                codigo_base
                                nombre_base
                                ubicacion
                            }
                        }
                    }
                `;
                const pilotosData = await graphqlQuery(pilotosQuery);
                appState.pilotos = pilotosData.pilotos || [];
                console.log('Pilotos cargados con base:', appState.pilotos);
            } catch (error) {
                console.error('Error cargando pilotos:', error);
                appState.pilotos = [];
            }
        }
        
        if (!appState.tripulacion || appState.tripulacion.length === 0) {
            console.log('Cargando tripulación con información de base...');
            try {
                await loadTripulacion();
            } catch (error) {
                console.error('Error cargando tripulación:', error);
                appState.tripulacion = [];
            }
        }
        
        console.log('Vuelos cargados:', appState.vuelos.length);
        console.log('Aviones disponibles:', appState.aviones.length);
        console.log('Pilotos disponibles:', appState.pilotos.length);
        console.log('Tripulación disponible:', appState.tripulacion.length);
        
        const table = document.getElementById('vuelosTable');
        
        if (!table) {
            console.error('¡Tabla de vuelos no encontrada!');
            return;
        }
        
        // Limpiar la tabla
        table.innerHTML = '';
        
        if (!appState.vuelos || appState.vuelos.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        <div class="alert alert-info mb-0" role="alert">
                            <i class="fas fa-plane-slash me-2"></i>
                            No hay vuelos registrados
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Mostrar todos los vuelos en la tabla
        appState.vuelos.forEach(vuelo => {
            console.log('Procesando vuelo:', vuelo);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${vuelo.numero_vuelo || 'N/A'}</strong></td>
                <td>${vuelo.origen || 'N/A'}</td>
                <td>${vuelo.destino || 'N/A'}</td>
                <td>${formatFechaVuelo(vuelo.fecha_vuelo)}</td>
                <td>${formatHora(vuelo.hora_salida)}</td>
                <td>
                    <span class="badge bg-${getEstadoBadgeColor(vuelo.estado)}">
                        ${vuelo.estado || 'desconocido'}
                    </span>
                </td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-info" onclick="viewVuelo('${vuelo.numero_vuelo}')" 
                            title="Ver detalles" data-bs-toggle="tooltip">
                        <i class="fas fa-eye"></i>
                        <span class="d-none d-md-inline"> Ver</span>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editVuelo('${vuelo.numero_vuelo}')" 
                            title="Editar vuelo" data-bs-toggle="tooltip">
                        <i class="fas fa-edit"></i>
                        <span class="d-none d-md-inline"> Editar</span>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteVuelo('${vuelo.numero_vuelo}')" 
                            title="Eliminar vuelo" data-bs-toggle="tooltip">
                        <i class="fas fa-trash"></i>
                        <span class="d-none d-md-inline"> Eliminar</span>
                    </button>
                </td>
            `;
            table.appendChild(row);
        });
        
        // Inicializar tooltips si Bootstrap está disponible
        if (typeof bootstrap !== 'undefined') {
            const tooltipTriggerList = [].slice.call(table.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
        
        console.log('Tabla de vuelos actualizada con', appState.vuelos.length, 'registros');
        
    } catch (error) {
        console.error('Error cargando vuelos:', error);
        
        const table = document.getElementById('vuelosTable');
        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <div class="alert alert-danger py-2 my-0" role="alert">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Error cargando vuelos: ${error.message || 'Error desconocido'}
                        </div>
                    </td>
                </tr>
            `;
        }
        
        alert('Error cargando vuelos: ' + error.message);
    }
}

function showVueloForm(vuelo = null) {
    const isEdit = !!vuelo;
    const title = isEdit ? 'Editar Vuelo' : 'Nuevo Vuelo';
    
    console.log('Mostrando formulario de vuelo');
    console.log('Aviones disponibles:', appState.aviones);
    console.log('Pilotos disponibles:', appState.pilotos);
    console.log('Tripulación disponible:', appState.tripulacion);
    
    // Verificar que tenemos datos necesarios
    if (!appState.aviones || appState.aviones.length === 0) {
        const modalContent = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>No hay aviones disponibles</strong>
                <p>No se encontraron aviones registrados en el sistema.</p>
                <p>Por favor, registre aviones primero antes de crear vuelos.</p>
                <button class="btn btn-sm btn-primary mt-2" onclick="showSection('aviones'); bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();">
                    <i class="fas fa-plane me-1"></i> Ir a Aviones
                </button>
            </div>
        `;
        
        showModal(title, modalContent, null);
        return;
    }
    
    if (!appState.pilotos || appState.pilotos.length === 0) {
        const modalContent = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>No hay pilotos disponibles</strong>
                <p>No se encontraron pilotos registrados en el sistema.</p>
                <p>Por favor, registre pilotos primero antes de crear vuelos.</p>
                <button class="btn btn-sm btn-primary mt-2" onclick="showSection('pilotos'); bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();">
                    <i class="fas fa-user-tie me-1"></i> Ir a Pilotos
                </button>
            </div>
        `;
        
        showModal(title, modalContent, null);
        return;
    }
    
    // Cargar tripulación si no está cargada
    if (!appState.tripulacion || appState.tripulacion.length === 0) {
        loadTripulacion().then(() => {
            // Volver a mostrar el formulario después de cargar tripulación
            showVueloForm(vuelo);
        });
        return;
    }
    
    // Obtener información del avión seleccionado (para edición)
    let avionSeleccionado = null;
    let codigoBaseAvion = null;
    
    if (isEdit && vuelo && vuelo.codigo_avion) {
        avionSeleccionado = appState.aviones.find(a => a.codigo_avion === vuelo.codigo_avion);
        if (avionSeleccionado) {
            codigoBaseAvion = avionSeleccionado.codigo_base || avionSeleccionado.base?.codigo_base;
        }
    }
    
    // Obtener tripulación asignada actualmente (para edición)
    let tripulacionAsignada = [];
    if (isEdit && vuelo && vuelo.tripulacion) {
        tripulacionAsignada = vuelo.tripulacion.map(t => t.codigo_tripulante);
    }
    
    // Crear opciones para aviones
    const avionesOptions = appState.aviones.map(avion => {
        const codigo = avion?.codigo_avion || 'N/A';
        const tipo = avion?.codigo_tipo || '';
        const baseNombre = avion?.base?.nombre_base || avion?.codigo_base || 'Sin base';
        const selected = vuelo?.codigo_avion === codigo ? 'selected' : '';
        
        return `<option value="${codigo}" data-base="${avion?.codigo_base || ''}" ${selected}>
            ${codigo} ${tipo ? `(${tipo})` : ''} - Base: ${baseNombre}
        </option>`;
    }).join('');
    
    // Crear opciones para pilotos (inicialmente todas, se filtrarán cuando se seleccione avión)
    const pilotosOptions = appState.pilotos.map(piloto => {
        const codigo = piloto?.codigo_piloto || 'N/A';
        const nombre = piloto?.nombre || 'Desconocido';
        const baseNombre = piloto?.base?.nombre_base || piloto?.codigo_base || 'Sin base';
        const selected = vuelo?.codigo_piloto === codigo ? 'selected' : '';
        const basePiloto = piloto?.codigo_base || piloto?.base?.codigo_base || '';
        
        return `<option value="${codigo}" data-base="${basePiloto}" ${selected}>
            ${nombre} (${codigo}) - Base: ${baseNombre}
        </option>`;
    }).join('');
    
    // Crear checkboxes para tripulación (inicialmente todas, se filtrarán cuando se seleccione avión)
    let tripulacionCheckboxes = '';
    if (appState.tripulacion && appState.tripulacion.length > 0) {
        tripulacionCheckboxes = `
            <div class="tripulacion-checkbox-container" style="max-height: 200px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 5px; padding: 10px; margin-top: 5px;">
                <div class="row g-2" id="tripulacionContainer">
        `;
        
        appState.tripulacion.forEach((tripulante, index) => {
            const codigo = tripulante?.codigo_tripulante || 'N/A';
            const nombre = tripulante?.nombre || 'Desconocido';
            const baseNombre = tripulante?.base?.nombre_base || tripulante?.codigo_base || 'Sin base';
            const baseTripulante = tripulante?.codigo_base || tripulante?.base?.codigo_base || '';
            const checked = tripulacionAsignada.includes(codigo) ? 'checked' : '';
            
            tripulacionCheckboxes += `
                <div class="col-md-6 col-lg-4 tripulante-item" data-base="${baseTripulante}">
                    <div class="form-check">
                        <input class="form-check-input tripulacion-checkbox" 
                               type="checkbox" 
                               value="${codigo}" 
                               id="tripulante_${index}" 
                               name="codigos_tripulacion" 
                               ${checked}>
                        <label class="form-check-label" for="tripulante_${index}">
                            <small>
                                <strong>${nombre}</strong><br>
                                <span class="text-muted">${codigo} - Base: ${baseNombre}</span>
                            </small>
                        </label>
                    </div>
                </div>
            `;
        });
        
        tripulacionCheckboxes += `
                </div>
            </div>
            <div class="mt-2">
                <small class="text-info" id="filtroBaseInfo">
                    <i class="fas fa-info-circle me-1"></i>
                    Mostrando todos los tripulantes disponibles
                </small>
            </div>
        `;
    } else {
        tripulacionCheckboxes = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                No hay tripulación disponible. Registre tripulación primero.
            </div>
        `;
    }
    
    // Contador de tripulantes seleccionados
    const contadorSeleccionados = tripulacionAsignada.length;
    
    // Crear el formulario
    const form = `
        <form id="vueloForm" novalidate>
            <div class="mb-3">
                <label class="form-label required-label">Número de Vuelo</label>
                <input type="text" class="form-control" name="numero_vuelo" 
                       value="${vuelo?.numero_vuelo || ''}" ${isEdit ? 'readonly' : ''} required>
                <div class="invalid-feedback" id="numero_vuelo_error">
                    Por favor ingrese el número de vuelo.
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label required-label">Origen</label>
                        <input type="text" class="form-control" name="origen" 
                               value="${vuelo?.origen || ''}" required>
                        <div class="invalid-feedback" id="origen_error">
                            Por favor ingrese el origen del vuelo.
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label required-label">Destino</label>
                        <input type="text" class="form-control" name="destino" 
                               value="${vuelo?.destino || ''}" required>
                        <div class="invalid-feedback" id="destino_error">
                            Por favor ingrese el destino del vuelo.
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label required-label">Fecha del Vuelo</label>
                        <input type="date" class="form-control" name="fecha_vuelo" 
                               value="${vuelo?.fecha_vuelo ? formatFechaForInput(vuelo.fecha_vuelo) : ''}" required>
                        <div class="invalid-feedback" id="fecha_vuelo_error">
                            Por favor seleccione la fecha del vuelo.
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label required-label">Hora de Salida</label>
                        <input type="time" class="form-control" name="hora_salida" 
                               value="${vuelo?.hora_salida || ''}" required>
                        <div class="invalid-feedback" id="hora_salida_error">
                            Por favor seleccione la hora de salida.
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label required-label">Avión</label>
                        <select class="form-control" name="codigo_avion" id="selectAvion" required>
                            <option value="">Seleccionar avión</option>
                            ${avionesOptions}
                        </select>
                        <div class="invalid-feedback" id="codigo_avion_error">
                            Por favor seleccione un avión.
                        </div>
                        <div class="form-text" id="infoBaseAvion">
                            <i class="fas fa-info-circle me-1"></i>
                            Al seleccionar un avión, solo se mostrarán pilotos y tripulación de la misma base
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label required-label">Piloto</label>
                        <select class="form-control" name="codigo_piloto" id="selectPiloto" required>
                            <option value="">Seleccionar piloto</option>
                            ${pilotosOptions}
                        </select>
                        <div class="invalid-feedback" id="codigo_piloto_error">
                            Por favor seleccione un piloto.
                        </div>
                        <div class="form-text" id="infoPilotosFiltrados">
                            <i class="fas fa-filter me-1"></i>
                            ${codigoBaseAvion ? 
                                `Filtrado por base: ${appState.bases.find(b => b.codigo_base === codigoBaseAvion)?.nombre_base || codigoBaseAvion}` : 
                                'Seleccione un avión primero'}
                        </div>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label required-label">Tripulación</label>
                <div class="mb-2">
                    <small class="text-muted">Seleccione los tripulantes asignados a este vuelo:</small>
                    <span id="contadorTripulacion" class="badge bg-info float-end">
                        ${contadorSeleccionados} seleccionado(s)
                    </span>
                </div>
                ${tripulacionCheckboxes}
                <div class="invalid-feedback" id="codigos_tripulacion_error">
                    Por favor seleccione al menos un tripulante.
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label required-label">Estado</label>
                <select class="form-control" name="estado" required>
                    <option value="">Seleccionar estado</option>
                    <option value="programado" ${vuelo?.estado === 'programado' ? 'selected' : ''}>Programado</option>
                    <option value="realizado" ${vuelo?.estado === 'realizado' ? 'selected' : ''}>Realizado</option>
                    <option value="cancelado" ${vuelo?.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
                <div class="invalid-feedback" id="estado_error">
                    Por favor seleccione un estado.
                </div>
            </div>
        </form>
    `;
    
    showModal(title, form, () => submitVueloForm(vuelo));
    
    // Configurar validación en tiempo real después de que el modal se muestre
    setTimeout(() => {
        console.log('Configurando validación para vueloForm');
        setupRealTimeValidation('vueloForm');
        
        // Función para filtrar pilotos y tripulación por base
        function filtrarPorBase(codigoBase) {
            console.log('Filtrando por base:', codigoBase);
            
            // Filtrar pilotos
            const selectPiloto = document.getElementById('selectPiloto');
            if (selectPiloto) {
                const optionsPiloto = selectPiloto.querySelectorAll('option');
                let pilotosDisponibles = 0;
                
                optionsPiloto.forEach(option => {
                    if (option.value === '') {
                        // Opción "Seleccionar piloto" siempre visible
                        option.style.display = '';
                        option.disabled = false;
                    } else {
                        const basePiloto = option.getAttribute('data-base');
                        if (codigoBase && basePiloto !== codigoBase) {
                            option.style.display = 'none';
                            option.disabled = true;
                        } else {
                            option.style.display = '';
                            option.disabled = false;
                            pilotosDisponibles++;
                        }
                    }
                });
                
                // Actualizar información
                const infoPilotos = document.getElementById('infoPilotosFiltrados');
                if (infoPilotos) {
                    const baseInfo = appState.bases.find(b => b.codigo_base === codigoBase);
                    const baseNombre = baseInfo ? baseInfo.nombre_base : codigoBase;
                    
                    if (codigoBase) {
                        infoPilotos.innerHTML = `
                            <i class="fas fa-filter me-1"></i>
                            Filtrado por base: <strong>${baseNombre}</strong> 
                            (${pilotosDisponibles} piloto(s) disponible(s))
                        `;
                    } else {
                        infoPilotos.innerHTML = `
                            <i class="fas fa-filter me-1"></i>
                            Mostrando todos los pilotos (${pilotosDisponibles} disponible(s))
                        `;
                    }
                }
            }
            
            // Filtrar tripulación
            const tripulacionContainer = document.getElementById('tripulacionContainer');
            const filtroBaseInfo = document.getElementById('filtroBaseInfo');
            
            if (tripulacionContainer && filtroBaseInfo) {
                const itemsTripulacion = tripulacionContainer.querySelectorAll('.tripulante-item');
                let tripulantesDisponibles = 0;
                
                itemsTripulacion.forEach(item => {
                    const baseTripulante = item.getAttribute('data-base');
                    if (codigoBase && baseTripulante !== codigoBase) {
                        item.style.display = 'none';
                    } else {
                        item.style.display = '';
                        tripulantesDisponibles++;
                    }
                });
                
                // Actualizar información
                if (codigoBase) {
                    const baseInfo = appState.bases.find(b => b.codigo_base === codigoBase);
                    const baseNombre = baseInfo ? baseInfo.nombre_base : codigoBase;
                    filtroBaseInfo.innerHTML = `
                        <i class="fas fa-filter me-1"></i>
                        Filtrado por base: <strong>${baseNombre}</strong> 
                        (${tripulantesDisponibles} tripulante(s) disponible(s))
                    `;
                    filtroBaseInfo.className = 'text-info';
                } else {
                    filtroBaseInfo.innerHTML = `
                        <i class="fas fa-info-circle me-1"></i>
                        Mostrando todos los tripulantes (${tripulantesDisponibles} disponible(s))
                    `;
                    filtroBaseInfo.className = 'text-info';
                }
            }
        }
        
        // Event listener para el cambio de avión
        const selectAvion = document.getElementById('selectAvion');
        if (selectAvion) {
            selectAvion.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                const codigoBase = selectedOption.getAttribute('data-base');
                
                // Filtrar pilotos y tripulación por la base del avión seleccionado
                filtrarPorBase(codigoBase);
                
                // Actualizar información de la base del avión
                const infoBaseAvion = document.getElementById('infoBaseAvion');
                if (infoBaseAvion && codigoBase) {
                    const baseInfo = appState.bases.find(b => b.codigo_base === codigoBase);
                    const baseNombre = baseInfo ? baseInfo.nombre_base : codigoBase;
                    infoBaseAvion.innerHTML = `
                        <i class="fas fa-info-circle me-1"></i>
                        Avión de la base: <strong>${baseNombre}</strong>
                    `;
                }
            });
            
            // Si estamos en modo edición y ya hay un avión seleccionado, aplicar filtro automáticamente
            if (isEdit && avionSeleccionado && avionSeleccionado.codigo_base) {
                filtrarPorBase(avionSeleccionado.codigo_base);
            }
        }
        
        // Agregar funcionalidad para actualizar el contador de tripulantes
        const checkboxes = document.querySelectorAll('.tripulacion-checkbox');
        const contador = document.getElementById('contadorTripulacion');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const seleccionados = document.querySelectorAll('.tripulacion-checkbox:checked').length;
                contador.textContent = `${seleccionados} seleccionado(s)`;
                
                // Validar si hay al menos un tripulante seleccionado
                const form = document.getElementById('vueloForm');
                const errorElement = document.getElementById('codigos_tripulacion_error');
                
                if (seleccionados === 0) {
                    errorElement.style.display = 'block';
                    errorElement.textContent = 'Por favor seleccione al menos un tripulante.';
                } else {
                    errorElement.style.display = 'none';
                }
            });
        });
        
        // Agregar validación personalizada para checkboxes
        const vueloForm = document.getElementById('vueloForm');
        if (vueloForm) {
            const originalCheckValidity = vueloForm.checkValidity;
            
            vueloForm.checkValidity = function() {
                const seleccionados = document.querySelectorAll('.tripulacion-checkbox:checked').length;
                
                if (seleccionados === 0) {
                    const errorElement = document.getElementById('codigos_tripulacion_error');
                    errorElement.style.display = 'block';
                    errorElement.textContent = 'Por favor seleccione al menos un tripulante.';
                    return false;
                }
                
                return originalCheckValidity.call(this);
            };
        }
        
    }, 100);
}

async function submitVueloForm(vuelo) {
    // Validar el formulario antes de proceder
    if (!validateForm('vueloForm')) {
        return;
    }
    
    // Validación personalizada para tripulación (al menos un checkbox seleccionado)
    const checkboxesSeleccionados = document.querySelectorAll('.tripulacion-checkbox:checked');
    if (checkboxesSeleccionados.length === 0) {
        const errorElement = document.getElementById('codigos_tripulacion_error');
        errorElement.style.display = 'block';
        errorElement.textContent = 'Por favor seleccione al menos un tripulante.';
        return;
    }
    
    const form = document.getElementById('vueloForm');
    const formData = new FormData(form);
    
    // Obtener los valores de tripulación seleccionados de los checkboxes
    const codigosTripulacion = Array.from(checkboxesSeleccionados).map(checkbox => checkbox.value);
    
    const input = {
        numero_vuelo: formData.get('numero_vuelo'),
        origen: formData.get('origen'),
        destino: formData.get('destino'),
        fecha_vuelo: formData.get('fecha_vuelo'),
        hora_salida: formData.get('hora_salida'),
        codigo_avion: formData.get('codigo_avion'),
        codigo_piloto: formData.get('codigo_piloto'),
        estado: formData.get('estado'),
        codigos_tripulacion: codigosTripulacion.filter(codigo => codigo !== '') // Filtrar valores vacíos
    };
    
    console.log('Datos a enviar:', input);
    
    try {
        if (vuelo) {
            const mutation = `
                mutation ActualizarVuelo($numeroVuelo: String!, $input: VueloInput!) {
                    actualizarVuelo(numero_vuelo: $numeroVuelo, input: $input) {
                        numero_vuelo
                    }
                }
            `;
            await graphqlQuery(mutation, { numeroVuelo: vuelo.numero_vuelo, input });
        } else {
            const mutation = `
                mutation CrearVuelo($input: VueloInput!) {
                    crearVuelo(input: $input) {
                        numero_vuelo
                    }
                }
            `;
            await graphqlQuery(mutation, { input });
        }
        
        bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
        loadVuelos();
        alert('Vuelo guardado exitosamente');
    } catch (error) {
        console.error('Error guardando vuelo:', error);
        alert('Error guardando vuelo: ' + error.message);
    }
}

async function editVuelo(numeroVuelo) {
    try {
        console.log('Editando vuelo:', numeroVuelo);
        
        // Primero cargar los datos del vuelo con su tripulación
        const query = `
            query GetVuelo($numeroVuelo: String!) {
                vuelo(numero_vuelo: $numeroVuelo) {
                    numero_vuelo
                    origen
                    destino
                    fecha_vuelo
                    hora_salida
                    codigo_avion
                    codigo_piloto
                    estado
                    tripulacion {
                        codigo_tripulante
                        nombre
                    }
                }
            }
        `;
        
        const data = await graphqlQuery(query, { numeroVuelo });
        
        if (!data.vuelo) {
            alert('Vuelo no encontrado');
            return;
        }
        
        console.log('Datos del vuelo cargados:', data.vuelo);
        
        // Asegurarse de que tenemos aviones y pilotos cargados
        if (appState.aviones.length === 0 || appState.pilotos.length === 0) {
            // Si no tenemos datos, cargarlos primero
            await loadVuelos();
        }
        
        // Asegurarse de que tenemos tripulación cargada
        if (appState.tripulacion.length === 0) {
            await loadTripulacion();
        }
        
        // Mostrar el formulario con los datos del vuelo
        showVueloForm(data.vuelo);
        
    } catch (error) {
        console.error('Error cargando vuelo:', error);
        alert('Error cargando vuelo: ' + error.message);
    }
}

async function viewVuelo(numeroVuelo) {
    try {
        const query = `
            query GetVueloCompleto($numeroVuelo: String!) {
                vuelo(numero_vuelo: $numeroVuelo) {
                    numero_vuelo
                    origen
                    destino
                    fecha_vuelo
                    hora_salida
                    estado
                    codigo_avion
                    codigo_piloto
                    avion {
                        codigo_avion
                        codigo_tipo
                        codigo_base
                        base {
                            codigo_base
                            nombre_base
                            ubicacion
                        }
                    }
                    piloto {
                        codigo_piloto
                        nombre
                        horas_vuelo
                        codigo_base
                        base {
                            codigo_base
                            nombre_base
                            ubicacion
                        }
                    }
                    tripulacion {
                        codigo_tripulante
                        nombre
                        codigo_base
                        base {
                            codigo_base
                            nombre_base
                            ubicacion
                        }
                    }
                }
            }
        `;
        
        const data = await graphqlQuery(query, { numeroVuelo });
        const vuelo = data.vuelo;
        
        if (!vuelo) {
            alert('Vuelo no encontrado');
            return;
        }

        // Helper function para mostrar información de base de forma segura
        const getBaseInfo = (baseObj, defaultText = 'No asignada') => {
            if (!baseObj || !baseObj.codigo_base) return defaultText;
            return `${baseObj.nombre_base} (${baseObj.ubicacion})`;
        };

        // Crear contenido seguro que maneje valores nulos
        const avionInfo = vuelo.avion ? 
            `${vuelo.avion.codigo_avion} (${vuelo.avion.codigo_tipo})<br>
             <strong>Base:</strong> ${getBaseInfo(vuelo.avion.base)}` : 
            'No asignado';

        const pilotoInfo = vuelo.piloto ? 
            `${vuelo.piloto.nombre}<br>
             <strong>Horas:</strong> ${vuelo.piloto.horas_vuelo}<br>
             <strong>Base:</strong> ${getBaseInfo(vuelo.piloto.base)}` : 
            'No asignado';

        // Mejorar la visualización de la tripulación
        const tripulacionInfo = vuelo.tripulacion && vuelo.tripulacion.length > 0 ? 
            `<div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Base</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vuelo.tripulacion.map(tripulante => `
                            <tr>
                                <td>${tripulante.codigo_tripulante}</td>
                                <td>${tripulante.nombre}</td>
                                <td>${getBaseInfo(tripulante.base)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <p class="text-muted"><small>Total: ${vuelo.tripulacion.length} tripulantes</small></p>` : 
            '<div class="alert alert-warning">No hay tripulación asignada a este vuelo</div>';

        const modalContent = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="card-title mb-0">Información del Vuelo</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Número:</strong> ${vuelo.numero_vuelo}</p>
                            <p><strong>Ruta:</strong> ${vuelo.origen} → ${vuelo.destino}</p>
                            <p><strong>Fecha:</strong> ${formatFechaVuelo(vuelo.fecha_vuelo)}</p>
                            <p><strong>Hora:</strong> ${vuelo.hora_salida}</p>
                            <p><strong>Estado:</strong> <span class="badge bg-${getEstadoBadgeColor(vuelo.estado)}">${vuelo.estado}</span></p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="card-title mb-0">Recursos Asignados</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Avión:</strong><br>${avionInfo}</p>
                            <hr>
                            <p><strong>Piloto:</strong><br>${pilotoInfo}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="card-title mb-0">Tripulación Asignada</h6>
                        </div>
                        <div class="card-body">
                            ${tripulacionInfo}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        showModal('Detalles del Vuelo - ' + vuelo.numero_vuelo, modalContent, null);
    } catch (error) {
        console.error('Error cargando detalles del vuelo:', error);
        alert('Error cargando detalles del vuelo: ' + error.message);
    }
}

async function deleteVuelo(numeroVuelo) {
    if (confirm('¿Está seguro de eliminar este vuelo?')) {
        try {
            const mutation = `
                mutation EliminarVuelo($numeroVuelo: String!) {
                    eliminarVuelo(numero_vuelo: $numeroVuelo)
                }
            `;
            await graphqlQuery(mutation, { numeroVuelo });
            loadVuelos();
            alert('Vuelo eliminado exitosamente');
        } catch (error) {
            alert('Error eliminando vuelo: ' + error.message);
        }
    }
}

// Bases
async function loadBases() {
    try {
        const query = `
            query {
                bases {
                    codigo_base
                    nombre_base
                    ubicacion
                }
            }
        `;
        
        const data = await graphqlQuery(query);
        appState.bases = data.bases;
        
        const table = document.getElementById('basesTable');
        table.innerHTML = '';
        
        data.bases.forEach(base => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${base.codigo_base}</td>
                <td>${base.nombre_base}</td>
                <td>${base.ubicacion}</td>
            `;
            table.appendChild(row);
        });
    } catch (error) {
        alert('Error cargando bases: ' + error.message);
    }
}

function getEstadoBadgeColor(estado) {
    switch(estado) {
        case 'programado': return 'primary';
        case 'realizado': return 'success';
        case 'cancelado': return 'danger';
        default: return 'secondary';
    }
}

function showModal(title, body, onSave) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    if (onSave) {
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="saveButton">Guardar</button>
        `;
        document.getElementById('modalBody').appendChild(footer);
        document.getElementById('saveButton').onclick = onSave;
    } else {
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
        `;
        document.getElementById('modalBody').appendChild(footer);
    }
    
    const modal = new bootstrap.Modal(document.getElementById('formModal'));
    modal.show();
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar dashboard por defecto
    showSection('dashboard');
    
    // Cargar datos iniciales necesarios
    loadBases();
    
    // Inicializar tooltips
    initTooltips();
    
    // Inicializar filtro en "todos"
    filtrarVuelos('todos');
});