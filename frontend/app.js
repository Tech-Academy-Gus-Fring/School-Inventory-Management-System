const apiBase = 'http://localhost:5000';

const elements = {
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    loginBtn: document.getElementById('loginBtn'),
    registerUsername: document.getElementById('registerUsername'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    registerRole: document.getElementById('registerRole'),
    registerBtn: document.getElementById('registerBtn'),
    authMessage: document.getElementById('authMessage'),
    profileSection: document.getElementById('profile-section'),
    equipmentSection: document.getElementById('equipment-section'),
    adminSection: document.getElementById('admin-section'),
    profileData: document.getElementById('profileData'),
    logoutBtn: document.getElementById('logoutBtn'),
    loadEquipmentBtn: document.getElementById('loadEquipmentBtn'),
    equipmentList: document.getElementById('equipmentList'),
    equipmentSelect: document.getElementById('equipmentSelect'),
    requestQuantity: document.getElementById('requestQuantity'),
    requestBtn: document.getElementById('requestBtn'),
    requestMessage: document.getElementById('requestMessage'),
    adminEquipmentName: document.getElementById('adminEquipmentName'),
    adminEquipmentDescription: document.getElementById('adminEquipmentDescription'),
    adminEquipmentQuantity: document.getElementById('adminEquipmentQuantity'),
    adminCreateEquipmentBtn: document.getElementById('adminCreateEquipmentBtn'),
    adminMessage: document.getElementById('adminMessage'),
};

function setStatus(messageEl, text, isSuccess=true) {
    messageEl.textContent = text;
    messageEl.className = 'message ' + (isSuccess ? 'success' : 'error');
}

function getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return token ? { 'Authorization': 'Bearer ' + token } : {};
}

function showSections(user) {
    elements.profileSection.style.display = 'block';
    elements.equipmentSection.style.display = 'block';
    elements.adminSection.style.display = user?.role === 'admin' ? 'block' : 'none';
    elements.profileData.textContent = JSON.stringify(user, null, 2);
}

async function login() {
    const username = elements.loginUsername.value.trim();
    const password = elements.loginPassword.value.trim();
    if (!username || !password) return setStatus(elements.authMessage, 'Please enter both username and password.', false);

    try {
        const res = await fetch(`${apiBase}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed.');

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        setStatus(elements.authMessage, 'Login successful!', true);
        showSections(data.user);
        loadEquipment();
    } catch (err) {
        setStatus(elements.authMessage, err.message, false);
    }
}

async function register() {
    const payload = {
        username: elements.registerUsername.value.trim(),
        email: elements.registerEmail.value.trim(),
        password: elements.registerPassword.value.trim(),
        role: elements.registerRole.value,
    };

    if (!payload.username || !payload.email || !payload.password) return setStatus(elements.authMessage, 'All register fields are required.', false);

    try {
        const res = await fetch(`${apiBase}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed.');

        setStatus(elements.authMessage, 'Registration successful; please login.', true);
    } catch (err) {
        setStatus(elements.authMessage, err.message, false);
    }
}

function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    elements.profileSection.style.display = 'none';
    elements.equipmentSection.style.display = 'none';
    elements.adminSection.style.display = 'none';
    elements.profileData.textContent = '';
    setStatus(elements.authMessage, 'Logged out', true);
}

async function loadEquipment() {
    try {
        const res = await fetch(`${apiBase}/equipment`);
        const equipment = await res.json();
        elements.equipmentList.innerHTML = '';
        elements.equipmentSelect.innerHTML = '';

        if (!Array.isArray(equipment)) return setStatus(elements.requestMessage, 'Equipment fetch returned invalid data.', false);

        equipment.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} (${item.quantity}) - ${item.status}`;
            elements.equipmentList.appendChild(li);

            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (${item.quantity})`;
            elements.equipmentSelect.appendChild(option);
        });

        setStatus(elements.requestMessage, 'Equipment loaded.', true);
    } catch (err) {
        setStatus(elements.requestMessage, 'Could not load equipment: ' + err.message, false);
    }
}

async function submitRequest() {
    const equipmentId = elements.equipmentSelect.value;
    const quantity = Number(elements.requestQuantity.value);

    if (!equipmentId || quantity <= 0) return setStatus(elements.requestMessage, 'Select equipment and quantity.', false);

    try {
        const res = await fetch(`${apiBase}/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ equipmentId, quantity }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Request creation failed.');
        setStatus(elements.requestMessage, 'Request submitted successfully!', true);
    } catch (err) {
        setStatus(elements.requestMessage, err.message, false);
    }
}

async function adminCreateEquipment() {
    const name = elements.adminEquipmentName.value.trim();
    const description = elements.adminEquipmentDescription.value.trim();
    const quantity = Number(elements.adminEquipmentQuantity.value);

    if (!name || !description || quantity <= 0) return setStatus(elements.adminMessage, 'Fill all fields with valid values.', false);

    try {
        const res = await fetch(`${apiBase}/admin/equipment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ name, description, quantity }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Create equipment failed.');
        setStatus(elements.adminMessage, 'Equipment created. Reload inventory.', true);
        loadEquipment();
    } catch (err) {
        setStatus(elements.adminMessage, err.message, false);
    }
}

function init() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        showSections(user);
        loadEquipment();
    }

    elements.loginBtn.addEventListener('click', login);
    elements.registerBtn.addEventListener('click', register);
    elements.logoutBtn.addEventListener('click', logout);
    elements.loadEquipmentBtn.addEventListener('click', loadEquipment);
    elements.requestBtn.addEventListener('click', submitRequest);
    elements.adminCreateEquipmentBtn.addEventListener('click', adminCreateEquipment);
}

init();
