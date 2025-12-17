// Configuration
const CONFIG = {
    searchEngines: {
        google: {
            name: 'Google',
            icon: 'fab fa-google',
            url: 'https://www.google.com/search?q='
        },
        bing: {
            name: 'Bing',
            icon: 'fab fa-microsoft',
            url: 'https://www.bing.com/search?q='
        },
        chatgpt: {
            name: 'ChatGPT',
            icon: 'fas fa-robot',
            url: 'https://chat.openai.com/?prompt='
        },
        wikipedia: {
            name: 'Wikipedia',
            icon: 'fab fa-wikipedia-w',
            url: 'https://en.wikipedia.org/wiki/Special:Search?search='
        },
        youtube: {
            name: 'YouTube',
            icon: 'fab fa-youtube',
            url: 'https://www.youtube.com/results?search_query='
        },
        twitch: {
            name: 'Twitch',
            icon: 'fab fa-twitch',
            url: 'https://www.twitch.tv/search?term='
        },
        reddit: {
            name: 'Reddit',
            icon: 'fab fa-reddit',
            url: 'https://www.reddit.com/search/?q='
        },
        pinterest: {
            name: 'Pinterest',
            icon: 'fab fa-pinterest',
            url: 'https://www.pinterest.com/search/pins/?q='
        }
    },
    placeholders: [
        "Search the web...",
        "What are you looking for?",
        "Ask anything...",
        "Find something interesting...",
        "Explore the internet...",
        "Search with {engine}..."
    ],
    greetings: [
        "Hello, {name}!",
        "Hi there, {name}!",
        "Welcome back, {name}!",
        "Good to see you, {name}!",
        "Hey {name}, ready to explore?",
        "How's it going, {name}?"
    ],
    defaultBookmarks: [
        { name: "YouTube", url: "https://www.youtube.com", icon: "fab fa-youtube" },
        { name: "Facebook", url: "https://www.facebook.com", icon: "fab fa-facebook" },
        { name: "Instagram", url: "https://www.instagram.com", icon: "fab fa-instagram" },
        { name: "TikTok", url: "https://www.tiktok.com", icon: "fab fa-tiktok" },
        { name: "Twitter (X)", url: "https://twitter.com", icon: "fab fa-twitter" },
        { name: "Reddit", url: "https://www.reddit.com", icon: "fab fa-reddit" },
        { name: "Amazon", url: "https://www.amazon.com", icon: "fab fa-amazon" },
        { name: "Discord", url: "https://discord.com", icon: "fab fa-discord" },
        { name: "Twitch", url: "https://www.twitch.tv", icon: "fab fa-twitch" },
        { name: "Gmail", url: "https://mail.google.com", icon: "fab fa-google" }
    ],
    pexelsApiKey: 'hkeIn4kKkW6dLyjjdXovELtLwS80UhK4BawrihgfoYV9O4sHKD7j9Dlk' // User should replace with their own key from pexels.com/api
};

// IndexedDB setup for wallpaper storage
let db;
const DB_NAME = 'spacetabby_db';
const DB_VERSION = 1;
const STORE_NAME = 'wallpapers';

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

function saveWallpaperToDB(data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data, 'wallpaper');

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function getWallpaperFromDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('wallpaper');

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function deleteWallpaperFromDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete('wallpaper');

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// State
let state = {
    currentSearchEngine: 'google',
    userName: '',
    bookmarks: [],
    theme: 'light',
    todos: [],
    notes: [],
    currentNoteId: null,
    wallpaper: {
        data: null,
        type: null,
        url: null,
        blur: 0,
        opacity: 0
    },
    wallpaperTab: 'upload'
};

