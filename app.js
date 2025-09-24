// Family Finance Tracker - Modern Futuristic JavaScript with Activity Feed
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import {
    getFirestore, collection, addDoc, doc, deleteDoc,
    setDoc, onSnapshot, query, orderBy, serverTimestamp,
    enableNetwork, updateDoc, getDoc, limit
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

console.log('🚀 Family Finance Tracker - Modern Futuristic Version 2025');

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBHytJ5GV4KeFcd1Xr5gfi7pW_IbUElQqY",
    authDomain: "shreyaandkaranfinance.firebaseapp.com",
    databaseURL: "https://shreyaandkaranfinance-default-rtdb.firebaseio.com/",
    projectId: "shreyaandkaranfinance",
    storageBucket: "shreyaandkaranfinance.firebasestorage.app",
    messagingSenderId: "1099360741471",
    appId: "1:1099360741471:web:cb9c21d6e429df99ca13ea"
};

// Initialize Firebase
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

// Global State
let familyTransactions = [];
let currentUser = 'Shreya';
let familyBudget = {};
let familyGoals = [];
let recentActivities = [];
let isConnected = false;
let currentTransactionType = 'expense';

// Constants
const USERS = {
    Shreya: { icon: '👩', greeting: 'SHREYA', label: 'Wife' },
    Karan: { icon: '👨', greeting: 'KARAN', label: 'Husband' }
};

const EXPENSE_CATEGORIES = [
    'Housing & Rent', 'Groceries & Food', 'Transport', 'Utilities',
    'Dining Out', 'Entertainment', 'Health & Fitness', 'Shopping',
    'Personal Care', 'Education', 'Travel', 'Miscellaneous'
];

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Other Income'];

const GOAL_CATEGORIES = [
    'Emergency Fund', 'Vacation', 'Home Down Payment', 'Car Purchase',
    'Wedding', 'Education', 'Investment', 'Gadgets & Tech',
    'Home Improvement', 'General Savings'
];

const CATEGORY_WEIGHTS = {
    'Housing & Rent': 0.40,
    'Groceries & Food': 0.15,
    'Transport': 0.10,
    'Utilities': 0.08,
    'Dining Out': 0.08,
    'Entertainment': 0.06,
    'Health & Fitness': 0.04,
    'Shopping': 0.04,
    'Personal Care': 0.02,
    'Education': 0.01,
    'Travel': 0.01,
    'Miscellaneous': 0.01
};

const CORRECT_PASSWORD = 'shreyakaran21012025';

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NZ', {
        style: 'currency',
        currency: 'NZD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
    }
}

