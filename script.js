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

// === МОДЕЛЬ ДАННЫХ С ФИЛИАЛАМИ ===
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

// === ФУНКЦИИ ПОЛУЧЕНИЯ ИНФОРМАЦИИ О СТАТУСЕ ===
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

// === ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ ФИЛИАЛА ===
function updateBranchDisplays() {
    const branchName = BRANCH_NAMES[currentBranch];
    document.getElementById('currentBranchSelect').value = currentBranch;
    document.getElementById('currentBranchFooter').textContent = branchName;
    document.getElementById('currentBranchKits').textContent = branchName;
    document.getElementById('currentBranchAdd').textContent = branchName;
    document.getElementById('currentBranchRepair').textContent = branchName;
}

// === СТРАНИЦА: ПРОСМОТР КОМПЛЕКТОВ ===
function loadAllKitsUI() {
    const kits = getCurrentBranchKits();
    kits.sort((a, b) => {
        const idA = a.blasterId !== null ? a.blasterId : Infinity;
        const idB = b.blasterId !== null ? b.blasterId : Infinity;
        if (currentSortOrder === 'asc') {
            return idA - idB;
        } else {
            return idB - idA;
        }
    });
    const list = document.getElementById('allKitsList');
    list.innerHTML = '';
    if (kits.length === 0) {
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
                    ${kit.vestColor} ${kit.blasterId !== null ? `| Бластер: ${kit.blasterId}` : ''}
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

// === ФУНКЦИЯ: Переключение статуса ремонта ===
function toggleRepairStatus(kitId) {
    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === kitId);
    if (kit) {
        kit.repair.active = !kit.repair.active;
        if (kit.repair.active) {
            kit.repair.lastRepairDate = null;
        }
        saveAllBranchKits();
        loadAllKitsUI();
        // Обновляем список ремонта только если он отображает "в ремонте"
        if (currentRepairFilter === 'active') {
             loadRepairKitsUI();
        }
    }
}

// === СТРАНИЦА: РЕМОНТ ===
function loadRepairKitsUI() {
    const kits = getCurrentBranchKits();
    let filteredKits = kits;
    if (currentRepairFilter === 'active') {
        filteredKits = kits.filter(kit => kit.repair.active);
    }

    filteredKits.sort((a, b) => {
        const idA = a.blasterId !== null ? a.blasterId : Infinity;
        const idB = b.blasterId !== null ? b.blasterId : Infinity;
        if (currentSortOrder === 'asc') {
            return idA - idB;
        } else {
            return idB - idA;
        }
    });

    const list = document.getElementById('repairKitsList');
    list.innerHTML = '';
    if (filteredKits.length === 0) {
        list.innerHTML = '<li class="kit-item" style="text-align:center;">Нет комплектов</li>';
        return;
    }
    filteredKits.forEach(kit => {
        const item = document.createElement('li');
        item.className = 'kit-item';

        const statusInfo = getKitStatusInfo(kit); // Используем общую функцию

        const vestColorEmoji = kit.vestColor === 'Красный' ? '🔴' : '🔵';

        item.innerHTML = `
            <div class="kit-item-header">
                <div class="kit-id">
                    <span>${vestColorEmoji}</span>
                    ${kit.vestColor} ${kit.blasterId !== null ? `| Бластер: ${kit.blasterId}` : ''}
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
            ${kit.repair.lastRepairDate ? `<div class="repair-report">
                <div class="additional-title">Отчёт о ремонте:</div>
                <div class="kit-details">
                    Дата: ${kit.repair.lastRepairDate}
                    ${kit.repair.comment ? `<div class="repair-comment">${kit.repair.comment}</div>` : ''}
                    ${kit.repair.image ? `<img src="${kit.repair.image}" alt="Фото после ремонта" class="repair-image">` : ''}
                </div>
            </div>` : ''}
        `;
        list.appendChild(item);
    });
}

// === СТРАНИЦА: ОТЧЁТ ПО РЕМОНТУ ===
let currentRepairingKitId = null;

function reportRepair(kitId) {
    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === kitId);
    if (!kit) {
        alert('Комплект не найден');
        showPage('repair');
        return;
    }
    currentRepairingKitId = kitId;
    document.getElementById('repairReportSubtitle').textContent = `${kit.vestColor} ${kit.blasterId !== null ? `| Бластер: ${kit.blasterId}` : ''}`;
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
    if (kit) {
        kit.repair.comment = document.getElementById('repairComment').value.trim();
        kit.repair.lastRepairDate = new Date().toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' });

        const fileInput = document.getElementById('repairImageInput');
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                kit.repair.image = e.target.result;
                finalizeRepairSave(kit);
            };
            reader.readAsDataURL(file);
        } else {
            kit.repair.image = null;
            finalizeRepairSave(kit);
        }
    }
}