// DOM Elements
const elements = {
    greeting: document.getElementById('greeting'),
    topBar: document.getElementById('topBar'),
    time: document.getElementById('time'),
    weather: document.getElementById('weather'),
    searchEngineBtn: document.getElementById('searchEngineBtn'),
    searchEngineIcon: document.getElementById('searchEngineIcon'),
    searchEngineDropdown: document.getElementById('searchEngineDropdown'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    bookmarks: document.getElementById('bookmarks'),
    addBookmarkModal: document.getElementById('addBookmarkModal'),
    todoModal: document.getElementById('todoModal'),
    notepadModal: document.getElementById('notepadModal'),
    wallpaperModal: document.getElementById('wallpaperModal')
};

// Initialize
async function init() {
    await initDB();
    await loadState();
    initializeUserName();
    initializeSearch();
    initializeBookmarks();
    initializeTodos();
    initializeNotepad();
    initializeWallpaper();
    updateGreeting();
    updateDateTime();
    updateWeather();
    await applyWallpaper();
    setInterval(updateDateTime, 1000);
    setInterval(updateWeather, 300000);
}

// State Management
async function loadState() {
    const savedState = localStorage.getItem('spacetabby_state');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        state.userName = parsed.userName || '';
        state.currentSearchEngine = parsed.currentSearchEngine || 'google';
        state.bookmarks = parsed.bookmarks || CONFIG.defaultBookmarks;
        state.theme = parsed.theme || 'light';
        state.todos = parsed.todos || [];
        state.notes = parsed.notes || [];

        // Load wallpaper settings (but not data)
        if (parsed.wallpaper) {
            state.wallpaper.type = parsed.wallpaper.type || null;
            state.wallpaper.url = parsed.wallpaper.url || null;
            state.wallpaper.blur = parsed.wallpaper.blur || 0;
            state.wallpaper.opacity = parsed.wallpaper.opacity || 0;
        }
    } else {
        state.bookmarks = CONFIG.defaultBookmarks;
    }

    // Load wallpaper data from IndexedDB
    try {
        const wallpaperData = await getWallpaperFromDB();
        if (wallpaperData) {
            state.wallpaper.data = wallpaperData;
        }
    } catch (error) {
        console.log('No wallpaper data found');
    }
}

function saveState() {
    // Save everything except wallpaper data to localStorage
    const stateToSave = {
        userName: state.userName,
        currentSearchEngine: state.currentSearchEngine,
        bookmarks: state.bookmarks,
        theme: state.theme,
        todos: state.todos,
        notes: state.notes,
        wallpaper: {
            type: state.wallpaper.type,
            url: state.wallpaper.url,
            blur: state.wallpaper.blur,
            opacity: state.wallpaper.opacity
        }
    };

    localStorage.setItem('spacetabby_state', JSON.stringify(stateToSave));
}

// User Name
function initializeUserName() {
    if (!state.userName) {
        const userName = prompt("Welcome to spacetabby! What's your name?");
        if (userName) {
            state.userName = userName.trim();
            saveState();
        }
    }
}

// Greeting System
function updateGreeting() {
    const greetingElement = elements.greeting;

    if (state.userName && Math.random() > 0.5) {
        const randomGreeting = CONFIG.greetings[Math.floor(Math.random() * CONFIG.greetings.length)];
        greetingElement.textContent = randomGreeting.replace('{name}', state.userName);
        greetingElement.className = 'text-center transition-colors duration-300 text-xl text-neutral-800 dark:text-neutral-200';
    } else {
        fetchRandomQuote().then(quote => {
            greetingElement.innerHTML = `"${quote.content}"<br><span class="text-sm opacity-70">- ${quote.author}</span>`;
            greetingElement.className = 'text-center transition-colors duration-300 text-lg max-w-2xl text-neutral-800 dark:text-neutral-200';
        }).catch(() => {
            const fallbackQuotes = [
                "The only way to do great work is to love what you do. - Steve Jobs",
                "Innovation distinguishes between a leader and a follower. - Steve Jobs",
                "Stay hungry, stay foolish. - Steve Jobs"
            ];
            const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
            greetingElement.textContent = randomQuote;
            greetingElement.className = 'text-center transition-colors duration-300 text-lg max-w-2xl text-neutral-800 dark:text-neutral-200';
        });
    }
}

async function fetchRandomQuote() {
    const response = await fetch('https://api.quotable.io/random?maxLength=100');
    const data = await response.json();
    return data;
}

// Date, Time and Weather
function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    elements.time.textContent = now.toLocaleDateString('en-US', options);
}

