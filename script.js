const STORAGE_KEY = "diacore-demo-store-v1";
const SESSION_KEY = "diacore-demo-session-v1";
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ADMIN_NUMBER_WORDS = [
	"one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
	"eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
	"twentyone", "twentytwo", "twentythree", "twentyfour", "twentyfive", "twentysix", "twentyseven", "twentyeight", "twentynine", "thirty"
];

function createSeedAdmins() {
	return Array.from({ length: 30 }, (_, index) => {
		const number = index + 1;
		const paddedNumber = String(number).padStart(2, "0");
		return {
			id: `admin-${paddedNumber}`,
			username: `admin${paddedNumber}`,
			email: `admin${number}@diacore.com`,
			password: `admin${ADMIN_NUMBER_WORDS[index]}${number}`,
			name: `DIACORE Admin ${paddedNumber}`,
			birthday: "",
			age: "",
			gender: "",
			position: "Admin",
			address: "",
			education: "",
			employmentId: `DC-${paddedNumber}`,
			photo: ""
		};
	});
}

function createSeedStore() {
	const patients = [
		{
			id: "patient-001",
			name: "Alex Reyes",
			email: "patient01@diacore.demo",
			password: "PatientDemo01!",
			birthday: "1985-06-14",
			age: 41,
			gender: "Female",
			address: "Marikina City",
			dialysisType: "Hemodialysis",
			center: "Marikina",
			dialysisDays: ["Monday", "Wednesday", "Friday"],
			registeredAt: "2026-09-01"
		},
		{
			id: "patient-002",
			name: "Jordan Santos",
			email: "patient02@diacore.demo",
			password: "PatientDemo02!",
			birthday: "1979-02-22",
			age: 47,
			gender: "Male",
			address: "Sumulong, Antipolo",
			dialysisType: "Peritoneal dialysis",
			center: "Sumulong",
			dialysisDays: ["Monday", "Wednesday", "Friday"],
			registeredAt: "2026-09-05"
		}
	];

	return {
		admins: createSeedAdmins(),
		patients,
		announcements: [{ id: "announcement-001", title: "Welcome to DIACORE", body: "Please contact your dialysis center if you need help with your appointment.", createdAt: "2026-09-01", author: "DIACORE Admin" }],
		notes: [
			{ id: "note-001", patientId: "patient-001", date: "2026-09-20", text: "Patient completed scheduled hemodialysis session. Continue monitoring as directed by the care team." },
			{ id: "note-002", patientId: "patient-002", date: "2026-09-21", text: "Routine peritoneal dialysis follow-up recorded by the care team." }
		],
		bills: [
			{ id: "bill-001", patientId: "patient-001", description: "Dialysis session", amount: 2500, status: "Pending", method: "Cash", updatedAt: "2026-09-20" },
			{ id: "bill-002", patientId: "patient-002", description: "Monthly dialysis supplies", amount: 1800, status: "Pending", method: "Cash", updatedAt: "2026-09-21" }
		],
		availableDays: ["Monday", "Wednesday", "Friday"],
		messages: [
			{ id: "message-001", patientId: "patient-001", senderId: "admin-01", senderRole: "admin", senderName: "DIACORE Admin 01", text: "Your next appointment is on Monday.", sentAt: "2026-09-22 09:00" }
		],
		notifications: [],
		audit: [{ id: "audit-001", text: "Demo records initialized", date: "2026-09-01" }]
	};
}

function getStore() {
	try {
		const savedStore = localStorage.getItem(STORAGE_KEY);
		if (savedStore) {
			const store = JSON.parse(savedStore);
			let changed = false;
			const availableDays = Array.isArray(store.availableDays) ? store.availableDays : DAY_NAMES;
			const savedAdmins = Array.isArray(store.admins) ? store.admins : [];
			const seededAdmins = createSeedAdmins();
			store.admins = seededAdmins.map((admin) => {
				const savedAdmin = savedAdmins.find((entry) => entry.id === admin.id);
				if (!savedAdmin) {
					changed = true;
					return admin;
				}
				if (savedAdmin.email !== admin.email || savedAdmin.password !== admin.password || savedAdmin.username !== admin.username) changed = true;
				return { ...savedAdmin, email: admin.email, password: admin.password, username: admin.username };
			});
			if (savedAdmins.length !== seededAdmins.length) changed = true;
			store.patients.forEach((patient) => {
				const validDays = (patient.dialysisDays || []).filter((day) => availableDays.includes(day));
				if (validDays.length !== (patient.dialysisDays || []).length) {
					patient.dialysisDays = validDays;
					changed = true;
				}
			});
			if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
			return store;
		}
		const store = createSeedStore();
		localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
		return store;
	} catch (error) {
		console.error("DIACORE demo storage is unavailable", error);
		return createSeedStore();
	}
}

function saveStore(store) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function makeId(prefix) {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHTML(value) {
	return String(value ?? "").replace(/[&<>"']/g, (character) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;"
	})[character]);
}

