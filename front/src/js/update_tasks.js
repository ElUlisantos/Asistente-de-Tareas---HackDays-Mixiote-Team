const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function updateThemeIcon() {
    themeIcon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
}

if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}
updateThemeIcon();

themeToggleBtn.addEventListener('click', function() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('color-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    updateThemeIcon();
});

// --- 2. ESTADO GLOBAL ---
let currentDate = new Date(); // Mantiene el mes/semana actual visible
let currentView = 'month';
let selectedColor = 'blue';
let tasks = []; // Array principal de tareas

// Formatea la fecha a YYYY-MM-DD para usarla como clave y en el input type="date"
function formatDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getTodayString() {
    return formatDateString(new Date());
}

// --- 3. FUNCIONES DE RENDERIZADO PRINCIPALES ---
function updateDashboard() {
    renderCalendar();
    renderTaskList();
    renderChart();
}

// --- 4. LÓGICA DEL CALENDARIO ---
const calendarGrid = document.getElementById('calendar-grid');
const displayDate = document.getElementById('current-date-display');

function renderCalendar() {
    calendarGrid.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    displayDate.textContent = currentView === 'month' ? `${monthNames[month]} ${year}` : `Week of ${monthNames[month]} ${year}`;

    let daysToRender = [];


    if (currentView === 'month') {
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        for (let i = startOffset - 1; i >= 0; i--) {
            daysToRender.push({ dateObj: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            daysToRender.push({ dateObj: new Date(year, month, i), isCurrentMonth: true });
        }
        const remainingCells = 42 - daysToRender.length;
        for (let i = 1; i <= remainingCells; i++) {
            daysToRender.push({ dateObj: new Date(year, month + 1, i), isCurrentMonth: false });
        }
    } else if (currentView === 'week') {
        const currentDayOfWeek = currentDate.getDay();
        const startOffset = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

        let startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - startOffset);

        for (let i = 0; i < 7; i++) {
            let dateIter = new Date(startOfWeek);
            dateIter.setDate(startOfWeek.getDate() + i);
            daysToRender.push({
                dateObj: dateIter,
                isCurrentMonth: dateIter.getMonth() === month
            });
        }
    }

    const todayStr = getTodayString();

    daysToRender.forEach(info => {
        const dateStr = formatDateString(info.dateObj);
        const isToday = todayStr === dateStr;

        const dayDiv = document.createElement('div');
        dayDiv.className = `bg-surface-light dark:bg-surface-dark min-h-[100px] p-2 relative group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer flex flex-col gap-1 ${!info.isCurrentMonth && currentView === 'month' ? 'opacity-50' : ''}`;

        let dayNumberHtml = `<span class="font-medium text-sm w-7 h-7 flex items-center justify-center ${isToday ? 'bg-primary text-white rounded-full shadow-md' : 'text-text-primary-light dark:text-text-primary-dark'}">${info.dateObj.getDate()}</span>`;
        dayDiv.innerHTML = dayNumberHtml;

        // Filtrar tareas para este día
        const dayTasks = tasks.filter(t => t.date === dateStr);
        dayTasks.forEach(task => {
            const evtDiv = document.createElement('div');
            evtDiv.className = `px-2 py-1 text-xs font-medium rounded truncate bg-${task.color}-100 dark:bg-${task.color}-900 text-${task.color}-800 dark:text-${task.color}-200 shadow-sm`;
            evtDiv.textContent = task.title;
            dayDiv.appendChild(evtDiv);
        });

        dayDiv.addEventListener('click', () => openModal(dateStr));
        calendarGrid.appendChild(dayDiv);
    });
}


// --- 5. LÓGICA DE LA LISTA DE TAREAS ---
const taskListEl = document.getElementById('task-list');
const taskCounterEl = document.getElementById('task-counter');

function renderTaskList() {
    taskListEl.innerHTML = '';

    // Ordenar tareas por fecha
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.date) - new Date(b.date));
    taskCounterEl.textContent = `${sortedTasks.length} Tareas`;

    if (sortedTasks.length === 0) {
        taskListEl.innerHTML = '<li class="text-center text-text-secondary-light dark:text-text-secondary-dark text-sm mt-4">No hay tareas programadas.</li>';
        return;
    }

    sortedTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `flex items-start p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 group border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all border-l-4 border-l-${task.color}-500`;

        li.innerHTML = `
            <div class="flex items-center h-5 mt-0.5">
                <input type="checkbox" class="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600 cursor-pointer"/>
            </div>
            <div class="ml-3 text-sm flex-grow">
                <label class="font-medium text-text-primary-light dark:text-text-primary-dark cursor-pointer break-words">${task.title}</label>
                ${task.desc ? `<p class="text-text-secondary-light dark:text-text-secondary-dark text-xs mt-1 truncate max-w-[200px]">${task.desc}</p>` : ''}
                <p class="text-${task.color}-600 dark:text-${task.color}-400 text-xs font-medium mt-1">
                    <span class="material-icons-outlined text-[12px] align-middle mr-0.5">event</span>${task.date}
                </p>
            </div>
        `;

        // Efecto de tachado al completar
        const checkbox = li.querySelector('input');
        const label = li.querySelector('label');
        checkbox.addEventListener('change', (e) => {
            if(e.target.checked) {
                label.classList.add('line-through', 'text-gray-400');
            } else {
                label.classList.remove('line-through', 'text-gray-400');
            }
        });

        taskListEl.appendChild(li);
    });
}


// --- 6. LÓGICA DE LA GRÁFICA SEMANAL ---
const chartContainer = document.getElementById('weekly-chart');