async function updateWeather() {
    try {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const weather = await fetchWeather(latitude, longitude);
                const currentText = elements.weather.textContent;
                elements.weather.textContent = `${currentText.split(' - ')[0]} - ${weather}`;
            }, async () => {
                const weather = await fetchWeatherByIP();
                const currentText = elements.weather.textContent;
                elements.weather.textContent = `${currentText.split(' - ')[0]} - ${weather}`;
            });
        } else {
            const weather = await fetchWeatherByIP();
            const currentText = elements.weather.textContent;
            elements.weather.textContent = `${currentText.split(' - ')[0]} - ${weather}`;
        }
    } catch (error) {
        console.log('Weather unavailable');
    }
}

async function fetchWeather(lat, lon) {
    const API_KEY = '9b9dee316f2fdb0dfe18f99d5671f429';
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        const data = await response.json();
        return `${Math.round(data.main.temp)}°C, ${data.weather[0].description}`;
    } catch {
        return 'Weather unavailable';
    }
}

async function fetchWeatherByIP() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return await fetchWeather(data.latitude, data.longitude);
    } catch {
        return 'Weather unavailable';
    }
}

// Search System
function initializeSearch() {
    const dropdownContent = elements.searchEngineDropdown.querySelector('.py-1');
    dropdownContent.innerHTML = '';

    Object.entries(CONFIG.searchEngines).forEach(([key, engine]) => {
        const option = document.createElement('div');
        option.className = 'flex items-center space-x-2 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer text-neutral-800 dark:text-neutral-200 transition-colors';
        option.innerHTML = `
            <i class="${engine.icon} w-4"></i>
            <span>${engine.name}</span>
        `;
        option.addEventListener('click', () => setSearchEngine(key));
        dropdownContent.appendChild(option);
    });

    setSearchEngine(state.currentSearchEngine);

    elements.searchBtn.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    updateSearchPlaceholder();
}

function setSearchEngine(engine) {
    state.currentSearchEngine = engine;
    const currentEngine = CONFIG.searchEngines[engine];

    elements.searchEngineIcon.className = currentEngine.icon;
    elements.searchEngineBtn.querySelector('span').textContent = currentEngine.name;

    updateSearchPlaceholder();
    saveState();
}

function updateSearchPlaceholder() {
    const randomPlaceholder = CONFIG.placeholders[Math.floor(Math.random() * CONFIG.placeholders.length)];
    elements.searchInput.placeholder = randomPlaceholder.replace('{engine}', CONFIG.searchEngines[state.currentSearchEngine].name);
}

function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;

    const engine = CONFIG.searchEngines[state.currentSearchEngine];
    let searchUrl;

    if (state.currentSearchEngine === 'chatgpt') {
        searchUrl = engine.url;
    } else {
        searchUrl = engine.url + encodeURIComponent(query);
    }

    window.location.href = searchUrl;
}

// Bookmarks System
function initializeBookmarks() {
    renderBookmarks();

    document.getElementById('saveBookmark').addEventListener('click', saveNewBookmark);
    document.getElementById('cancelBookmark').addEventListener('click', () => {
        elements.addBookmarkModal.classList.add('hidden');
    });
}

