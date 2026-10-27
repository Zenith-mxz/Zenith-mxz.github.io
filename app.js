// 个人收支管理系统 - 主应用逻辑

// ==================== 数据存储层 ====================
const Storage = {
    prefix: 'finance_',

    get(key) {
        const data = localStorage.getItem(this.prefix + key);
        return data ? JSON.parse(data) : null;
    },

    set(key, value) {
        localStorage.setItem(this.prefix + key, JSON.stringify(value));
    },

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }
};

// ==================== 密码加密 ====================
const Crypto = {
    hash(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hash_' + Math.abs(hash).toString(16);
    }
};

// ==================== 默认数据 ====================
const DEFAULT_INCOME_CATEGORIES = ['工资', '奖金', '投资收益', '兼职', '礼金', '其他'];
const DEFAULT_EXPENSE_CATEGORIES = ['餐饮', '交通', '住房', '购物', '娱乐', '医疗', '教育', '其他'];

// 默认菜单数据
const DEFAULT_MENU_ITEMS = [
    { id: 'm1', name: '宫保鸡丁', category: '热菜', price: 38, desc: '经典川菜，鸡肉鲜嫩，花生香脆', emoji: '🍗' },
    { id: 'm2', name: '麻婆豆腐', category: '热菜', price: 22, desc: '麻辣鲜香，豆腐嫩滑', emoji: '🥘' },
    { id: 'm3', name: '糖醋里脊', category: '热菜', price: 42, desc: '外酥里嫩，酸甜可口', emoji: '🍖' },
    { id: 'm4', name: '水煮鱼', category: '热菜', price: 68, desc: '鱼肉鲜嫩，麻辣过瘾', emoji: '🐟' },
    { id: 'm5', name: '回锅肉', category: '热菜', price: 36, desc: '肥而不腻，酱香浓郁', emoji: '🥓' },
    { id: 'm6', name: '拍黄瓜', category: '凉菜', price: 12, desc: '清爽解腻，蒜香开胃', emoji: '🥒' },
    { id: 'm7', name: '凉拌木耳', category: '凉菜', price: 16, desc: '脆嫩爽口，营养丰富', emoji: '🍄' },
    { id: 'm8', name: '口水鸡', category: '凉菜', price: 32, desc: '麻辣鲜香，鸡肉滑嫩', emoji: '🐔' },
    { id: 'm9', name: '白米饭', category: '主食', price: 3, desc: '香喷喷的五常大米', emoji: '🍚' },
    { id: 'm10', name: '蛋炒饭', category: '主食', price: 15, desc: '粒粒分明，蛋香四溢', emoji: '🍛' },
    { id: 'm11', name: '手工面条', category: '主食', price: 12, desc: '劲道爽滑，汤鲜味美', emoji: '🍜' },
    { id: 'm12', name: '紫菜蛋花汤', category: '汤羹', price: 10, desc: '清淡鲜美，营养丰富', emoji: '🍲' },
    { id: 'm13', name: '酸辣汤', category: '汤羹', price: 12, desc: '酸辣开胃，暖胃暖心', emoji: '🥣' },
    { id: 'm14', name: '可乐', category: '饮品', price: 8, desc: '冰爽畅饮', emoji: '🥤' },
    { id: 'm15', name: '鲜榨橙汁', category: '饮品', price: 18, desc: '100%鲜榨，维C满满', emoji: '🍊' },
    { id: 'm16', name: '绿茶', category: '饮品', price: 10, desc: '清香回甘，解腻消食', emoji: '🍵' },
    { id: 'm17', name: '芒果布丁', category: '甜点', price: 15, desc: '香甜细腻，入口即化', emoji: '🍮' },
    { id: 'm18', name: '红豆汤圆', category: '甜点', price: 12, desc: '软糯香甜，温暖人心', emoji: '🍡' }
];

const ORDER_STATUS = {
    pending: { label: '待处理', class: 'status-pending' },
    cooking: { label: '制作中', class: 'status-cooking' },
    served: { label: '已上菜', class: 'status-served' },
    completed: { label: '已完成', class: 'status-completed' },
    cancelled: { label: '已取消', class: 'status-cancelled' }
};

// ==================== 全局状态 ====================
let currentUser = null;
let currentPage = 'dashboard';
let editingRecordId = null;
let cart = [];
let currentMenuCategory = 'all';

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 检查登录状态
    const session = Storage.get('session');
    if (session && session.expires > Date.now()) {
        currentUser = session.user;
        showMainPage();
    } else {
        showLoginPage();
    }

    // 绑定事件
    bindAuthEvents();
    bindNavigationEvents();
    bindTransactionEvents();
    bindModalEvents();
    bindFilterEvents();
    bindSettingsEvents();
    bindAdviceEvents();
    bindOrderEvents();
    bindCheckoutEvents();
    bindOrderFilterEvents();

    // 启动 Firebase 订单实时监听（延迟一点确保 Firebase 已加载）
    setTimeout(() => {
        initOrdersListener();
    }, 1000);
}

// ==================== 页面切换 ====================
function showLoginPage() {
    hideAllPages();
    document.getElementById('login-page').classList.remove('hidden');
}

function showRegisterPage() {
    hideAllPages();
    document.getElementById('register-page').classList.remove('hidden');
}

function showForgotUsernamePage() {
    hideAllPages();
    document.getElementById('forgot-username-page').classList.remove('hidden');
    document.getElementById('forgot-username-form').reset();
    document.getElementById('fu-error').textContent = '';
    document.getElementById('fu-success').textContent = '';
}

function showForgotPasswordPage() {
    hideAllPages();
    document.getElementById('forgot-password-page').classList.remove('hidden');
    document.getElementById('forgot-password-form').reset();
    document.getElementById('fp-error').textContent = '';
    document.getElementById('fp-success').textContent = '';
}

function showMainPage() {
    hideAllPages();
    document.getElementById('main-page').classList.remove('hidden');
    document.getElementById('current-username').textContent = currentUser.username;
    refreshCurrentPage();
}

function hideAllPages() {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
}

function switchPage(pageName) {
    currentPage = pageName;

    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });

    // 切换内容页
    document.querySelectorAll('.content-page').forEach(page => {
        page.classList.toggle('hidden', page.id !== pageName + '-page');
    });

    refreshCurrentPage();
}

function refreshCurrentPage() {
    switch (currentPage) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'transactions':
            renderTransactions();
            break;
        case 'statistics':
            renderStatistics();
            break;
        case 'order':
            fetchMenuFromSupabase(); // 同步菜单
            renderMenuCategoryButtons();
            renderMenu();
            renderCart();
            break;
        case 'orders':
            renderOrders();
            break;
        case 'advice':
            renderAdvice();
            break;
        case 'settings':
            fetchMenuFromSupabase(); // 同步菜单
            renderSettings();
            break;
    }
}

// ==================== 认证事件 ====================
function bindAuthEvents() {
    // 登录表单
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });

    // 注册表单
    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleRegister();
    });

    // 找回用户名表单
    document.getElementById('forgot-username-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleForgotUsername();
    });

    // 重置密码表单
    document.getElementById('forgot-password-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleForgotPassword();
    });

    // 切换页面
    document.getElementById('to-register').addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterPage();
    });

    document.getElementById('to-login').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginPage();
    });

    document.getElementById('to-forgot').addEventListener('click', (e) => {
        e.preventDefault();
        showForgotPasswordPage();
    });

    document.getElementById('to-forgot-username').addEventListener('click', (e) => {
        e.preventDefault();
        showForgotUsernamePage();
    });

    document.getElementById('fu-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginPage();
    });

    document.getElementById('fp-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginPage();
    });

    // 退出登录
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    if (!username || !password) {
        errorEl.textContent = '请输入用户名和密码';
        return;
    }

    const users = Storage.get('users') || [];
    const user = users.find(u => u.username === username);

    if (!user) {
        errorEl.textContent = '用户名不存在';
        return;
    }

    if (user.passwordHash !== Crypto.hash(password)) {
        errorEl.textContent = '密码错误';
        return;
    }

    // 创建会话
    currentUser = { id: user.id, username: user.username };
    Storage.set('session', {
        user: currentUser,
        expires: Date.now() + 30 * 60 * 1000 // 30分钟过期
    });

    showMainPage();
}

function handleRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const securityQuestion = document.getElementById('reg-security-question').value;
    const securityAnswer = document.getElementById('reg-security-answer').value.trim();
    const errorEl = document.getElementById('reg-error');

    // 验证
    if (!username || !password || !confirm || !securityQuestion || !securityAnswer) {
        errorEl.textContent = '请填写所有字段';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = '密码长度不少于6位';
        return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        errorEl.textContent = '密码需包含字母和数字';
        return;
    }

    if (password !== confirm) {
        errorEl.textContent = '两次输入的密码不一致';
        return;
    }

    // 检查用户名唯一性
    const users = Storage.get('users') || [];
    if (users.some(u => u.username === username)) {
        errorEl.textContent = '用户名已被占用';
        return;
    }

    // 创建用户
    const newUser = {
        id: Date.now().toString(),
        username,
        passwordHash: Crypto.hash(password),
        securityQuestion,
        securityAnswerHash: Crypto.hash(securityAnswer.toLowerCase()),
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    Storage.set('users', users);

    // 初始化用户数据
    initUserData(newUser.id);

    // 跳转到登录页
    showLoginPage();
    document.getElementById('login-error').textContent = '注册成功，请登录';
    document.getElementById('login-error').style.color = '#27ae60';
    setTimeout(() => {
        document.getElementById('login-error').style.color = '#e74c3c';
    }, 3000);
}

function initUserData(userId) {
    const allData = Storage.get('userData') || {};
    allData[userId] = {
        transactions: [],
        incomeCategories: [...DEFAULT_INCOME_CATEGORIES],
        expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
        menuItems: [...DEFAULT_MENU_ITEMS],
        menuCategories: null,
        orders: []
    };
    Storage.set('userData', allData);
}

function handleLogout() {
    currentUser = null;
    Storage.remove('session');
    showLoginPage();
}

function handleForgotUsername() {
    const question = document.getElementById('fu-question').value;
    const answer = document.getElementById('fu-answer').value.trim();
    const errorEl = document.getElementById('fu-error');
    const successEl = document.getElementById('fu-success');

    if (!question || !answer) {
        errorEl.textContent = '请填写所有字段';
        successEl.textContent = '';
        return;
    }

    const users = Storage.get('users') || [];
    const matchedUsers = users.filter(u =>
        u.securityQuestion === question &&
        u.securityAnswerHash === Crypto.hash(answer.toLowerCase())
    );

    if (matchedUsers.length === 0) {
        errorEl.textContent = '安全问题或答案不正确';
        successEl.textContent = '';
        return;
    }

    errorEl.textContent = '';
    const usernames = matchedUsers.map(u => `"${u.username}"`).join('、');
    successEl.textContent = `找回成功！您的用户名是：${usernames}`;
}

function handleForgotPassword() {
    const username = document.getElementById('fp-username').value.trim();
    const question = document.getElementById('fp-question').value;
    const answer = document.getElementById('fp-answer').value.trim();
    const newPassword = document.getElementById('fp-new-password').value;
    const confirmPassword = document.getElementById('fp-confirm-password').value;
    const errorEl = document.getElementById('fp-error');
    const successEl = document.getElementById('fp-success');

    if (!username || !question || !answer || !newPassword || !confirmPassword) {
        errorEl.textContent = '请填写所有字段';
        successEl.textContent = '';
        return;
    }

    if (newPassword.length < 6) {
        errorEl.textContent = '新密码长度不少于6位';
        successEl.textContent = '';
        return;
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        errorEl.textContent = '新密码需包含字母和数字';
        successEl.textContent = '';
        return;
    }

    if (newPassword !== confirmPassword) {
        errorEl.textContent = '两次输入的新密码不一致';
        successEl.textContent = '';
        return;
    }

    const users = Storage.get('users') || [];
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        errorEl.textContent = '用户名不存在';
        successEl.textContent = '';
        return;
    }

    const user = users[userIndex];
    if (user.securityQuestion !== question || user.securityAnswerHash !== Crypto.hash(answer.toLowerCase())) {
        errorEl.textContent = '安全问题或答案不正确';
        successEl.textContent = '';
        return;
    }

    // 更新密码
    users[userIndex].passwordHash = Crypto.hash(newPassword);
    Storage.set('users', users);

    errorEl.textContent = '';
    successEl.textContent = '密码重置成功！请使用新密码登录。';
    document.getElementById('forgot-password-form').reset();
}

// ==================== 导航事件 ====================
function bindNavigationEvents() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            switchPage(item.dataset.page);
        });
    });
}

// ==================== 仪表盘 ====================
function renderDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = getTransactions().filter(t => {
        const date = new Date(t.date);
        return date >= startOfMonth && date <= endOfMonth;
    });

    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;
    const ratio = expense > 0 ? (income / expense).toFixed(2) : (income > 0 ? '∞' : '-');

    document.getElementById('dash-income').textContent = formatMoney(income);
    document.getElementById('dash-expense').textContent = formatMoney(expense);
    document.getElementById('dash-balance').textContent = formatMoney(balance);
    document.getElementById('dash-ratio').textContent = ratio;

    renderGaugeChart(income, expense);
    renderTrendChart();
    renderDashboardAdvice();
}

function renderGaugeChart(income, expense) {
    const chart = echarts.init(document.getElementById('gauge-chart'));
    const ratio = expense > 0 ? income / expense : (income > 0 ? 2 : 0);

    const option = {
        series: [{
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            min: 0,
            max: 2,
            splitNumber: 4,
            itemStyle: {
                color: getRatioColor(ratio)
            },
            progress: {
                show: true,
                width: 20
            },
            pointer: {
                show: true,
                length: '60%',
                width: 6
            },
            axisLine: {
                lineStyle: { width: 20 }
            },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: {
                distance: 30,
                formatter: function(value) {
                    if (value === 0) return '亏损';
                    if (value === 0.5) return '警戒';
                    if (value === 1) return '平衡';
                    if (value === 1.5) return '健康';
                    if (value === 2) return '良好';
                    return '';
                }
            },
            title: { show: false },
            detail: {
                valueAnimation: true,
                fontSize: 30,
                offsetCenter: [0, '30%'],
                formatter: function(value) {
                    return value.toFixed(2);
                }
            },
            data: [{ value: Math.min(ratio, 2) }]
        }]
    };

    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

function getRatioColor(ratio) {
    if (ratio >= 1.5) return '#27ae60';
    if (ratio >= 1.2) return '#2ecc71';
    if (ratio >= 1.0) return '#f39c12';
    if (ratio >= 0.8) return '#e67e22';
    return '#e74c3c';
}

function renderTrendChart() {
    const chart = echarts.init(document.getElementById('trend-chart'));
    const months = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth();
        months.push(`${year}-${String(month + 1).padStart(2, '0')}`);

        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);

        const transactions = getTransactions().filter(t => {
            const tDate = new Date(t.date);
            return tDate >= startOfMonth && tDate <= endOfMonth;
        });

        incomeData.push(transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0));
        expenseData.push(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));
    }

    const option = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['收入', '支出']
        },
        xAxis: {
            type: 'category',
            data: months
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: '收入',
                type: 'bar',
                data: incomeData,
                itemStyle: { color: '#27ae60' }
            },
            {
                name: '支出',
                type: 'bar',
                data: expenseData,
                itemStyle: { color: '#e74c3c' }
            }
        ]
    };

    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

// ==================== 收支记录 ====================
function bindTransactionEvents() {
    document.getElementById('add-record-btn').addEventListener('click', () => {
        openModal();
    });

    document.getElementById('record-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveRecord();
    });

    document.getElementById('record-type').addEventListener('change', updateCategoryOptions);
}

function bindModalEvents() {
    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.getElementById('record-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('record-modal')) {
            closeModal();
        }
    });
}

