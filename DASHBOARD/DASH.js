class AttendanceSystem {
  constructor() {
    this.students = [];
    this.attendance = {};
    this.courses = [];
    this.apiUrl = "api/";
    this.init();
  }

  async init() {
    if (!this.checkSession()) {
      return;
    }

    await this.loadData();
    this.setupEventListeners();
    this.setupLogout();
    this.renderDashboard();
    this.renderStudents();
    this.setupDatePicker();
    this.updateDateDisplay();
    await this.loadCourses();
  }

  checkSession() {
    const loggedInUser = localStorage.getItem("nexus_logged_in_user");
    if (!loggedInUser) {
      window.location.href = "index.html";
      return false;
    }
    return true;
  }

  setupLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.logout());
    }

    const logoutNavBtn = document.getElementById("logoutNavBtn");
    if (logoutNavBtn) {
      logoutNavBtn.addEventListener("click", () => this.logout());
    }
  }

  logout() {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("nexus_logged_in_user");
      localStorage.removeItem("rem_nexus_email");
      localStorage.removeItem("rem_nexus_flag");

      fetch(this.apiUrl + "logout.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch((error) => console.error("Logout API error:", error));

      window.location.href = "index.html";
    }
  }

  async loadData() {
    await this.loadStudents();
    await this.loadCourses();
  }

  async loadStudents() {
    try {
      const response = await fetch(
        this.apiUrl + "get_students.php?t=" + Date.now(),
      );
      this.students = await response.json();
      this.saveToLocalStorage();

      const activeTab = document.querySelector(".tab-content.active")?.id;
      if (activeTab === "students-tab") {
        this.renderStudents();
      }

      if (activeTab === "dashboard-tab") {
        await this.renderDashboard();
      }

      console.log("Students loaded with updated percentages:", this.students);
    } catch (error) {
      console.error("Error loading students:", error);
      this.students = this.getSampleData();
    }
  }

  async loadCourses() {
    try {
      const response = await fetch(this.apiUrl + "get_courses.php");
      this.courses = await response.json();
      this.populateCourseSelect();
      this.renderCourseList();
    } catch (error) {
      console.error("Error loading courses:", error);
      this.courses = [
        "Computer Science",
        "Information Technology",
        "Engineering",
        "Business Administration",
      ];
      this.populateCourseSelect();
      this.renderCourseList();
    }
  }

  getSampleData() {
    return [
      {
        id: "CS001",
        name: "John Smith",
        course: "Computer Science",
        year: "3rd Year",
        email: "john@university.com",
        attendance_percentage: 85,
        total_days: 10,
        present_days: 9,
      },
      {
        id: "CS002",
        name: "Emma Johnson",
        course: "Computer Science",
        year: "3rd Year",
        email: "emma@university.com",
        attendance_percentage: 92,
        total_days: 10,
        present_days: 9,
      },
      {
        id: "IT001",
        name: "Michael Brown",
        course: "Information Technology",
        year: "2nd Year",
        email: "michael@university.com",
        attendance_percentage: 78,
        total_days: 10,
        present_days: 8,
      },
      {
        id: "IT002",
        name: "Sarah Wilson",
        course: "Information Technology",
        year: "2nd Year",
        email: "sarah@university.com",
        attendance_percentage: 65,
        total_days: 10,
        present_days: 7,
      },
      {
        id: "ENG001",
        name: "David Lee",
        course: "Engineering",
        year: "4th Year",
        email: "david@university.com",
        attendance_percentage: 45,
        total_days: 10,
        present_days: 5,
      },
    ];
  }

  saveToLocalStorage() {
    localStorage.setItem("attendance_students", JSON.stringify(this.students));
    localStorage.setItem("attendance_courses", JSON.stringify(this.courses));
  }

  setupEventListeners() {
    document.querySelectorAll(".nav-item").forEach((btn) => {
      if (btn.id !== "logoutNavBtn") {
        btn.addEventListener("click", (e) => this.switchTab(btn.dataset.tab));
      }
    });

    const addBtn = document.getElementById("addStudentBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => this.showStudentModal());
    }

    const studentForm = document.getElementById("studentForm");
    if (studentForm) {
      studentForm.addEventListener("submit", (e) => this.saveStudent(e));
    }

    const searchInput = document.getElementById("searchStudent");
    if (searchInput) {
      searchInput.addEventListener("input", (e) =>
        this.searchStudents(e.target.value),
      );
    }

    const loadBtn = document.getElementById("loadAttendanceBtn");
    if (loadBtn) {
      loadBtn.addEventListener("click", () => this.loadAttendanceForDate());
    }

    const saveBtn = document.getElementById("saveAttendanceBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.saveAttendance());
    }

    const addCourseBtn = document.getElementById("addCourseBtn");
    if (addCourseBtn) {
      addCourseBtn.addEventListener("click", () => this.addCourse());
    }

    const resetBtn = document.getElementById("resetDataBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetData());
    }

    const exportBtn = document.getElementById("exportAllDataBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.exportAllData());
    }

    const closeBtn = document.querySelector(".close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeModal());
    }

    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) this.closeModal();
    });
  }

  switchTab(tabId) {
    document.querySelectorAll(".nav-item").forEach((btn) => {
      if (btn.id !== "logoutNavBtn") {
        btn.classList.toggle("active", btn.dataset.tab === tabId);
      }
    });

    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.toggle("active", content.id === `${tabId}-tab`);
    });

    const titles = {
      dashboard: "Dashboard",
      students: "Student Management",
      "mark-attendance": "Mark Attendance",
      settings: "System Settings",
    };
    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) {
      pageTitle.textContent = titles[tabId] || "Dashboard";
    }

    if (tabId === "students") this.renderStudents();
    if (tabId === "dashboard") this.renderDashboard();
  }

  async renderDashboard() {
    try {
      const response = await fetch(
        this.apiUrl + "get_dashboard_stats.php?t=" + Date.now(),
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const stats = await response.json();

      document.getElementById("totalStudents").textContent =
        stats.total_students || 0;
      document.getElementById("todayAttendance").textContent =
        `${stats.today_attendance || 0}%`;
      document.getElementById("overallAvg").textContent =
        `${stats.overall_average || 0}%`;
      document.getElementById("lowAttendanceCount").textContent =
        stats.low_attendance_count || 0;

      this.renderLowAttendanceTable(stats.low_attendance_students);

      if (stats.trend_data && stats.trend_data.length > 0) {
        setTimeout(() => {
          this.renderAttendanceChart(stats.trend_data);
        }, 100);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  }

  renderLowAttendanceTable(lowStudents) {
    const tbody = document.querySelector("#lowAttendanceTable tbody");
    if (!tbody) return;

    if (!lowStudents || lowStudents.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px; color: #48bb78;">
                        ✅ No students with low attendance! All students are above 75%.
                    </td>
                </tr>
            `;
    } else {
      tbody.innerHTML = lowStudents
        .map(
          (s) => `
                <tr>
                    <td>${this.escapeHtml(s.id)}</td>
                    <td>${this.escapeHtml(s.name)}</td>
                    <td>${this.escapeHtml(s.course)}</td>
                    <td style="color: #e53e3e; font-weight: bold;">
                        ${s.percentage || s.attendance_percentage || 0}%
                    </td>
                </tr>
            `,
        )
        .join("");
    }
  }

  renderAttendanceChart(trendData) {
    const canvas = document.getElementById("attendanceChart");
    const ctx = canvas?.getContext("2d");

    if (!ctx) return;

    if (window.attendanceChart) {
      try {
        if (typeof window.attendanceChart.destroy === "function") {
          window.attendanceChart.destroy();
        }
      } catch (e) {
        console.warn("Error destroying chart:", e);
      }
      window.attendanceChart = null;
    }

    const hasValidData =
      trendData && Array.isArray(trendData) && trendData.length > 0;

    if (!hasValidData) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "14px 'Segoe UI'";
      ctx.fillStyle = "#999";
      ctx.textAlign = "center";
      ctx.fillText(
        "No attendance data for selected range",
        canvas.width / 2,
        canvas.height / 2,
      );
      return;
    }

    // Format labels based on data (handles both daily and monthly views)
    const labels = trendData.map((d) => {
      if (d.day) {
        return `Day ${d.day}`;
      }
      const parts = d.date.split("-");
      return `${parts[1]}/${parts[2]}`;
    });

    const rates = trendData.map((d) => d.rate || 0);

    try {
      window.attendanceChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Attendance Rate (%)",
              data: rates,
              borderColor: "#667eea",
              backgroundColor: "rgba(102, 126, 234, 0.1)",
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: rates.map((rate) => {
                if (rate >= 75) return "#48bb78";
                if (rate > 0) return "#e53e3e";
                return "#667eea";
              }),
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: "top",
              labels: {
                usePointStyle: true,
                boxWidth: 10,
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const dataPoint = trendData[context.dataIndex];
                  return `Attendance: ${context.raw}%`;
                },
                title: function (context) {
                  const dataPoint = trendData[context[0].dataIndex];
                  return `${dataPoint.date}`;
                },
              },
            },
          },
          scales: {
            y: {
              min: 0,
              max: 100,
              title: {
                display: true,
                text: "Attendance Percentage (%)",
              },
              grid: {
                color: "#e0e0e0",
              },
            },
            x: {
              title: {
                display: true,
                text: "Date",
              },
              grid: {
                display: false,
              },
              ticks: {
                maxRotation: 45,
                minRotation: 45,
                autoSkip: true,
                maxTicksLimit: 15,
              },
            },
          },
        },
      });
    } catch (e) {
      console.error("Error creating chart:", e);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "14px 'Segoe UI'";
      ctx.fillStyle = "#e53e3e";
      ctx.textAlign = "center";
      ctx.fillText(
        "Error loading chart: " + e.message,
        canvas.width / 2,
        canvas.height / 2,
      );
    }
  }

  renderStudents() {
    const tbody = document.getElementById("studentsTableBody");
    if (!tbody) return;

    if (this.students.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align: center;">No students found. Please add students.</td></tr>';
      return;
    }

    tbody.innerHTML = this.students
      .map((student) => {
        const percentage = student.attendance_percentage || 0;
        const percentageColor =
          percentage >= 75 ? "#48bb78" : percentage > 0 ? "#e53e3e" : "#999";

        return `
                <tr>
                    <td>${this.escapeHtml(student.id)}</td>
                    <td>${this.escapeHtml(student.name)}</td>
                    <td>${this.escapeHtml(student.course)}</td>
                    <td>${this.escapeHtml(student.year)}</td>
                    <td>${this.escapeHtml(student.email)}</td>
                    <td>
                        <strong style="color: ${percentageColor}">
                            ${percentage}%
                        </strong>
                        <small style="display:block; font-size:10px; color:#999;">
                            (${student.present_days || 0}/${student.total_days || 0} days)
                        </small>
                    </td>
                    <td>
                        <button class="edit-btn" data-id="${this.escapeHtml(student.id)}" style="margin-right:5px; padding:5px 10px; cursor:pointer; background:#667eea; color:white; border:none; border-radius:5px;">✏️ Edit</button>
                        <button class="delete-btn" data-id="${this.escapeHtml(student.id)}" style="padding:5px 10px; background:#e53e3e; color:white; border:none; border-radius:5px; cursor:pointer;">🗑️ Delete</button>
                    </td>
                </tr>
            `;
      })
      .join("");

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        this.editStudent(id);
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        this.deleteStudent(id);
      });
    });
  }

  escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>]/g, function (m) {
      if (m === "&") return "&amp;";
      if (m === "<") return "&lt;";
      if (m === ">") return "&gt;";
      return m;
    });
  }

  showStudentModal(editMode = false, student = null) {
    const modal = document.getElementById("studentModal");
    const modalTitle = document.getElementById("modalTitle");
    const form = document.getElementById("studentForm");

    if (!modal) return;

    this.populateCourseSelect();

    if (editMode && student) {
      modalTitle.textContent = "Edit Student";
      document.getElementById("studentId").value = student.id;
      document.getElementById("studentName").value = student.name;
      document.getElementById("studentNumber").value = student.id;
      document.getElementById("studentCourse").value = student.course;
      document.getElementById("studentYear").value = student.year;
      document.getElementById("studentEmail").value = student.email;
    } else {
      modalTitle.textContent = "Add Student";
      if (form) form.reset();
      const studentIdField = document.getElementById("studentId");
      if (studentIdField) studentIdField.value = "";
      const studentNumberField = document.getElementById("studentNumber");
      if (studentNumberField) studentNumberField.value = "";
    }

    modal.style.display = "block";
  }

  async saveStudent(e) {
    e.preventDefault();
    const student = {
      id: document.getElementById("studentNumber").value,
      name: document.getElementById("studentName").value,
      course: document.getElementById("studentCourse").value,
      year: document.getElementById("studentYear").value,
      email: document.getElementById("studentEmail").value,
    };

    if (!student.id || !student.name) {
      alert("Please fill in all required fields");
      return;
    }

    const result = await this.saveStudentToDB(student);

    if (result.success) {
      await this.loadStudents();
      this.renderStudents();
      await this.renderDashboard();
      this.closeModal();
      document.getElementById("studentForm").reset();
      alert("Student saved successfully!");
    } else {
      alert("Failed to save student: " + (result.message || "Unknown error"));
    }
  }

  async saveStudentToDB(student) {
    try {
      const response = await fetch(this.apiUrl + "add_student.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      });
      return await response.json();
    } catch (error) {
      console.error("Error saving student:", error);
      return { success: false, message: "Network error" };
    }
  }

  editStudent(id) {
    const student = this.students.find((s) => s.id === id);
    if (student) this.showStudentModal(true, student);
  }

  async deleteStudent(id) {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        const response = await fetch(this.apiUrl + "delete_student.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: id }),
        });
        const result = await response.json();

        if (result.success) {
          await this.loadStudents();
          this.renderStudents();
          await this.renderDashboard();
          alert("Student deleted successfully!");
        } else {
          alert("Failed to delete student");
        }
      } catch (error) {
        console.error("Error deleting student:", error);
        alert("Error deleting student");
      }
    }
  }

  searchStudents(query) {
    if (!query) {
      this.renderStudents();
      return;
    }

    const filtered = this.students.filter(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.id.toLowerCase().includes(query.toLowerCase()),
    );
    const tbody = document.getElementById("studentsTableBody");
    if (tbody) {
      tbody.innerHTML = filtered
        .map(
          (student) => `
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
            `,
        )
        .join("");

      document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.getAttribute("data-id");
          this.editStudent(id);
        });
      });

      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.getAttribute("data-id");
          this.deleteStudent(id);
        });
      });
    }
  }

  setupDatePicker() {
    const dateInput = document.getElementById("attendanceDate");
    if (dateInput) {
      // Set to today's date
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const todayFormatted = `${year}-${month}-${day}`;

      dateInput.value = todayFormatted;

      // Allow future dates (no max attribute)
      dateInput.removeAttribute("max");

      console.log("Date picker set to:", todayFormatted);

      dateInput.addEventListener("change", (e) => {
        console.log("Date changed to:", e.target.value);
      });
    }
  }

  async loadAttendanceForDate() {
    const date = document.getElementById("attendanceDate").value;
    if (!date) {
      alert("Please select a date first");
      return;
    }

    const loadBtn = document.getElementById("loadAttendanceBtn");
    const originalText = loadBtn.textContent;
    loadBtn.textContent = "⏳ Loading...";
    loadBtn.disabled = true;

    try {
      const response = await fetch(
        `${this.apiUrl}get_attendance.php?date=${date}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const attendanceData = await response.json();
      const tbody = document.getElementById("attendanceTableBody");

      if (!tbody) return;

      if (this.students.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="5" style="text-align: center;">No students found. Please add students first.</td></tr>';
        return;
      }

      tbody.innerHTML = this.students
        .map((student) => {
          const record = attendanceData.find(
            (a) => a.student_id === student.id,
          );
          return `
                    <tr>
                        <td>${this.escapeHtml(student.id)}</td>
                        <td>${this.escapeHtml(student.name)}</td>
                        <td>${this.escapeHtml(student.course)}</td>
                        <td>
                            <select class="attendance-status" data-id="${student.id}" style="padding: 8px; border-radius: 5px; border: 1px solid #ddd;">
                                <option value="present" ${record && record.status === "present" ? "selected" : ""}>✅ Present</option>
                                <option value="absent" ${record && record.status === "absent" ? "selected" : ""}>❌ Absent</option>
                                <option value="late" ${record && record.status === "late" ? "selected" : ""}>⏰ Late</option>
                            </select>
                        </td>
                        <td>
                            <input type="text" class="attendance-remarks" data-id="${student.id}" 
                                   value="${record && record.remarks ? this.escapeHtml(record.remarks) : ""}" 
                                   placeholder="Optional remarks" 
                                   style="width:100%; padding:8px; border:1px solid #ddd; border-radius:5px;">
                        </td>
                    </tr>
                `;
        })
        .join("");

      alert(`Loaded attendance for ${date}`);
    } catch (error) {
      console.error("Error loading attendance:", error);
      alert("Error loading attendance data: " + error.message);
    } finally {
      loadBtn.textContent = originalText;
      loadBtn.disabled = false;
    }
  }

  async saveAttendance() {
    const date = document.getElementById("attendanceDate").value;
    if (!date) {
      alert("Please select a date");
      return;
    }

    const saveBtn = document.getElementById("saveAttendanceBtn");
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "💾 Saving...";
    saveBtn.disabled = true;

    try {
      const attendanceRecord = {};

      document.querySelectorAll(".attendance-status").forEach((select) => {
        const studentId = select.getAttribute("data-id");
        attendanceRecord[studentId] = {
          status: select.value,
          remarks: "",
        };
      });

      document.querySelectorAll(".attendance-remarks").forEach((input) => {
        const studentId = input.getAttribute("data-id");
        if (attendanceRecord[studentId]) {
          attendanceRecord[studentId].remarks = input.value;
        }
      });

      console.log("Saving attendance:", { date, attendanceRecord });

      const response = await fetch(this.apiUrl + "save_attendance.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          date: date,
          attendance: attendanceRecord,
        }),
      });

      const result = await response.json();
      console.log("Server response:", result);

      if (result.success) {
        await this.loadStudents();
        await this.renderDashboard();

        const activeTab = document.querySelector(".tab-content.active")?.id;
        if (activeTab === "students-tab") {
          this.renderStudents();
        }

        alert(result.message || `Attendance for ${date} saved successfully!`);
      } else {
        alert(
          "Failed to save attendance: " + (result.message || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Error saving attendance: " + error.message);
    } finally {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  }

  exportAllData() {
    const studentsCSV = this.convertToCSV(this.students);
    this.downloadCSV(studentsCSV, "students_data.csv");
    this.exportAttendanceData();
  }

  convertToCSV(data) {
    if (!data || data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header] || "";
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  }

  async exportAttendanceData() {
    try {
      const response = await fetch(this.apiUrl + "get_attendance.php?date=all");
      const attendanceData = await response.json();
      const csv = this.convertToCSV(attendanceData);
      this.downloadCSV(csv, "attendance_records.csv");
    } catch (error) {
      console.error("Error exporting attendance:", error);
    }
  }

  downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async addCourse() {
    const newCourseInput = document.getElementById("newCourse");
    const newCourse = newCourseInput ? newCourseInput.value.trim() : "";

    if (newCourse && !this.courses.includes(newCourse)) {
      try {
        const response = await fetch(this.apiUrl + "add_course.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_name: newCourse }),
        });
        const result = await response.json();

        if (result.success) {
          await this.loadCourses();
          if (newCourseInput) newCourseInput.value = "";
          alert("Course added successfully!");
        } else {
          alert("Failed to add course: " + result.message);
        }
      } catch (error) {
        console.error("Error adding course:", error);
        alert("Error adding course");
      }
    } else if (newCourse) {
      alert("Course already exists!");
    } else {
      alert("Please enter a course name");
    }
  }

  renderCourseList() {
    const container = document.getElementById("courseList");
    if (!container) return;

    container.innerHTML = this.courses
      .map(
        (course) => `
            <div class="course-tag">
                ${this.escapeHtml(course)}
                <button onclick="attendanceSystem.removeCourse('${this.escapeHtml(course)}')">×</button>
            </div>
        `,
      )
      .join("");
  }

  async removeCourse(course) {
    if (
      confirm(
        `Remove ${course}? This will affect students enrolled in this course.`,
      )
    ) {
      try {
        const response = await fetch(this.apiUrl + "delete_course.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_name: course }),
        });
        const result = await response.json();

        if (result.success) {
          await this.loadCourses();
          await this.loadStudents();
          this.renderStudents();
          this.renderDashboard();
          alert("Course removed successfully!");
        } else {
          alert(
            "Failed to remove course: " + (result.message || "Unknown error"),
          );
        }
      } catch (error) {
        console.error("Error removing course:", error);
        alert("Error removing course");
      }
    }
  }

  populateCourseSelect() {
    const select = document.getElementById("studentCourse");
    if (select) {
      if (this.courses.length > 0) {
        select.innerHTML = this.courses
          .map(
            (c) =>
              `<option value="${this.escapeHtml(c)}">${this.escapeHtml(c)}</option>`,
          )
          .join("");
      } else {
        select.innerHTML = '<option value="">No courses available</option>';
      }
    }
  }

  resetData() {
    if (
      confirm(
        "⚠️ WARNING: This will delete ALL data from the database. Are you absolutely sure?",
      )
    ) {
      if (
        confirm(
          "Last chance! This action cannot be undone. Click OK to delete all data.",
        )
      ) {
        this.performReset();
      }
    }
  }

  async performReset() {
    try {
      const response = await fetch(this.apiUrl + "reset_data.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();

      if (result.success) {
        alert("All data has been reset successfully!");
        location.reload();
      } else {
        alert("Failed to reset data: " + result.message);
      }
    } catch (error) {
      console.error("Error resetting data:", error);
      alert("Error resetting data");
    }
  }

  updateDateDisplay() {
    const update = () => {
      const now = new Date();
      const dateDisplay = document.getElementById("selectedDateDisplay");
      if (dateDisplay) {
        dateDisplay.textContent = now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    };
    update();
    setInterval(update, 60000);
  }

  closeModal() {
    const modal = document.getElementById("studentModal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  // Setup chart controls
  setupChartControls() {
    // Populate year select
    const yearSelect = document.getElementById("yearSelect");
    if (yearSelect) {
      const currentYear = new Date().getFullYear();
      for (let year = currentYear - 5; year <= currentYear + 5; year++) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        if (year === currentYear) option.selected = true;
        yearSelect.appendChild(option);
      }
    }

    // Range button click handlers
    document.querySelectorAll(".range-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Update active state
        document
          .querySelectorAll(".range-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const range = btn.dataset.range;

        document.getElementById("customDateRange").style.display =
          range === "custom" ? "flex" : "none";
        document.getElementById("monthSelector").style.display =
          range === "month" ? "flex" : "none";

        if (range !== "custom" && range !== "month") {
          this.loadChartData(range);
        }
      });
    });


    const applyBtn = document.getElementById("applyDateRange");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;
        if (startDate && endDate) {
          this.loadChartData("custom", startDate, endDate);
        } else {
          alert("Please select both start and end dates");
        }
      });
    }

    
    const applyMonthBtn = document.getElementById("applyMonth");
    if (applyMonthBtn) {
      applyMonthBtn.addEventListener("click", () => {
        const month = document.getElementById("monthSelect").value;
        const year = document.getElementById("yearSelect").value;
        this.loadChartData("month", null, null, month, year);
      });
    }
  }


  async loadChartData(
    range,
    startDate = null,
    endDate = null,
    month = null,
    year = null,
  ) {
    try {
      let url =
        this.apiUrl +
        "get_dashboard_stats.php?t=" +
        Date.now() +
        "&range=" +
        range;

      if (startDate && endDate) {
        url += "&start_date=" + startDate + "&end_date=" + endDate;
      }

      if (month && year) {
        url += "&month=" + month + "&year=" + year;
      }

      const response = await fetch(url);
      const stats = await response.json();

      if (stats.trend_data && stats.trend_data.length > 0) {
        this.renderAttendanceChart(stats.trend_data);
      }
    } catch (error) {
      console.error("Error loading chart data:", error);
    }
  }


  async renderDashboard() {
    try {
      const response = await fetch(
        this.apiUrl + "get_dashboard_stats.php?t=" + Date.now() + "&range=7",
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const stats = await response.json();

      document.getElementById("totalStudents").textContent =
        stats.total_students || 0;
      document.getElementById("todayAttendance").textContent =
        `${stats.today_attendance || 0}%`;
      document.getElementById("overallAvg").textContent =
        `${stats.overall_average || 0}%`;
      document.getElementById("lowAttendanceCount").textContent =
        stats.low_attendance_count || 0;

      this.renderLowAttendanceTable(stats.low_attendance_students);

      if (stats.trend_data && stats.trend_data.length > 0) {
        setTimeout(() => {
          this.renderAttendanceChart(stats.trend_data);
        }, 100);
      }

     
      this.setupChartControls();
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  }
}

let attendanceSystem;

document.addEventListener("DOMContentLoaded", () => {
  attendanceSystem = new AttendanceSystem();
  window.attendanceSystem = attendanceSystem;
});