function renderBookmarks() {
    elements.bookmarks.innerHTML = '';

    // Todo list button with badge
    const todoButton = document.createElement('button');
    todoButton.className = 'relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors';
    todoButton.innerHTML = '<i class="fas fa-tasks text-sm"></i>';
    const incompleteTodos = state.todos.filter(t => !t.completed).length;
    if (incompleteTodos > 0) {
        const badge = document.createElement('span');
        badge.className = 'absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center';
        badge.textContent = incompleteTodos;
        todoButton.appendChild(badge);
    }
    todoButton.addEventListener('click', () => {
        elements.todoModal.classList.remove('hidden');
        renderTodoList();
    });
    elements.bookmarks.appendChild(todoButton);

    // Notepad button
    const notepadButton = document.createElement('button');
    notepadButton.className = 'w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors';
    notepadButton.innerHTML = '<i class="fas fa-sticky-note text-sm"></i>';
    notepadButton.addEventListener('click', () => {
        elements.notepadModal.classList.remove('hidden');
        showNotesList();
    });
    elements.bookmarks.appendChild(notepadButton);

    // Separator line
    const separator = document.createElement('div');
    separator.className = 'h-6 w-px bg-neutral-300 dark:bg-neutral-600 mx-2';
    elements.bookmarks.appendChild(separator);

    // Regular bookmarks
    state.bookmarks.forEach((bookmark, index) => {
        const bookmarkElement = document.createElement('div');
        bookmarkElement.className = 'relative group';
        var bmicon = bookmark.icon || 'fa-solid fa-earth'

        const link = document.createElement('a');
        link.href = bookmark.url;
        link.className = 'w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors';
        link.innerHTML = `<i class="${bmicon} text-sm"></i>`;

        const tooltip = document.createElement('span');
        tooltip.className = 'absolute bottom-full mb-2 hidden group-hover:block bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-800 text-xs px-2 py-1 rounded whitespace-nowrap transition-colors';
        tooltip.textContent = bookmark.name;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full items-center justify-center text-xs hidden group-hover:flex hover:bg-red-600';
        deleteBtn.innerHTML = '<i class="fas fa-times" style="font-size: 8px;"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            removeBookmark(index);
        });

        bookmarkElement.appendChild(link);
        bookmarkElement.appendChild(tooltip);
        bookmarkElement.appendChild(deleteBtn);
        elements.bookmarks.appendChild(bookmarkElement);
    });

    // Plus button
    const plusButton = document.createElement('button');
    plusButton.className = 'w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors';
    plusButton.innerHTML = '<i class="fas fa-plus text-sm"></i>';
    plusButton.addEventListener('click', () => {
        elements.addBookmarkModal.classList.remove('hidden');
    });
    elements.bookmarks.appendChild(plusButton);

    // Separator line
    const separator2 = document.createElement('div');
    separator2.className = 'h-6 w-px bg-neutral-300 dark:bg-neutral-600 mx-2';
    elements.bookmarks.appendChild(separator2);

    // Wallpaper button
    const wallpaperButton = document.createElement('button');
    wallpaperButton.className = 'w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors';
    wallpaperButton.innerHTML = '<i class="fas fa-image text-sm"></i>';
    wallpaperButton.addEventListener('click', openWallpaperModal);
    elements.bookmarks.appendChild(wallpaperButton);
}

function removeBookmark(index) {
    if (confirm('Remove this bookmark?')) {
        state.bookmarks.splice(index, 1);
        saveState();
        renderBookmarks();
    }
}

function saveNewBookmark() {
    const name = document.getElementById('bookmarkName').value.trim();
    const url = document.getElementById('bookmarkUrl').value.trim();
    const icon = document.getElementById('bookmarkIcon').value.trim();

    if (name && url) {
        state.bookmarks.push({ name, url, icon });
        saveState();
        renderBookmarks();

        document.getElementById('bookmarkName').value = '';
        document.getElementById('bookmarkUrl').value = '';
        document.getElementById('bookmarkIcon').value = '';
        elements.addBookmarkModal.classList.add('hidden');
    }
}

// Todo List System
function initializeTodos() {
    document.getElementById('addTodoBtn').addEventListener('click', addTodo);
    document.getElementById('todoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    document.getElementById('closeTodoModal').addEventListener('click', () => {
        elements.todoModal.classList.add('hidden');
        renderBookmarks(); // Update badge
    });
}

function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();

    if (text) {
        state.todos.push({
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        });
        input.value = '';
        saveState();
        renderTodoList();
        renderBookmarks();
    }
}

function renderTodoList() {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';

    if (state.todos.length === 0) {
        todoList.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 text-center py-4">No tasks yet. Add one above!</p>';
        return;
    }

    state.todos.forEach((todo, index) => {
        const todoItem = document.createElement('div');
        todoItem.className = 'flex items-center space-x-2 p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.className = 'w-4 h-4 cursor-pointer';
        checkbox.addEventListener('change', () => {
            state.todos[index].completed = checkbox.checked;
            saveState();
            renderTodoList();
            renderBookmarks();
        });

        const text = document.createElement('span');
        text.className = `flex-1 ${todo.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`;
        text.textContent = todo.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity';
        deleteBtn.innerHTML = '<i class="fas fa-trash text-sm"></i>';
        deleteBtn.addEventListener('click', () => {
            state.todos.splice(index, 1);
            saveState();
            renderTodoList();
            renderBookmarks();
        });

        todoItem.appendChild(checkbox);
        todoItem.appendChild(text);
        todoItem.appendChild(deleteBtn);
        todoList.appendChild(todoItem);
    });
}

