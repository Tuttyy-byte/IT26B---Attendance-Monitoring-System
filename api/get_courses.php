<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT course_name FROM courses ORDER BY course_name";
$stmt = $db->prepare($query);
$stmt->execute();

$courses = [];
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $courses[] = $row['course_name'];
}

echo json_encode($courses);
?>