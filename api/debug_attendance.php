<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT 
            s.id,
            s.name,
            s.course,
            COUNT(a.id) as total_days,
            SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
            ROUND(IFNULL(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0) * 100, 0), 1) as percentage
          FROM students s
          LEFT JOIN attendance a ON s.id = a.student_id
          GROUP BY s.id";

$stmt = $db->prepare($query);
$stmt->execute();
$students = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'success' => true,
    'students' => $students,
    'low_attendance' => array_filter($students, function($s) {
        return $s['total_days'] > 0 && $s['percentage'] < 75;
    })
]);
?>