function getCategoryIcon(category) {
    const icons = {
        'Housing & Rent': '🏠',
        'Groceries & Food': '🛒',
        'Transport': '🚗',
        'Utilities': '⚡',
        'Dining Out': '🍽️',
        'Entertainment': '🎬',
        'Health & Fitness': '💪',
        'Shopping': '🛍️',
        'Personal Care': '💄',
        'Education': '📚',
        'Travel': '✈️',
        'Miscellaneous': '📦',
        'Salary': '💼',
        'Freelance': '💻',
        'Investment': '📈',
        'Other Income': '💰'
    };
    return icons[category] || '📦';
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
        return `${Math.floor(diffInDays)}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Modern Toast Notifications with Enhanced Styling
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Auto-remove with fade out animation
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%) scale(0.8)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// Activity Tracking System
async function logActivity(type, description, details = {}) {
    if (!isConnected) return;

    try {
        const activity = {
            type, // 'transaction_added', 'transaction_deleted', 'goal_created', 'goal_contribution', 'budget_set'
            description,
            user: currentUser,
            timestamp: serverTimestamp(),
            timestampString: new Date().toISOString(),
            details
        };

        await addDoc(collection(db, 'activities'), activity);
        console.log('📱 Activity logged:', type, description);
    } catch (error) {
        console.error('❌ Failed to log activity:', error);
    }
}

// Firebase Functions
async function initFirebase() {
    try {
        console.log('🔄 Connecting to Firebase...');
        await enableNetwork(db);
        setupListeners();
        isConnected = true;
        console.log('✅ Firebase connected successfully');
        showToast('🚀 CONNECTED TO FAMILY DATABASE', 'success');
    } catch (error) {
        console.error('❌ Firebase connection failed:', error);
        showToast('❌ DATABASE CONNECTION FAILED', 'error');
        isConnected = false;
    }
}

function setupListeners() {
    // Transactions listener
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'));
    onSnapshot(q, (snapshot) => {
        familyTransactions = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            familyTransactions.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate() || new Date(data.timestampString) || new Date()
            });
        });
        updateUI();
        console.log(`📡 Synced ${familyTransactions.length} transactions`);
    }, (error) => {
        console.error('❌ Transactions listener error:', error);
        showToast('❌ SYNC ERROR - TRANSACTIONS', 'error');
    });

    // Settings listener
    onSnapshot(doc(db, 'settings', 'userPrefs'), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            if (data.currentUser && data.currentUser !== currentUser) {
                currentUser = data.currentUser;
                updateUserDisplay();
            }
            familyBudget = data.budget || {};
            updateBudgetDisplay();
        }
    }, (error) => {
        console.error('❌ Settings listener error:', error);
        showToast('❌ SYNC ERROR - SETTINGS', 'error');
    });

    // Goals listener
    const goalsQuery = query(collection(db, 'goals'), orderBy('targetDate', 'asc'));
    onSnapshot(goalsQuery, (snapshot) => {
        familyGoals = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            familyGoals.push({
                id: doc.id,
                ...data,
                targetDate: data.targetDate?.toDate() || new Date(data.targetDateString) || new Date(),
                contributions: data.contributions || []
            });
        });
        updateGoalsDisplay();
        updateSavingsDisplay();
        updateAnalytics();
        console.log(`📡 Synced ${familyGoals.length} goals`);
    }, (error) => {
        console.error('❌ Goals listener error:', error);
        showToast('❌ SYNC ERROR - GOALS', 'error');
    });

    // Activities listener
    const activitiesQuery = query(
        collection(db, 'activities'), 
        orderBy('timestamp', 'desc'), 
        limit(20)
    );
    onSnapshot(activitiesQuery, (snapshot) => {
        recentActivities = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            recentActivities.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate() || new Date(data.timestampString) || new Date()
            });
        });
        renderActivityFeed(); // Render the feed data, ready for the modal
        console.log(`📡 Synced ${recentActivities.length} activities`);
    }, (error) => {
        console.error('❌ Activities listener error:', error);
        showToast('❌ SYNC ERROR - ACTIVITIES', 'error');
    });
}

async function saveSettings() {
    if (!isConnected) return false;
    
    try {
        const settingsData = {
            currentUser,
            budget: familyBudget,
            lastUpdated: serverTimestamp()
        };
        await setDoc(doc(db, 'settings', 'userPrefs'), settingsData);
        return true;
    } catch (error) {
        console.error('❌ Save failed:', error);
        showToast('❌ FAILED TO SAVE CHANGES', 'error');
        return false;
    }
}

async function addTransaction(data) {
    if (!isConnected) {
        showToast('❌ NO CONNECTION', 'error');
        return false;
    }

    try {
        const transaction = {
            amount: parseFloat(data.amount),
            category: data.category,
            description: data.description || data.category,
            type: data.type,
            addedBy: currentUser,
            date: data.date,
            timestamp: serverTimestamp(),
            timestampString: new Date().toISOString()
        };

        await addDoc(collection(db, 'transactions'), transaction);
        
        // Log activity
        await logActivity(
            'transaction_added',
            `${data.type === 'income' ? 'Added income' : 'Added expense'}: ${formatCurrency(data.amount)} for ${data.category}`,
            { amount: data.amount, category: data.category, type: data.type }
        );

        const icon = data.type === 'income' ? '💰' : '💸';
        showToast(`${icon} ${data.type.toUpperCase()} ADDED: ${formatCurrency(data.amount)}`, 'success');
        return true;
    } catch (error) {
        console.error('❌ Add transaction failed:', error);
        showToast('❌ FAILED TO ADD TRANSACTION', 'error');
        return false;
    }
}

async function deleteTransaction(transactionId) {
    if (!isConnected) {
        showToast('❌ NO CONNECTION', 'error');
        return false;
    }

    try {
        const transaction = familyTransactions.find(t => t.id === transactionId);
        if (!transaction) {
            showToast('❌ TRANSACTION NOT FOUND', 'error');
            return false;
        }

        const confirmed = confirm(
            `🗑️ DELETE TRANSACTION?\n\n` +
            `${transaction.description}: ${formatCurrency(transaction.amount)}\n` +
            `Added by: ${transaction.addedBy}\n` +
            `Type: ${transaction.type.toUpperCase()}\n\n` +
            `This will delete the transaction for BOTH users! Continue?`
        );

        if (!confirmed) return false;

        await deleteDoc(doc(db, 'transactions', transactionId));
        
        // Log activity
        await logActivity(
            'transaction_deleted',
            `Deleted ${transaction.type}: ${formatCurrency(transaction.amount)} for ${transaction.category}`,
            { amount: transaction.amount, category: transaction.category, type: transaction.type }
        );

        showToast(`🗑️ TRANSACTION DELETED BY ${currentUser.toUpperCase()}`, 'success');
        return true;
    } catch (error) {
        console.error('❌ Delete transaction failed:', error);
        showToast('❌ FAILED TO DELETE TRANSACTION', 'error');
        return false;
    }
}

async function addGoal(data) {
    if (!isConnected) {
        showToast('❌ NO CONNECTION', 'error');
        return false;
    }

    try {
        const goal = {
            name: data.name,
            targetAmount: parseFloat(data.targetAmount),
            currentAmount: parseFloat(data.currentAmount) || 0,
            targetDate: new Date(data.targetDate),
            targetDateString: data.targetDate,
            category: data.category || 'General Savings',
            createdBy: currentUser,
            createdAt: serverTimestamp(),
            icon: getCategoryIcon(data.category),
            description: data.description || '',
            contributions: data.currentAmount > 0 ? [{
                user: currentUser,
                amount: parseFloat(data.currentAmount),
                timestamp: new Date().toISOString(),
                dateString: new Date().toLocaleDateString()
            }] : []
        };

        await addDoc(collection(db, 'goals'), goal);
        
        // Log activity
        await logActivity(
            'goal_created',
            `Created goal: "${data.name}" with target ${formatCurrency(data.targetAmount)}`,
            { goalName: data.name, targetAmount: data.targetAmount, category: data.category }
        );

        if (data.currentAmount > 0) {
            await logActivity(
                'goal_contribution',
                `Added ${formatCurrency(data.currentAmount)} to goal "${data.name}"`,
                { goalName: data.name, amount: data.currentAmount }
            );
        }

        showToast(`🎯 GOAL CREATED: ${data.name.toUpperCase()}`, 'success');
        return true;
    } catch (error) {
        console.error('❌ Add goal failed:', error);
        showToast('❌ FAILED TO CREATE GOAL', 'error');
        return false;
    }
}

async function addToGoal(goalId) {
    const goal = familyGoals.find(g => g.id === goalId);
    if (!goal) {
        showToast('❌ GOAL NOT FOUND', 'error');
        return;
    }

    const amountStr = prompt(
        `💰 Add money to "${goal.name}"\n\n` +
        `Current: ${formatCurrency(goal.currentAmount || 0)}\n` +
        `Target: ${formatCurrency(goal.targetAmount)}\n\n` +
        `Enter amount to add:`
    );
    
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
        showToast('❌ PLEASE ENTER A VALID POSITIVE AMOUNT', 'error');
        return;
    }

    try {
        const goalRef = doc(db, 'goals', goalId);
        const newAmount = (goal.currentAmount || 0) + amount;

        const newContribution = {
            user: currentUser,
            amount: amount,
            timestamp: new Date().toISOString(),
            dateString: new Date().toLocaleDateString()
        };

        await updateDoc(goalRef, {
            currentAmount: newAmount,
            lastUpdated: serverTimestamp(),
            lastUpdatedBy: currentUser,
            contributions: [...(goal.contributions || []), newContribution]
        });

        // Log activity
        await logActivity(
            'goal_contribution',
            `Added ${formatCurrency(amount)} to goal "${goal.name}"`,
            { goalName: goal.name, amount, newTotal: newAmount, targetAmount: goal.targetAmount }
        );

        showToast(`✅ Added ${formatCurrency(amount)} to "${goal.name}"!`, 'success');

        if (newAmount >= goal.targetAmount) {
            setTimeout(() => {
                showToast(`🎉 Congratulations! Goal "${goal.name}" completed!`, 'success');
                // Log completion activity
                logActivity(
                    'goal_completed',
                    `🎉 Goal completed: "${goal.name}" reached ${formatCurrency(goal.targetAmount)}!`,
                    { goalName: goal.name, targetAmount: goal.targetAmount }
                );
            }, 1000);
        }
    } catch (error) {
        console.error('Error updating goal:', error);
        showToast('❌ FAILED TO ADD MONEY TO GOAL', 'error');
    }
}

async function deleteGoal(goalId) {
    const goal = familyGoals.find(g => g.id === goalId);
    if (!goal) {
        showToast('❌ GOAL NOT FOUND', 'error');
        return;
    }

    const confirmed = confirm(
        `🗑️ DELETE GOAL?\n\n` +
        `Goal: ${goal.name}\n` +
        `Progress: ${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}\n` +
        `Created by: ${goal.createdBy}\n\n` +
        `This will delete the goal for BOTH users! Continue?`
    );

    if (!confirmed) return;

    if (!isConnected) {
        showToast('❌ NO CONNECTION', 'error');
        return;
    }

    try {
        await deleteDoc(doc(db, 'goals', goalId));
        
        // Log activity
        await logActivity(
            'goal_deleted',
            `Deleted goal: "${goal.name}" (was ${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)})`,
            { goalName: goal.name, currentAmount: goal.currentAmount, targetAmount: goal.targetAmount }
        );

        showToast(`🗑️ GOAL DELETED: ${goal.name.toUpperCase()}`, 'success');
    } catch (error) {
        console.error('❌ Delete goal failed:', error);
        showToast('❌ FAILED TO DELETE GOAL', 'error');
    }
}

function editBudgetCategory(category, currentAmount) {
    const newAmount = parseFloat(prompt(`💰 Edit budget for ${category}:`, currentAmount));
    if (newAmount == null || newAmount < 0) return;

    familyBudget[category] = newAmount;
    saveSettings();
    updateBudgetDisplay();
    showToast(`✅ ${category} budget updated to ${formatCurrency(newAmount)}`, 'success');
}

async function setBudgetSmart() {
    const totalBudgetInput = document.getElementById('totalBudgetInput');
    const totalBudget = parseFloat(totalBudgetInput.value) || 0;

    if (totalBudget <= 0) {
        showToast('❌ PLEASE ENTER A VALID BUDGET AMOUNT', 'error');
        return;
    }

    familyBudget = {};
    EXPENSE_CATEGORIES.forEach(category => {
        const weight = CATEGORY_WEIGHTS[category] || 0.01;
        familyBudget[category] = Math.round(totalBudget * weight);
    });

    await saveSettings();
    
    // Log activity
    await logActivity(
        'budget_set',
        `Set family budget: ${formatCurrency(totalBudget)} distributed across categories`,
        { totalBudget, categories: Object.keys(familyBudget).length }
    );

    showToast(`📊 BUDGET SET: ${formatCurrency(totalBudget)}`, 'success');
}

// UI Update Functions
function updateUI() {
    updateBalanceDisplay();
    updateTransactionsList();
    updateBudgetDisplay();
    updateGoalsDisplay();
    updateSavingsDisplay();
    updateAnalytics();
    renderActivityFeed(); // Ensures activity modal is populated on every UI refresh
    updateLifetimeAnalytics();
}

function updateBalanceDisplay() {
    const now = new Date();
    const thisMonthTransactions = familyTransactions.filter(t => {
        const date = new Date(t.timestamp);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const income = thisMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = thisMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;
    const savings = income > 0 ? ((income - expenses) / income * 100) : 0;

    updateElement('familyBalance', formatCurrency(balance));
    updateElement('familyIncome', formatCurrency(income));
    updateElement('familyExpenses', formatCurrency(expenses));
    updateElement('familySavings', formatCurrency(income - expenses));
    
    const savingsRateElement = document.getElementById('savingsRatePercent');
    if (savingsRateElement) {
        savingsRateElement.textContent = `${savings.toFixed(1)}%`;
    }
}

function updateTransactionsList() {
    const recentList = document.getElementById('recentTransactionsList');
    const allList = document.getElementById('allTransactionsList');

    if (familyTransactions.length === 0) {
        const emptyHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>NO FAMILY TRANSACTIONS YET</h3>
                <p>Add your first transaction to get started!</p>
                <button class="btn btn-primary" onclick="openTransactionModal('expense')">
                    💸 ADD EXPENSE
                </button>
            </div>
        `;
        if (recentList) recentList.innerHTML = emptyHTML;
        if (allList) allList.innerHTML = emptyHTML;
        return;
    }

    // Recent transactions (last 5)
    const recentTransactionHTML = familyTransactions.slice(0, 5).map(transaction => createTransactionHTML(transaction)).join('');
    if (recentList) recentList.innerHTML = recentTransactionHTML;

    // All transactions
    const allTransactionHTML = familyTransactions.map(transaction => createTransactionHTML(transaction)).join('');
    if (allList) allList.innerHTML = allTransactionHTML;
}

