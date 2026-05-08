<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
   
    $db->beginTransaction();
    

    $db->exec("DELETE FROM attendance");
    
    
    $db->exec("DELETE FROM students");
    
    
    
    $db->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "All data has been reset successfully"
    ]);
} catch(Exception $e) {
    $db->rollBack();
    echo json_encode([
        "success" => false,
        "message" => "Failed to reset data: " . $e->getMessage()
    ]);
}
?>