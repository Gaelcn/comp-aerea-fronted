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

// Función para formatear fechas desde timestamp
function formatFecha(timestamp) {
    if (!timestamp) return 'N/A';
    
    try {
        // Convertir timestamp a fecha
        const fecha = new Date(parseInt(timestamp));
        
        // Verificar si la fecha es válida
        if (isNaN(fecha.getTime())) {
            return 'Fecha inválida';
        }
        
        // Formatear a DD/MM/YYYY
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const año = fecha.getFullYear();
        
        return `${dia}/${mes}/${año}`;
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return 'Error fecha';
    }
}

// Función para formatear fecha para input type="date" (YYYY-MM-DD)
function formatFechaForInput(timestamp) {
    if (!timestamp) return '';
    
    try {
        const fecha = new Date(parseInt(timestamp));
        if (isNaN(fecha.getTime())) return '';
        
        return fecha.toISOString().split('T')[0];
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

// Dashboard
async function loadDashboard() {
    try {
        const query = `
            query {
                aviones { codigo_avion }
                pilotos { codigo_piloto }
                tripulacion { codigo_tripulante }
                vuelos { numero_vuelo }
            }
        `;
        
        const data = await graphqlQuery(query);
        
        document.getElementById('totalAviones').textContent = data.aviones.length;
        document.getElementById('totalPilotos').textContent = data.pilotos.length;
        document.getElementById('totalTripulacion').textContent = data.tripulacion.length;
        document.getElementById('totalVuelos').textContent = data.vuelos.length;
    } catch (error) {
        alert('Error cargando dashboard: ' + error.message);
    }
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
        <form id="avionForm">
            <div class="mb-3">
                <label class="form-label">Código Avión</label>
                <input type="text" class="form-control" name="codigo_avion" 
                       value="${avion?.codigo_avion || ''}" ${isEdit ? 'readonly' : ''} required>
            </div>
            <div class="mb-3">
                <label class="form-label">Tipo de Avión</label>
                <select class="form-control" name="codigo_tipo" required>
                    <option value="">Seleccionar tipo</option>
                    ${tiposOptions}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Base</label>
                <select class="form-control" name="codigo_base" required>
                    <option value="">Seleccionar base</option>
                    ${basesOptions}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Fecha Adquisición</label>
                <input type="date" class="form-control" name="fecha_adquisicion" 
                    value="${avion?.fecha_adquisicion ? formatFechaForInput(avion.fecha_adquisicion) : ''}">
            </div>
        </form>
    `;
    
    showModal(title, form, () => submitAvionForm(avion));
}

async function submitAvionForm(avion) {
    const form = document.getElementById('avionForm');
    const formData = new FormData(form);
    const fechaInput = formData.get('fecha_adquisicion');
    
    const input = {
        codigo_avion: formData.get('codigo_avion'),
        codigo_tipo: formData.get('codigo_tipo'),
        codigo_base: formData.get('codigo_base'),
        fecha_adquisicion: fechaInput ? new Date(fechaInput).getTime().toString() : null
    };
    
    // El resto del código permanece igual...
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
    if (confirm('¿Está seguro de eliminar este avión?')) {
        try {
            const mutation = `
                mutation EliminarAvion($codigoAvion: String!) {
                    eliminarAvion(codigo_avion: $codigoAvion)
                }
            `;
            await graphqlQuery(mutation, { codigoAvion });
            loadAviones();
            alert('Avión eliminado exitosamente');
        } catch (error) {
            alert('Error eliminando avión: ' + error.message);
        }
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
                    base { nombre_base }
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
        <form id="pilotoForm">
            <div class="mb-3">
                <label class="form-label">Código Piloto</label>
                <input type="text" class="form-control" name="codigo_piloto" 
                       value="${piloto?.codigo_piloto || ''}" ${isEdit ? 'readonly' : ''} required>
            </div>
            <div class="mb-3">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-control" name="nombre" 
                       value="${piloto?.nombre || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Horas de Vuelo</label>
                <input type="number" class="form-control" name="horas_vuelo" 
                       value="${piloto?.horas_vuelo || 0}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Base</label>
                <select class="form-control" name="codigo_base" required>
                    <option value="">Seleccionar base</option>
                    ${basesOptions}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Fecha Contratación</label>
                <input type="date" class="form-control" name="fecha_contratacion" 
                       value="${piloto?.fecha_contratacion || ''}">
            </div>
        </form>
    `;
    
    showModal(title, form, () => submitPilotoForm(piloto));
}

async function submitPilotoForm(piloto) {
    const form = document.getElementById('pilotoForm');
    const formData = new FormData(form);
    const input = {
        codigo_piloto: formData.get('codigo_piloto'),
        nombre: formData.get('nombre'),
        horas_vuelo: parseInt(formData.get('horas_vuelo')),
        codigo_base: formData.get('codigo_base'),
        fecha_contratacion: formData.get('fecha_contratacion') || null
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
    if (confirm('¿Está seguro de eliminar este piloto?')) {
        try {
            const mutation = `
                mutation EliminarPiloto($codigoPiloto: String!) {
                    eliminarPiloto(codigo_piloto: $codigoPiloto)
                }
            `;
            await graphqlQuery(mutation, { codigoPiloto });
            loadPilotos();
            alert('Piloto eliminado exitosamente');
        } catch (error) {
            alert('Error eliminando piloto: ' + error.message);
        }
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
                    base { nombre_base }
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
        <form id="tripulanteForm">
            <div class="mb-3">
                <label class="form-label">Código Tripulante</label>
                <input type="text" class="form-control" name="codigo_tripulante" 
                       value="${tripulante?.codigo_tripulante || ''}" ${isEdit ? 'readonly' : ''} required>
            </div>
            <div class="mb-3">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-control" name="nombre" 
                       value="${tripulante?.nombre || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Base</label>
                <select class="form-control" name="codigo_base" required>
                    <option value="">Seleccionar base</option>
                    ${basesOptions}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Fecha Contratación</label>
                <input type="date" class="form-control" name="fecha_contratacion" 
                       value="${tripulante?.fecha_contratacion || ''}">
            </div>
        </form>
    `;
    
    showModal(title, form, () => submitTripulanteForm(tripulante));
}

async function submitTripulanteForm(tripulante) {
    const form = document.getElementById('tripulanteForm');
    const formData = new FormData(form);
    const input = {
        codigo_tripulante: formData.get('codigo_tripulante'),
        nombre: formData.get('nombre'),
        codigo_base: formData.get('codigo_base'),
        fecha_contratacion: formData.get('fecha_contratacion') || null
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
    if (confirm('¿Está seguro de eliminar este tripulante?')) {
        try {
            const mutation = `
                mutation EliminarTripulante($codigoTripulante: String!) {
                    eliminarTripulante(codigo_tripulante: $codigoTripulante)
                }
            `;
            await graphqlQuery(mutation, { codigoTripulante });
            loadTripulacion();
            alert('Tripulante eliminado exitosamente');
        } catch (error) {
            alert('Error eliminando tripulante: ' + error.message);
        }
    }
}

// Vuelos
async function loadVuelos() {
    try {
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
                    avion {
                        codigo_avion
                        codigo_tipo
                    }
                    piloto {
                        nombre
                    }
                }
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
        appState.vuelos = data.vuelos;
        
        const table = document.getElementById('vuelosTable');
        table.innerHTML = '';
        
        data.vuelos.forEach(vuelo => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vuelo.numero_vuelo}</td>
                <td>${vuelo.origen}</td>
                <td>${vuelo.destino}</td>
                <td>${vuelo.fecha_vuelo}</td>
                <td>${vuelo.hora_salida}</td>
                <td><span class="badge bg-${getEstadoBadgeColor(vuelo.estado)}">${vuelo.estado}</span></td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-info" onclick="viewVuelo('${vuelo.numero_vuelo}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editVuelo('${vuelo.numero_vuelo}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteVuelo('${vuelo.numero_vuelo}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            table.appendChild(row);
        });
    } catch (error) {
        alert('Error cargando vuelos: ' + error.message);
    }
}

function showVueloForm(vuelo = null) {
    const isEdit = !!vuelo;
    const title = isEdit ? 'Editar Vuelo' : 'Nuevo Vuelo';
    
    const avionesOptions = appState.aviones.map(avion => 
        `<option value="${avion.codigo_avion}" ${vuelo?.codigo_avion === avion.codigo_avion ? 'selected' : ''}>
            ${avion.codigo_avion} (${avion.codigo_tipo})
        </option>`
    ).join('');
    
    const pilotosOptions = appState.pilotos.map(piloto => 
        `<option value="${piloto.codigo_piloto}" ${vuelo?.codigo_piloto === piloto.codigo_piloto ? 'selected' : ''}>
            ${piloto.nombre}
        </option>`
    ).join('');
    
    const form = `
        <form id="vueloForm">
            <div class="mb-3">
                <label class="form-label">Número de Vuelo</label>
                <input type="text" class="form-control" name="numero_vuelo" 
                       value="${vuelo?.numero_vuelo || ''}" ${isEdit ? 'readonly' : ''} required>
            </div>
            <div class="mb-3">
                <label class="form-label">Origen</label>
                <input type="text" class="form-control" name="origen" 
                       value="${vuelo?.origen || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Destino</label>
                <input type="text" class="form-control" name="destino" 
                       value="${vuelo?.destino || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Fecha del Vuelo</label>
                <input type="date" class="form-control" name="fecha_vuelo" 
                       value="${vuelo?.fecha_vuelo || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Hora de Salida</label>
                <input type="time" class="form-control" name="hora_salida" 
                       value="${vuelo?.hora_salida || ''}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Avión</label>
                <select class="form-control" name="codigo_avion" required>
                    <option value="">Seleccionar avión</option>
                    ${avionesOptions}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Piloto</label>
                <select class="form-control" name="codigo_piloto" required>
                    <option value="">Seleccionar piloto</option>
                    ${pilotosOptions}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Estado</label>
                <select class="form-control" name="estado" required>
                    <option value="programado" ${vuelo?.estado === 'programado' ? 'selected' : ''}>Programado</option>
                    <option value="realizado" ${vuelo?.estado === 'realizado' ? 'selected' : ''}>Realizado</option>
                    <option value="cancelado" ${vuelo?.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </div>
        </form>
    `;
    
    showModal(title, form, () => submitVueloForm(vuelo));
}

async function submitVueloForm(vuelo) {
    const form = document.getElementById('vueloForm');
    const formData = new FormData(form);
    const input = {
        numero_vuelo: formData.get('numero_vuelo'),
        origen: formData.get('origen'),
        destino: formData.get('destino'),
        fecha_vuelo: formData.get('fecha_vuelo'),
        hora_salida: formData.get('hora_salida'),
        codigo_avion: formData.get('codigo_avion'),
        codigo_piloto: formData.get('codigo_piloto'),
        estado: formData.get('estado')
    };
    
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
        alert('Error guardando vuelo: ' + error.message);
    }
}

async function editVuelo(numeroVuelo) {
    try {
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
                }
            }
        `;
        
        const data = await graphqlQuery(query, { numeroVuelo });
        showVueloForm(data.vuelo);
    } catch (error) {
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
                            <p><strong>Fecha:</strong> ${vuelo.fecha_vuelo}</p>
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
    showSection('dashboard');
    // Cargar datos iniciales necesarios
    loadBases();
});