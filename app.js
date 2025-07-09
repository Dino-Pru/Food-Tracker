const foodInput = document.getElementById('foodInput');
const calorieInput = document.getElementById('calorieInput');
const addFoodBtn = document.getElementById('addFoodBtn');
const foodList = document.getElementById('foodList');
const totalCaloriesEl = document.getElementById('totalCalories');
const remainingCaloriesEl = document.getElementById('remainingCalories');
const progressBar = document.getElementById('progressBar');
const calorieGoal = 4000; // Default goal, adjustable

let foods = [];
let db;

// Sample food calorie database (simplified)
const foodDatabase = {
    'chicken burger': 600,
    'pizza slice': 300,
    'apple': 95,
    'banana': 120,
    'rice bowl': 400,
    'protein shake': 200
};

// Initialize IndexedDB
const request = indexedDB.open('CosmicCalorieDB', 1);
request.onupgradeneeded = (event) => {
    db = event.target.result;
    db.createObjectStore('foods', { keyPath: 'id', autoIncrement: true });
};
request.onsuccess = (event) => {
    db = event.target.result;
    loadFoods();
};
request.onerror = (event) => console.error('IndexedDB error:', event);

// Load foods from IndexedDB
function loadFoods() {
    const transaction = db.transaction(['foods'], 'readonly');
    const store = transaction.objectStore('foods');
    const request = store.getAll();
    request.onsuccess = () => {
        foods = request.result;
        renderFoods();
        updateProgress();
    };
}

// Add food to IndexedDB
function addFood(food, calories) {
    const transaction = db.transaction(['foods'], 'readwrite');
    const store = transaction.objectStore('foods');
    store.add({ food, calories: parseInt(calories), date: new Date().toISOString().split('T')[0] });
    transaction.oncomplete = () => {
        loadFoods();
        playSound();
    };
}

// Render food list
function renderFoods() {
    foodList.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    const todayFoods = foods.filter(f => f.date === today);
    todayFoods.forEach(food => {
        const li = document.createElement('li');
        li.className = 'p-2 bg-indigo-900 bg-opacity-50 rounded-lg flex justify-between items-center';
        li.innerHTML = `<span>${food.food}: ${food.calories} kcal</span>
            <button class="text-neon-pink hover:text-neon-yellow" onclick="deleteFood(${food.id})">Delete</button>`;
        foodList.appendChild(li);
    });
}

// Delete food
function deleteFood(id) {
    const transaction = db.transaction(['foods'], 'readwrite');
    const store = transaction.objectStore('foods');
    store.delete(id);
    transaction.oncomplete = () => loadFoods();
}

// Update progress
function updateProgress() {
    const today = new Date().toISOString().split('T')[0];
    const todayFoods = foods.filter(f => f.date === today);
    const total = todayFoods.reduce((sum, f) => sum + f.calories, 0);
    totalCaloriesEl.textContent = total;
    remainingCaloriesEl.textContent = calorieGoal - total;
    const progress = (total / calorieGoal) * 100;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
}

// Play sound on add
function playSound() {
    const audio = new Audio('https://freesound.org/data/previews/270/270333_5032173-lq.mp3'); // Short sci-fi beep
    audio.play().catch(() => console.log('Audio playback failed'));
}

// Suggest calories based on food input
foodInput.addEventListener('input', () => {
    const food = foodInput.value.toLowerCase();
    const suggestion = Object.keys(foodDatabase).find(f => f.includes(food));
    if (suggestion) {
        calorieInput.value = foodDatabase[suggestion];
    }
});

// Add food on button click
addFoodBtn.addEventListener('click', () => {
    const food = foodInput.value.trim();
    const calories = calorieInput.value;
    if (food && calories && !isNaN(calories) && calories > 0) {
        addFood(food, calories);
        foodInput.value = '';
        calorieInput.value = '';
    } else {
        alert('Please enter a valid food and calorie count.');
    }
});