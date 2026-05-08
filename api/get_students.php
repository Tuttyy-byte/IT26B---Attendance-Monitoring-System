<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

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
            ROUND(IFNULL(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0) * 100, 0), 1) as attendance_percentage
          FROM students s
          LEFT JOIN attendance a ON s.id = a.student_id
          GROUP BY s.id, s.name, s.course, s.year, s.email
          ORDER BY s.id";

$stmt = $db->prepare($query);
$stmt->execute();

$students = [];
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $students[] = $row;
}

echo json_encode($students);
?>