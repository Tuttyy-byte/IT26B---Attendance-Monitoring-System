// Attendance Monitoring System
class AttendanceSystem {
    constructor() {
        this.students = [];
        this.attendance = {};
        this.courses = [];
        this.apiUrl = 'api/';
        this.init();
    }

    async init() {
        // Check if user is logged in
        if (!this.checkSession()) {
            return;
        }
        
        await this.loadData();
        this.setupEventListeners();
        this.setupLogout(); // Add logout setup
        this.displayUserInfo(); // Display user info
        this.renderDashboard();
        this.renderStudents();
        this.setupDatePicker();
        this.updateDateDisplay();
        await this.loadCourses();
    }

    // Check if user is logged in
    checkSession() {
        const loggedInUser = localStorage.getItem('nexus_logged_in_user');
        if (!loggedInUser) {
            // No user logged in, redirect to login
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    // Display logged-in user info
    displayUserInfo() {
        const userInfoDiv = document.getElementById('userInfo');
        if (userInfoDiv) {
            const loggedInUser = localStorage.getItem('nexus_logged_in_user');
            if (loggedInUser) {
                try {
                    const user = JSON.parse(loggedInUser);
                    userInfoDiv.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 8px; flex-direction: column;">
                            <span>👤</span>
                            <span style="font-size: 0.75rem;">${this.escapeHtml(user.fullname || user.email)}</span>
                        </div>
                    `;
                } catch(e) {
                    console.error('Error parsing user info:', e);
                }
            }
        }
    }

    // Setup logout functionality
    setupLogout() {
        // Check for logout button in sidebar footer
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Check for logout nav item
        const logoutNavBtn = document.getElementById('logoutNavBtn');
        if (logoutNavBtn) {
            logoutNavBtn.addEventListener('click', () => this.logout());
        }
    }

    // Logout method
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear session data
            localStorage.removeItem('nexus_logged_in_user');
            localStorage.removeItem('rem_nexus_email');
            localStorage.removeItem('rem_nexus_flag');
            
            // Optional: Call logout API to end server session
            fetch(this.apiUrl + 'logout.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).catch(error => console.error('Logout API error:', error));
            
            // Redirect to login page
            window.location.href = 'index.html';
        }
    }

    async loadData() {
        await this.loadStudents();
        await this.loadCourses();
    }

    async loadStudents() {
        try {
            const response = await fetch(this.apiUrl + 'get_students.php');
            this.students = await response.json();
            this.saveToLocalStorage();
        } catch(error) {
            console.error('Error loading students:', error);
            this.students = this.getSampleData();
        }
    }

    async loadCourses() {
        try {
            const response = await fetch(this.apiUrl + 'get_courses.php');
            this.courses = await response.json();
            this.populateCourseSelect();
            this.renderCourseList();
        } catch(error) {
            console.error('Error loading courses:', error);
            this.courses = ['Computer Science', 'Information Technology', 'Engineering', 'Business Administration'];
            this.populateCourseSelect();
            this.renderCourseList();
        }
    }

    getSampleData() {
        return [
            { id: 'CS001', name: 'John Smith', course: 'Computer Science', year: '3rd Year', email: 'john@university.com', attendance_percentage: 85 },
            { id: 'CS002', name: 'Emma Johnson', course: 'Computer Science', year: '3rd Year', email: 'emma@university.com', attendance_percentage: 92 },
            { id: 'IT001', name: 'Michael Brown', course: 'Information Technology', year: '2nd Year', email: 'michael@university.com', attendance_percentage: 78 },
            { id: 'IT002', name: 'Sarah Wilson', course: 'Information Technology', year: '2nd Year', email: 'sarah@university.com', attendance_percentage: 65 },
            { id: 'ENG001', name: 'David Lee', course: 'Engineering', year: '4th Year', email: 'david@university.com', attendance_percentage: 45 }
        ];
    }

    saveToLocalStorage() {
        localStorage.setItem('attendance_students', JSON.stringify(this.students));
        localStorage.setItem('attendance_courses', JSON.stringify(this.courses));
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.nav-item').forEach(btn => {
            if (btn.id !== 'logoutNavBtn') { // Skip logout button
                btn.addEventListener('click', (e) => this.switchTab(btn.dataset.tab));
            }
        });

        // Add student
        const addBtn = document.getElementById('addStudentBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showStudentModal());
        }
        
        const studentForm = document.getElementById('studentForm');
        if (studentForm) {
            studentForm.addEventListener('submit', (e) => this.saveStudent(e));
        }
        
        // Search
        const searchInput = document.getElementById('searchStudent');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchStudents(e.target.value));
        }
        
        // Attendance
        const loadBtn = document.getElementById('loadAttendanceBtn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.loadAttendanceForDate());
        }
        
        const saveBtn = document.getElementById('saveAttendanceBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAttendance());
        }
        
        // Settings
        const addCourseBtn = document.getElementById('addCourseBtn');
        if (addCourseBtn) {
            addCourseBtn.addEventListener('click', () => this.addCourse());
        }
        
        const resetBtn = document.getElementById('resetDataBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetData());
        }
        
        const exportBtn = document.getElementById('exportAllDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAllData());
        }
        
        // Modal close
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) this.closeModal();
        });
    }

    switchTab(tabId) {
        // Update active states
        document.querySelectorAll('.nav-item').forEach(btn => {
            if (btn.id !== 'logoutNavBtn') {
                btn.classList.toggle('active', btn.dataset.tab === tabId);
            }
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });
        
        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            students: 'Student Management',
            'mark-attendance': 'Mark Attendance',
            settings: 'System Settings'
        };
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titles[tabId] || 'Dashboard';
        }
        
        // Refresh data based on tab
        if (tabId === 'students') this.renderStudents();
        if (tabId === 'dashboard') this.renderDashboard();
    }

async renderDashboard() {
    try {
        console.log('Fetching dashboard stats...');
        const response = await fetch(this.apiUrl + 'get_dashboard_stats.php');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stats = await response.json();
        console.log('Dashboard stats received:', stats);
        
        // Update stat cards
        const totalStudentsEl = document.getElementById('totalStudents');
        const todayAttendanceEl = document.getElementById('todayAttendance');
        const overallAvgEl = document.getElementById('overallAvg');
        const lowAttendanceCountEl = document.getElementById('lowAttendanceCount');
        
        if (totalStudentsEl) totalStudentsEl.textContent = stats.total_students || 0;
        if (todayAttendanceEl) todayAttendanceEl.textContent = `${stats.today_attendance || 0}%`;
        if (overallAvgEl) overallAvgEl.textContent = `${stats.overall_average || 0}%`;
        if (lowAttendanceCountEl) lowAttendanceCountEl.textContent = stats.low_attendance_count || 0;
        
        // Render low attendance table
        const tbody = document.querySelector('#lowAttendanceTable tbody');
        if (tbody) {
            let lowStudents = [];
            
            // Try to get low students from API response
            if (stats.low_attendance_students && Array.isArray(stats.low_attendance_students) && stats.low_attendance_students.length > 0) {
                lowStudents = stats.low_attendance_students;
                console.log('Using low students from API:', lowStudents);
            } 
            // Fallback: calculate from local students array
            else if (this.students && this.students.length > 0) {
                lowStudents = this.students.filter(s => {
                    const percentage = s.attendance_percentage || s.percentage || 0;
                    return percentage > 0 && percentage < 75;
                });
                console.log('Using fallback low students from local data:', lowStudents);
            }
            
            if (!lowStudents || lowStudents.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 40px; color: #48bb78;">
                            ✅ No students with low attendance! All students are above 75%.
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = lowStudents.map(s => `
                    <tr>
                        <td>${this.escapeHtml(s.id)}</td>
                        <td>${this.escapeHtml(s.name)}</td>
                        <td>${this.escapeHtml(s.course)}</td>
                        <td style="color: #e53e3e; font-weight: bold;">
                            ${s.percentage || s.attendance_percentage || 0}%
                        </td>
                    </tr>
                `).join('');
            }
        }
        
        // Render chart
        if (stats.trend_data && Array.isArray(stats.trend_data) && stats.trend_data.length > 0) {
            this.renderAttendanceChart(stats.trend_data);
        } else {
            console.warn('No trend data available for chart');
        }
        
    } catch(error) {
        console.error('Error loading dashboard:', error);
        
        // Show error message in table
        const tbody = document.querySelector('#lowAttendanceTable tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px; color: #e53e3e;">
                        ⚠️ Error loading low attendance data: ${error.message}<br>
                        Please check if the database has attendance records.
                    </td>
                </tr>
            `;
        }
        
        // Still update stat cards with local data if available
        const totalStudentsEl = document.getElementById('totalStudents');
        if (totalStudentsEl && this.students) {
            totalStudentsEl.textContent = this.students.length;
        }
    }
}

renderAttendanceChart(trendData) {
    const ctx = document.getElementById('attendanceChart')?.getContext('2d');
    
    // Check if chart exists and destroy it safely
    if (ctx && window.attendanceChart && typeof window.attendanceChart.destroy === 'function') {
        try {
            window.attendanceChart.destroy();
        } catch(e) {
            console.warn('Error destroying chart:', e);
        }
        window.attendanceChart = null;
    }
    
    if (ctx && trendData && trendData.length > 0) {
        try {
            window.attendanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trendData.map(d => d.date ? d.date.slice(5) : ''),
                    datasets: [{
                        label: 'Attendance Rate (%)',
                        data: trendData.map(d => d.rate || 0),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: false }
                    },
                    scales: {
                        y: { 
                            min: 0, 
                            max: 100, 
                            title: { display: true, text: 'Attendance %' } 
                        }
                    }
                }
            });
        } catch(e) {
            console.error('Error creating chart:', e);
        }
    }
}

