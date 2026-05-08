<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, must-revalidate");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT 
            s.id,
            s.name,
            s.course,
            s.year,
            s.email,
            COUNT(a.id) as total_days,
            SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
            CASE 
                WHEN COUNT(a.id) = 0 THEN 0
                ELSE ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 1)
            END as attendance_percentage
          FROM students s
          LEFT JOIN attendance a ON s.id = a.student_id
          GROUP BY s.id, s.name, s.course, s.year, s.email
          ORDER BY s.id";

$stmt = $db->prepare($query);
$stmt->execute();

$students = [];
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $row['total_days'] = (int)$row['total_days'];
    $row['present_days'] = (int)$row['present_days'];
    $row['attendance_percentage'] = (float)$row['attendance_percentage'];
    $students[] = $row;
}

echo json_encode($students);
?>