function openModal(recordId = null) {
    editingRecordId = recordId;
    const modal = document.getElementById('record-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('record-form');

    if (recordId) {
        title.textContent = '编辑记录';
        const record = getTransactions().find(t => t.id === recordId);
        if (record) {
            document.getElementById('record-id').value = record.id;
            document.getElementById('record-type').value = record.type;
            document.getElementById('record-amount').value = record.amount;
            document.getElementById('record-date').value = record.date;
            document.getElementById('record-note').value = record.note || '';
            updateCategoryOptions();
            document.getElementById('record-category').value = record.category;
        }
    } else {
        title.textContent = '添加记录';
        form.reset();
        document.getElementById('record-id').value = '';
        document.getElementById('record-date').value = new Date().toISOString().split('T')[0];
        updateCategoryOptions();
    }

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('record-modal').classList.add('hidden');
    editingRecordId = null;
}

function updateCategoryOptions() {
    const type = document.getElementById('record-type').value;
    const categories = type === 'income' ? getIncomeCategories() : getExpenseCategories();
    const select = document.getElementById('record-category');

    select.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function saveRecord() {
    const id = document.getElementById('record-id').value;
    const type = document.getElementById('record-type').value;
    const amount = parseFloat(document.getElementById('record-amount').value);
    const category = document.getElementById('record-category').value;
    const date = document.getElementById('record-date').value;
    const note = document.getElementById('record-note').value;

    if (!amount || amount <= 0) {
        alert('请输入有效金额');
        return;
    }

    const transactions = getTransactions();

    if (id) {
        // 编辑
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = {
                ...transactions[index],
                type,
                amount,
                category,
                date,
                note,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // 新增
        transactions.push({
            id: Date.now().toString(),
            userId: currentUser.id,
            type,
            amount,
            category,
            date,
            note,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    saveTransactions(transactions);
    closeModal();
    renderTransactions();
}

function deleteRecord(id) {
    if (!confirm('确定要删除这条记录吗？')) return;

    const transactions = getTransactions().filter(t => t.id !== id);
    saveTransactions(transactions);
    renderTransactions();
}

function renderTransactions() {
    const transactions = getFilteredTransactions();
    const tbody = document.getElementById('transactions-list');

    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div>暂无收支记录</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${t.date}</td>
            <td class="type-${t.type}">${t.type === 'income' ? '收入' : '支出'}</td>
            <td>${t.category}</td>
            <td class="amount-${t.type}">${t.type === 'income' ? '+' : '-'}${formatMoney(t.amount)}</td>
            <td>${t.note || '-'}</td>
            <td class="actions">
                <button class="btn btn-small btn-primary" onclick="openModal('${t.id}')">编辑</button>
                <button class="btn btn-small btn-danger" onclick="deleteRecord('${t.id}')">删除</button>
            </td>
        </tr>
    `).join('');
}

function bindFilterEvents() {
    ['filter-type', 'filter-period', 'filter-category'].forEach(id => {
        document.getElementById(id).addEventListener('change', renderTransactions);
    });

    document.getElementById('filter-keyword').addEventListener('input', renderTransactions);
}

function getFilteredTransactions() {
    let transactions = getTransactions();

    // 按类型筛选
    const type = document.getElementById('filter-type').value;
    if (type) {
        transactions = transactions.filter(t => t.type === type);
    }

    // 按时间筛选
    const period = document.getElementById('filter-period').value;
    const now = new Date();
    switch (period) {
        case 'month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            transactions = transactions.filter(t => new Date(t.date) >= startOfMonth);
            break;
        case '3months':
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            transactions = transactions.filter(t => new Date(t.date) >= threeMonthsAgo);
            break;
        case '6months':
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            transactions = transactions.filter(t => new Date(t.date) >= sixMonthsAgo);
            break;
    }

    // 按类别筛选
    const category = document.getElementById('filter-category').value;
    if (category) {
        transactions = transactions.filter(t => t.category === category);
    }

    // 按关键词搜索
    const keyword = document.getElementById('filter-keyword').value.trim().toLowerCase();
    if (keyword) {
        transactions = transactions.filter(t =>
            (t.note && t.note.toLowerCase().includes(keyword)) ||
            t.category.toLowerCase().includes(keyword)
        );
    }

    // 按日期倒序排列
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function updateFilterCategories() {
    const select = document.getElementById('filter-category');
    const allCategories = [...getIncomeCategories(), ...getExpenseCategories()];

    select.innerHTML = '<option value="">全部类别</option>' +
        allCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// ==================== 统计分析 ====================
function renderStatistics() {
    const period = document.getElementById('stat-period').value;
    const now = new Date();
    let startDate, endDate;

    switch (period) {
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case '3months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case '6months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
    }

    const transactions = getTransactions().filter(t => {
        const date = new Date(t.date);
        return date >= startDate && date <= endDate;
    });

    const income = transactions.filter(t => t.type === 'income');
    const expense = transactions.filter(t => t.type === 'expense');

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expense.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const ratio = totalExpense > 0 ? (totalIncome / totalExpense).toFixed(2) : (totalIncome > 0 ? '∞' : '-');

    // 计算月均
    const monthCount = Math.max(1, getMonthDiff(startDate, endDate) + 1);
    const avgIncome = totalIncome / monthCount;
    const avgExpense = totalExpense / monthCount;

    // 更新统计卡片
    document.getElementById('stat-total-income').textContent = formatMoney(totalIncome);
    document.getElementById('stat-total-expense').textContent = formatMoney(totalExpense);
    document.getElementById('stat-balance').textContent = formatMoney(balance);
    document.getElementById('stat-ratio').textContent = ratio;
    document.getElementById('stat-avg-income').textContent = formatMoney(avgIncome);
    document.getElementById('stat-avg-expense').textContent = formatMoney(avgExpense);

    // 渲染图表
    renderExpensePie(expense);
    renderIncomePie(income);
    renderMonthlyTrend(startDate, endDate);
}

function renderExpensePie(expenseTransactions) {
    const chart = echarts.init(document.getElementById('expense-pie-chart'));
    const data = getCategoryData(expenseTransactions);

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left'
        },
        series: [{
            name: '支出类别',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: {
                show: false,
                position: 'center'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 20,
                    fontWeight: 'bold'
                }
            },
            labelLine: {
                show: false
            },
            data: data
        }]
    };

    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

function renderIncomePie(incomeTransactions) {
    const chart = echarts.init(document.getElementById('income-pie-chart'));
    const data = getCategoryData(incomeTransactions);

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left'
        },
        series: [{
            name: '收入类别',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: {
                show: false,
                position: 'center'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 20,
                    fontWeight: 'bold'
                }
            },
            labelLine: {
                show: false
            },
            data: data
        }]
    };

    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

function renderMonthlyTrend(startDate, endDate) {
    const chart = echarts.init(document.getElementById('monthly-trend-chart'));
    const months = [];
    const incomeData = [];
    const expenseData = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        months.push(`${year}-${String(month + 1).padStart(2, '0')}`);

        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);

        const transactions = getTransactions().filter(t => {
            const tDate = new Date(t.date);
            return tDate >= monthStart && tDate <= monthEnd;
        });

        incomeData.push(transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0));
        expenseData.push(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));

        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const option = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['收入', '支出']
        },
        xAxis: {
            type: 'category',
            data: months
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: '收入',
                type: 'line',
                data: incomeData,
                smooth: true,
                itemStyle: { color: '#27ae60' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(39, 174, 96, 0.3)' },
                        { offset: 1, color: 'rgba(39, 174, 96, 0.05)' }
                    ])
                }
            },
            {
                name: '支出',
                type: 'line',
                data: expenseData,
                smooth: true,
                itemStyle: { color: '#e74c3c' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(231, 76, 60, 0.3)' },
                        { offset: 1, color: 'rgba(231, 76, 60, 0.05)' }
                    ])
                }
            }
        ]
    };

    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

function getCategoryData(transactions) {
    const categoryMap = {};
    transactions.forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
}

// ==================== 发展建议 ====================
function renderAdvice() {
    const advice = generateAdvice();
    const container = document.getElementById('all-advice');

    if (advice.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💡</div>
                <div>暂无建议，请添加更多收支记录</div>
            </div>
        `;
        return;
    }

    container.innerHTML = advice.map(item => `
        <div class="advice-item ${item.level}">
            <div class="advice-title">${item.title}</div>
            <div class="advice-desc">${item.description}</div>
            <div class="advice-data">${item.data}</div>
        </div>
    `).join('');
}

function renderDashboardAdvice() {
    const advice = generateAdvice().slice(0, 3);
    const container = document.getElementById('dash-advice');

    if (advice.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无建议</div>';
        return;
    }

    container.innerHTML = advice.map(item => `
        <div class="advice-item ${item.level}">
            <div class="advice-title">${item.title}</div>
            <div class="advice-desc">${item.description}</div>
            <div class="advice-data">${item.data}</div>
        </div>
    `).join('');
}

function generateAdvice() {
    const advice = [];
    const now = new Date();
    const transactions = getTransactions();

    // 获取最近6个月的数据
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= sixMonthsAgo);

    // 计算月度数据
    const monthlyData = {};
    for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[key] = { income: 0, expense: 0 };
    }

    recentTransactions.forEach(t => {
        const date = new Date(t.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
            if (t.type === 'income') {
                monthlyData[key].income += t.amount;
            } else {
                monthlyData[key].expense += t.amount;
            }
        }
    });

    const months = Object.keys(monthlyData).sort();
    const currentMonth = months[months.length - 1];
    const currentData = monthlyData[currentMonth] || { income: 0, expense: 0 };

    // A. 预算建议
    const ratio = currentData.expense > 0 ? currentData.income / currentData.expense : 0;
    if (ratio < 1.0 && currentData.expense > 0) {
        advice.push({
            level: 'warning',
            title: '预算建议：当前处于亏损状态',
            description: '您的支出超过收入，建议削减非必要开支，制定合理的消费计划。',
            data: `本月盈亏比：${ratio.toFixed(2)}，支出 ¥${formatMoney(currentData.expense)}，收入 ¥${formatMoney(currentData.income)}`
        });
    }

    // 检查某类别支出占比
    const expenseByCategory = {};
    recentTransactions.filter(t => t.type === 'expense').forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

    const totalExpense = Object.values(expenseByCategory).reduce((sum, v) => sum + v, 0);
    Object.entries(expenseByCategory).forEach(([category, amount]) => {
        if (totalExpense > 0 && amount / totalExpense > 0.4) {
            advice.push({
                level: 'caution',
                title: `预算建议：${category}支出占比过高`,
                description: `您的${category}支出占总支出的${((amount / totalExpense) * 100).toFixed(1)}%，建议合理控制该类支出。`,
                data: `${category}支出：¥${formatMoney(amount)}，总支出：¥${formatMoney(totalExpense)}`
            });
        }
    });

    // B. 储蓄建议
    const savingsRate = currentData.income > 0 ? (currentData.income - currentData.expense) / currentData.income : 0;
    if (savingsRate < 0.1 && currentData.income > 0) {
        advice.push({
            level: 'caution',
            title: '储蓄建议：储蓄率偏低',
            description: '您的储蓄率低于10%，建议遵循"先储蓄后消费"原则，每月至少储蓄收入的20%。',
            data: `当前储蓄率：${(savingsRate * 100).toFixed(1)}%`
        });
    }

    if (savingsRate > 0.3) {
        advice.push({
            level: 'success',
            title: '储蓄建议：储蓄状况良好',
            description: '您的储蓄率超过30%，建议将部分盈余投入储蓄或理财产品，实现财富增值。',
            data: `当前储蓄率：${(savingsRate * 100).toFixed(1)}%`
        });
    }

    // C. 消费结构建议
    const entertainmentAmount = expenseByCategory['娱乐'] || 0;
    if (totalExpense > 0 && entertainmentAmount / totalExpense > 0.2) {
        advice.push({
            level: 'caution',
            title: '消费结构建议：娱乐消费占比偏高',
            description: '娱乐消费占总支出的20%以上，建议适当控制娱乐开支，避免过度消费。',
            data: `娱乐支出：¥${formatMoney(entertainmentAmount)}，占比：${((entertainmentAmount / totalExpense) * 100).toFixed(1)}%`
        });
    }

    // D. 收入增长建议
    const incomeSources = new Set(recentTransactions.filter(t => t.type === 'income').map(t => t.category));
    if (incomeSources.size === 1 && incomeSources.has('工资')) {
        advice.push({
            level: 'caution',
            title: '收入增长建议：收入来源单一',
            description: '您的收入来源仅有工资，建议拓展收入渠道，如兼职、投资等，增加收入多样性。',
            data: '收入来源：仅工资'
        });
    }

    // E. 投资与理财建议
    const monthlySurplus = currentData.income - currentData.expense;
    if (monthlySurplus > 5000) {
        advice.push({
            level: 'success',
            title: '投资理财建议：可考虑配置投资产品',
            description: '您的月盈余超过5000元，建议配置部分资金到基金、股票等投资产品，实现资产增值。',
            data: `月盈余：¥${formatMoney(monthlySurplus)}`
        });
    }

    const hasInvestmentIncome = recentTransactions.some(t => t.type === 'income' && t.category === '投资收益');
    if (!hasInvestmentIncome && currentData.income > 0) {
        advice.push({
            level: 'caution',
            title: '投资理财建议：开始学习理财',
            description: '您暂无投资收益，建议学习基础理财知识，从小额投资开始尝试，培养理财习惯。',
            data: '无投资收益记录'
        });
    }

    // 按重要程度排序
    const levelOrder = { warning: 0, caution: 1, success: 2 };
    return advice.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
}

function bindAdviceEvents() {
    document.getElementById('stat-period').addEventListener('change', renderStatistics);
}

// ==================== 设置 ====================
function renderSettings() {
    renderCategoryLists();
    renderMenuCategoryLists();
    renderDishList();
    updateDishCategorySelect();
}

function renderCategoryLists() {
    const incomeList = document.getElementById('income-categories-list');
    const expenseList = document.getElementById('expense-categories-list');

    incomeList.innerHTML = getIncomeCategories().map(cat => `
        <li>
            <span>${cat}</span>
            <button onclick="removeCategory('income', '${cat}')">删除</button>
        </li>
    `).join('');

    expenseList.innerHTML = getExpenseCategories().map(cat => `
        <li>
            <span>${cat}</span>
            <button onclick="removeCategory('expense', '${cat}')">删除</button>
        </li>
    `).join('');
}

function bindSettingsEvents() {
    document.getElementById('change-password-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleChangePassword();
    });

    document.getElementById('add-income-category').addEventListener('click', () => {
        addCategory('income');
    });

    document.getElementById('add-expense-category').addEventListener('click', () => {
        addCategory('expense');
    });

    document.getElementById('add-menu-category').addEventListener('click', () => {
        addMenuCategory();
    });

    document.getElementById('add-dish-btn').addEventListener('click', () => {
        addDish();
    });

    // 强制同步菜单按钮
    const syncBtn = document.getElementById('sync-menu-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            syncBtn.disabled = true;
            syncBtn.textContent = '🔄 正在同步...';
            
            try {
                await fetchMenuFromSupabase();
                alert('菜单同步成功！');
            } catch (err) {
                console.error('同步失败:', err);
                alert('同步失败，请检查网络连接');
            } finally {
                syncBtn.disabled = false;
                syncBtn.textContent = '🔄 强制同步菜单（从云端获取最新菜单）';
            }
        });
    }

    // 批量删除按钮
    const batchDeleteBtn = document.getElementById('batch-delete-btn');
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', batchDeleteDishes);
    }

    // 全选复选框
    const selectAllCheckbox = document.getElementById('select-all-dishes');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.dish-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateBatchDeleteButton();
        });
    }

    // 表头全选复选框
    const selectAllHeader = document.getElementById('select-all-header');
    if (selectAllHeader) {
        selectAllHeader.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.dish-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateBatchDeleteButton();
        });
    }

    // 监听菜品列表中的复选框变化（使用事件委托）
    const dishList = document.getElementById('dish-list');
    if (dishList) {
        dishList.addEventListener('change', (e) => {
            if (e.target.classList.contains('dish-checkbox')) {
                updateBatchDeleteButton();
            }
        });
    }
}