    renderStudents() {
        const tbody = document.getElementById('studentsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = this.students.map(student => `
            <tr>
                <td>${this.escapeHtml(student.id)}</td>
                <td>${this.escapeHtml(student.name)}</td>
                <td>${this.escapeHtml(student.course)}</td>
                <td>${this.escapeHtml(student.year)}</td>
                <td>${this.escapeHtml(student.email)}</td>
                <td><strong style="color: ${(student.attendance_percentage || 0) >= 75 ? '#48bb78' : '#e53e3e'}">${student.attendance_percentage || 0}%</strong></td>
                <td>
                    <button class="edit-btn" data-id="${this.escapeHtml(student.id)}" style="margin-right:5px; padding:5px 10px; cursor:pointer; background:#667eea; color:white; border:none; border-radius:5px;">✏️ Edit</button>
                    <button class="delete-btn" data-id="${this.escapeHtml(student.id)}" style="padding:5px 10px; background:#e53e3e; color:white; border:none; border-radius:5px; cursor:pointer;">🗑️ Delete</button>
                 </td>
             </tr>
        `).join('');
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                this.editStudent(id);
            });
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                this.deleteStudent(id);
            });
        });
    }
    
    escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    getStudentAttendancePercentage(studentId) {
        const student = this.students.find(s => s.id === studentId);
        return student ? (student.attendance_percentage || 0) : 0;
    }

    showStudentModal(editMode = false, student = null) {
        const modal = document.getElementById('studentModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('studentForm');
        
        if (!modal) return;
        
        // Make sure course dropdown is populated
        this.populateCourseSelect();
        
        if (editMode && student) {
            modalTitle.textContent = 'Edit Student';
            document.getElementById('studentId').value = student.id;
            document.getElementById('studentName').value = student.name;
            document.getElementById('studentNumber').value = student.id;
            document.getElementById('studentCourse').value = student.course;
            document.getElementById('studentYear').value = student.year;
            document.getElementById('studentEmail').value = student.email;
        } else {
            modalTitle.textContent = 'Add Student';
            if (form) form.reset();
            const studentIdField = document.getElementById('studentId');
            if (studentIdField) studentIdField.value = '';
            const studentNumberField = document.getElementById('studentNumber');
            if (studentNumberField) studentNumberField.value = '';
        }
        
        modal.style.display = 'block';
    }

    async saveStudent(e) {
        e.preventDefault();
        const studentId = document.getElementById('studentId').value;
        const student = {
            id: document.getElementById('studentNumber').value,
            name: document.getElementById('studentName').value,
            course: document.getElementById('studentCourse').value,
            year: document.getElementById('studentYear').value,
            email: document.getElementById('studentEmail').value
        };
        
        if (!student.id || !student.name) {
            alert('Please fill in all required fields');
            return;
        }
        
        const result = await this.saveStudentToDB(student);
        
        if(result.success) {
            await this.loadStudents();
            this.renderStudents();
            this.renderDashboard();
            this.closeModal();
            document.getElementById('studentForm').reset();
            alert('Student saved successfully!');
        } else {
            alert('Failed to save student: ' + (result.message || 'Unknown error'));
        }
    }

    async saveStudentToDB(student) {
        try {
            const response = await fetch(this.apiUrl + 'add_student.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(student)
            });
            return await response.json();
        } catch(error) {
            console.error('Error saving student:', error);
            return { success: false, message: 'Network error' };
        }
    }

    editStudent(id) {
        const student = this.students.find(s => s.id === id);
        if (student) this.showStudentModal(true, student);
    }

    async deleteStudent(id) {
        if (confirm('Are you sure you want to delete this student?')) {
            try {
                const response = await fetch(this.apiUrl + 'delete_student.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id })
                });
                const result = await response.json();
                
                if(result.success) {
                    await this.loadStudents();
                    this.renderStudents();
                    this.renderDashboard();
                    alert('Student deleted successfully!');
                } else {
                    alert('Failed to delete student');
                }
            } catch(error) {
                console.error('Error deleting student:', error);
                alert('Error deleting student');
            }
        }
    }

    searchStudents(query) {
        if (!query) {
            this.renderStudents();
            return;
        }
        
        const filtered = this.students.filter(s => 
            s.name.toLowerCase().includes(query.toLowerCase()) || 
            s.id.toLowerCase().includes(query.toLowerCase())
        );
        const tbody = document.getElementById('studentsTableBody');
        if (tbody) {
            tbody.innerHTML = filtered.map(student => `
                <tr>
                    <td>${this.escapeHtml(student.id)}</td>
                    <td>${this.escapeHtml(student.name)}</td>
                    <td>${this.escapeHtml(student.course)}</td>
                    <td>${this.escapeHtml(student.year)}</td>
                    <td>${this.escapeHtml(student.email)}</td>
                    <td>${student.attendance_percentage || 0}%</td>
                    <td>
                        <button class="edit-btn" data-id="${this.escapeHtml(student.id)}" style="margin-right:5px; padding:5px 10px; cursor:pointer; background:#667eea; color:white; border:none; border-radius:5px;">✏️ Edit</button>
                        <button class="delete-btn" data-id="${this.escapeHtml(student.id)}" style="padding:5px 10px; background:#e53e3e; color:white; border:none; border-radius:5px; cursor:pointer;">🗑️ Delete</button>
                     </td>
                 </tr>
            `).join('');
            
            // Re-attach event listeners for filtered results
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    this.editStudent(id);
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    this.deleteStudent(id);
                });
            });
        }
    }

    setupDatePicker() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('attendanceDate');
        if (dateInput) {
            dateInput.value = today;
        }
    }

async loadAttendanceForDate() {
    const date = document.getElementById('attendanceDate').value;
    if (!date) {
        alert('Please select a date first');
        return;
    }
    
    // Show loading indicator
    const loadBtn = document.getElementById('loadAttendanceBtn');
    const originalText = loadBtn.textContent;
    loadBtn.textContent = '⏳ Loading...';
    loadBtn.disabled = true;
    
    try {
        const response = await fetch(`${this.apiUrl}get_attendance.php?date=${date}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const attendanceData = await response.json();
        const tbody = document.getElementById('attendanceTableBody');
        
        if (!tbody) return;
        
        if (this.students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No students found. Please add students first.</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.students.map(student => {
            // Find attendance record for this student
            const record = attendanceData.find(a => a.student_id === student.id);
            return `
                <tr>
                    <td>${this.escapeHtml(student.id)}</td>
                    <td>${this.escapeHtml(student.name)}</td>
                    <td>${this.escapeHtml(student.course)}</td>
                    <td>
                        <select class="attendance-status" data-id="${student.id}" style="padding: 8px; border-radius: 5px; border: 1px solid #ddd;">
                            <option value="present" ${record && record.status === 'present' ? 'selected' : ''}>✅ Present</option>
                            <option value="absent" ${record && record.status === 'absent' ? 'selected' : ''}>❌ Absent</option>
                            <option value="late" ${record && record.status === 'late' ? 'selected' : ''}>⏰ Late</option>
                        </select>
                    </td>
                    <td>
                        <input type="text" class="attendance-remarks" data-id="${student.id}" 
                               value="${record && record.remarks ? this.escapeHtml(record.remarks) : ''}" 
                               placeholder="Optional remarks" 
                               style="width:100%; padding:8px; border:1px solid #ddd; border-radius:5px;">
                    </td>
                </tr>
            `;
        }).join('');
        
        alert(`Loaded attendance for ${date}`);
    } catch(error) {
        console.error('Error loading attendance:', error);
        alert('Error loading attendance data: ' + error.message);
    } finally {
        // Restore button
        loadBtn.textContent = originalText;
        loadBtn.disabled = false;
    }
}
async saveAttendance() {
    const date = document.getElementById('attendanceDate').value;
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    // Show loading indicator
    const saveBtn = document.getElementById('saveAttendanceBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '💾 Saving...';
    saveBtn.disabled = true;
    
    try {
        const attendanceRecord = {};
        
        // Collect attendance statuses
        document.querySelectorAll('.attendance-status').forEach(select => {
            const studentId = select.getAttribute('data-id');
            attendanceRecord[studentId] = {
                status: select.value,
                remarks: ''
            };
        });
        
        // Collect remarks
        document.querySelectorAll('.attendance-remarks').forEach(input => {
            const studentId = input.getAttribute('data-id');
            if (attendanceRecord[studentId]) {
                attendanceRecord[studentId].remarks = input.value;
            }
        });
        
        console.log('Saving attendance:', { date, attendanceRecord });
        
        const response = await fetch(this.apiUrl + 'save_attendance.php', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                date: date, 
                attendance: attendanceRecord 
            })
        });
        
        const result = await response.json();
        console.log('Server response:', result);
        
        if (result.success) {
            await this.renderDashboard();
            alert(result.message || `Attendance for ${date} saved successfully!`);
        } else {
            alert('Failed to save attendance: ' + (result.message || 'Unknown error'));
        }
    } catch(error) {
        console.error('Error saving attendance:', error);
        alert('Error saving attendance: ' + error.message);
    } finally {
        // Restore button
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

    exportAllData() {
        // Export students data
        const studentsCSV = this.convertToCSV(this.students);
        this.downloadCSV(studentsCSV, 'students_data.csv');
        
        // Export attendance data
        this.exportAttendanceData();
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const csvRows = [];
        csvRows.push(headers.join(','));
        
        for (const row of data) {
            const values = headers.map(header => {
                const val = row[header] || '';
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    }

    async exportAttendanceData() {
        try {
            const response = await fetch(this.apiUrl + 'get_attendance.php?date=all');
            const attendanceData = await response.json();
            const csv = this.convertToCSV(attendanceData);
            this.downloadCSV(csv, 'attendance_records.csv');
        } catch(error) {
            console.error('Error exporting attendance:', error);
        }
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    async addCourse() {
        const newCourseInput = document.getElementById('newCourse');
        const newCourse = newCourseInput ? newCourseInput.value.trim() : '';
        
        if (newCourse && !this.courses.includes(newCourse)) {
            try {
                const response = await fetch(this.apiUrl + 'add_course.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ course_name: newCourse })
                });
                const result = await response.json();
                
                if(result.success) {
                    await this.loadCourses();
                    if (newCourseInput) newCourseInput.value = '';
                    alert('Course added successfully!');
                } else {
                    alert('Failed to add course: ' + result.message);
                }
            } catch(error) {
                console.error('Error adding course:', error);
                alert('Error adding course');
            }
        } else if (newCourse) {
            alert('Course already exists!');
        } else {
            alert('Please enter a course name');
        }
    }

    renderCourseList() {
        const container = document.getElementById('courseList');
        if (!container) return;
        
        container.innerHTML = this.courses.map(course => `
            <div class="course-tag">
                ${this.escapeHtml(course)}
                <button onclick="attendanceSystem.removeCourse('${this.escapeHtml(course)}')">×</button>
            </div>
        `).join('');
    }

    async removeCourse(course) {
        if (confirm(`Remove ${course}? This will affect students enrolled in this course.`)) {
            try {
                const response = await fetch(this.apiUrl + 'delete_course.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ course_name: course })
                });
                const result = await response.json();
                
                if(result.success) {
                    await this.loadCourses();
                    await this.loadStudents(); // Reload students as well
                    this.renderStudents();
                    this.renderDashboard();
                    alert('Course removed successfully!');
                } else {
                    alert('Failed to remove course: ' + (result.message || 'Unknown error'));
                }
            } catch(error) {
                console.error('Error removing course:', error);
                alert('Error removing course');
            }
        }
    }

    populateCourseSelect() {
        const select = document.getElementById('studentCourse');
        if (select) {
            if (this.courses.length > 0) {
                select.innerHTML = this.courses.map(c => `<option value="${this.escapeHtml(c)}">${this.escapeHtml(c)}</option>`).join('');
            } else {
                select.innerHTML = '<option value="">No courses available</option>';
            }
        }
    }

    resetData() {
        if (confirm('⚠️ WARNING: This will delete ALL data from the database. Are you absolutely sure?')) {
            if (confirm('Last chance! This action cannot be undone. Click OK to delete all data.')) {
                this.performReset();
            }
        }
    }

    async performReset() {
        try {
            const response = await fetch(this.apiUrl + 'reset_data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            
            if(result.success) {
                alert('All data has been reset successfully!');
                location.reload();
            } else {
                alert('Failed to reset data: ' + result.message);
            }
        } catch(error) {
            console.error('Error resetting data:', error);
            alert('Error resetting data');
        }
    }

    updateDateDisplay() {
        const update = () => {
            const now = new Date();
            const dateDisplay = document.getElementById('selectedDateDisplay');
            if (dateDisplay) {
                dateDisplay.textContent = now.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            }
        };
        update();
        setInterval(update, 60000);
    }

    closeModal() {
        const modal = document.getElementById('studentModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Make attendanceSystem globally available
let attendanceSystem;

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    attendanceSystem = new AttendanceSystem();
    window.attendanceSystem = attendanceSystem;
});