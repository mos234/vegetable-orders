/**
 * WhatsApp Groups Management
 */

let editingGroupId = null;

function renderGroupsList() {
    const groups = getGroups();
    const container = document.getElementById('groups-list');
    const emptyState = document.getElementById('groups-empty');

    if (groups.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    container.innerHTML = groups.map(g => `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <i class="fab fa-whatsapp text-green-600 text-2xl"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="font-bold text-slate-800">${escapeHtml(g.name)}</p>
                <p class="text-xs text-slate-400 truncate">${escapeHtml(g.link)}</p>
            </div>
            <div class="flex gap-2 flex-shrink-0">
                <button onclick="openEditModal('${g.id}')"
                    class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                    <i class="fas fa-pen text-sm"></i>
                </button>
                <button onclick="confirmDeleteGroup('${g.id}', '${escapeAttr(g.name)}')"
                    class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-all">
                    <i class="fas fa-trash text-sm"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openAddModal() {
    editingGroupId = null;
    document.getElementById('modal-title').textContent = 'הוסף קבוצה';
    document.getElementById('group-name-input').value = '';
    document.getElementById('group-link-input').value = '';
    showModal();
}

function openEditModal(id) {
    const group = getGroups().find(g => g.id === id);
    if (!group) return;
    editingGroupId = id;
    document.getElementById('modal-title').textContent = 'ערוך קבוצה';
    document.getElementById('group-name-input').value = group.name;
    document.getElementById('group-link-input').value = group.link;
    showModal();
}

function showModal() {
    const modal = document.getElementById('group-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('group-name-input').focus();
}

function closeModal() {
    const modal = document.getElementById('group-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function saveGroupForm() {
    const name = document.getElementById('group-name-input').value.trim();
    const link = document.getElementById('group-link-input').value.trim();

    if (!name) { showToast('נא להזין שם לקבוצה', 'error'); return; }
    if (!link || !link.startsWith('https://chat.whatsapp.com/')) {
        showToast('נא להזין קישור WhatsApp תקין (https://chat.whatsapp.com/...)', 'error');
        return;
    }

    if (editingGroupId) {
        updateGroup(editingGroupId, { name, link });
        showToast('הקבוצה עודכנה ✓');
    } else {
        saveGroup({ name, link });
        showToast('הקבוצה נוספה ✓');
    }

    closeModal();
    renderGroupsList();
}

function confirmDeleteGroup(id, name) {
    if (!confirm(`למחוק את הקבוצה "${name}"?`)) return;
    deleteGroup(id);
    showToast('הקבוצה נמחקה');
    renderGroupsList();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderGroupsList();
    document.getElementById('back-btn')?.addEventListener('click', () => { window.location.href = 'index.html'; });
    document.querySelectorAll('.open-add-group-btn').forEach(btn => btn.addEventListener('click', openAddModal));
    document.querySelectorAll('.close-group-modal-btn').forEach(btn => btn.addEventListener('click', closeModal));
    document.getElementById('save-group-btn')?.addEventListener('click', saveGroupForm);
});