function finalizeRepairSave(kit) {
    // Сбрасываем статус ремонта при сохранении отчёта
    kit.repair.active = false;
    saveAllBranchKits();
    loadRepairKitsUI();
    loadAllKitsUI();
    showPage('repair');
}

// === СТРАНИЦА: ДОБАВЛЕНИЕ КОМПЛЕКТА ===
function createKitSkeleton(vestColor, blasterId = null, employee = '', comment = '') {
    // Используем фиксированную временную зону для даты
    const now = new Date().toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' });
    return {
        id: generateKitId(),
        vestColor: vestColor,
        blasterId: blasterId,
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
        employee: employee,
        comment: comment,
        repair: {
            active: false,
            comment: '',
            image: null,
            lastRepairDate: null
        }
    };
}

function generateKitId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function createNewKit() {
    const vestColor = document.getElementById('newVestColor').value;
    const blasterId = document.getElementById('newBlasterID').value ? parseInt(document.getElementById('newBlasterID').value) : null;
    const employee = document.getElementById('employeeName').value.trim();
    const comment = document.getElementById('kitComment').value.trim();
    const error = document.getElementById('addError');
    error.textContent = '';

    const newKit = createKitSkeleton(vestColor, blasterId, employee, comment);

    allBranchKits[currentBranch].push(newKit);
    saveAllBranchKits();

    document.getElementById('newBlasterID').value = '';
    document.getElementById('employeeName').value = '';
    document.getElementById('kitComment').value = '';

    inspectKit(newKit.id);
}

// === СТРАНИЦА: ПРОВЕРКА КОМПЛЕКТА ===
let currentInspectingKitId = null;
function inspectKit(kitId) {
    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === kitId);
    if (!kit) {
        alert('Комплект не найден');
        showPage('kits');
        return;
    }
    currentInspectingKitId = kitId;
    document.getElementById('inspectKitSubtitle').textContent = `${kit.vestColor} ${kit.blasterId !== null ? `| Бластер: ${kit.blasterId}` : ''}`;
    document.getElementById('inspectKitDetails').innerHTML = `
        Цвет: ${kit.vestColor} | Дата: ${kit.lastInspectionDate} | Сотрудник: ${kit.employee || '-'}
        ${kit.comment ? `<br>Комментарий: ${kit.comment}` : ''}
    `;
    document.getElementById('inspectionComment').value = kit.comment || '';

    const checklist = document.getElementById('inspectionChecklist');
    checklist.innerHTML = '';

    const mainVestChecks = [
        { id: 'vestHits', label: 'Автомат поражает цель' },
        { id: 'vestWire', label: 'Провод автомат жилет цел, светодиоды не мерцают при изгибе провода.' },
        { id: 'vestVibro', label: 'Вибро срабатывает' },
        { id: 'vestLaser', label: 'Лазер работает' },
        { id: 'vestSound', label: 'Звук работает' },
        { id: 'vestDisplay', label: 'Работают все сектора дисплея' }
    ];
    mainVestChecks.forEach(check => {
        const div = document.createElement('div');
        div.className = 'check-item';
        div.innerHTML = `
            <input type="checkbox" id="chk-${check.id}" ${kit.checks[check.id] ? 'checked' : ''} onchange="updateKitCheck('${check.id}', this.checked)">
            <label for="chk-${check.id}">${check.label}</label>
        `;
        checklist.appendChild(div);
    });

    const additionalVestChecks = [
        { id: 'vestSideStripes', label: 'Целы цветные полосы по бокам автомата' },
        { id: 'vestBodyHalves', label: 'Половинки корпуса плотно стянуты' },
        { id: 'vestScrews', label: 'Винты есть там где возможно' },
        { id: 'vestTrigger', label: 'Курок мягкий и срабатывает сразу' },
        { id: 'vestSensorCover', label: 'Прозрачные крышки на жилете целы, бумажные вкладыши выглядят хорошо.' },
        { id: 'vestNoCracks', label: 'На пластике жилета нет незашитых трещин' },
        { id: 'vestStickers', label: 'Наклейки выглядят хорошо' },
        { id: 'vestBeltBuckles', label: 'Пластиковые защёлки ремней целы' }
    ];
    const additionalSection = document.createElement('div');
    additionalSection.className = 'additional-section';
    additionalSection.innerHTML = '<div class="additional-title">Дополнительные параметры жилета</div>';
    additionalVestChecks.forEach(check => {
        const div = document.createElement('div');
        div.className = 'check-item';
        div.innerHTML = `
            <input type="checkbox" id="chk-${check.id}" ${kit.checks[check.id] ? 'checked' : ''} onchange="updateKitCheck('${check.id}', this.checked)">
            <label for="chk-${check.id}">${check.label}</label>
        `;
        additionalSection.appendChild(div);
    });
    checklist.appendChild(additionalSection);
    updateKitStatusDisplay();
    showPage('inspectKit');
}

