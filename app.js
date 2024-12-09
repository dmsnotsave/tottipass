// app.js

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elementos del DOM
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginButton = document.getElementById('login-button');
const authKeyInput = document.getElementById('auth-key');
const loginError = document.getElementById('login-error');
const logoutButton = document.getElementById('logout-button');
const addButton = document.getElementById('add-button');
const passwordsBody = document.getElementById('passwords-body');

const modal = document.getElementById('modal');
const closeButton = document.querySelector('.close-button');
const modalTitle = document.getElementById('modal-title');
const passwordForm = document.getElementById('password-form');
const serviceInput = document.getElementById('service');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const docIdInput = document.getElementById('doc-id');
const saveButton = document.getElementById('save-button');

// Clave de acceso (almacenada como hash)
const ACCESS_KEY_HASH = CryptoJS.SHA256("A501423").toString();

// Clave de cifrado para las contraseñas (puedes cambiarla)
const ENCRYPTION_KEY = "MiClaveSecreta123!";

// Función para verificar la clave
function verifyKey(inputKey) {
    const inputHash = CryptoJS.SHA256(inputKey).toString();
    return inputHash === ACCESS_KEY_HASH;
}

// Función para cifrar una contraseña
function encryptPassword(password) {
    return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
}

// Función para descifrar una contraseña
function decryptPassword(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// Autenticación
loginButton.addEventListener('click', () => {
    const enteredKey = authKeyInput.value.trim();
    if (verifyKey(enteredKey)) {
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        loadPasswords();
    } else {
        loginError.textContent = "Clave incorrecta. Intenta de nuevo.";
    }
});

// Cerrar sesión
logoutButton.addEventListener('click', () => {
    appContainer.style.display = 'none';
    loginContainer.style.display = 'block';
    authKeyInput.value = '';
    loginError.textContent = '';
    passwordsBody.innerHTML = '';
});

// Cargar contraseñas desde Firestore
function loadPasswords() {
    db.collection("passwords").get().then((querySnapshot) => {
        passwordsBody.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const tr = document.createElement('tr');

            const tdService = document.createElement('td');
            tdService.textContent = data.service;
            tr.appendChild(tdService);

            const tdUsername = document.createElement('td');
            tdUsername.textContent = data.username;
            tr.appendChild(tdUsername);

            const tdPassword = document.createElement('td');
            tdPassword.textContent = decryptPassword(data.password);
            tr.appendChild(tdPassword);

            const tdActions = document.createElement('td');

            const editBtn = document.createElement('button');
            editBtn.textContent = "Editar";
            editBtn.style.marginRight = "5px";
            editBtn.addEventListener('click', () => openModal('edit', doc.id, data));
            tdActions.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = "Eliminar";
            deleteBtn.style.backgroundColor = "#f44336";
            deleteBtn.addEventListener('click', () => deletePassword(doc.id));
            tdActions.appendChild(deleteBtn);

            tr.appendChild(tdActions);

            passwordsBody.appendChild(tr);
        });
    }).catch((error) => {
        console.error("Error al cargar contraseñas: ", error);
    });
}

// Abrir modal para agregar o editar
function openModal(mode, id = null, data = {}) {
    modal.style.display = 'block';
    if (mode === 'add') {
        modalTitle.textContent = "Agregar Contraseña";
        passwordForm.reset();
        docIdInput.value = '';
    } else if (mode === 'edit') {
        modalTitle.textContent = "Editar Contraseña";
        serviceInput.value = data.service;
        usernameInput.value = data.username;
        passwordInput.value = decryptPassword(data.password);
        docIdInput.value = id;
    }
}

// Cerrar modal
closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Agregar o editar contraseña
passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const service = serviceInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const docId = docIdInput.value;

    const encryptedPassword = encryptPassword(password);

    if (docId) {
        // Editar
        db.collection("passwords").doc(docId).update({
            service,
            username,
            password: encryptedPassword
        }).then(() => {
            modal.style.display = 'none';
            loadPasswords();
        }).catch((error) => {
            console.error("Error al actualizar: ", error);
        });
    } else {
        // Agregar
        db.collection("passwords").add({
            service,
            username,
            password: encryptedPassword
        }).then(() => {
            modal.style.display = 'none';
            loadPasswords();
        }).catch((error) => {
            console.error("Error al agregar: ", error);
        });
    }
});

// Eliminar contraseña
function deletePassword(id) {
    if (confirm("¿Estás seguro de que deseas eliminar esta contraseña?")) {
        db.collection("passwords").doc(id).delete().then(() => {
            loadPasswords();
        }).catch((error) => {
            console.error("Error al eliminar: ", error);
        });
    }
}

// Abrir modal para agregar
addButton.addEventListener('click', () => {
    openModal('add');
});

// Cerrar modal al hacer clic fuera del contenido
window.addEventListener('click', (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});