function handleChangePassword() {
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    const errorEl = document.getElementById('pwd-error');

    if (!oldPassword || !newPassword || !confirmPassword) {
        errorEl.textContent = '请填写所有字段';
        return;
    }

    if (newPassword.length < 6) {
        errorEl.textContent = '新密码长度不少于6位';
        return;
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        errorEl.textContent = '新密码需包含字母和数字';
        return;
    }

    if (newPassword !== confirmPassword) {
        errorEl.textContent = '两次输入的新密码不一致';
        return;
    }

    const users = Storage.get('users') || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex === -1) {
        errorEl.textContent = '用户不存在';
        return;
    }

    if (users[userIndex].passwordHash !== Crypto.hash(oldPassword)) {
        errorEl.textContent = '原密码错误';
        return;
    }

    users[userIndex].passwordHash = Crypto.hash(newPassword);
    Storage.set('users', users);

    document.getElementById('change-password-form').reset();
    errorEl.textContent = '密码修改成功';
    errorEl.style.color = '#27ae60';

    setTimeout(() => {
        errorEl.textContent = '';
        errorEl.style.color = '#e74c3c';
    }, 3000);
}

function addCategory(type) {
    const inputId = type === 'income' ? 'new-income-category' : 'new-expense-category';
    const input = document.getElementById(inputId);
    const category = input.value.trim();

    if (!category) {
        alert('请输入类别名称');
        return;
    }

    const categories = type === 'income' ? getIncomeCategories() : getExpenseCategories();
    if (categories.includes(category)) {
        alert('该类别已存在');
        return;
    }

    categories.push(category);
    saveCategories(type, categories);
    input.value = '';
    renderCategoryLists();
    updateFilterCategories();
}