function renderChart() {
    chartContainer.innerHTML = '';

    // Obtener el inicio de la semana actual (basado en el calendario visible 'currentDate')
    const dayOfWeek = currentDate.getDay();
    const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    let startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - startOffset);

    const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    let weekData = [];
    let maxCount = 0;

    // Recolectar datos
    for (let i = 0; i < 7; i++) {
        let iterDate = new Date(startOfWeek);
        iterDate.setDate(startOfWeek.getDate() + i);
        let dateStr = formatDateString(iterDate);

        let count = tasks.filter(t => t.date === dateStr).length;
        if (count > maxCount) maxCount = count;

        weekData.push({
            label: dayNames[i],
            dateNum: iterDate.getDate(),
            count: count,
            isToday: dateStr === getTodayString()
        });
    }

    // Si no hay tareas, evitamos división por 0 y fijamos una escala base
    if (maxCount === 0) maxCount = 1;
    const minHeightPercent = 10; // Altura mínima para que se vea el "carril" vacío

    // Dibujar las barras
    weekData.forEach(day => {
        let heightPercent = (day.count / maxCount) * 100;
        if (day.count === 0) heightPercent = minHeightPercent;

        const isPrimary = day.isToday;
        const barColorClass = isPrimary ? 'bg-primary group-hover:bg-blue-600' : 'bg-blue-200 dark:bg-blue-900 group-hover:bg-blue-300 dark:group-hover:bg-blue-800';
        const textColorClass = isPrimary ? 'text-primary font-bold' : 'text-text-secondary-light dark:text-text-secondary-dark font-medium';

        const barHtml = `
            <div class="flex flex-col items-center flex-1 group h-full justify-end cursor-pointer">
                <div class="relative w-full flex justify-center h-[120px] items-end">
                    <div class="w-full max-w-[24px] ${barColorClass} rounded-t-md transition-all duration-300 relative flex items-start justify-center pt-1" style="height: ${heightPercent}%;">
                        ${day.count > 0 ? `<span class="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 text-gray-700 dark:text-gray-300">${day.count}</span>` : ''}
                    </div>
                </div>
                <div class="flex flex-col items-center mt-2">
                    <span class="text-xs ${textColorClass}">${day.label}</span>
                    <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500">${day.dateNum}</span>
                </div>
            </div>
        `;
        chartContainer.insertAdjacentHTML('beforeend', barHtml);
    });
}


// --- 7. CONTROLES Y MODAL ---
const modal = document.getElementById('event-modal');
const titleInput = document.getElementById('event-title');
const descInput = document.getElementById('event-desc');
const dateInput = document.getElementById('event-date');
const colorButtons = document.querySelectorAll('#color-picker button');

// Navegación del Calendario
document.getElementById('prev-btn').addEventListener('click', () => {
    currentView === 'month' ? currentDate.setMonth(currentDate.getMonth() - 1) : currentDate.setDate(currentDate.getDate() - 7);
    updateDashboard();
});

document.getElementById('next-btn').addEventListener('click', () => {
    currentView === 'month' ? currentDate.setMonth(currentDate.getMonth() + 1) : currentDate.setDate(currentDate.getDate() + 7);
    updateDashboard();
});

// Alternar Vista Mes/Semana
const viewMonthBtn = document.getElementById('view-month-btn');
const viewWeekBtn = document.getElementById('view-week-btn');

viewMonthBtn.addEventListener('click', () => {
    currentView = 'month';
    viewMonthBtn.className = "rounded px-3 py-1 bg-surface-light dark:bg-surface-dark shadow-sm text-text-primary-light dark:text-text-primary-dark transition-all";
    viewWeekBtn.className = "rounded px-3 py-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-all cursor-pointer";
    updateDashboard();
});

viewWeekBtn.addEventListener('click', () => {
    currentView = 'week';
    viewWeekBtn.className = "rounded px-3 py-1 bg-surface-light dark:bg-surface-dark shadow-sm text-text-primary-light dark:text-text-primary-dark transition-all";
    viewMonthBtn.className = "rounded px-3 py-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-all cursor-pointer";
    currentDate = new Date(); // Resetear a hoy al cambiar a semana
    updateDashboard();
});

// Funciones del Modal
function openModal(defaultDateStr = '') {
    titleInput.value = '';
    descInput.value = '';
    dateInput.value = defaultDateStr || getTodayString();
    modal.classList.remove('hidden');
    setTimeout(() => titleInput.focus(), 100); // Focus for UX
}

document.getElementById('btn-create-task').addEventListener('click', () => openModal());
document.getElementById('close-modal-btn').addEventListener('click', () => modal.classList.add('hidden'));

// Selección de Colores en Modal
colorButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        colorButtons.forEach(b => {
            b.classList.remove('ring-2', 'ring-offset-2', 'opacity-100');
            b.classList.add('opacity-70', 'hover:opacity-100');
        });
        const clicked = e.target;
        clicked.classList.remove('opacity-70', 'hover:opacity-100');
        clicked.classList.add('ring-2', 'ring-offset-2', 'opacity-100');
        selectedColor = clicked.getAttribute('data-color');
    });
});

// Guardar Tarea
document.getElementById('save-event-btn').addEventListener('click', () => {
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();
    const dateStr = dateInput.value;

    if (title && dateStr) {
        tasks.push({
            id: Date.now(), // ID único
            title: title,
            desc: desc,
            date: dateStr,
            color: selectedColor
        });
        modal.classList.add('hidden');
        updateDashboard(); // Actualiza todo: Calendario, Lista y Gráfica
    } else {
        alert("Por favor, ingresa al menos un título y una fecha.");
    }
});

// --- 8. INICIO ---
updateDashboard();