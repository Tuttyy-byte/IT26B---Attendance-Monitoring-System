<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id) && isset($data->name) && isset($data->course)) {
    $query = "INSERT INTO students (id, name, course, year, email) 
              VALUES (:id, :name, :course, :year, :email)
              ON DUPLICATE KEY UPDATE 
              name = VALUES(name), 
              course = VALUES(course), 
              year = VALUES(year), 
              email = VALUES(email)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $data->id);
    $stmt->bindParam(":name", $data->name);
    $stmt->bindParam(":course", $data->course);
    $stmt->bindParam(":year", $data->year);
    $stmt->bindParam(":email", $data->email);
    
    if($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Student saved successfully"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Failed to save student"
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields"
    ]);
}
?>