function removeCategory(type, category) {
    if (!confirm(`确定要删除类别"${category}"吗？`)) return;

    const categories = (type === 'income' ? getIncomeCategories() : getExpenseCategories())
        .filter(c => c !== category);

    saveCategories(type, categories);
    renderCategoryLists();
    updateFilterCategories();
}

function renderMenuCategoryLists() {
    const categories = getMenuCategories();
    const list = document.getElementById('menu-categories-list');
    const stats = document.getElementById('menu-category-stats');
    const items = getMenuItems();

    list.innerHTML = categories.map(cat => `
        <li>
            <span>${cat}</span>
            <button onclick="removeMenuCategory('${cat}')">删除</button>
        </li>
    `).join('');

    stats.innerHTML = categories.map(cat => {
        const count = items.filter(i => i.category === cat).length;
        return `<li><span>${cat}</span><span>${count} 道菜</span></li>`;
    }).join('');
}

function addMenuCategory() {
    const input = document.getElementById('new-menu-category');
    const category = input.value.trim();

    if (!category) {
        alert('请输入分类名称');
        return;
    }

    const categories = getMenuCategories();
    if (categories.includes(category)) {
        alert('该分类已存在');
        return;
    }

    categories.push(category);
    saveMenuCategories(categories);
    input.value = '';
    renderMenuCategoryLists();
    renderMenuCategoryButtons();
}

function removeMenuCategory(category) {
    const items = getMenuItems().filter(i => i.category === category);
    let confirmMsg = `确定要删除分类"${category}"吗？`;
    if (items.length > 0) {
        confirmMsg += `\n该分类下有 ${items.length} 道菜品，删除后这些菜品将变为"未分类"。`;
    }
    if (!confirm(confirmMsg)) return;

    const categories = getMenuCategories().filter(c => c !== category);
    saveMenuCategories(categories);

    const menuItems = getMenuItems();
    menuItems.forEach(item => {
        if (item.category === category) {
            item.category = '未分类';
        }
    });
    saveMenuItems(menuItems);

    renderMenuCategoryLists();
    renderMenuCategoryButtons();
    renderDishList();
    updateDishCategorySelect();
}

