const taskList = document.getElementById("taskList");
const clearAll = document.getElementById("clearAll");
const sortDefault = document.getElementById("sortDefault");
const sortAi = document.getElementById("sortAi");
const askAi = document.getElementById("askAi");
const aiPrompt = document.getElementById("aiPrompt");
const aiResponse = document.getElementById("aiResponse");
const aiFiles = document.getElementById("aiFiles");
const aiFilePreview = document.getElementById("aiFilePreview");
const aiFileButton = document.getElementById("aiFileButton");
let aiFileObjectURLs = [];
const addTaskByCalendar = document.getElementById("addTaskByCalendar");
const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const calendarGrid = document.getElementById("calendarGrid");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const dateTaskCount = document.getElementById("dateTaskCount");
const headerTaskSummary = document.getElementById("headerTaskSummary");
const taskSubtitle = document.getElementById("taskSubtitle");
const notificationButton = document.getElementById("enableNotifications");
const toastContainer = document.getElementById("toastContainer");

let tasks = JSON.parse(localStorage.getItem("dailyScheduleTasks") || "[]");
let useDefaultOrder = true;
let selectedDate = new Date().toISOString().slice(0, 10);
const currentCalendar = new Date();
const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function saveTasks() {
  localStorage.setItem("dailyScheduleTasks", JSON.stringify(tasks));
}

function getDifficultyValue(difficulty) {
  return difficulty === "Mudah" ? 1 : difficulty === "Sedang" ? 2 : 3;
}

