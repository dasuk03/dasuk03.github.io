// === УПРАВЛЕНИЕ ФИЛИАЛАМИ ===
const BRANCHES = ['reutov', 'vdnh', 'rostokino'];
const BRANCH_NAMES = {
    'reutov': 'Реутов',
    'vdnh': 'Водный Стадион',
    'rostokino': 'Ростокино'
};

let currentBranch = localStorage.getItem('cosmozar-current-branch') || BRANCHES[0];

// === УПРАВЛЕНИЕ ТЕМОЙ ===
const THEME_STORAGE_KEY = 'cosmozar-theme';
let currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('theme-dark');
    } else {
        document.body.classList.remove('theme-dark');
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    applyTheme(currentTheme);
}

applyTheme(currentTheme);

// === УПРАВЛЕНИЕ СОРТИРОВКОЙ ===
const SORT_STORAGE_KEY = 'cosmozar-sort-order';
let currentSortOrder = localStorage.getItem(SORT_STORAGE_KEY) || 'asc';

// === приоритет цвета ===
let currentSortColor = localStorage.getItem('cosmozar-sort-color') || 'blueFirst';

function setSortColor(mode) {
    currentSortColor = mode;
    localStorage.setItem('cosmozar-sort-color', mode);
    loadAllKitsUI();
    if (currentRepairFilter === 'active') loadRepairKitsUI();
}

function setSortOrder(order) {
    if (order === 'asc' || order === 'desc') {
        currentSortOrder = order;
        localStorage.setItem(SORT_STORAGE_KEY, currentSortOrder);
        updateSortButtonUI();
        loadAllKitsUI();
        if (currentRepairFilter === 'active') {
             loadRepairKitsUI();
        }
    }
}

function updateSortButtonUI() {
    document.getElementById('sortAscBtn').classList.toggle('active', currentSortOrder === 'asc');
    document.getElementById('sortDescBtn').classList.toggle('active', currentSortOrder === 'desc');
}

// === УПРАВЛЕНИЕ РЕМОНТОМ ===
const REPAIR_FILTER_STORAGE_KEY = 'cosmozar-repair-filter';
let currentRepairFilter = localStorage.getItem(REPAIR_FILTER_STORAGE_KEY) || 'active';

function setRepairFilter(filter) {
    if (filter === 'all' || filter === 'active') {
        currentRepairFilter = filter;
        localStorage.setItem(REPAIR_FILTER_STORAGE_KEY, currentRepairFilter);
        updateRepairButtonUI();
        loadRepairKitsUI();
    }
}

function updateRepairButtonUI() {
    document.getElementById('repairAllBtn').classList.toggle('active', currentRepairFilter === 'all');
    document.getElementById('repairActiveBtn').classList.toggle('active', currentRepairFilter === 'active');
}

// === МОДЕЛЬ ДАННЫХ ===
const KITS_STORAGE_KEY = 'cosmozar-kits-by-branch-v3_2';

let allBranchKits = JSON.parse(localStorage.getItem(KITS_STORAGE_KEY)) || {};

BRANCHES.forEach(branch => {
    if (!allBranchKits[branch]) {
        allBranchKits[branch] = [];
    }
});

function getCurrentBranchKits() {
    return allBranchKits[currentBranch] || [];
}

function saveAllBranchKits() {
    localStorage.setItem(KITS_STORAGE_KEY, JSON.stringify(allBranchKits));
}

// === СТАТУС ===
function getKitStatusInfo(kit) {
    if (kit.repair.active) {
        return { class: 'status-repair', text: '🔧 В ремонте' };
    } else {
        const isSuitable = kit.isVestSuitable;
        return {
            class: isSuitable ? 'status-ok' : 'status-bad',
            text: isSuitable ? '✅ Пригоден' : '❌ Не пригоден'
        };
    }
}