// ==================== 菜品管理 ====================
function updateDishCategorySelect() {
    const select = document.getElementById('new-dish-category');
    const categories = getMenuCategories();
    select.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function addDish() {
    const nameInput = document.getElementById('new-dish-name');
    const priceInput = document.getElementById('new-dish-price');
    const categorySelect = document.getElementById('new-dish-category');
    const descInput = document.getElementById('new-dish-desc');
    const emojiInput = document.getElementById('new-dish-emoji');

    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const category = categorySelect.value;
    const desc = descInput.value.trim();
    const emoji = emojiInput.value.trim() || '🍽️';

    if (!name) {
        alert('请输入菜品名称');
        return;
    }
    if (isNaN(price) || price < 0) {
        alert('请输入有效的价格');
        return;
    }
    if (!category) {
        alert('请选择菜品分类');
        return;
    }

    const menuItems = getMenuItems();
    if (menuItems.some(item => item.name === name)) {
        alert('该菜品已存在');
        return;
    }

    menuItems.push({
        id: 'm' + Date.now().toString(),
        name,
        category,
        price,
        desc: desc || '暂无描述',
        emoji
    });

    saveMenuItems(menuItems);

    nameInput.value = '';
    priceInput.value = '';
    descInput.value = '';
    emojiInput.value = '';

    renderDishList();
    renderMenuCategoryLists();
    alert('菜品添加成功！');
}

function renderDishList() {
    const tbody = document.getElementById('dish-list');
    const items = getMenuItems();

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-state-icon">🍽️</div>
                    <div>暂无菜品</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr data-dish-id="${item.id}">
            <td><input type="checkbox" class="dish-checkbox" value="${item.id}"></td>
            <td>${item.emoji}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td class="dish-price-cell">
                <span class="dish-price-display">¥${item.price.toFixed(2)}</span>
                <input type="number" class="dish-price-input hidden" value="${item.price}" min="0" step="0.01">
            </td>
            <td>${item.desc}</td>
            <td class="actions">
                <button class="btn btn-small btn-primary" onclick="editDishPrice('${item.id}')">修改价格</button>
                <button class="btn btn-small btn-danger" onclick="deleteDish('${item.id}')">删除</button>
            </td>
        </tr>
    `).join('');
}

function editDishPrice(dishId) {
    const row = document.querySelector(`tr[data-dish-id="${dishId}"]`);
    if (!row) return;

    const displayEl = row.querySelector('.dish-price-display');
    const inputEl = row.querySelector('.dish-price-input');
    const btn = row.querySelector('.btn-primary');

    if (inputEl.classList.contains('hidden')) {
        // 进入编辑模式
        displayEl.classList.add('hidden');
        inputEl.classList.remove('hidden');
        inputEl.focus();
        inputEl.select();
        btn.textContent = '保存';
    } else {
        // 保存价格
        const newPrice = parseFloat(inputEl.value);
        if (isNaN(newPrice) || newPrice < 0) {
            alert('请输入有效的价格');
            return;
        }

        const menuItems = getMenuItems();
        const item = menuItems.find(i => i.id === dishId);
        if (item) {
            item.price = newPrice;
            saveMenuItems(menuItems);

            displayEl.textContent = '¥' + newPrice.toFixed(2);
            displayEl.classList.remove('hidden');
            inputEl.classList.add('hidden');
            btn.textContent = '修改价格';

            // 如果当前在点餐页面，刷新菜单显示
            if (currentPage === 'order') {
                renderMenu();
            }
        }
    }
}

function deleteDish(dishId) {
    const menuItems = getMenuItems();
    const item = menuItems.find(i => i.id === dishId);
    if (!item) return;

    if (!confirm(`确定要删除菜品"${item.name}"吗？`)) return;

    const newItems = menuItems.filter(i => i.id !== dishId);
    saveMenuItems(newItems);

    // 从购物车中移除
    const cartIdx = cart.findIndex(c => c.id === dishId);
    if (cartIdx !== -1) {
        cart.splice(cartIdx, 1);
        if (currentPage === 'order') {
            renderCart();
            renderMenu();
        }
    }

    renderDishList();
    renderMenuCategoryLists();
}

// 批量删除菜品
function batchDeleteDishes() {
    const checkboxes = document.querySelectorAll('.dish-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);
    
    console.log('批量删除菜品，选中IDs:', selectedIds);
    
    if (selectedIds.length === 0) {
        alert('请先选择要删除的菜品');
        return;
    }

    if (!confirm(`确定要删除选中的 ${selectedIds.length} 个菜品吗？`)) return;

    const menuItems = getMenuItems();
    console.log('删除前菜单数量:', menuItems.length);
    
    const newItems = menuItems.filter(i => !selectedIds.includes(i.id));
    console.log('删除后菜单数量:', newItems.length);
    
    // 从购物车中移除已删除的菜品
    selectedIds.forEach(dishId => {
        const cartIdx = cart.findIndex(c => c.id === dishId);
        if (cartIdx !== -1) {
            cart.splice(cartIdx, 1);
        }
    });

    saveMenuItems(newItems);
    renderDishList();
    renderMenuCategoryLists();
    
    if (currentPage === 'order') {
        renderCart();
        renderMenu();
    }
    
    // 重置批量删除按钮状态
    const batchDeleteBtn = document.getElementById('batch-delete-btn');
    if (batchDeleteBtn) {
        batchDeleteBtn.disabled = true;
    }
    
    alert(`成功删除 ${selectedIds.length} 个菜品！`);
}

// 更新批量删除按钮状态
function updateBatchDeleteButton() {
    const checkboxes = document.querySelectorAll('.dish-checkbox:checked');
    const batchDeleteBtn = document.getElementById('batch-delete-btn');
    if (batchDeleteBtn) {
        batchDeleteBtn.disabled = checkboxes.length === 0;
        batchDeleteBtn.textContent = checkboxes.length > 0 ? `批量删除 (${checkboxes.length})` : '批量删除';
    }
}

// ==================== 数据操作 ====================
function getTransactions() {
    const userData = Storage.get('userData') || {};
    return userData[currentUser.id]?.transactions || [];
}

function saveTransactions(transactions) {
    const userData = Storage.get('userData') || {};
    if (!userData[currentUser.id]) {
        userData[currentUser.id] = { transactions: [], incomeCategories: [...DEFAULT_INCOME_CATEGORIES], expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES] };
    }
    userData[currentUser.id].transactions = transactions;
    Storage.set('userData', userData);
}

function getIncomeCategories() {
    const userData = Storage.get('userData') || {};
    return userData[currentUser.id]?.incomeCategories || [...DEFAULT_INCOME_CATEGORIES];
}

function getExpenseCategories() {
    const userData = Storage.get('userData') || {};
    return userData[currentUser.id]?.expenseCategories || [...DEFAULT_EXPENSE_CATEGORIES];
}

function saveCategories(type, categories) {
    const userData = Storage.get('userData') || {};
    if (!userData[currentUser.id]) {
        userData[currentUser.id] = { transactions: [], incomeCategories: [...DEFAULT_INCOME_CATEGORIES], expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES] };
    }

    if (type === 'income') {
        userData[currentUser.id].incomeCategories = categories;
    } else {
        userData[currentUser.id].expenseCategories = categories;
    }

    Storage.set('userData', userData);
}

// ==================== 工具函数 ====================
function formatMoney(amount) {
    return '¥' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getMonthDiff(startDate, endDate) {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
}

// ==================== 在线点餐 ====================
function getMenuItems() {
    const userData = Storage.get('userData') || {};
    return userData[currentUser.id]?.menuItems || [...DEFAULT_MENU_ITEMS];
}

function saveMenuItems(menuItems) {
    const userData = Storage.get('userData') || {};
    if (!userData[currentUser.id]) {
        userData[currentUser.id] = {
            transactions: [],
            incomeCategories: [...DEFAULT_INCOME_CATEGORIES],
            expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
            menuItems: [...DEFAULT_MENU_ITEMS],
            orders: []
        };
    }
    userData[currentUser.id].menuItems = menuItems;
    Storage.set('userData', userData);

    // 同步到 Supabase
    pushMenuToSupabase(menuItems);
}

function getMenuCategories() {
    const userData = Storage.get('userData') || {};
    const stored = userData[currentUser.id]?.menuCategories;
    if (stored) return stored;
    const items = userData[currentUser.id]?.menuItems || [...DEFAULT_MENU_ITEMS];
    return [...new Set(items.map(i => i.category))];
}

function saveMenuCategories(categories) {
    const userData = Storage.get('userData') || {};
    if (!userData[currentUser.id]) {
        userData[currentUser.id] = {
            transactions: [],
            incomeCategories: [...DEFAULT_INCOME_CATEGORIES],
            expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
            menuItems: [...DEFAULT_MENU_ITEMS],
            orders: []
        };
    }
    userData[currentUser.id].menuCategories = categories;
    Storage.set('userData', userData);
}

// ==================== Supabase 订单同步 ====================
let ordersRealtimeChannel = null;
let cachedOrders = [];

function getOrders() {
    return cachedOrders;
}

function saveOrders(orders) {
    cachedOrders = orders;
}

// Supabase REST API 直接调用（绕过浏览器跟踪防护）
const SUPABASE_URL = 'https://zxqnvifblavwzprwrmss.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4cW52aWZibGF2d3pwcndybXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1Nzc2MzEsImV4cCI6MjEwODE1MzYzMX0.MH6qdIYUvuWDgSEpGLET6uCVk65oxXTknTzyzx6Qjkc';

async function supabaseFetch(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    
    // 根据请求类型设置不同的默认 Prefer
    let defaultPrefer = 'return=representation, resolution=merge-duplicates';
    if (options.method === 'DELETE') {
        defaultPrefer = 'return=minimal';
    }
    
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': defaultPrefer,
        ...options.headers
    };

    try {
        console.log('Supabase API 请求:', options.method || 'GET', url);
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supabase API 错误:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // DELETE 请求可能没有返回内容
        if (options.method === 'DELETE') {
            return { data: null, error: null };
        }

        const data = await response.json();
        return { data, error: null };
    } catch (err) {
        console.error('Supabase API 调用失败:', err);
        return { data: null, error: err };
    }
}

// ==================== 菜单同步到 Supabase ====================
async function fetchMenuFromSupabase() {
    console.log('正在从 Supabase 获取菜单...');

    try {
        const { data, error } = await supabaseFetch('menu_items?select=*');

        if (error) {
            console.error('获取菜单失败:', error);
            return;
        }

        console.log('获取到菜单数据:', data);

        if (data && data.length > 0) {
            // 将 Supabase 数据格式转换为应用内部格式
            const menuItems = data.map(row => ({
                id: row.item_id,
                name: row.name,
                category: row.category,
                price: row.price,
                desc: row.description || '',
                emoji: row.emoji || '🍽️'
            }));

            // 保存到本地
            const userData = Storage.get('userData') || {};
            if (!userData[currentUser.id]) {
                userData[currentUser.id] = {
                    transactions: [],
                    incomeCategories: [...DEFAULT_INCOME_CATEGORIES],
                    expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
                    menuItems: [...DEFAULT_MENU_ITEMS],
                    orders: []
                };
            }
            userData[currentUser.id].menuItems = menuItems;
            Storage.set('userData', userData);

            console.log('菜单已同步到本地，共', menuItems.length, '条');
        } else {
            console.log('云端菜单为空');
            // 如果云端为空，也清空本地菜单
            const userData = Storage.get('userData') || {};
            if (userData[currentUser.id]) {
                userData[currentUser.id].menuItems = [];
                Storage.set('userData', userData);
            }
        }

        // 刷新页面显示
        if (currentPage === 'order') {
            renderMenu();
        } else if (currentPage === 'settings') {
            renderDishList();
            renderMenuCategoryLists();
        }
    } catch (err) {
        console.error('获取菜单异常:', err);
    }
}

async function pushMenuToSupabase(menuItems) {
    console.log('正在推送菜单到 Supabase...');

    try {
        // 先删除所有现有菜单项
        console.log('删除旧菜单数据...');
        
        // 获取所有现有菜单项
        const { data: existingData, error: fetchError } = await supabaseFetch('menu_items?select=id');
        
        if (fetchError) {
            console.error('获取现有菜单失败:', fetchError);
        } else {
            console.log('现有菜单数据:', existingData);
            
            if (existingData && existingData.length > 0) {
                console.log('删除旧菜单数据，共', existingData.length, '条');
                
                // 逐个删除现有菜单项
                for (const item of existingData) {
                    console.log('删除菜单项:', item.id);
                    try {
                        const deleteResult = await supabaseFetch(`menu_items?id=eq.${item.id}`, {
                            method: 'DELETE'
                        });
                        console.log('删除结果:', deleteResult);
                        
                        if (deleteResult.error) {
                            console.error('删除失败:', deleteResult.error);
                        }
                    } catch (deleteErr) {
                        console.error('删除异常:', deleteErr);
                    }
                }
                
                // 验证删除结果
                const { data: verifyData } = await supabaseFetch('menu_items?select=id');
                console.log('删除后剩余数据:', verifyData ? verifyData.length : 0);
            }
        }

        // 如果没有菜单项，直接返回成功
        if (!menuItems || menuItems.length === 0) {
            console.log('菜单为空，无需推送');
            return true;
        }

        // 插入新菜单项
        const insertData = menuItems.map(item => ({
            item_id: item.id,
            name: item.name,
            category: item.category,
            price: item.price,
            description: item.desc || '',
            emoji: item.emoji || '🍽️'
        }));

        console.log('插入新菜单数据:', insertData);

        const { data, error } = await supabaseFetch('menu_items', {
            method: 'POST',
            body: JSON.stringify(insertData)
        });

        if (error) {
            console.error('保存菜单到 Supabase 失败:', error);
            return false;
        }

        console.log('菜单推送成功:', data);
        return true;
    } catch (err) {
        console.error('同步菜单到 Supabase 异常:', err);
        return false;
    }
}

async function fetchOrdersFromSupabase() {
    console.log('正在从 Supabase 获取订单...');

    try {
        const { data, error } = await supabaseFetch('orders?select=*&order=created_at.desc');

        if (error) {
            console.error('获取订单失败:', error);
            return;
        }

        console.log('获取到订单数据:', data);

        // 将 Supabase 数据格式转换为应用内部格式
        cachedOrders = (data || []).map(row => {
            let items = row.items || [];
            // 如果 items 是字符串（JSON），解析它
            if (typeof items === 'string') {
                try {
                    items = JSON.parse(items);
                } catch (e) {
                    items = [];
                }
            }
            return {
                id: row.order_id,
                supabaseId: row.id,
                userId: row.user_id,
                table: row.table_num,
                customerName: row.customer_name,
                phone: row.phone,
                note: row.note || '',
                items: items,
                totalPrice: row.total_price,
                status: row.status,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
        });

        console.log('转换后的订单:', cachedOrders);

        if (currentPage === 'orders') {
            renderOrders();
        }
    } catch (err) {
        console.error('获取订单异常:', err);
    }
}

function initOrdersListener() {
    console.log('初始化订单监听器...');
    // 先获取一次数据
    fetchOrdersFromSupabase();

    // 每 10 秒轮询一次（实时性要求不高的话）
    setInterval(() => {
        if (currentPage === 'orders') {
            fetchOrdersFromSupabase();
        }
    }, 10000);
}

async function pushOrderToSupabase(order) {
    console.log('正在推送订单到 Supabase...');

    try {
        const insertData = {
            order_id: order.id,
            user_id: order.userId || 'guest',
            table_num: order.table,
            customer_name: order.customerName,
            phone: order.phone,
            note: order.note || '',
            items: JSON.stringify(order.items || []),
            total_price: order.totalPrice || 0,
            status: order.status || 'pending',
            created_at: order.createdAt || new Date().toISOString(),
            updated_at: order.updatedAt || new Date().toISOString()
        };

        console.log('推送数据:', insertData);

        const { data, error } = await supabaseFetch('orders', {
            method: 'POST',
            body: JSON.stringify(insertData)
        });

        if (error) {
            console.error('保存订单到 Supabase 失败:', error);
            alert('订单同步失败: ' + error.message);
            return false;
        }

        console.log('订单推送成功:', data);

        // 保存 supabase 返回的 id 用于后续更新/删除
        if (data && data[0]) {
            order.supabaseId = data[0].id;
        }
        return true;
    } catch (err) {
        console.error('同步订单到 Supabase 异常:', err);
        alert('订单同步异常: ' + err.message);
        return false;
    }
}

async function updateOrderInSupabase(orderId, updates) {
    try {
        const order = cachedOrders.find(o => o.id === orderId);
        if (!order) return false;

        const dbUpdates = {};
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt;

        const { error } = await supabaseFetch(`orders?id=eq.${order.supabaseId || orderId}`, {
            method: 'PATCH',
            body: JSON.stringify(dbUpdates)
        });

        if (error) {
            console.error('更新 Supabase 订单失败:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('更新 Supabase 订单异常:', err);
        return false;
    }
}

async function deleteOrderFromSupabase(orderId) {
    try {
        const order = cachedOrders.find(o => o.id === orderId);
        if (!order) return false;

        const { error } = await supabaseFetch(`orders?id=eq.${order.supabaseId || orderId}`, {
            method: 'DELETE'
        });

        if (error) {
            console.error('删除 Supabase 订单失败:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('删除 Supabase 订单异常:', err);
        return false;
    }
}

function renderMenuCategoryButtons() {
    const container = document.getElementById('menu-categories');
    if (!container) return;

    const categories = getMenuCategories();
    const buttonsHtml = `<button class="menu-cat-btn ${currentMenuCategory === 'all' ? 'active' : ''}" data-cat="all">全部</button>` +
        categories.map(cat => `<button class="menu-cat-btn ${currentMenuCategory === cat ? 'active' : ''}" data-cat="${cat}">${cat}</button>`).join('');

    container.innerHTML = buttonsHtml;

    container.querySelectorAll('.menu-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.menu-cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMenuCategory = btn.dataset.cat;
            renderMenu();
        });
    });
}

function renderMenu() {
    const items = getMenuItems();
    const grid = document.getElementById('menu-grid');

    const filtered = currentMenuCategory === 'all'
        ? items
        : items.filter(item => item.category === currentMenuCategory);

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><div class="empty-state-icon">🍽️</div><div>暂无菜品</div></div>';
        return;
    }

    grid.innerHTML = filtered.map(item => {
        const inCart = cart.find(c => c.id === item.id);
        return `
            <div class="menu-item">
                <div class="menu-item-img">${item.emoji}</div>
                <div class="menu-item-info">
                    <div class="menu-item-name">${item.name}</div>
                    <div class="menu-item-desc">${item.desc}</div>
                    <div class="menu-item-bottom">
                        <div class="menu-item-price">¥${item.price}</div>
                        ${inCart
                            ? `<div class="cart-item-qty">
                                <button onclick="updateCartQty('${item.id}', -1)">−</button>
                                <span>${inCart.qty}</span>
                                <button onclick="updateCartQty('${item.id}', 1)">+</button>
                            </div>`
                            : `<button class="menu-item-add" onclick="addToCart('${item.id}')">+</button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addToCart(itemId) {
    const items = getMenuItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const existing = cart.find(c => c.id === itemId);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
    }

    renderMenu();
    renderCart();
}

function updateCartQty(itemId, delta) {
    const idx = cart.findIndex(c => c.id === itemId);
    if (idx === -1) return;

    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) {
        cart.splice(idx, 1);
    }

    renderMenu();
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total-price');

    const totalQty = cart.reduce((sum, c) => sum + c.qty, 0);
    const totalPrice = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

    countEl.textContent = `${totalQty} 件`;
    totalEl.textContent = formatMoney(totalPrice);

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding: 30px 10px;"><div class="empty-state-icon" style="font-size: 32px;">🛒</div><div style="font-size: 13px;">购物车是空的</div></div>';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">¥${item.price}</div>
            </div>
            <div class="cart-item-qty">
                <button onclick="updateCartQty('${item.id}', -1)">−</button>
                <span>${item.qty}</span>
                <button onclick="updateCartQty('${item.id}', 1)">+</button>
            </div>
        </div>
    `).join('');
}

function bindOrderEvents() {
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (cart.length === 0) {
            alert('请先选择菜品');
            return;
        }
        openCheckoutModal();
    });
}

function openCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const itemsContainer = document.getElementById('checkout-items');
    const totalEl = document.getElementById('checkout-total-price');

    const totalPrice = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

    itemsContainer.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.name} x${item.qty}</span>
            <span>¥${(item.price * item.qty).toFixed(2)}</span>
        </div>
    `).join('');

    totalEl.textContent = formatMoney(totalPrice);
    modal.classList.remove('hidden');
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.add('hidden');
    document.getElementById('checkout-form').reset();
}

function bindCheckoutEvents() {
    document.querySelectorAll('#checkout-modal .modal-close, #checkout-modal .modal-close-btn').forEach(btn => {
        btn.addEventListener('click', closeCheckoutModal);
    });

    document.getElementById('checkout-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('checkout-modal')) {
            closeCheckoutModal();
        }
    });

    document.getElementById('checkout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitOrder();
    });
}

async function submitOrder() {
    const table = document.getElementById('co-table').value.trim();
    const name = document.getElementById('co-name').value.trim();
    const phone = document.getElementById('co-phone').value.trim();
    const note = document.getElementById('co-note').value.trim();

    if (!table || !name || !phone) {
        alert('请填写必填项');
        return;
    }

    const totalPrice = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    const order = {
        id: 'ORD' + Date.now().toString(36).toUpperCase(),
        userId: currentUser ? currentUser.id : 'guest',
        table,
        customerName: name,
        phone,
        note,
        items: [...cart],
        totalPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // 推送到 Supabase
    const pushed = await pushOrderToSupabase(order);

    // 同时保存到本地作为备份
    const localOrders = Storage.get('userData')?.[currentUser?.id]?.orders || [];
    localOrders.unshift(order);
    const userData = Storage.get('userData') || {};
    if (!userData[currentUser?.id]) {
        userData[currentUser.id] = { orders: [] };
    }
    userData[currentUser.id].orders = localOrders;
    Storage.set('userData', userData);

    cart = [];
    closeCheckoutModal();
    renderMenu();
    renderCart();

    alert(`订单提交成功！\n订单号：${order.id}\n金额：${formatMoney(totalPrice)}${pushed ? '\n（已同步到云端）' : ''}`);

    if (currentPage === 'orders') {
        renderOrders();
    }
}

// ==================== 订单管理 ====================
function renderOrders() {
    let orders = getOrders();

    const statusFilter = document.getElementById('order-filter-status').value;
    const dateFilter = document.getElementById('order-filter-date').value;
    const keywordFilter = document.getElementById('order-filter-keyword').value.trim().toLowerCase();

    if (statusFilter) {
        orders = orders.filter(o => o.status === statusFilter);
    }
    if (dateFilter) {
        orders = orders.filter(o => o.createdAt.startsWith(dateFilter));
    }
    if (keywordFilter) {
        orders = orders.filter(o =>
            o.id.toLowerCase().includes(keywordFilter) ||
            o.table.toLowerCase().includes(keywordFilter) ||
            o.customerName.toLowerCase().includes(keywordFilter) ||
            o.phone.includes(keywordFilter)
        );
    }

    const container = document.getElementById('orders-list');

    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div>暂无订单</div>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => {
        const status = ORDER_STATUS[order.status];
        return `
            <div class="order-card">
                <div class="order-card-header">
                    <span class="order-card-id">${order.id}</span>
                    <span class="order-card-status ${status.class}">${status.label}</span>
                </div>
                <div class="order-card-info">
                    <span>📅 ${new Date(order.createdAt).toLocaleString('zh-CN')}</span>
                    <span>🪑 ${order.table}</span>
                    <span>👤 ${order.customerName}</span>
                    <span>📞 ${order.phone}</span>
                </div>
                <div class="order-card-items">
                    ${order.items.map(i => `
                        <div class="order-card-item">
                            <span>${i.name} x${i.qty}</span>
                            <span>¥${(i.price * i.qty).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-card-total">${formatMoney(order.totalPrice)}</div>
                <div class="order-card-actions">
                    <button class="btn btn-small btn-primary" onclick="viewOrderDetail('${order.id}')">查看详情</button>
                    ${order.status === 'pending' ? `<button class="btn btn-small" style="background:#004085;color:white;" onclick="updateOrderStatus('${order.id}', 'cooking')">开始制作</button>` : ''}
                    ${order.status === 'cooking' ? `<button class="btn btn-small" style="background:#155724;color:white;" onclick="updateOrderStatus('${order.id}', 'served')">已上菜</button>` : ''}
                    ${order.status === 'served' ? `<button class="btn btn-small" style="background:#383d41;color:white;" onclick="updateOrderStatus('${order.id}', 'completed')">完成订单</button>` : ''}
                    ${order.status !== 'completed' && order.status !== 'cancelled' ? `<button class="btn btn-small btn-danger" onclick="updateOrderStatus('${order.id}', 'cancelled')">取消</button>` : ''}
                    <button class="btn btn-small btn-danger" onclick="deleteOrder('${order.id}')">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

async function deleteOrder(orderId) {
    if (!confirm('确定要删除该订单吗？此操作不可恢复。')) return;

    // 先删除 Supabase 上的订单
    await deleteOrderFromSupabase(orderId);

    // 同时更新本地缓存
    const orders = getOrders();
    const filteredOrders = orders.filter(o => o.id !== orderId);
    saveOrders(filteredOrders);

    renderOrders();
}

async function updateOrderStatus(orderId, status) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return;

    const oldStatus = orders[idx].status;
    const updates = {
        status: status,
        updatedAt: new Date().toISOString()
    };

    // 更新 Supabase
    await updateOrderInSupabase(orderId, updates);

    // 更新本地缓存
    orders[idx].status = status;
    orders[idx].updatedAt = updates.updatedAt;
    saveOrders(orders);

    // 当订单完成时，记录为收入
    if (status === 'completed' && oldStatus !== 'completed') {
        const order = orders[idx];
        const transactions = getTransactions();
        transactions.push({
            id: Date.now().toString(),
            userId: currentUser ? currentUser.id : 'guest',
            type: 'income',
            amount: order.totalPrice,
            category: '餐饮',
            date: new Date().toISOString().split('T')[0],
            note: `完成订单 ${order.id} - ${order.items.map(i => i.name).join('、')}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        saveTransactions(transactions);
    }

    renderOrders();
}

