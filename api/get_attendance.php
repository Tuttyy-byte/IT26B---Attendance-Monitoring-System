<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');


if ($date === 'all') {
    $query = "SELECT a.*, s.name, s.course 
              FROM attendance a 
              JOIN students s ON a.student_id = s.id 
              ORDER BY a.attendance_date DESC, s.name";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($attendance);
    exit();
}


$query = "SELECT a.*, s.name, s.course 
          FROM attendance a 
          RIGHT JOIN students s ON a.student_id = s.id AND a.attendance_date = :date
          ORDER BY s.id";
$stmt = $db->prepare($query);
$stmt->bindParam(":date", $date);
$stmt->execute();

$attendance = [];
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $attendance[] = $row;
}

echo json_encode($attendance);
?>