function getPriorityValue(priority) {
  return priority === "Tinggi" ? 3 : priority === "Sedang" ? 2 : 1;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function updateHeaderSummary() {
  const totalTasks = tasks.length;
  headerTaskSummary.textContent = `${totalTasks} tugas total`;
  taskSubtitle.textContent = `Menampilkan tugas untuk ${formatDate(selectedDate)}.`;
}

function getVisibleTasks() {
  return tasks
    .map((task, originalIndex) => ({ ...task, originalIndex }))
    .filter((task) => task.date === selectedDate);
}

function renderTasks() {
  taskList.innerHTML = "";
  const visibleTasks = getVisibleTasks();

  if (visibleTasks.length === 0) {
    taskList.innerHTML = '<div class="task-card"><p>Belum ada tugas untuk tanggal ini. Tambahkan tugas baru atau pilih tanggal lain di kalender.</p></div>';
    dateTaskCount.textContent = "0 tugas pada tanggal terpilih.";
    updateHeaderSummary();
    return;
  }

  const sortedTasks = [...visibleTasks];
  if (!useDefaultOrder) {
    sortedTasks.sort((a, b) => {
      const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      const difficultyDiff = getDifficultyValue(a.difficulty) - getDifficultyValue(b.difficulty);
      if (difficultyDiff !== 0) return difficultyDiff;
      return a.duration - b.duration;
    });
  }

  sortedTasks.forEach((task, index) => {
    const card = document.createElement("article");
    card.className = "task-card";
    card.innerHTML = `
      <h3>${task.name}</h3>
      <div class="task-meta">
        <span><strong>Kategori:</strong> ${task.category || "Umum"}</span>
        <span><strong>Prioritas:</strong> ${task.priority}</span>
        <span><strong>Kesulitan:</strong> ${task.difficulty}</span>
        <span><strong>Durasi:</strong> ${task.duration} menit</span>
        <span><strong>Waktu:</strong> ${task.time || "Bebas"}</span>
        <span><strong>Posisi:</strong> ${index + 1}</span>
      </div>
      <div class="form-actions">
        <button type="button" data-index="${task.originalIndex}" class="delete-task">Hapus</button>
      </div>
    `;
    taskList.appendChild(card);
  });

  dateTaskCount.textContent = `${visibleTasks.length} tugas pada tanggal ini.`;
  updateHeaderSummary();
}

function addTask(taskData) {
  tasks.push({
    ...taskData,
    createdAt: Date.now(),
  });
  saveTasks();
  renderTasks();
  renderCalendar();
  showToast(`Tugas "${taskData.name}" berhasil ditambahkan.`, "success");
  scheduleNotificationForTask(taskData);
}

const notifiedTasks = new Set(JSON.parse(localStorage.getItem("dailyScheduleNotified") || "[]"));
let notificationPermission = "default";

function saveNotificationState() {
  localStorage.setItem("dailyScheduleNotified", JSON.stringify(Array.from(notifiedTasks)));
}

function showToast(message, type = "info") {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderAiFilePreview() {
  if (!aiFilePreview || !aiFiles) return;
  const files = aiFiles.files ? Array.from(aiFiles.files) : [];
  if (files.length === 0) {
    // revoke any previously created object URLs
    aiFileObjectURLs.forEach((u) => URL.revokeObjectURL(u));
    aiFileObjectURLs = [];
    aiFilePreview.innerHTML = "";
    return;
  }
  // revoke previous urls
  aiFileObjectURLs.forEach((u) => URL.revokeObjectURL(u));
  aiFileObjectURLs = [];

  aiFilePreview.innerHTML = files
    .map((file, idx) => {
      if (file.type && file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        aiFileObjectURLs.push(url);
        return `
          <div class="ai-file-item">
            <img src="${url}" class="ai-file-thumb" alt="preview" />
            <div style="flex:1;min-width:0">
              <div class="ai-file-name">${file.name}</div>
              <small>${formatBytes(file.size)}</small>
            </div>
          </div>
        `;
      }
      return `
        <div class="ai-file-item">
          <div style="display:flex;align-items:center;gap:10px;">
            <span>📎</span>
            <div style="min-width:0">
              <div class="ai-file-name">${file.name}</div>
              <small>${formatBytes(file.size)}</small>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function getSelectedFileDescriptions() {
  if (!aiFiles || !aiFiles.files) return [];
  return Array.from(aiFiles.files).map((file) => file.name);
}

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showToast("Browser Anda tidak mendukung notifikasi.", "error");
    return;
  }

  Notification.requestPermission().then((permission) => {
    notificationPermission = permission;
    updateNotificationButton();
    if (permission === "granted") {
      showToast("Notifikasi diaktifkan.", "success");
    } else {
      showToast("Notifikasi tidak diizinkan.", "error");
    }
  });
}

function updateNotificationButton() {
  if (!notificationButton) return;
  notificationButton.textContent = notificationPermission === "granted" ? "Notifikasi Aktif" : "Aktifkan Notifikasi";
}

function sendSystemNotification(title, options) {
  if (notificationPermission !== "granted") return;
  try {
    new Notification(title, options);
  } catch (error) {
    showToast("Notifikasi tidak dapat dikirim.", "error");
  }
}

function scheduleNotificationForTask(task) {
  if (!task.time || notificationPermission !== "granted") return;
  const now = new Date();
  const taskDateTime = new Date(`${task.date}T${task.time}`);
  const taskKey = `${task.date}|${task.time}|${task.name}`;

  if (notifiedTasks.has(taskKey)) return;
  const delay = taskDateTime.getTime() - now.getTime();
  if (delay <= 0 || delay > 86400000) return;

  setTimeout(() => {
    if (!notifiedTasks.has(taskKey)) {
      sendTaskNotification(task);
      notifiedTasks.add(taskKey);
      saveNotificationState();
    }
  }, delay);
}

function sendTaskNotification(task) {
  sendSystemNotification("Pengingat tugas", {
    body: `${task.name} (${task.time || "Tanpa waktu"})`,
    silent: false,
  });
  showToast(`Notifikasi: ${task.name} pada ${task.time || task.date}.`, "success");
}

function checkDueNotifications() {
  if (notificationPermission !== "granted") return;
  const now = new Date();
  tasks.forEach((task) => {
    if (!task.time) return;
    const taskKey = `${task.date}|${task.time}|${task.name}`;
    if (notifiedTasks.has(taskKey)) return;
    const taskDateTime = new Date(`${task.date}T${task.time}`);
    const diff = Math.abs(now.getTime() - taskDateTime.getTime());
    if (diff < 30000) {
      sendTaskNotification(task);
      notifiedTasks.add(taskKey);
      saveNotificationState();
    }
  });
}

function initializeNotifications() {
  notificationPermission = "Notification" in window ? Notification.permission : "denied";
  updateNotificationButton();
  tasks.forEach((task) => scheduleNotificationForTask(task));
  setInterval(checkDueNotifications, 30000);
}

// Modal-based task creation (replaces prompt())
const taskModal = document.getElementById("taskModal");
const modalName = document.getElementById("modalName");
const modalCategory = document.getElementById("modalCategory");
const modalDuration = document.getElementById("modalDuration");
const modalTime = document.getElementById("modalTime");
const modalDifficulty = document.getElementById("modalDifficulty");
const modalPriority = document.getElementById("modalPriority");
const modalSave = document.getElementById("modalSave");
const modalCancel = document.getElementById("modalCancel");

function openTaskModal(forDate) {
  if (!taskModal) return;
  taskModal.classList.remove("hidden");
  modalName.value = "";
  modalCategory.value = "Umum";
  modalDuration.value = 30;
  modalTime.value = "";
  modalDifficulty.value = "Mudah";
  modalPriority.value = "Sedang";
  // store chosen date in a dataset
  taskModal.dataset.forDate = forDate || selectedDate;
  // focus first input for accessibility
  setTimeout(() => modalName.focus(), 60);
}

function closeTaskModal() {
  if (!taskModal) return;
  taskModal.classList.add("hidden");
  delete taskModal.dataset.forDate;
}

function saveTaskFromModal() {
  const name = modalName.value.trim();
  if (!name) return;
  const duration = Number(modalDuration.value) || 30;
  const taskDate = taskModal.dataset.forDate || selectedDate;
  addTask({
    name,
    category: modalCategory.value.trim() || "Umum",
    duration,
    difficulty: modalDifficulty.value,
    priority: modalPriority.value,
    time: modalTime.value || "",
    date: taskDate,
  });
  closeTaskModal();
}

if (modalCancel) modalCancel.addEventListener("click", closeTaskModal);
if (modalSave) modalSave.addEventListener("click", saveTaskFromModal);

// Close modal when clicking outside content
if (taskModal) {
  taskModal.addEventListener("click", (e) => {
    if (e.target === taskModal) closeTaskModal();
  });
}

// Keyboard accessibility: Escape to close, Enter to save
document.addEventListener("keydown", (e) => {
  if (!taskModal || taskModal.classList.contains("hidden")) return;
  if (e.key === "Escape") closeTaskModal();
  if (e.key === "Enter") {
    // prevent submitting forms elsewhere
    e.preventDefault();
    saveTaskFromModal();
  }
});

function deleteTask(index) {
  const deleted = tasks.splice(index, 1);
  saveTasks();
  renderTasks();
  renderCalendar();
  if (deleted.length) showToast(`Tugas "${deleted[0].name}" dihapus.`, "info");
}

function clearTasks() {
  if (!confirm("Hapus semua tugas?")) return;
  tasks = [];
  saveTasks();
  renderTasks();
  renderCalendar();
  showToast("Semua tugas telah dihapus.", "info");
}

function sortWithAi() {
  useDefaultOrder = false;
  renderTasks();
  aiResponse.textContent = "AI telah mengurutkan tugas ini berdasarkan prioritas dan kesulitan: tinggi dulu, lalu tugas mudah diprioritaskan ketika prioritas sama.";
}

function askAiHandler() {
  const promptText = aiPrompt.value.trim();
  if (!promptText && (!aiFiles || aiFiles.files.length === 0)) {
    aiResponse.textContent = "Silakan tulis pertanyaan atau tambahkan file agar AI dapat membantu.";
    return;
  }

  const files = getSelectedFileDescriptions();
  const fileInfo = files.length ? `

File terlampir: ${files.join(", ")}` : "";
  const response = generateAiAnswer(promptText.toLowerCase(), files);
  aiResponse.textContent = `${response}${fileInfo}`;
}

function generateAiAnswer(prompt, files = []) {
  const visibleTasks = getVisibleTasks();
  if (visibleTasks.length === 0) {
    if (files.length) {
      return `Saya menerima ${files.length} file, tetapi belum ada tugas pada tanggal ini. Tambahkan tugas terlebih dahulu atau beri tahu saya apa yang ingin Anda lakukan dengan file tersebut.`;
    }
    return "Tidak ada tugas pada tanggal ini. Tambahkan tugas terlebih dahulu atau pilih tanggal lain di kalender.";
  }
  if (!prompt && files.length) {
    return `Saya menerima ${files.length} file dan siap membantu. Silakan jelaskan apa yang Anda butuhkan.`;
  }

  if (prompt.includes("mudah") || prompt.includes("sulit") || prompt.includes("sus")) {
    return createTaskPlan(visibleTasks);
  }

  if (prompt.includes("dulu") || prompt.includes("pertama") || prompt.includes("mana yang harus")) {
    return suggestNextTask(visibleTasks);
  }

  if (prompt.includes("bersihkan") || prompt.includes("hapus") || prompt.includes("kosong")) {
    return "Untuk menghapus tugas, gunakan tombol 'Kosongkan Semua'. Jika hanya ingin menghapus satu, tekan tombol Hapus pada tugas terkait.";
  }

  if (prompt.includes("pilih") || prompt.includes("baik") || prompt.includes("mana yang")) {
    return compareTasks(visibleTasks);
  }

  if (prompt.includes("jadwal") || prompt.includes("atur") || prompt.includes("aturkan")) {
    return createTaskPlan(visibleTasks);
  }

  return "AI menyarankan: mulai dari tugas prioritas tinggi yang mudah atau sedang, lalu lanjut ke tugas sulit.";
}

function suggestNextTask(visibleTasks) {
  const sorted = [...visibleTasks].sort((a, b) => {
    const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return getDifficultyValue(a.difficulty) - getDifficultyValue(b.difficulty);
  });
  const next = sorted[0];
  return `Saran AI: mulai dengan tugas "${next.name}" (Prioritas: ${next.priority}, Kesulitan: ${next.difficulty}, Durasi: ${next.duration} menit).`;
}

function createTaskPlan(visibleTasks) {
  const easyTasks = visibleTasks.filter((task) => task.difficulty === "Mudah");
  const mediumTasks = visibleTasks.filter((task) => task.difficulty === "Sedang");
  const hardTasks = visibleTasks.filter((task) => task.difficulty === "Sulit");
  const plan = [];

  if (easyTasks.length) {
    plan.push("Mulai dengan tugas mudah:");
    easyTasks.forEach((task) => plan.push(`- ${task.name} (${task.duration} menit)`));
  }
  if (mediumTasks.length) {
    plan.push("\nLanjutkan dengan tugas sedang:");
    mediumTasks.forEach((task) => plan.push(`- ${task.name} (${task.duration} menit)`));
  }
  if (hardTasks.length) {
    plan.push("\nAkhiri dengan tugas sulit:");
    hardTasks.forEach((task) => plan.push(`- ${task.name} (${task.duration} menit)`));
  }

  return plan.join("\n");
}

function compareTasks(visibleTasks) {
  const highest = visibleTasks.reduce((best, task) => {
    if (!best) return task;
    const score = getPriorityValue(task.priority) * 10 - getDifficultyValue(task.difficulty);
    const bestScore = getPriorityValue(best.priority) * 10 - getDifficultyValue(best.difficulty);
    return score > bestScore ? task : best;
  }, null);
  return `AI rekomendasi: tugas terbaik untuk dikerjakan sekarang adalah "${highest.name}" karena prioritasnya ${highest.priority} dan kesulitannya ${highest.difficulty}.`;
}

// Chart functionality removed

function setSelectedDate(value) {
  selectedDate = value;
  selectedDateLabel.textContent = formatDate(value);
  renderCalendar();
  renderTasks();
}

function renderCalendar() {
  const year = currentCalendar.getFullYear();
  const month = currentCalendar.getMonth();
  populateMonthSelect(month);
  populateYearSelect(year);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  calendarGrid.innerHTML = "";
  for (let i = 0; i < firstDay; i += 1) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day empty";
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateValue = new Date(year, month, day).toISOString().slice(0, 10);
    const dayButton = document.createElement("button");
    dayButton.type = "button";
    dayButton.className = "calendar-day";
    dayButton.textContent = day;
    if (dateValue === selectedDate) {
      dayButton.classList.add("selected");
    }
    if (dateValue === new Date().toISOString().slice(0, 10)) {
      dayButton.classList.add("today");
    }
    dayButton.addEventListener("click", () => {
      setSelectedDate(dateValue);
      openTaskModal(dateValue);
    });
    calendarGrid.appendChild(dayButton);
  }
}

function populateMonthSelect(selectedMonth) {
  monthSelect.innerHTML = monthNames
    .map((monthName, index) => `
      <option value="${index}" ${index === selectedMonth ? "selected" : ""}>${monthName}</option>
    `)
    .join("");
}

function populateYearSelect(selectedYear) {
  const startYear = selectedYear - 5;
  const endYear = selectedYear + 5;
  const yearOptions = [];
  for (let year = startYear; year <= endYear; year += 1) {
    yearOptions.push(
      `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`
    );
  }
  yearSelect.innerHTML = yearOptions.join("");
}

function changeMonth(offset) {
  currentCalendar.setMonth(currentCalendar.getMonth() + offset);
  renderCalendar();
}

function changeYear(offset) {
  currentCalendar.setFullYear(currentCalendar.getFullYear() + offset);
  renderCalendar();
}

function bindEvents() {
  clearAll.addEventListener("click", clearTasks);
  sortDefault.addEventListener("click", () => {
    useDefaultOrder = true;
    renderTasks();
    aiResponse.textContent = "Menampilkan urutan asli tugas Anda. Gunakan 'Atur dengan AI' untuk menyusun berdasarkan prioritas dan kesulitan.";
  });
  sortAi.addEventListener("click", sortWithAi);
  askAi.addEventListener("click", askAiHandler);
  if (aiFiles) aiFiles.addEventListener("change", renderAiFilePreview);
  addTaskByCalendar.addEventListener("click", () => openTaskModal(selectedDate));
  if (notificationButton) notificationButton.addEventListener("click", requestNotificationPermission);
  prevMonth.addEventListener("click", () => changeMonth(-1));
  monthSelect.addEventListener("change", (event) => {
    currentCalendar.setMonth(Number(event.target.value));
    renderCalendar();
  });
  yearSelect.addEventListener("change", (event) => {
    currentCalendar.setFullYear(Number(event.target.value));
    renderCalendar();
  });
  nextMonth.addEventListener("click", () => changeMonth(1));
  taskList.addEventListener("click", (event) => {
    if (!event.target.matches(".delete-task")) return;
    const index = Number(event.target.dataset.index);
    deleteTask(index);
  });
}

setSelectedDate(selectedDate);
bindEvents();
initializeNotifications();
renderCalendar();
renderTasks();

// wire camera button to input
if (aiFileButton && aiFiles) {
  aiFileButton.addEventListener("click", () => aiFiles.click());
}