function createTransactionHTML(transaction) {
    return `
        <div class="transaction-item" onclick="showTransactionDetails('${transaction.id}')">
            <div class="transaction-icon ${transaction.type}">
                ${getCategoryIcon(transaction.category)}
            </div>
            <div class="transaction-details">
                <div class="transaction-description">${transaction.description}</div>
                <div class="transaction-category">${transaction.category}</div>
                <div class="transaction-meta">
                    <span>By ${transaction.addedBy}</span>
                    <span>${new Date(transaction.timestamp).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'expense' ? '-' : '+'}${formatCurrency(transaction.amount)}
            </div>
        </div>
    `;
}

function renderActivityFeed() {
    const activityContainer = document.getElementById('activityFeedContainer');
    if (!activityContainer) return;

    if (recentActivities.length === 0) {
        activityContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📱</div>
                <p>All family activities will appear here</p>
            </div>
        `;
        return;
    }

    const activitiesHTML = recentActivities.map(activity => {
        const icon = getActivityIcon(activity.type);
        return `
            <div class="activity-item">
                <div class="activity-icon">${icon}</div>
                <div class="activity-details">
                    <div class="activity-text">${activity.description}</div>
                    <div class="activity-meta">
                        <span class="activity-user">by ${activity.user}</span>
                        <span>•</span>
                        <span>${formatTimeAgo(activity.timestamp)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    activityContainer.innerHTML = activitiesHTML;
}

function getActivityIcon(type) {
    const icons = {
        'transaction_added': '💰',
        'transaction_deleted': '🗑️',
        'goal_created': '🎯',
        'goal_contribution': '💝',
        'goal_completed': '🎉',
        'goal_deleted': '❌',
        'budget_set': '📊',
        'user_switch': '👥'
    };
    return icons[type] || '📱';
}

function updateBudgetDisplay() {
    const budgetDisplay = document.getElementById('budgetDisplay');
    const budgetTotal = document.getElementById('budgetTotal');
    
    if (!budgetDisplay) return;

    if (Object.keys(familyBudget).length === 0) {
        budgetDisplay.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>SET YOUR FAMILY BUDGET TO GET STARTED</h3>
                <p>Enter your total budget above and click "Set Budget"</p>
            </div>
        `;
        if (budgetTotal) budgetTotal.textContent = 'Total: NZ$0';
        return;
    }

    const total = Object.values(familyBudget).reduce((sum, amount) => sum + amount, 0);
    if (budgetTotal) budgetTotal.textContent = `Total: ${formatCurrency(total)}`;

    const budgetHTML = Object.entries(familyBudget).map(([category, amount]) => `
        <div class="budget-item" onclick="editBudgetCategory('${category}', ${amount})">
            <div class="budget-info">
                <span class="budget-icon">${getCategoryIcon(category)}</span>
                <span class="budget-category">${category}</span>
            </div>
            <div class="budget-amount">${formatCurrency(amount)}</div>
        </div>
    `).join('');

    budgetDisplay.innerHTML = budgetHTML;
}

function updateGoalsDisplay() {
    const goalsDisplay = document.getElementById('goalsDisplay');
    if (!goalsDisplay) return;

    if (familyGoals.length === 0) {
        goalsDisplay.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <h3>NO FAMILY GOALS YET</h3>
                <p>Create your first shared goal!</p>
                <button class="btn btn-primary" onclick="openGoalModal()">
                    🎯 NEW GOAL
                </button>
            </div>
        `;
        return;
    }

    const goalsHTML = familyGoals.map(goal => {
        const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
        const isCompleted = goal.currentAmount >= goal.targetAmount;
        const daysLeft = Math.ceil((goal.targetDate - new Date()) / (1000 * 60 * 60 * 24));

        return `
            <div class="goal-item ${isCompleted ? 'completed' : ''}">
                <div class="goal-header">
                    <h4>${goal.icon || '🎯'} ${goal.name}</h4>
                    <span class="goal-category">${goal.category}</span>
                </div>
                <div class="goal-progress">
                    <div class="goal-amounts">
                        <span>${formatCurrency(goal.currentAmount)}</span>
                        <span>of ${formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="goal-meta">
                        <span>${progress.toFixed(1)}% complete</span>
                        <span>${daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}</span>
                    </div>
                </div>
                <div class="goal-actions">
                    <button class="btn btn-primary btn-sm" onclick="addToGoal('${goal.id}')">
                        💰 ADD MONEY
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="deleteGoal('${goal.id}')">
                        🗑️ DELETE
                    </button>
                </div>
            </div>
        `;
    }).join('');

    goalsDisplay.innerHTML = goalsHTML;
}

function updateSavingsDisplay() {
    const thisMonthSavingsElement = document.getElementById('thisMonthSavings');
    const goalsProgressElement = document.getElementById('goalsProgress');

    if (thisMonthSavingsElement) {
        const now = new Date();
        const thisMonthTransactions = familyTransactions.filter(t => {
            const date = new Date(t.timestamp);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });

        const income = thisMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = thisMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        thisMonthSavingsElement.textContent = formatCurrency(income - expenses);
    }

    if (goalsProgressElement) {
        if (familyGoals.length === 0) {
            goalsProgressElement.textContent = '0%';
        } else {
            const totalTarget = familyGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
            const totalCurrent = familyGoals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
            const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
            goalsProgressElement.textContent = `${overallProgress.toFixed(1)}%`;
        }
    }
}

// ANALYTICS FUNCTIONS
function updateAnalytics() {
    renderMonthlySummary();
    renderCategoryDonutChart();
    renderCashFlowChart();
}

function renderMonthlySummary() {
    const container = document.getElementById('monthlySummaryContainer');
    if (!container) return;

    const now = new Date();
    const thisMonthTransactions = familyTransactions.filter(t => {
        const date = new Date(t.timestamp);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const income = thisMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = thisMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const net = income - expenses;

    container.innerHTML = `
        <div class="summary-item">
            <div class="label">INCOME</div>
            <div class="value income">${formatCurrency(income)}</div>
        </div>
        <div class="summary-item">
            <div class="label">EXPENSES</div>
            <div class="value expense">${formatCurrency(expenses)}</div>
        </div>
        <div class="summary-item">
            <div class="label">NET SAVINGS</div>
            <div class="value net">${formatCurrency(net)}</div>
        </div>
    `;
}

function updateLifetimeAnalytics() {
    const totalIncome = familyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

    const totalExpenses = familyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
    
    const totalSavings = totalIncome - totalExpenses;

    updateElement('lifetimeIncome', formatCurrency(totalIncome));
    updateElement('lifetimeExpenses', formatCurrency(totalExpenses));
    updateElement('lifetimeSavings', formatCurrency(totalSavings));
}


function renderCategoryDonutChart() {
    const container = document.getElementById('categoryDonutChartContainer');
    if (!container) return;

    const now = new Date();
    const thisMonthExpenses = familyTransactions.filter(t => {
        const date = new Date(t.timestamp);
        return t.type === 'expense' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    if (thisMonthExpenses.length === 0) {
        container.innerHTML = `<div class="empty-state" style="width: 100%;"><div class="empty-icon">📈</div><p>No expenses this month to analyze.</p></div>`;
        return;
    }

    const categoryTotals = thisMonthExpenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {});

    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    const sortedCategories = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a);
    const chartColors = ['--color-chart-1', '--color-chart-2', '--color-chart-3', '--color-chart-4', '--color-chart-5', '--color-chart-6'];
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    
    let cumulativePercentage = 0;
    const segments = sortedCategories.map(([category, amount], index) => {
        const percentage = (amount / totalExpenses);
        const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`;
        const strokeDashoffset = circumference * (1 - cumulativePercentage);
        
        const segmentHtml = `<circle class="donut-segment" cx="100" cy="100" r="${radius}" 
            stroke-dasharray="${strokeDasharray}" 
            stroke-dashoffset="${strokeDashoffset}" 
            stroke="var(${chartColors[index % chartColors.length]})"></circle>`;
        
        cumulativePercentage += percentage;
        return segmentHtml;
    }).join('');

    const legend = sortedCategories.map(([category, amount], index) => `
        <div class="legend-item">
            <div class="legend-color-box" style="background-color: var(${chartColors[index % chartColors.length]})"></div>
            <div class="legend-label">${category}</div>
            <div class="legend-value">${formatCurrency(amount)}</div>
        </div>
    `).join('');

    container.innerHTML = `
        <svg width="200" height="200" viewBox="0 0 200 200" class="donut-chart-svg">
            <circle cx="100" cy="100" r="${radius}" fill="none" stroke="var(--color-border)" stroke-width="25"></circle>
            ${segments}
        </svg>
        <div class="donut-chart-legend">
            ${legend}
        </div>`;
}


function renderCashFlowChart() {
    const container = document.getElementById('cashFlowChartContainer');
    if (!container) return;

    const dataByMonth = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthLabel = date.toLocaleString('default', { month: 'short' });
        dataByMonth[monthKey] = { income: 0, expense: 0, label: monthLabel };
    }

    familyTransactions.forEach(t => {
        const date = new Date(t.timestamp);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (dataByMonth[monthKey]) {
            if (t.type === 'income') dataByMonth[monthKey].income += t.amount;
            if (t.type === 'expense') dataByMonth[monthKey].expense += t.amount;
        }
    });

    const values = Object.values(dataByMonth);
    const maxAmount = Math.max(1, ...values.flatMap(m => [m.income, m.expense])); // Use 1 as minimum to avoid division by zero

    if (familyTransactions.length === 0) {
        container.innerHTML = `<div class="empty-state" style="width: 100%;"><div class="empty-icon">📊</div><p>Not enough data for a monthly trend.</p></div>`;
        return;
    }

    const chartHTML = values.map(month => `
        <div class="cashflow-month">
            <div class="cashflow-bars">
                <div class="cashflow-bar income" style="height: ${ (month.income / maxAmount) * 100}%" title="Income: ${formatCurrency(month.income)}"></div>
                <div class="cashflow-bar expense" style="height: ${(month.expense / maxAmount) * 100}%" title="Expense: ${formatCurrency(month.expense)}"></div>
            </div>
            <div class="cashflow-label">${month.label}</div>
        </div>
    `).join('');

    container.innerHTML = chartHTML;
}


function updateUserDisplay() {
    const userBtn = document.getElementById('userSwitchBtn');
    const userGreeting = document.getElementById('userGreeting');
    
    if (userBtn) {
        const user = USERS[currentUser];
        userBtn.textContent = `${user.icon} ${user.greeting}`;
    }
    
    if (userGreeting) {
        userGreeting.textContent = `💑 ${currentUser.toUpperCase()}'S VIEW`;
    }
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

function openTransactionModal(type = 'expense') {
    currentTransactionType = type;
    updateTransactionModalType();
    openModal('transactionModal');
    
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function openGoalModal() {
    openModal('goalModal');
    
    const dateInput = document.getElementById('targetDate');
    if (dateInput) {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        dateInput.value = nextYear.toISOString().split('T')[0];
    }
}

function openActivityModal() {
    openModal('activityModal');
}

function updateTransactionModalType() {
    const expenseBtn = document.querySelector('[data-type="expense"]');
    const incomeBtn = document.querySelector('[data-type="income"]');
    const categorySelect = document.getElementById('category');
    
    if (expenseBtn && incomeBtn) {
        expenseBtn.classList.toggle('active', currentTransactionType === 'expense');
        incomeBtn.classList.toggle('active', currentTransactionType === 'income');
    }
    
    if (categorySelect) {
        const categories = currentTransactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
        categorySelect.innerHTML = '<option value="">Select Category</option>' +
            categories.map(cat => `<option value="${cat}">${getCategoryIcon(cat)} ${cat}</option>`).join('');
    }
}

function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-screen="${screenId}"]`).classList.add('active');
}

function showTransactionDetails(transactionId) {
    const transaction = familyTransactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    const details = `
        💰 Transaction Details:
        
        Description: ${transaction.description}
        Category: ${transaction.category}
        Amount: ${formatCurrency(transaction.amount)}
        Type: ${transaction.type.toUpperCase()}
        Added by: ${transaction.addedBy}
        Date: ${new Date(transaction.timestamp).toLocaleDateString()}
    `;
    
    if (confirm(`${details}\n\n🗑️ Do you want to delete this transaction?`)) {
        deleteTransaction(transactionId);
    }
}

async function switchUser() {
    const previousUser = currentUser;
    currentUser = currentUser === 'Shreya' ? 'Karan' : 'Shreya';
    updateUserDisplay();
    await saveSettings();
    
    await logActivity(
        'user_switch',
        `Switched from ${previousUser} to ${currentUser}`,
        { previousUser, newUser: currentUser }
    );
    
    showToast(`🔄 SWITCHED TO ${currentUser.toUpperCase()}`, 'success');
}

// --- NEW --- Function to export transactions to CSV
function exportTransactionsToCsv() {
    if (familyTransactions.length === 0) {
        showToast('❌ NO TRANSACTIONS TO EXPORT', 'error');
        return;
    }

    const sanitizeCsvField = (field) => {
        const str = String(field || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type', 'Added By'];
    const csvRows = [headers.join(',')];

    const sortedTransactions = [...familyTransactions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (const t of sortedTransactions) {
        const date = new Date(t.timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD format
        const amount = t.type === 'expense' ? -t.amount : t.amount;
        const row = [
            date,
            sanitizeCsvField(t.description),
            sanitizeCsvField(t.category),
            amount,
            sanitizeCsvField(t.type),
            sanitizeCsvField(t.addedBy)
        ];
        csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `family-transactions-${today}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('✅ TRANSACTIONS EXPORTED!', 'success');
}

// Global functions for HTML onclick handlers
window.openTransactionModal = openTransactionModal;
window.openGoalModal = openGoalModal;
window.closeModal = closeModal;
window.showScreen = showScreen;
window.switchUser = switchUser;
window.showTransactionDetails = showTransactionDetails;
window.addToGoal = addToGoal;
window.deleteGoal = deleteGoal;
window.editBudgetCategory = editBudgetCategory;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Initializing Modern App');

    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const password = document.getElementById('passwordInput').value;
            const errorDiv = document.getElementById('passwordError');
            
            if (password === CORRECT_PASSWORD) {
                document.getElementById('passwordScreen').classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');
                initFirebase();
            } else {
                errorDiv.classList.remove('hidden');
                setTimeout(() => errorDiv.classList.add('hidden'), 3000);
            }
        });
    }

    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const data = {
                amount: document.getElementById('amount').value,
                category: document.getElementById('category').value,
                description: document.getElementById('description').value,
                date: document.getElementById('date').value,
                type: currentTransactionType
            };
            
            if (!data.amount || !data.category || !data.date) {
                showToast('❌ PLEASE FILL IN ALL REQUIRED FIELDS', 'error');
                return;
            }
            
            if (await addTransaction(data)) {
                e.target.reset();
                closeModal();
            }
        });
    }

    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const data = {
                name: document.getElementById('goalName').value,
                targetAmount: document.getElementById('targetAmount').value,
                targetDate: document.getElementById('targetDate').value,
                category: document.getElementById('goalCategory').value,
                currentAmount: document.getElementById('currentAmount').value || 0
            };
            
            if (!data.name || !data.targetAmount || !data.targetDate || !data.category) {
                showToast('❌ PLEASE FILL IN ALL REQUIRED FIELDS', 'error');
                return;
            }
            
            if (await addGoal(data)) {
                e.target.reset();
                closeModal();
            }
        });
    }

    const typeButtons = document.querySelectorAll('[data-type]');
    typeButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentTransactionType = this.dataset.type;
            updateTransactionModalType();
        });
    });

    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetScreen = this.dataset.screen;
            showScreen(targetScreen);
        });
    });

    const userSwitchBtn = document.getElementById('userSwitchBtn');
    if (userSwitchBtn) {
        userSwitchBtn.addEventListener('click', switchUser);
    }
    
    const activityBtn = document.getElementById('activityBtn');
    if (activityBtn) {
        activityBtn.addEventListener('click', openActivityModal);
    }

    const floatingBtn = document.getElementById('floatingAddBtn');
    if (floatingBtn) {
        floatingBtn.addEventListener('click', () => openTransactionModal('expense'));
    }

    const setBudgetBtn = document.getElementById('setBudgetBtn');
    if (setBudgetBtn) {
        setBudgetBtn.addEventListener('click', setBudgetSmart);
    }

    // --- NEW --- Event listener for the download button
    const downloadCsvBtn = document.getElementById('downloadCsvBtn');
    if (downloadCsvBtn) {
        downloadCsvBtn.addEventListener('click', exportTransactionsToCsv);
    }

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'n': e.preventDefault(); openTransactionModal('expense'); break;
                case 'i': e.preventDefault(); openTransactionModal('income'); break;
                case 'g': e.preventDefault(); openGoalModal(); break;
            }
        }
    });

    updateUserDisplay();
    console.log('✅ Modern App Initialized Successfully');
});

console.log('🚀✨ Family Finance Tracker - Modern Futuristic JavaScript Ready!');