function viewOrderDetail(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const status = ORDER_STATUS[order.status];
    const content = document.getElementById('order-detail-content');

    content.innerHTML = `
        <div class="order-detail-section">
            <h4>基本信息</h4>
            <div class="order-detail-row"><span>订单号</span><span>${order.id}</span></div>
            <div class="order-detail-row"><span>状态</span><span class="order-card-status ${status.class}" style="display:inline-block;">${status.label}</span></div>
            <div class="order-detail-row"><span>下单时间</span><span>${new Date(order.createdAt).toLocaleString('zh-CN')}</span></div>
            <div class="order-detail-row"><span>桌号</span><span>${order.table}</span></div>
            <div class="order-detail-row"><span>联系人</span><span>${order.customerName}</span></div>
            <div class="order-detail-row"><span>电话</span><span>${order.phone}</span></div>
            ${order.note ? `<div class="order-detail-row"><span>备注</span><span>${order.note}</span></div>` : ''}
        </div>
        <div class="order-detail-section">
            <h4>订单明细</h4>
            ${order.items.map(i => `
                <div class="order-detail-row">
                    <span>${i.name} x${i.qty}</span>
                    <span>¥${(i.price * i.qty).toFixed(2)}</span>
                </div>
            `).join('')}
            <div class="order-detail-row" style="border-top:1px solid #eee;margin-top:8px;padding-top:8px;font-weight:600;">
                <span>总计</span>
                <span style="color:#e74c3c;font-size:16px;">${formatMoney(order.totalPrice)}</span>
            </div>
        </div>
    `;

    document.getElementById('order-detail-modal').classList.remove('hidden');
}

function bindOrderFilterEvents() {
    ['order-filter-status', 'order-filter-date'].forEach(id => {
        document.getElementById(id).addEventListener('change', renderOrders);
    });
    document.getElementById('order-filter-keyword').addEventListener('input', renderOrders);

    document.querySelector('#order-detail-modal .modal-close').addEventListener('click', () => {
        document.getElementById('order-detail-modal').classList.add('hidden');
    });

    document.getElementById('order-detail-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('order-detail-modal')) {
            document.getElementById('order-detail-modal').classList.add('hidden');
        }
    });
}

// 全局函数暴露
window.openModal = openModal;
window.deleteRecord = deleteRecord;
window.removeCategory = removeCategory;
window.removeMenuCategory = removeMenuCategory;
window.addToCart = addToCart;
window.updateCartQty = updateCartQty;
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetail = viewOrderDetail;
window.editDishPrice = editDishPrice;
window.deleteDish = deleteDish;
window.deleteOrder = deleteOrder;
window.batchDeleteDishes = batchDeleteDishes;
window.updateBatchDeleteButton = updateBatchDeleteButton;