function updateKitCheck(field, isChecked) {
    if (!currentInspectingKitId) return;
    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === currentInspectingKitId);
    if (kit) {
        kit.checks[field] = isChecked;
        // Обновляем isVestSuitable после всех изменений
        const mainChecks = [
            kit.checks.vestHits,
            kit.checks.vestWire,
            kit.checks.vestVibro,
            kit.checks.vestLaser,
            kit.checks.vestSound,
            kit.checks.vestDisplay
        ];
        kit.isVestSuitable = mainChecks.every(v => v);
        updateKitStatusDisplay(); // Вызываем после обновления isVestSuitable
    }
}

function updateKitStatusDisplay() {
    if (!currentInspectingKitId) return;
    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === currentInspectingKitId);
    if (kit) {
        const statusEl = document.getElementById('kitStatus');
        if (statusEl) {
            const statusInfo = getKitStatusInfo(kit); // Используем общую функцию
            statusEl.className = `status ${statusInfo.class}`;
            statusEl.textContent = statusInfo.text;
        }
    }
}

function saveInspection() {
    if (!currentInspectingKitId) {
        document.getElementById('saveError').textContent = 'Ошибка: комплект не выбран';
        return;
    }
    const kits = getCurrentBranchKits();
    const kit = kits.find(k => k.id === currentInspectingKitId);
    if (kit) {
        kit.lastInspectionDate = new Date().toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' });
        kit.comment = document.getElementById('inspectionComment').value.trim();
        saveAllBranchKits(); // Сохраняем один раз
        loadAllKitsUI(); // Обновляем список
        showPage('kits');
    }
}

// === ИСПРАВЛЕННАЯ ФУНКЦИЯ УДАЛЕНИЯ ===
function deleteKit(kitId) {
    const kits = getCurrentBranchKits();
    const kitToDelete = kits.find(k => k.id === kitId);
    if (!kitToDelete) {
        console.error('Комплект не найден для удаления, ID:', kitId);
        return;
    }

    const confirmationMessage = `Удалить комплект: ${kitToDelete.vestColor} ${kitToDelete.blasterId !== null ? `| Бластер: ${kitToDelete.blasterId}` : ''}?`;

    if (confirm(confirmationMessage)) {
        allBranchKits[currentBranch] = kits.filter(k => k.id !== kitId);
        saveAllBranchKits(); // Сохраняем один раз
        loadAllKitsUI(); // Обновляем основной список
        loadRepairKitsUI(); // Обновляем список ремонта
        if (currentInspectingKitId === kitId) {
            currentInspectingKitId = null;
        }
        if (currentRepairingKitId === kitId) {
            currentRepairingKitId = null;
        }
    }
}

// === СТРАНИЦА: ПРОСМОТР ИГРОКОВ (DIP) ===
function loadAllPlayersUI() {
    const list = document.getElementById('allPlayersList');
    list.innerHTML = '';

    for (let playerId = 1; playerId <= 30; playerId++) {
        const item = document.createElement('li');
        item.className = 'player-item';

        const dipBits = [];
        for (let i = 0; i < 5; i++) {
            const bitValue = (playerId >> i) & 1;
            dipBits.push(bitValue ? '+' : '–');
        }

        let dipDisplayHTML = '';
        for (let i = 0; i < 5; i++) {
            const label = i + 1;
            const value = dipBits[i];
            const valueClass = value === '+' ? 'dip-value-on' : 'dip-value-off';
            dipDisplayHTML += `<span class="dip-display"><span class="dip-label">Т${label}:</span><span class="${valueClass}">${value}</span></span>`;
        }

        item.innerHTML = `
            <div class="player-item-header">
                <div class="player-id">Игрок ${playerId}</div>
            </div>
            <div class="player-details">
                ${dipDisplayHTML}
            </div>
        `;
        list.appendChild(item);
    }
}