function formatMoney(value) {
	return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function addAudit(store, text) {
	store.audit.unshift({ id: makeId("audit"), text, date: new Date().toLocaleString() });
	store.audit = store.audit.slice(0, 100);
}

function addNotification(store, patientId, text) {
	store.notifications.unshift({ id: makeId("notification"), patientId, text, date: new Date().toLocaleString(), read: false });
}

function setSession(role, userId) {
	localStorage.setItem(SESSION_KEY, JSON.stringify({ role, userId }));
}

function getSession() {
	try {
		return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
	} catch {
		return null;
	}
}

function setupLocationSearch() {
	const locationInput = document.querySelector("#location-query");
	if (!locationInput) return;
	const locations = [...document.querySelectorAll(".location-item")];
	const locationEmpty = document.querySelector("#location-empty");
	locationInput.addEventListener("input", () => {
		const query = locationInput.value.trim().toLowerCase();
		let visibleCount = 0;
		locations.forEach((location) => {
			const isMatch = location.dataset.location.includes(query);
			location.hidden = !isMatch;
			if (isMatch) visibleCount += 1;
		});
		locationEmpty.hidden = visibleCount > 0;
	});
}

function setupAuth() {
	const patientRole = document.querySelector("#patient-role");
	if (!patientRole) return;
	document.querySelectorAll("[data-password-toggle]").forEach((button) => {
		button.addEventListener("click", () => {
			const passwordInput = document.getElementById(button.getAttribute("aria-controls"));
			const showPassword = passwordInput.type === "password";
			passwordInput.type = showPassword ? "text" : "password";
			button.textContent = showPassword ? "Hide" : "Show";
			button.setAttribute("aria-label", `${showPassword ? "Hide" : "Show"} password`);
			button.setAttribute("aria-pressed", String(showPassword));
		});
	});

	const adminRole = document.querySelector("#admin-role");
	const patientTabs = document.querySelector("#patient-tabs");
	const adminTabs = document.querySelector("#admin-tabs");
	const signupForm = document.querySelector("#patient-signup-form");
	const patientLoginForm = document.querySelector("#patient-login-form");
	const adminLoginForm = document.querySelector("#admin-login-form");
	const signupTab = document.querySelector("#patient-signup-tab");
	const patientLoginTab = document.querySelector("#patient-login-tab");

	function showPatientForm(formName) {
		const showSignup = formName === "signup";
		signupForm.hidden = !showSignup;
		patientLoginForm.hidden = showSignup;
		signupTab.classList.toggle("active", showSignup);
		signupTab.setAttribute("aria-selected", String(showSignup));
		patientLoginTab.classList.toggle("active", !showSignup);
		patientLoginTab.setAttribute("aria-selected", String(!showSignup));
	}

	function showRole(role) {
		const isPatient = role === "patient";
		patientRole.classList.toggle("active", isPatient);
		patientRole.setAttribute("aria-pressed", String(isPatient));
		adminRole.classList.toggle("active", !isPatient);
		adminRole.setAttribute("aria-pressed", String(!isPatient));
		patientTabs.hidden = !isPatient;
		adminTabs.hidden = isPatient;
		signupForm.hidden = !isPatient || signupTab.getAttribute("aria-selected") !== "true";
		patientLoginForm.hidden = !isPatient || patientLoginTab.getAttribute("aria-selected") !== "true";
		adminLoginForm.hidden = isPatient;
	}

	patientRole.addEventListener("click", () => showRole("patient"));
	adminRole.addEventListener("click", () => showRole("admin"));
	signupTab.addEventListener("click", () => showPatientForm("signup"));
	patientLoginTab.addEventListener("click", () => showPatientForm("login"));

	signupForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const formData = new FormData(signupForm);
		const email = String(formData.get("patient-email")).trim().toLowerCase();
		const store = getStore();
		if (store.patients.some((patient) => patient.email === email && patient.password)) {
			signupForm.querySelector(".form-message").textContent = "An account already uses this email. Please log in.";
			return;
		}

		let patient = store.patients.find((entry) => entry.email === email);
		if (patient) {
			patient.name = String(formData.get("patient-name")).trim();
			patient.password = String(formData.get("patient-password"));
		} else {
			patient = {
				id: makeId("patient"),
				name: String(formData.get("patient-name")).trim(),
				email,
				password: String(formData.get("patient-password")),
				birthday: "",
				age: "",
				gender: "",
				address: "",
				dialysisType: "Not set",
				center: "Marikina",
				dialysisDays: [],
				registeredAt: new Date().toISOString().slice(0, 10)
			};
			store.patients.push(patient);
		}
		addAudit(store, `Patient account registered: ${patient.name}`);
		setSession("patient", patient.id);
		saveStore(store);
		window.location.href = "patient.html";
	});

	patientLoginForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const formData = new FormData(patientLoginForm);
		const email = String(formData.get("patient-login-email")).trim().toLowerCase();
		const password = String(formData.get("patient-login-password"));
		const patient = getStore().patients.find((entry) => entry.email === email && entry.password === password);
		if (!patient) {
			patientLoginForm.querySelector(".form-message").textContent = "No matching patient account. Create an account first.";
			return;
		}
		setSession("patient", patient.id);
		window.location.href = "patient.html";
	});

	adminLoginForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const formData = new FormData(adminLoginForm);
		const email = String(formData.get("admin-email")).trim().toLowerCase();
		const password = String(formData.get("admin-password"));
		const admin = getStore().admins.find((entry) => entry.email === email && entry.password === password);
		if (!admin) {
			adminLoginForm.querySelector(".form-message").textContent = "Invalid email or password. Use one of the 30 default demo accounts.";
			return;
		}
		setSession("admin", admin.id);
		window.location.href = "admin.html";
	});
}

function initLocationAndAuth() {
	setupLocationSearch();
	setupAuth();
}

const currentPage = document.body.dataset.page;
if (!currentPage || currentPage === "home") {
	initLocationAndAuth();
} else {
	initPortal(currentPage);
}