// === ОБНОВЛЕНИЕ ===
function updateBranchDisplays() {
    const branchName = BRANCH_NAMES[currentBranch];
    document.getElementById('currentBranchSelect').value = currentBranch;
    document.getElementById('currentBranchFooter').textContent = branchName;
    document.getElementById('currentBranchKits').textContent = branchName;
    document.getElementById('currentBranchAdd').textContent = branchName;
    document.getElementById('currentBranchRepair').textContent = branchName;
}

// === СПИСОК КОМПЛЕКТОВ ===
function loadAllKitsUI() {
    const kits = getCurrentBranchKits();

    const total = kits.length;
    const red = kits.filter(k => k.vestColor === 'Красный').length;
    const blue = kits.filter(k => k.vestColor === 'Синий').length;
    const repair = kits.filter(k => k.repair.active).length;

    document.querySelector('#kits .subtitle').textContent =
        `Всего: ${total} | 🔴 ${red} | 🔵 ${blue} | 🔧 ${repair}`;

    kits.sort((a, b) => {
        if (currentSortColor === 'blueFirst') {
            if (a.vestColor !== b.vestColor) return a.vestColor === 'Синий' ? -1 : 1;
        } else {
            if (a.vestColor !== b.vestColor) return a.vestColor === 'Красный' ? -1 : 1;
        }
        const idA = a.blasterId ?? Infinity;
        const idB = b.blasterId ?? Infinity;
        return currentSortOrder === 'asc' ? idA - idB : idB - idA;
    });

    const list = document.getElementById('allKitsList');
    list.innerHTML = '';
    if (!kits.length) {
        list.innerHTML = '<li class="kit-item" style="text-align:center;">Нет комплектов</li>';
        return;
    }

    kits.forEach(kit => {
        const item = document.createElement('li');
        item.className = 'kit-item';

        const statusInfo = getKitStatusInfo(kit);
        const vestColorEmoji = kit.vestColor === 'Красный' ? '🔴' : '🔵';

        item.innerHTML = `
            <div class="kit-item-header">
                <div class="kit-id">
                    <span>${vestColorEmoji}</span>
                    ${kit.vestColor} ${kit.blasterId ? `| Бластер: ${kit.blasterId}` : ''}
                </div>
                <div style="display:flex; gap: 8px;">
                    <button class="btn-check" onclick="inspectKit('${kit.id}')">🔧</button>
                    <button class="btn-repair-kit" onclick="toggleRepairStatus('${kit.id}')">${kit.repair.active ? '✅' : '🔧'}</button>
                    <button class="btn-delete" onclick="deleteKit('${kit.id}')">✕</button>
                </div>
            </div>
            <div class="kit-details">
                Дата: ${kit.lastInspectionDate} | Сотрудник: ${kit.employee || '-'}
                ${kit.comment ? `<br>Комментарий: ${kit.comment}` : ''}
            </div>
            <div class="status ${statusInfo.class}">${statusInfo.text}</div>
        `;
        list.appendChild(item);
    });
}

// === Переключение ремонта ===
function toggleRepairStatus(kitId) {
    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === kitId);
    if (!kit) return;
    kit.repair.active = !kit.repair.active;
    if (kit.repair.active) kit.repair.lastRepairDate = null;
    saveAllBranchKits();
    loadAllKitsUI();
    if (currentRepairFilter === 'active') loadRepairKitsUI();
}