// === ЭКСПОРТ В CSV ===
function kitToCsvRow(kit) {
    const checks = [
        kit.checks.vestHits ? 'TRUE' : 'FALSE',
        kit.checks.vestWire ? 'TRUE' : 'FALSE',
        kit.checks.vestVibro ? 'TRUE' : 'FALSE',
        kit.checks.vestLaser ? 'TRUE' : 'FALSE',
        kit.checks.vestSound ? 'TRUE' : 'FALSE',
        kit.checks.vestDisplay ? 'TRUE' : 'FALSE',
        kit.checks.vestSideStripes ? 'TRUE' : 'FALSE',
        kit.checks.vestBodyHalves ? 'TRUE' : 'FALSE',
        kit.checks.vestScrews ? 'TRUE' : 'FALSE',
        kit.checks.vestTrigger ? 'TRUE' : 'FALSE',
        kit.checks.vestSensorCover ? 'TRUE' : 'FALSE',
        kit.checks.vestNoCracks ? 'TRUE' : 'FALSE',
        kit.checks.vestStickers ? 'TRUE' : 'FALSE',
        kit.checks.vestBeltBuckles ? 'TRUE' : 'FALSE'
    ];
    const extraData = [
        kit.lastInspectionDate || '',
        kit.employee || '',
        kit.comment || '',
        kit.repair.active ? 'В ремонте' : 'Не в ремонте',
        kit.repair.comment || '',
        kit.repair.lastRepairDate || ''
    ];
    return checks.concat(extraData).map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
}

function exportToCSV() {
    const kits = getCurrentBranchKits();
    let csv = kits.map(kit => kitToCsvRow(kit)).join('');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const supportsShare = navigator.share && navigator.canShare && navigator.canShare({ files: [new File([], 'test')] });
    if (supportsShare) {
        const file = new File([blob], `cosmozar-export-${currentBranch}.csv`, { type: 'text/csv' });
        navigator.share({
            title: 'Экспорт Cosmozar',
            text: `Данные проверки комплектов (${BRANCH_NAMES[currentBranch]})`,
            files: [file]
        }).catch(error => {
            console.log('Share failed:', error.message);
            triggerDownload(blob, `cosmozar-export-${currentBranch}.csv`);
        });
    } else {
        triggerDownload(blob, `cosmozar-export-${currentBranch}.csv`);
    }
}

// Вспомогательная функция для создания и "клика" по ссылке скачивания
function triggerDownload(blob, filename = 'cosmozar-export.csv') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        link.style.position = 'fixed';
        link.style.top = '50%';
        link.style.left = '50%';
        link.style.transform = 'translate(-50%, -50%)';
        link.style.padding = '20px';
        link.style.fontSize = '18px';
        link.style.zIndex = '10000';
        link.style.background = '#0077ff';
        link.style.color = 'white';
        link.style.borderRadius = '10px';
        link.style.textDecoration = 'none';
        link.textContent = 'Скачать CSV';
        link.target = '_blank';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '10px';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = function(e) {
            e.stopPropagation();
            document.body.removeChild(link);
        };
        link.appendChild(closeBtn);
        document.body.appendChild(link);

        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
        }, 10000);
    } else {
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

 // === ГЛОБАЛЬНАЯ ФУНКЦИЯ НАВИГАЦИИ ===
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
  }
  document.getElementById('settingsMenu').classList.add('hidden');
}

// === ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ ===
function initializeApp() {
    updateBranchDisplays();
    updateSortButtonUI();
    updateRepairButtonUI();
    loadAllKitsUI();
    loadRepairKitsUI();
    loadAllPlayersUI();
}

// === ИНИЦИАЛИЗАЦИЯ ===
window.onload = initializeApp;

// Закрытие меню настроек при клике вне его
document.addEventListener('click', function(event) {
    const menu = document.getElementById('settingsMenu');
    const settingsBtn = document.querySelector('.btn-settings');
    if (menu && !menu.classList.contains('hidden') &&
        !menu.contains(event.target) &&
        event.target !== settingsBtn) {
        menu.classList.add('hidden');
    }
});

// Функция для переключения меню настроек
function toggleSettingsMenu() {
    const menu = document.getElementById('settingsMenu');
    menu.classList.toggle('hidden');
}

// Функция для изменения филиала через select
function changeBranch(branchId) {
    if (BRANCHES.includes(branchId)) {
        currentBranch = branchId;
        localStorage.setItem('cosmozar-current-branch', currentBranch);
        updateBranchDisplays();
        loadAllKitsUI();
        loadRepairKitsUI();
    }
}

// Функция для установки филиала (с переходом на главную)
function setBranch(branchId) {
    if (BRANCHES.includes(branchId)) {
        currentBranch = branchId;
        localStorage.setItem('cosmozar-current-branch', currentBranch);
        updateBranchDisplays();
        showPage('home');
    }
}