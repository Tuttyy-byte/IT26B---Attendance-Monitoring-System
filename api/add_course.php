<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(isset($data->course_name)) {
    $query = "INSERT INTO courses (course_name) VALUES (:course_name)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":course_name", $data->course_name);
    
    if($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Course added successfully"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Course already exists or invalid"
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Course name required"
    ]);
}
?>