// === РЕМОНТ ===
function loadRepairKitsUI() {
    const kits = getCurrentBranchKits();
    let filtered = currentRepairFilter === 'active'
        ? kits.filter(k => k.repair.active)
        : kits;

    filtered.sort((a, b) => {
        if (currentSortColor === 'blueFirst') {
            if (a.vestColor !== b.vestColor) return a.vestColor === 'Синий' ? -1 : 1;
        } else {
            if (a.vestColor !== b.vestColor) return a.vestColor === 'Красный' ? -1 : 1;
        }
        const idA = a.blasterId ?? Infinity;
        const idB = b.blasterId ?? Infinity;
        return currentSortOrder === 'asc' ? idA - idB : idB - idA;
    });

    const list = document.getElementById('repairKitsList');
    list.innerHTML = '';
    if (!filtered.length) {
        list.innerHTML = '<li class="kit-item" style="text-align:center;">Нет комплектов</li>';
        return;
    }

    filtered.forEach(kit => {
        const item = document.createElement('li');
        item.className = 'kit-item';

        const statusInfo = getKitStatusInfo(kit);
        const vestColorEmoji = kit.vestColor === 'Красный' ? '🔴' : '🔵';

        item.innerHTML = `
            <div class="kit-item-header">
                <div class="kit-id">
                    <span>${vestColorEmoji}</span>
                    ${kit.vestColor} ${kit.blasterId ? `| Бластер: ${kit.blasterId}` : ''}
                </div>
                <div style="display:flex; gap: 8px;">
                    <button class="btn-repair" onclick="reportRepair('${kit.id}')">📝</button>
                </div>
            </div>
            <div class="kit-details">
                Дата: ${kit.lastInspectionDate} | Сотрудник: ${kit.employee || '-'}
                ${kit.comment ? `<br>Комментарий: ${kit.comment}` : ''}
            </div>
            <div class="status ${statusInfo.class}">${statusInfo.text}</div>
            ${kit.repair.lastRepairDate ? `
            <div class="repair-report">
                <div class="additional-title">Отчёт о ремонте:</div>
                Дата: ${kit.repair.lastRepairDate}
                ${kit.repair.comment ? `<div class="repair-comment">${kit.repair.comment}</div>` : ''}
                ${kit.repair.images?.length ? kit.repair.images.map(src =>
                    `<img src="${src}" class="repair-image">`
                ).join('') : ''}
            </div>` : ''}
        `;
        list.appendChild(item);
    });
}

// === ОТЧЁТ ===
let currentRepairingKitId = null;

function reportRepair(kitId) {
    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === kitId);
    currentRepairingKitId = kitId;

    document.getElementById('repairReportSubtitle').textContent =
        `${kit.vestColor} ${kit.blasterId ? `| Бластер: ${kit.blasterId}` : ''}`;

    document.getElementById('repairKitDetails').innerHTML = `
        Цвет: ${kit.vestColor} | Дата последней проверки: ${kit.lastInspectionDate} | Сотрудник: ${kit.employee || '-'}
        ${kit.comment ? `<br>Комментарий: ${kit.comment}` : ''}
    `;

    document.getElementById('repairComment').value = kit.repair.comment || '';
    document.getElementById('repairImageInput').value = '';

    showPage('repairReport');
}

function saveRepairReport() {
    if (!currentRepairingKitId) {
        document.getElementById('repairSaveError').textContent = 'Ошибка: комплект не выбран';
        return;
    }

    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === currentRepairingKitId);

    kit.repair.comment = document.getElementById('repairComment').value;
    kit.repair.lastRepairDate = new Date().toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' });

    const files = Array.from(document.getElementById('repairImageInput').files);
    kit.repair.images = [];
    if (files.length) {
        let loaded = 0;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
                kit.repair.images.push(e.target.result);
                loaded++;
                if (loaded === files.length) finalizeRepairSave(kit);
            };
            reader.readAsDataURL(file);
        });
    } else {
        finalizeRepairSave(kit);
    }
}

function finalizeRepairSave(kit) {
    kit.repair.active = false;
    saveAllBranchKits();
    loadRepairKitsUI();
    loadAllKitsUI();
    showPage('repair');
}

