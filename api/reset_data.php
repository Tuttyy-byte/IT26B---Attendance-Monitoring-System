<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Start transaction
    $db->beginTransaction();
    
    // Delete all attendance records
    $db->exec("DELETE FROM attendance");
    
    // Delete all students
    $db->exec("DELETE FROM students");
    
    // Reset courses to default (optional - comment out if you want to keep courses)
    // $db->exec("DELETE FROM courses");
    // $db->exec("INSERT INTO courses (course_name) VALUES 
    //     ('Computer Science'), ('Information Technology'), 
    //     ('Engineering'), ('Business Administration')");
    
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