<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config/database.php'; //location sa folder sa database php nimo 

$database = new Database();
$db = $database->getConnection();

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(isset($data->fullname) && isset($data->email) && isset($data->password)) {
    $fullname = $data->fullname;
    $email = $data->email;
    $password = md5($data->password);
    
    // Check if email exists
    $checkQuery = "SELECT id FROM users WHERE email = :email";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(":email", $email);
    $checkStmt->execute();
    
    if($checkStmt->rowCount() > 0) {
        echo json_encode([
            "success" => false,
            "message" => "Email already exists"
        ]);
        exit();
    }
    
    $query = "INSERT INTO users (fullname, email, password) VALUES (:fullname, :email, :password)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":fullname", $fullname);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":password", $password);
    
    if($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Registration successful"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Registration failed"
        ]);
    }
}  else {
    echo json_encode([
        "success" => false,
        "message" => "All fields required"
    ]);
}
?>