// === СОЗДАНИЕ КОМПЛЕКТА ===
function createKitSkeleton(vestColor, blasterId = null, employee = '', comment = '') {
    const now = new Date().toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' });
    return {
        id: generateKitId(),
        vestColor,
        blasterId,
        status: "НАДО",
        isVestSuitable: true,
        checks: {
            vestHits: true,
            vestWire: true,
            vestVibro: true,
            vestLaser: true,
            vestSound: true,
            vestDisplay: true,
            vestSideStripes: true,
            vestBodyHalves: true,
            vestScrews: true,
            vestTrigger: true,
            vestSensorCover: true,
            vestNoCracks: true,
            vestStickers: true,
            vestBeltBuckles: true,
        },
        batteryType: "Li-ion",
        lastInspectionDate: now,
        employee,
        comment,
        repair: {
            active: false,
            comment: '',
            images: [],
            lastRepairDate: null
        }
    };
}

function generateKitId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2,5);
}

function createNewKit() {
    const vestColor = document.getElementById('newVestColor').value;
    const blasterId = document.getElementById('newBlasterID').value ? parseInt(document.getElementById('newBlasterID').value) : null;
    const employee = document.getElementById('employeeName').value.trim();
    const comment = document.getElementById('kitComment').value.trim();

    const newKit = createKitSkeleton(vestColor, blasterId, employee, comment);
    allBranchKits[currentBranch].push(newKit);
    saveAllBranchKits();

    document.getElementById('newBlasterID').value = '';
    document.getElementById('employeeName').value = '';
    document.getElementById('kitComment').value = '';

    inspectKit(newKit.id);
}

// === ПРОВЕРКА ===
let currentInspectingKitId = null;

function inspectKit(kitId) {
    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === kitId);
    currentInspectingKitId = kitId;

    document.getElementById('inspectKitSubtitle').textContent =
        `${kit.vestColor} ${kit.blasterId ? `| Бластер: ${kit.blasterId}` : ''}`;

    document.getElementById('inspectKitDetails').innerHTML = `
        Цвет: ${kit.vestColor} | Дата: ${kit.lastInspectionDate} | Сотрудник: ${kit.employee || '-'}
        ${kit.comment ? `<br>Комментарий: ${kit.comment}` : ''}
    `;

    document.getElementById('inspectionComment').value = kit.comment || '';

    const checklist = document.getElementById('inspectionChecklist');
    checklist.innerHTML = '';

    const mainVestChecks = [
        { id: 'vestHits', label: 'Автомат поражает цель' },
        { id: 'vestWire', label: 'Провод целый' },
        { id: 'vestVibro', label: 'Вибро работает' },
        { id: 'vestLaser', label: 'Лазер работает' },
        { id: 'vestSound', label: 'Звук работает' },
        { id: 'vestDisplay', label: 'Дисплей цел' }
    ];

    mainVestChecks.forEach(ch => {
        const div = document.createElement('div');
        div.className = 'check-item';
        div.innerHTML = `
            <input type="checkbox" id="chk-${ch.id}" ${kit.checks[ch.id]?'checked':''} onchange="updateKitCheck('${ch.id}',this.checked)">
            <label for="chk-${ch.id}">${ch.label}</label>
        `;
        checklist.appendChild(div);
    });

    const additionalVestChecks = [
        { id: 'vestSideStripes', label: 'Полосы целы' },
        { id: 'vestBodyHalves', label: 'Корпус стянут' },
        { id: 'vestScrews', label: 'Все винты на месте' },
        { id: 'vestTrigger', label: 'Курок мягкий' },
        { id: 'vestSensorCover', label: 'Крышки датчиков целы' },
        { id: 'vestNoCracks', label: 'Нет трещин' },
        { id: 'vestStickers', label: 'Наклейки живые' },
        { id: 'vestBeltBuckles', label: 'Защёлки ремней целы' }
    ];

    const additionalSection = document.createElement('div');
    additionalSection.className = 'additional-section';
    additionalSection.innerHTML = '<div class="additional-title">Дополнительно</div>';

    additionalVestChecks.forEach(ch => {
        const div = document.createElement('div');
        div.className = 'check-item';
        div.innerHTML = `
            <input type="checkbox" id="chk-${ch.id}" ${kit.checks[ch.id]?'checked':''} onchange="updateKitCheck('${ch.id}',this.checked)">
            <label for="chk-${ch.id}">${ch.label}</label>
        `;
        additionalSection.appendChild(div);
    });
    checklist.appendChild(additionalSection);

    updateKitStatusDisplay();
    showPage('inspectKit');
}