// Notepad System
function initializeNotepad() {
    document.getElementById('createNoteBtn').addEventListener('click', createNewNote);
    document.getElementById('saveNoteBtn').addEventListener('click', saveCurrentNote);
    document.getElementById('deleteNoteBtn').addEventListener('click', deleteCurrentNote);
    document.getElementById('backToListBtn').addEventListener('click', showNotesList);
    document.getElementById('closeNotepadModal').addEventListener('click', () => {
        elements.notepadModal.classList.add('hidden');
        showNotesList();
    });
}

function createNewNote() {
    state.currentNoteId = Date.now();
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    showNoteEditor();
}

function showNoteEditor() {
    document.getElementById('notesListView').style.display = 'none';
    document.getElementById('noteEditorView').style.display = 'flex';
    document.getElementById('noteTitle').focus();
}

function showNotesList() {
    document.getElementById('notesListView').style.display = 'flex';
    document.getElementById('noteEditorView').style.display = 'none';
    state.currentNoteId = null;
    renderNotesList();
}

function renderNotesList() {
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = '';

    if (state.notes.length === 0) {
        notesList.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 text-center py-4">No notes yet. Create one above!</p>';
        return;
    }

    state.notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    state.notes.forEach((note) => {
        const noteItem = document.createElement('div');
        noteItem.className = 'p-3 rounded border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors';

        const date = new Date(note.updatedAt);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        noteItem.innerHTML = `
            <div class="font-medium text-neutral-800 dark:text-neutral-200 mb-1">${note.title || 'Untitled Note'}</div>
            <div class="text-xs text-neutral-500 dark:text-neutral-400 mb-2">${formattedDate}</div>
            <div class="text-sm text-neutral-600 dark:text-neutral-300 truncate">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</div>
        `;

        noteItem.addEventListener('click', () => openNote(note.id));
        notesList.appendChild(noteItem);
    });
}

function openNote(noteId) {
    const note = state.notes.find(n => n.id === noteId);
    if (note) {
        state.currentNoteId = noteId;
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;
        showNoteEditor();
    }
}

function saveCurrentNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();

    if (!title && !content) {
        alert('Please add a title or content to save the note.');
        return;
    }

    const noteIndex = state.notes.findIndex(n => n.id === state.currentNoteId);

    if (noteIndex >= 0) {
        state.notes[noteIndex].title = title;
        state.notes[noteIndex].content = content;
        state.notes[noteIndex].updatedAt = new Date().toISOString();
    } else {
        state.notes.push({
            id: state.currentNoteId,
            title: title,
            content: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    saveState();
    showNotesList();
}

function deleteCurrentNote() {
    if (confirm('Delete this note?')) {
        const noteIndex = state.notes.findIndex(n => n.id === state.currentNoteId);
        if (noteIndex >= 0) {
            state.notes.splice(noteIndex, 1);
            saveState();
        }
        showNotesList();
    }
}

// Wallpaper System
function initializeWallpaper() {
    const wallpaperUpload = document.getElementById('wallpaperUpload');
    const blurSlider = document.getElementById('blurSlider');
    const opacitySlider = document.getElementById('opacitySlider');
    const applyBtn = document.getElementById('applyWallpaper');
    const cancelBtn = document.getElementById('cancelWallpaper');
    const removeBtn = document.getElementById('removeWallpaper');

    // Tab switching
    document.getElementById('uploadTab').addEventListener('click', () => switchWallpaperTab('upload'));
    document.getElementById('pexelsTab').addEventListener('click', () => switchWallpaperTab('pexels'));

    // File upload handler
    wallpaperUpload.addEventListener('change', handleWallpaperUpload);

    // Pexels search
    document.getElementById('pexelsSearchBtn').addEventListener('click', searchPexels);
    document.getElementById('pexelsSearchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchPexels();
    });

    // Blur slider
    blurSlider.addEventListener('input', (e) => {
        document.getElementById('blurValue').textContent = e.target.value;
        updateWallpaperPreview();
    });

    // Opacity slider
    opacitySlider.addEventListener('input', (e) => {
        document.getElementById('opacityValue').textContent = e.target.value;
        updateWallpaperPreview();
    });

    // Apply button
    applyBtn.addEventListener('click', async () => {
        state.wallpaper.blur = parseInt(blurSlider.value);
        state.wallpaper.opacity = parseInt(opacitySlider.value);

        // Save wallpaper data to IndexedDB if it exists
        if (state.wallpaper.data) {
            try {
                await saveWallpaperToDB(state.wallpaper.data);
            } catch (error) {
                console.error('Failed to save wallpaper:', error);
                alert('Failed to save wallpaper. The file might be too large.');
                return;
            }
        }

        saveState();
        await applyWallpaper();
        elements.wallpaperModal.classList.add('hidden');
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        elements.wallpaperModal.classList.add('hidden');
    });

    // Remove button
    removeBtn.addEventListener('click', async () => {
        if (confirm('Remove wallpaper?')) {
            state.wallpaper = { data: null, type: null, url: null, blur: 0, opacity: 0 };
            await deleteWallpaperFromDB();
            saveState();
            await applyWallpaper();
            elements.wallpaperModal.classList.add('hidden');
        }
    });

    // Load initial Pexels results
    loadPexelsCurated();
}

function switchWallpaperTab(tab) {
    state.wallpaperTab = tab;

    // Update tab buttons
    document.getElementById('uploadTab').className = tab === 'upload'
        ? 'px-4 py-2 bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-800 rounded-t transition-colors'
        : 'px-4 py-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded transition-colors';

    document.getElementById('pexelsTab').className = tab === 'pexels'
        ? 'px-4 py-2 bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-800 rounded-t transition-colors'
        : 'px-4 py-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded transition-colors';

    // Show/hide tab content
    document.getElementById('uploadContent').style.display = tab === 'upload' ? 'block' : 'none';
    document.getElementById('pexelsContent').style.display = tab === 'pexels' ? 'block' : 'none';
}

async function loadPexelsCurated() {
    const resultsContainer = document.getElementById('pexelsResults');
    resultsContainer.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 text-center py-4">Loading curated photos...</p>';

    try {
        const response = await fetch('https://api.pexels.com/v1/curated?per_page=12', {
            headers: {
                'Authorization': CONFIG.pexelsApiKey
            }
        });

        const data = await response.json();
        renderPexelsResults(data.photos);
    } catch (error) {
        resultsContainer.innerHTML = '<p class="text-red-500 text-center py-4">Failed to load images. Check your API key.</p>';
    }
}

async function searchPexels() {
    const query = document.getElementById('pexelsSearchInput').value.trim();
    if (!query) return;

    const resultsContainer = document.getElementById('pexelsResults');
    resultsContainer.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 text-center py-4">Searching...</p>';

    try {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12`, {
            headers: {
                'Authorization': CONFIG.pexelsApiKey
            }
        });

        const data = await response.json();
        renderPexelsResults(data.photos);
    } catch (error) {
        resultsContainer.innerHTML = '<p class="text-red-500 text-center py-4">Search failed. Please try again.</p>';
    }
}

function renderPexelsResults(photos) {
    const resultsContainer = document.getElementById('pexelsResults');

    if (!photos || photos.length === 0) {
        resultsContainer.innerHTML = '<p class="text-neutral-500 dark:text-neutral-400 text-center py-4">No results found.</p>';
        return;
    }

    resultsContainer.innerHTML = '';

    photos.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'relative group cursor-pointer overflow-hidden rounded flex-shrink-0';

        const imgContainer = document.createElement('div');
        imgContainer.className = 'h-[160px] overflow-hidden';

        const img = document.createElement('img');
        img.src = photo.src.medium;
        // Use object-contain to show entire image without cropping
        img.className = 'h-full w-auto object-contain transition-transform group-hover:scale-110';

        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center';
        overlay.innerHTML = '<i class="fas fa-check text-white text-2xl"></i>';

        imgContainer.appendChild(img);
        item.appendChild(imgContainer);
        item.appendChild(overlay);

        item.addEventListener('click', () => applyPexelsImage(photo.src.large2x, 'image'));

        resultsContainer.appendChild(item);
    });
}

async function applyPexelsImage(url, type) {
    try {
        // Convert URL to data URL for storage
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();

        reader.onload = (e) => {
            state.wallpaper.data = e.target.result;
            state.wallpaper.type = type;
            state.wallpaper.url = url;

            updateWallpaperPreview();
            document.getElementById('wallpaperPreview').classList.remove('hidden');
        };

        reader.readAsDataURL(blob);
    } catch (error) {
        console.error('Failed to load image:', error);
        alert('Failed to load image. Please try another one.');
    }
}

function openWallpaperModal() {
    elements.wallpaperModal.classList.remove('hidden');

    // Set current values
    document.getElementById('blurSlider').value = state.wallpaper.blur;
    document.getElementById('opacitySlider').value = state.wallpaper.opacity;
    document.getElementById('blurValue').textContent = state.wallpaper.blur;
    document.getElementById('opacityValue').textContent = state.wallpaper.opacity;

    // Switch to appropriate tab
    switchWallpaperTab(state.wallpaperTab);

    // Show preview if wallpaper exists
    if (state.wallpaper.data || state.wallpaper.url) {
        updateWallpaperPreview();
        document.getElementById('wallpaperPreview').classList.remove('hidden');
    } else {
        document.getElementById('wallpaperPreview').classList.add('hidden');
    }
}

function handleWallpaperUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        state.wallpaper.data = event.target.result;
        state.wallpaper.type = fileType;
        state.wallpaper.url = null;

        updateWallpaperPreview();
        document.getElementById('wallpaperPreview').classList.remove('hidden');
    };

    reader.readAsDataURL(file);
}

function updateWallpaperPreview() {
    const previewImage = document.getElementById('previewImage');
    const previewVideo = document.getElementById('previewVideo');
    const blur = document.getElementById('blurSlider').value;

    const source = state.wallpaper.data || state.wallpaper.url;

    if (state.wallpaper.type === 'image') {
        previewImage.src = source;
        previewImage.style.filter = `blur(${blur}px)`;
        previewImage.classList.remove('hidden');
        previewVideo.classList.add('hidden');
    } else if (state.wallpaper.type === 'video') {
        previewVideo.src = source;
        previewVideo.style.filter = `blur(${blur}px)`;
        previewVideo.classList.remove('hidden');
        previewImage.classList.add('hidden');
    }
}

async function applyWallpaper() {
    const wallpaperContainer = document.getElementById('wallpaperContainer');
    const wallpaperImage = document.getElementById('wallpaperImage');
    const wallpaperVideo = document.getElementById('wallpaperVideo');
    const wallpaperOverlay = document.getElementById('wallpaperOverlay');

    const source = state.wallpaper.data || state.wallpaper.url;

    if (source) {
        wallpaperContainer.classList.remove('hidden');

        if (state.wallpaper.type === 'image') {
            wallpaperImage.src = source;
            wallpaperImage.style.filter = `blur(${state.wallpaper.blur}px)`;
            wallpaperImage.classList.remove('hidden');
            wallpaperVideo.classList.add('hidden');
        } else if (state.wallpaper.type === 'video') {
            wallpaperVideo.src = source;
            wallpaperVideo.style.filter = `blur(${state.wallpaper.blur}px)`;
            wallpaperVideo.classList.remove('hidden');
            wallpaperImage.classList.add('hidden');
        }

        wallpaperOverlay.style.opacity = state.wallpaper.opacity / 100;
    } else {
        wallpaperContainer.classList.add('hidden');
        wallpaperImage.classList.add('hidden');
        wallpaperVideo.classList.add('hidden');
    }
}

window.addEventListener("load", () => {
    setTimeout(() => {
        document.getElementById("searchInput").focus();
    }, 100);
});

document.addEventListener('DOMContentLoaded', init);