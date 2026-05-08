<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(isset($data->course_name)) {
    $query = "DELETE FROM courses WHERE course_name = :course_name";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":course_name", $data->course_name);
    
    if($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Course deleted successfully"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Failed to delete course"
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Course name required"
    ]);
}
?>