function updateKitCheck(field, val) {
    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === currentInspectingKitId);
    kit.checks[field] = val;

    const main = [
        kit.checks.vestHits,
        kit.checks.vestWire,
        kit.checks.vestVibro,
        kit.checks.vestLaser,
        kit.checks.vestSound,
        kit.checks.vestDisplay
    ];
    kit.isVestSuitable = main.every(Boolean);

    updateKitStatusDisplay();
}

function updateKitStatusDisplay() {
    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === currentInspectingKitId);
    const statusEl = document.getElementById('kitStatus');
    const info = getKitStatusInfo(kit);
    statusEl.className = `status ${info.class}`;
    statusEl.textContent = info.text;
}

function saveInspection() {
    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === currentInspectingKitId);
    kit.lastInspectionDate = new Date().toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' });
    kit.comment = document.getElementById('inspectionComment').value.trim();
    saveAllBranchKits();
    loadAllKitsUI();
    showPage('kits');
}

// === УДАЛЕНИЕ ===
function deleteKit(kitId) {
    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === kitId);
    if (!kit) return;

    if (confirm(`Удалить комплект: ${kit.vestColor} ${kit.blasterId?'| '+kit.blasterId:''}?`)) {
        allBranchKits[currentBranch] = kits.filter(k => k.id !== kitId);
        saveAllBranchKits();
        loadAllKitsUI();
        loadRepairKitsUI();
        if (currentInspectingKitId === kitId) currentInspectingKitId = null;
        if (currentRepairingKitId === kitId) currentRepairingKitId = null;
    }
}

// === PLAYERS ===
function loadAllPlayersUI() {
    const list = document.getElementById('allPlayersList');
    list.innerHTML = '';
    for (let id = 1; id <= 30; id++) {
        const item = document.createElement('li');
        item.className = 'player-item';

        const dip = [];
        for (let i = 0; i < 5; i++) dip.push(((id>>i)&1)?'+':'–');

        let html = '';
        for (let i = 0; i < 5; i++) {
            html += `<span class="dip-display"><span class="dip-label">Т${i+1}:</span><span class="${dip[i]==='+'?'dip-value-on':'dip-value-off'}">${dip[i]}</span></span>`;
        }

        item.innerHTML = `
            <div class="player-item-header"><div class="player-id">Игрок ${id}</div></div>
            <div class="player-details">${html}</div>
        `;
        list.appendChild(item);
    }
}

// === CSV ===
// оставлено без изменений
// ...


function showPage(id) {
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('settingsMenu').classList.add('hidden');
}

function initializeApp() {
    updateBranchDisplays();
    updateSortButtonUI();
    updateRepairButtonUI();
    loadAllKitsUI();
    loadRepairKitsUI();
    loadAllPlayersUI();
}

window.onload = initializeApp;

document.addEventListener('click', e=>{
    const menu = document.getElementById('settingsMenu');
    const btn = document.querySelector('.btn-settings');
    if(menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && e.target!==btn) {
        menu.classList.add('hidden');
    }
});

function toggleSettingsMenu(){
    document.getElementById('settingsMenu').classList.toggle('hidden');
}

function changeBranch(x){
    if(BRANCHES.includes(x)){
        currentBranch = x;
        localStorage.setItem('cosmozar-current-branch',x);
        updateBranchDisplays();
        loadAllKitsUI();
        loadRepairKitsUI();
    }
}

function setBranch(x){
    if(BRANCHES.includes(x)){
        currentBranch=x;
        localStorage.setItem('cosmozar-current-branch',x);
        updateBranchDisplays();
        showPage('home');
    }
}