function initPortal(role) {
	const session = getSession();
	if (!session || session.role !== role) {
		window.location.replace("index.html#account");
		return;
	}

	let store = getStore();
	let currentUser = role === "admin"
		? store.admins.find((admin) => admin.id === session.userId)
		: store.patients.find((patient) => patient.id === session.userId);
	if (!currentUser) {
		localStorage.removeItem(SESSION_KEY);
		window.location.replace("index.html#account");
		return;
	}

	const viewContainer = document.querySelector("#portal-content");
	const menu = document.querySelector("#portal-menu");
	const menuToggle = document.querySelector("#menu-toggle");
	const menuClose = document.querySelector("#menu-close");
	const menuLinks = [...document.querySelectorAll("[data-view]")];
	const userLabel = document.querySelector("#portal-user");
	let activeView = role === "admin" ? "dashboard" : "announcements";
	let activeMessagePatientId = role === "patient" ? currentUser.id : store.patients[0]?.id;
	let profilePhotoDraft = currentUser.photo || "";

	const adminViews = [
		["dashboard", "Dashboard"], ["billing", "Billing"], ["profile", "Profile"], ["schedule", "Schedule"],
		["patients", "Patients"], ["announcements", "Announcement"], ["reports", "Report"], ["messages", "Message"]
	];
	const patientViews = [
		["announcements", "Announcement"], ["profile", "Profile"], ["notes", "Nurses notes"], ["schedule", "Schedule"],
		["billing", "Billing"], ["notifications", "Notification"], ["messages", "Message"]
	];
	const availableViews = role === "admin" ? adminViews : patientViews;
	userLabel.textContent = role === "admin" ? currentUser.name : currentUser.name;

	function refreshStore() {
		store = getStore();
		currentUser = role === "admin"
			? store.admins.find((admin) => admin.id === session.userId)
			: store.patients.find((patient) => patient.id === session.userId);
		if (role === "admin") userLabel.textContent = currentUser.name;
	}

	function openMenu(isOpen) {
		menu.classList.toggle("is-open", isOpen);
		menuToggle.setAttribute("aria-expanded", String(isOpen));
		menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
	}

	menuToggle.addEventListener("click", () => openMenu(!menu.classList.contains("is-open")));
	menuClose.addEventListener("click", () => openMenu(false));
	menuLinks.forEach((link) => link.addEventListener("click", (event) => {
		event.preventDefault();
		activeView = link.dataset.view;
		openMenu(false);
		renderView();
	}));
	document.querySelector("#logout-button").addEventListener("click", () => {
		localStorage.removeItem(SESSION_KEY);
		window.location.href = "index.html";
	});

	function renderView() {
		refreshStore();
		menuLinks.forEach((link) => link.classList.toggle("active", link.dataset.view === activeView));
		const title = availableViews.find(([view]) => view === activeView)?.[1] || "Dashboard";
		document.querySelector("#view-title").textContent = title;
		viewContainer.innerHTML = role === "admin" ? renderAdminView(activeView) : renderPatientView(activeView);
		bindViewEvents();
	}

	function patientName(patientId) {
		return store.patients.find((patient) => patient.id === patientId)?.name || "Unknown patient";
	}

	function renderAdminView(view) {
		if (view === "dashboard") return renderAdminDashboard();
		if (view === "billing") return renderAdminBilling();
		if (view === "profile") return renderAdminProfile();
		if (view === "schedule") return renderAdminSchedule();
		if (view === "patients") return renderAdminPatients();
		if (view === "announcements") return renderAdminAnnouncements();
		if (view === "reports") return renderAdminReports();
		return renderMessages(true);
	}

	function renderAdminDashboard() {
		const types = [...new Set(store.patients.map((patient) => patient.dialysisType || "Not set"))];
		const typeRows = types.map((type) => {
			const count = store.patients.filter((patient) => (patient.dialysisType || "Not set") === type).length;
			const percent = store.patients.length ? Math.round(count / store.patients.length * 100) : 0;
			return `<div class="metric-row"><div class="metric-label"><span>${escapeHTML(type)}</span><strong>${count}</strong></div><div class="metric-track"><span style="width:${percent}%"></span></div></div>`;
		}).join("");
		return `<div class="section-heading"><div><p class="portal-kicker">OVERVIEW</p><h2>Dialysis cases</h2></div><span class="demo-chip">LOCAL DEMO DATA</span></div>
			<div class="stat-grid"><article class="stat-card"><span>REGISTERED PATIENTS</span><strong>${store.patients.length}</strong></article><article class="stat-card"><span>TOTAL CASE RECORDS</span><strong>${store.notes.length}</strong></article><article class="stat-card"><span>PENDING BILLS</span><strong>${store.bills.filter((bill) => bill.status === "Pending").length}</strong></article><article class="stat-card"><span>ANNOUNCEMENTS</span><strong>${store.announcements.length}</strong></article></div>
			<div class="portal-panel"><div class="panel-heading"><div><p class="portal-kicker">PATIENT CASES</p><h3>Patient count by dialysis type</h3></div></div><div class="metric-chart">${typeRows || "<p>No cases recorded yet.</p>"}</div></div>
			<div class="portal-panel"><div class="panel-heading"><div><p class="portal-kicker">RECENT PATIENTS</p><h3>Care roster</h3></div><button class="text-button" data-go-view="patients">View patients</button></div>${patientTable(store.patients.slice(-5).reverse(), false)}</div>`;
	}

	function patientTable(patients, actions = true) {
		if (!patients.length) return `<p class="empty-state">No patient records yet.</p>`;
		return `<div class="table-wrap"><table><thead><tr><th>Patient</th><th>Email</th><th>Dialysis type</th><th>Center</th>${actions ? "<th>Actions</th>" : ""}</tr></thead><tbody>${patients.map((patient) => `<tr><td>${escapeHTML(patient.name)}</td><td>${escapeHTML(patient.email)}</td><td>${escapeHTML(patient.dialysisType || "Not set")}</td><td>${escapeHTML(patient.center || "Not set")}</td>${actions ? `<td><button class="table-action" data-edit-patient="${escapeHTML(patient.id)}">Edit</button><button class="table-action danger" data-delete-patient="${escapeHTML(patient.id)}">Delete</button></td>` : ""}</tr>`).join("")}</tbody></table></div>`;
	}

	function patientOptions(selectedId = "") {
		return store.patients.map((patient) => `<option value="${escapeHTML(patient.id)}" ${patient.id === selectedId ? "selected" : ""}>${escapeHTML(patient.name)}</option>`).join("");
	}

	function renderAdminPatients(editPatient = null) {
		const patient = editPatient || {};
		return `<div class="section-heading"><div><p class="portal-kicker">PATIENT RECORDS</p><h2>Patients</h2></div><span class="demo-chip">ADMIN ONLY</span></div>
			<div class="portal-panel"><h3>${patient.id ? "Edit patient" : "Add patient record"}</h3><form id="admin-patient-form" class="form-grid"><input type="hidden" name="patientId" value="${escapeHTML(patient.id || "")}"><label>Full name<input name="name" value="${escapeHTML(patient.name || "")}" required></label><label>Email<input type="email" name="email" value="${escapeHTML(patient.email || "")}" required></label><label>Birthday<input type="date" name="birthday" value="${escapeHTML(patient.birthday || "")}"></label><label>Age<input type="number" min="0" name="age" value="${escapeHTML(patient.age || "")}"></label><label>Gender<select name="gender"><option value="">Choose</option>${["Female", "Male", "Other"].map((value) => `<option ${patient.gender === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label>Dialysis type<select name="dialysisType">${["Hemodialysis", "Peritoneal dialysis", "Not set"].map((value) => `<option ${patient.dialysisType === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label>Center<select name="center">${["Marikina", "Sumulong"].map((value) => `<option ${patient.center === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label>Home address<input name="address" value="${escapeHTML(patient.address || "")}"></label><div class="form-actions"><button class="primary-button" type="submit">${patient.id ? "Save patient" : "Add patient"}</button>${patient.id ? `<button class="secondary-button" type="button" data-cancel-patient-edit>Cancel</button>` : ""}</div></form></div>
			<div class="portal-panel"><div class="panel-heading"><h3>Patient directory (${store.patients.length})</h3></div>${patientTable(store.patients)}</div>
			<div class="portal-panel"><h3>Add nursing note</h3><p class="muted-copy">Notes saved here appear in the selected patient's Nurses notes section.</p><form id="admin-nursing-note-form" class="form-grid"><label>Patient<select name="patientId" required>${patientOptions()}</select></label><label>Date<input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" required></label><label class="full-width">Nursing note<textarea name="text" rows="4" required></textarea></label><div class="form-actions"><button class="primary-button" type="submit">Publish nursing note</button></div></form></div>
			<div class="portal-panel"><div class="panel-heading"><h3>Nursing notes (${store.notes.length})</h3></div>${store.notes.length ? `<div class="notes-list">${store.notes.map((note) => `<article class="portal-panel note-card"><div class="panel-heading"><div><p class="portal-kicker">${escapeHTML(note.date)}</p><strong>${escapeHTML(patientName(note.patientId))}</strong></div><button class="table-action danger" data-delete-nursing-note="${escapeHTML(note.id)}">Delete</button></div><p>${escapeHTML(note.text)}</p></article>`).join("")}</div>` : `<p class="empty-state">No nursing notes recorded yet.</p>`}</div>`;
	}

	function renderAdminBilling(editBill = null) {
		const bill = editBill || {};
		return `<div class="section-heading"><div><p class="portal-kicker">PAYMENTS</p><h2>Billing</h2></div><span class="demo-chip">DEMO ONLY · NO CARD PROCESSING</span></div>
			<div class="portal-panel"><h3>${bill.id ? "Edit bill" : "Add bill"}</h3><form id="admin-bill-form" class="form-grid"><input type="hidden" name="billId" value="${escapeHTML(bill.id || "")}"><label>Patient<select name="patientId" required>${patientOptions(bill.patientId)}</select></label><label>Description<input name="description" value="${escapeHTML(bill.description || "Dialysis session")}" required></label><label>Amount (PHP)<input type="number" name="amount" min="0" step="0.01" value="${escapeHTML(bill.amount || "")}" required></label><label>Status<select name="status">${["Pending", "Paid", "Overdue"].map((value) => `<option ${bill.status === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label>Payment method<select name="method">${["Cash", "BPI", "PhilHealth", "BDO"].map((value) => `<option ${bill.method === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><div class="form-actions"><button class="primary-button" type="submit">${bill.id ? "Save bill" : "Add bill"}</button>${bill.id ? `<button class="secondary-button" type="button" data-cancel-bill-edit>Cancel</button>` : ""}</div></form></div>
			<div class="portal-panel"><h3>Patient bills</h3>${renderBillsTable(store.bills, true)}</div>`;
	}

	function renderBillsTable(bills, adminView) {
		if (!bills.length) return `<p class="empty-state">No bills recorded.</p>`;
		return `<div class="table-wrap"><table><thead><tr><th>Patient</th><th>Description</th><th>Amount</th><th>Status</th><th>Method</th><th>Updated</th>${adminView ? "<th>Actions</th>" : ""}</tr></thead><tbody>${bills.map((bill) => `<tr><td>${escapeHTML(patientName(bill.patientId))}</td><td>${escapeHTML(bill.description)}</td><td>${formatMoney(bill.amount)}</td><td><span class="status-tag ${bill.status === "Paid" ? "success" : "pending"}">${escapeHTML(bill.status)}</span></td><td>${escapeHTML(bill.method || "Cash")}</td><td>${escapeHTML(bill.updatedAt || "")}</td>${adminView ? `<td><button class="table-action" data-edit-bill="${escapeHTML(bill.id)}">Edit</button><button class="table-action danger" data-delete-bill="${escapeHTML(bill.id)}">Delete</button></td>` : ""}</tr>`).join("")}</tbody></table></div>`;
	}

	function renderAdminProfile() {
		return `<div class="section-heading"><div><p class="portal-kicker">ADMIN ACCOUNT</p><h2>Profile</h2></div></div><div class="portal-panel profile-panel"><div class="profile-photo-wrap">${currentUser.photo ? `<img class="profile-photo" src="${currentUser.photo}" alt="Admin profile photo">` : `<div class="profile-photo placeholder-photo">${escapeHTML(currentUser.name.slice(0, 1))}</div>`}<p>Profile photo</p></div><form id="admin-profile-form" class="form-grid"><label>Full name<input name="name" value="${escapeHTML(currentUser.name)}" required></label><label>Birthday<input type="date" name="birthday" value="${escapeHTML(currentUser.birthday)}"></label><label>Age<input type="number" min="0" name="age" value="${escapeHTML(currentUser.age)}"></label><label>Gender<select name="gender"><option value="">Choose</option>${["Female", "Male", "Other"].map((value) => `<option ${currentUser.gender === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label>Position<select name="position">${["Staff/Admin", "Doctor", "Nurse"].map((value) => `<option ${currentUser.position === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label>Home address<input name="address" value="${escapeHTML(currentUser.address)}"></label><label>Education background<input name="education" value="${escapeHTML(currentUser.education)}"></label><label>Employment ID / Medical staff no.<input name="employmentId" value="${escapeHTML(currentUser.employmentId)}"></label><label class="full-width">Profile picture<input id="profile-photo-input" type="file" accept="image/*"><span class="field-hint">Images are stored in this browser only.</span></label><div class="form-actions"><button class="primary-button" type="submit">Save profile</button><button class="secondary-button" type="button" data-clear-profile>Delete profile info</button></div></form></div>`;
	}

	function dayCheckboxes(selectedDays, availableOnly = false) {
		return DAY_NAMES.filter((day) => !availableOnly || store.availableDays.includes(day)).map((day) => `<label class="day-option"><input type="checkbox" name="days" value="${day}" ${selectedDays.includes(day) ? "checked" : ""}><span>${day}</span></label>`).join("");
	}

	function renderAdminSchedule() {
		return `<div class="section-heading"><div><p class="portal-kicker">CENTER AVAILABILITY</p><h2>Schedule</h2></div></div><div class="portal-panel"><h3>Available dialysis days</h3><p class="muted-copy">Green days will appear as available in the patient portal.</p><form id="availability-form"><div class="day-grid">${dayCheckboxes(store.availableDays)}</div><button class="primary-button" type="submit">Save availability</button></form></div><div class="portal-panel"><h3>Patient dialysis schedule</h3><form id="assignment-form" class="form-grid"><label>Patient<select name="patientId" id="schedule-patient-select">${patientOptions()}</select></label><div class="full-width"><span class="field-label">Choose available days</span><div id="assignment-days" class="day-grid">${dayCheckboxes(store.patients[0]?.dialysisDays || [], true)}</div></div><button class="primary-button" type="submit">Save patient schedule</button></form><div class="schedule-roster">${store.patients.map((patient) => `<div class="roster-row"><strong>${escapeHTML(patient.name)}</strong><span>${escapeHTML(patient.center || "Center not set")}</span><span>${(patient.dialysisDays || []).map(escapeHTML).join(", ") || "No days selected"}</span></div>`).join("")}</div></div>`;
	}

	function renderAdminAnnouncements() {
		return `<div class="section-heading"><div><p class="portal-kicker">PATIENT UPDATES</p><h2>Announcements</h2></div><span class="demo-chip">ADMIN POSTS · VISIBLE TO ALL PATIENTS</span></div><div class="portal-panel"><h3>Publish an announcement</h3><form id="announcement-form" class="form-grid"><label>Title<input name="title" required></label><label class="full-width">Update<textarea name="body" rows="4" required></textarea></label><button class="primary-button" type="submit">Publish announcement</button></form></div>${renderAnnouncementList(store.announcements, true)}`;
	}

	function renderAnnouncementList(announcements, adminView) {
		if (!announcements.length) return `<div class="portal-panel"><p class="empty-state">No announcements yet.</p></div>`;
		return `<div class="announcement-list">${announcements.map((announcement) => `<article class="portal-panel announcement-card"><div class="panel-heading"><div><p class="portal-kicker">${escapeHTML(announcement.date || announcement.createdAt || "")}</p><h3>${escapeHTML(announcement.title)}</h3></div>${adminView ? `<button class="table-action danger" data-delete-announcement="${escapeHTML(announcement.id)}">Delete</button>` : ""}</div><p>${escapeHTML(announcement.body)}</p><span class="muted-copy">Posted by ${escapeHTML(announcement.author || "DIACORE Admin")}</span></article>`).join("")}</div>`;
	}

	function renderAdminReports() {
		return `<div class="section-heading"><div><p class="portal-kicker">ACTIVITY LOG</p><h2>Reports</h2></div></div><div class="stat-grid"><article class="stat-card"><span>REGISTERED PATIENTS</span><strong>${store.patients.length}</strong></article><article class="stat-card"><span>UPDATES / EVENTS</span><strong>${store.audit.length}</strong></article><article class="stat-card"><span>UNREAD PATIENT NOTIFICATIONS</span><strong>${store.notifications.filter((note) => !note.read).length}</strong></article></div><div class="portal-panel"><h3>Recent patient and system updates</h3>${store.audit.length ? `<ul class="activity-list">${store.audit.map((entry) => `<li><span class="activity-mark"></span><div><strong>${escapeHTML(entry.text)}</strong><small>${escapeHTML(entry.date)}</small></div></li>`).join("")}</ul>` : `<p class="empty-state">No activity recorded.</p>`}</div>`;
	}

	function renderMessages(adminView) {
		if (adminView && !store.patients.some((patient) => patient.id === activeMessagePatientId)) activeMessagePatientId = store.patients[0]?.id;
		const threadMessages = store.messages.filter((message) => message.patientId === activeMessagePatientId);
		return `<div class="section-heading"><div><p class="portal-kicker">CARE TEAM</p><h2>Messages</h2></div></div><div class="portal-panel message-layout">${adminView ? `<label class="message-patient-select">Choose patient<select id="message-patient-select">${patientOptions(activeMessagePatientId)}</select></label>` : ""}<div class="message-thread" id="message-thread">${threadMessages.length ? threadMessages.map((message) => `<div class="message-bubble ${message.senderRole === role ? "mine" : "theirs"}"><span>${escapeHTML(message.senderName)}</span><p>${escapeHTML(message.text)}</p><small>${escapeHTML(message.sentAt)}</small></div>`).join("") : `<p class="empty-state">No messages yet. Start a conversation with the care team.</p>`}</div><form id="message-form" class="message-compose"><label class="visually-hidden" for="message-text">Message</label><textarea id="message-text" name="text" rows="2" placeholder="Write a message" required></textarea><button class="primary-button" type="submit">Send</button></form></div>`;
	}

	function renderPatientView(view) {
		if (view === "announcements") return `<div class="section-heading"><div><p class="portal-kicker">DIACORE UPDATES</p><h2>Announcements</h2></div></div>${renderAnnouncementList(store.announcements, false)}`;
		if (view === "profile") return renderPatientProfile();
		if (view === "notes") return renderPatientNotes();
		if (view === "schedule") return renderPatientSchedule();
		if (view === "billing") return renderPatientBilling();
		if (view === "notifications") return renderPatientNotifications();
		return renderMessages(false);
	}

	function renderPatientProfile() {
		return `<div class="section-heading"><div><p class="portal-kicker">YOUR INFORMATION</p><h2>Profile</h2></div></div><div class="portal-panel"><dl class="profile-details">${[["Full name", currentUser.name], ["Email", currentUser.email], ["Birthday", currentUser.birthday], ["Age", currentUser.age], ["Gender", currentUser.gender], ["Home address", currentUser.address], ["Dialysis type", currentUser.dialysisType], ["Center", currentUser.center]].map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHTML(value || "Not provided")}</dd></div>`).join("")}</dl><p class="field-hint">Your profile only. Contact an administrator to update your personal details.</p></div>`;
	}

	function renderPatientNotes() {
		const patientNotes = store.notes.filter((note) => note.patientId === currentUser.id);
		return `<div class="section-heading"><div><p class="portal-kicker">YOUR CARE RECORD</p><h2>Nurses notes</h2></div></div>${patientNotes.length ? `<div class="notes-list">${patientNotes.map((note) => `<article class="portal-panel note-card"><p class="portal-kicker">${escapeHTML(note.date)}</p><p>${escapeHTML(note.text)}</p></article>`).join("")}</div>` : `<div class="portal-panel"><p class="empty-state">There are no care notes for your account yet.</p></div>`}`;
	}

	function renderPatientSchedule() {
		const selectedDays = currentUser.dialysisDays || [];
		return `<div class="section-heading"><div><p class="portal-kicker">YOUR APPOINTMENTS</p><h2>Schedule</h2></div></div><div class="portal-panel"><p class="muted-copy">Available days at ${escapeHTML(currentUser.center || "your center")}</p><div class="day-grid patient-day-grid">${DAY_NAMES.map((day) => `<div class="day-option ${store.availableDays.includes(day) ? "available" : "unavailable"} ${selectedDays.includes(day) ? "selected" : ""}"><span>${day.slice(0, 3)}</span><strong>${store.availableDays.includes(day) ? (selectedDays.includes(day) ? "Your session" : "Available") : "Unavailable"}</strong></div>`).join("")}</div><form id="patient-schedule-form"><span class="field-label">Request your preferred dialysis days</span><div class="day-grid">${dayCheckboxes(selectedDays.filter((day) => store.availableDays.includes(day)), true)}</div><p class="field-hint">Only days marked available can be selected.</p><button class="primary-button" type="submit">Save preferences</button></form></div>`;
	}

	function renderPatientBilling() {
		const bills = store.bills.filter((bill) => bill.patientId === currentUser.id);
		return `<div class="section-heading"><div><p class="portal-kicker">YOUR ACCOUNT</p><h2>Billing</h2></div><span class="demo-chip">DEMO · NO PAYMENT IS CHARGED</span></div>${bills.length ? `<div class="patient-bill-list">${bills.map((bill) => `<article class="portal-panel patient-bill"><div class="panel-heading"><div><p class="portal-kicker">${escapeHTML(bill.updatedAt || "")}</p><h3>${escapeHTML(bill.description)}</h3></div><strong class="bill-amount">${formatMoney(bill.amount)}</strong></div><p>Status: <span class="status-tag ${bill.status === "Paid" ? "success" : "pending"}">${escapeHTML(bill.status)}</span></p><form class="patient-payment-form" data-bill-id="${escapeHTML(bill.id)}"><label>Method of payment<select name="method">${["Cash", "BPI", "PhilHealth", "BDO"].map((value) => `<option ${bill.method === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><button class="secondary-button" type="submit">Save payment method</button></form><p class="field-hint">Selecting a bank does not connect or charge a card in this demo.</p></article>`).join("")}</div>` : `<div class="portal-panel"><p class="empty-state">No bills are assigned to your account.</p></div>`}`;
	}

	function renderPatientNotifications() {
		const ownNotifications = store.notifications.filter((note) => note.patientId === currentUser.id);
		const pendingBills = store.bills.filter((bill) => bill.patientId === currentUser.id && bill.status === "Pending");
		const billNotices = pendingBills.map((bill) => ({ id: `bill-${bill.id}`, text: `You have a pending payment of ${formatMoney(bill.amount)} for ${bill.description}.`, date: bill.updatedAt }));
		const allNotifications = [...ownNotifications, ...billNotices];
		return `<div class="section-heading"><div><p class="portal-kicker">ACCOUNT ACTIVITY</p><h2>Notifications</h2></div></div><div class="portal-panel">${allNotifications.length ? `<ul class="activity-list">${allNotifications.map((note) => `<li><span class="activity-mark ${note.read ? "read" : ""}"></span><div><strong>${escapeHTML(note.text)}</strong><small>${escapeHTML(note.date)}</small></div></li>`).join("")}</ul>` : `<p class="empty-state">You're all caught up.</p>`}</div>`;
	}

	function bindViewEvents() {
		viewContainer.querySelectorAll("[data-go-view]").forEach((button) => button.addEventListener("click", () => {
			activeView = button.dataset.goView;
			renderView();
		}));

		const formHandlers = {
			"admin-profile-form": saveAdminProfile,
			"admin-patient-form": savePatient,
			"admin-bill-form": saveBill,
			"availability-form": saveAvailability,
			"assignment-form": saveAssignment,
			"announcement-form": saveAnnouncement,
			"admin-nursing-note-form": saveNursingNote,
			"message-form": sendMessage,
			"patient-schedule-form": savePatientSchedule
		};
		Object.entries(formHandlers).forEach(([id, handler]) => {
			const form = document.querySelector(`#${id}`);
			if (form) form.addEventListener("submit", handler);
		});

		viewContainer.querySelectorAll(".patient-payment-form").forEach((form) => form.addEventListener("submit", savePaymentMethod));
		viewContainer.querySelectorAll("[data-edit-patient]").forEach((button) => button.addEventListener("click", () => {
			const patient = store.patients.find((entry) => entry.id === button.dataset.editPatient);
			viewContainer.innerHTML = renderAdminPatients(patient);
			bindViewEvents();
		}));
		viewContainer.querySelectorAll("[data-delete-patient]").forEach((button) => button.addEventListener("click", () => deletePatient(button.dataset.deletePatient)));
		viewContainer.querySelectorAll("[data-cancel-patient-edit]").forEach((button) => button.addEventListener("click", renderView));
		viewContainer.querySelectorAll("[data-edit-bill]").forEach((button) => button.addEventListener("click", () => {
			const bill = store.bills.find((entry) => entry.id === button.dataset.editBill);
			viewContainer.innerHTML = renderAdminBilling(bill);
			bindViewEvents();
		}));
		viewContainer.querySelectorAll("[data-delete-bill]").forEach((button) => button.addEventListener("click", () => deleteBill(button.dataset.deleteBill)));
		viewContainer.querySelectorAll("[data-cancel-bill-edit]").forEach((button) => button.addEventListener("click", renderView));
		viewContainer.querySelectorAll("[data-delete-announcement]").forEach((button) => button.addEventListener("click", () => deleteAnnouncement(button.dataset.deleteAnnouncement)));
		viewContainer.querySelectorAll("[data-delete-nursing-note]").forEach((button) => button.addEventListener("click", () => deleteNursingNote(button.dataset.deleteNursingNote)));
		const patientSelect = document.querySelector("#schedule-patient-select");
		if (patientSelect) patientSelect.addEventListener("change", () => {
			const patient = store.patients.find((entry) => entry.id === patientSelect.value);
			document.querySelector("#assignment-days").innerHTML = dayCheckboxes(patient?.dialysisDays || [], true);
		});
		const messagePatientSelect = document.querySelector("#message-patient-select");
		if (messagePatientSelect) messagePatientSelect.addEventListener("change", () => {
			activeMessagePatientId = messagePatientSelect.value;
			renderView();
		});
		const photoInput = document.querySelector("#profile-photo-input");
		if (photoInput) photoInput.addEventListener("change", readProfilePhoto);
		const clearProfileButton = document.querySelector("[data-clear-profile]");
		if (clearProfileButton) clearProfileButton.addEventListener("click", clearAdminProfile);
	}

	function readProfilePhoto(event) {
		const file = event.target.files?.[0];
		if (!file) return;
		if (file.size > 500000) {
			window.alert("Please choose a profile image smaller than 500 KB.");
			event.target.value = "";
			return;
		}
		const reader = new FileReader();
		reader.addEventListener("load", () => { profilePhotoDraft = String(reader.result); });
		reader.readAsDataURL(file);
	}

	function saveAdminProfile(event) {
		event.preventDefault();
		const data = Object.fromEntries(new FormData(event.currentTarget));
		Object.assign(currentUser, data, { photo: profilePhotoDraft });
		addAudit(store, `Admin profile updated: ${currentUser.name}`);
		saveStore(store);
		renderView();
	}

	function clearAdminProfile() {
		Object.assign(currentUser, { name: currentUser.username, birthday: "", age: "", gender: "", position: "Admin", address: "", education: "", employmentId: "", photo: "" });
		profilePhotoDraft = "";
		addAudit(store, `Admin profile cleared: ${currentUser.username}`);
		saveStore(store);
		renderView();
	}

	function savePatient(event) {
		event.preventDefault();
		const data = Object.fromEntries(new FormData(event.currentTarget));
		const existing = store.patients.find((patient) => patient.id === data.patientId);
		if (existing) {
			Object.assign(existing, data);
			addAudit(store, `Patient information updated: ${existing.name}`);
		} else {
			const patient = { ...data, id: makeId("patient"), password: "", dialysisDays: [], registeredAt: new Date().toISOString().slice(0, 10) };
			store.patients.push(patient);
			addAudit(store, `Patient record added: ${patient.name}`);
		}
		saveStore(store);
		renderView();
	}

	function saveNursingNote(event) {
		event.preventDefault();
		const data = Object.fromEntries(new FormData(event.currentTarget));
		const patient = store.patients.find((entry) => entry.id === data.patientId);
		if (!patient) return;
		store.notes.unshift({ id: makeId("note"), patientId: patient.id, date: data.date, text: data.text.trim() });
		addNotification(store, patient.id, "A new nursing note has been added to your care record.");
		addAudit(store, `Nursing note added for ${patient.name}`);
		saveStore(store);
		renderView();
	}

	function deleteNursingNote(noteId) {
		const note = store.notes.find((entry) => entry.id === noteId);
		if (!note || !window.confirm(`Delete the nursing note for ${patientName(note.patientId)}?`)) return;
		store.notes = store.notes.filter((entry) => entry.id !== noteId);
		addAudit(store, `Nursing note deleted for ${patientName(note.patientId)}`);
		saveStore(store);
		renderView();
	}

	function deletePatient(patientId) {
		const patient = store.patients.find((entry) => entry.id === patientId);
		if (!patient || !window.confirm(`Delete ${patient.name} and their demo records?`)) return;
		store.patients = store.patients.filter((entry) => entry.id !== patientId);
		store.notes = store.notes.filter((entry) => entry.patientId !== patientId);
		store.bills = store.bills.filter((entry) => entry.patientId !== patientId);
		store.messages = store.messages.filter((entry) => entry.patientId !== patientId);
		store.notifications = store.notifications.filter((entry) => entry.patientId !== patientId);
		addAudit(store, `Patient record deleted: ${patient.name}`);
		saveStore(store);
		renderView();
	}

	function saveBill(event) {
		event.preventDefault();
		const data = Object.fromEntries(new FormData(event.currentTarget));
		const existing = store.bills.find((bill) => bill.id === data.billId);
		const billData = { patientId: data.patientId, description: data.description, amount: Number(data.amount), status: data.status, method: data.method, updatedAt: new Date().toISOString().slice(0, 10) };
		if (existing) Object.assign(existing, billData);
		else store.bills.unshift({ ...billData, id: makeId("bill") });
		const patient = store.patients.find((entry) => entry.id === data.patientId);
		addNotification(store, data.patientId, `Your bill was updated by DIACORE: ${formatMoney(data.amount)} (${data.status}).`);
		addAudit(store, `Bill updated for ${patient?.name || "patient"}`);
		saveStore(store);
		renderView();
	}

	function deleteBill(billId) {
		const bill = store.bills.find((entry) => entry.id === billId);
		if (!bill || !window.confirm("Delete this bill?")) return;
		store.bills = store.bills.filter((entry) => entry.id !== billId);
		addNotification(store, bill.patientId, `A bill for ${bill.description} was removed from your account.`);
		addAudit(store, `Bill deleted for ${patientName(bill.patientId)}`);
		saveStore(store);
		renderView();
	}

	function saveAvailability(event) {
		event.preventDefault();
		store.availableDays = new FormData(event.currentTarget).getAll("days");
		addAudit(store, `Available schedule updated: ${store.availableDays.join(", ") || "no days"}`);
		store.patients.forEach((patient) => {
			patient.dialysisDays = (patient.dialysisDays || []).filter((day) => store.availableDays.includes(day));
		});
		saveStore(store);
		renderView();
	}

	function saveAssignment(event) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const patient = store.patients.find((entry) => entry.id === formData.get("patientId"));
		if (!patient) return;
		patient.dialysisDays = formData.getAll("days").filter((day) => store.availableDays.includes(day));
		addNotification(store, patient.id, `Your dialysis schedule was updated: ${patient.dialysisDays.join(", ") || "Please contact your center."}`);
		addAudit(store, `Dialysis schedule updated for ${patient.name}`);
		saveStore(store);
		renderView();
	}

	function savePatientSchedule(event) {
		event.preventDefault();
		currentUser.dialysisDays = new FormData(event.currentTarget).getAll("days").filter((day) => store.availableDays.includes(day));
		addNotification(store, currentUser.id, `Your schedule preference was saved: ${currentUser.dialysisDays.join(", ") || "No days selected"}.`);
		addAudit(store, `Schedule preference saved by ${currentUser.name}`);
		saveStore(store);
		renderView();
	}

	function saveAnnouncement(event) {
		event.preventDefault();
		const data = Object.fromEntries(new FormData(event.currentTarget));
		const announcement = { id: makeId("announcement"), title: data.title, body: data.body, createdAt: new Date().toISOString().slice(0, 10), author: currentUser.name };
		store.announcements.unshift(announcement);
		store.patients.forEach((patient) => addNotification(store, patient.id, `New announcement: ${announcement.title}`));
		addAudit(store, `Announcement posted: ${announcement.title}`);
		saveStore(store);
		renderView();
	}

	function deleteAnnouncement(announcementId) {
		const announcement = store.announcements.find((entry) => entry.id === announcementId);
		if (!announcement || !window.confirm("Delete this announcement?")) return;
		store.announcements = store.announcements.filter((entry) => entry.id !== announcementId);
		addAudit(store, `Announcement deleted: ${announcement.title}`);
		saveStore(store);
		renderView();
	}

	function sendMessage(event) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const text = String(formData.get("text")).trim();
		if (!text || !activeMessagePatientId) return;
		store.messages.push({ id: makeId("message"), patientId: activeMessagePatientId, senderId: currentUser.id, senderRole: role, senderName: currentUser.name, text, sentAt: new Date().toLocaleString() });
		if (role === "admin") addNotification(store, activeMessagePatientId, `New message from ${currentUser.name}.`);
		addAudit(store, `Message sent ${role === "admin" ? `to ${patientName(activeMessagePatientId)}` : `by ${currentUser.name}`}`);
		saveStore(store);
		renderView();
	}

	function savePaymentMethod(event) {
		event.preventDefault();
		const billId = event.currentTarget.dataset.billId;
		const bill = store.bills.find((entry) => entry.id === billId && entry.patientId === currentUser.id);
		if (!bill) return;
		const method = new FormData(event.currentTarget).get("method");
		bill.method = method;
		bill.updatedAt = new Date().toISOString().slice(0, 10);
		const notice = method === "Cash"
			? "Cash selected as your demo payment method. No payment was processed."
			: `${method} selected as your demo payment method. No bank or card was connected or charged.`;
		addNotification(store, currentUser.id, notice);
		addAudit(store, `Payment method ${method} selected by ${currentUser.name}`);
		saveStore(store);
		renderView();
	}

	renderView();
}
