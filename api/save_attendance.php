<?php
// Set timezone FIRST
date_default_timezone_set('Asia/Manila');

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$raw_data = file_get_contents("php://input");
$data = json_decode($raw_data);

error_log("Received data: " . $raw_data);

if (!$data) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON data received. Raw: " . $raw_data
    ]);
    exit();
}

if (!isset($data->date) || !isset($data->attendance)) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required data. Date and attendance required."
    ]);
    exit();
}

$date = $data->date;
$attendance = $data->attendance;

// Validate date
if (empty($date)) {
    echo json_encode([
        "success" => false,
        "message" => "Date cannot be empty"
    ]);
    exit();
}

error_log("Saving attendance for date: " . $date);

$db->beginTransaction();

try {
    $success_count = 0;
    $error_count = 0;
    
    foreach($attendance as $studentId => $record) {
        if (is_array($record)) {
            $status = isset($record['status']) ? $record['status'] : 'absent';
            $remarks = isset($record['remarks']) ? $record['remarks'] : '';
        } else if (is_object($record)) {
            $status = isset($record->status) ? $record->status : 'absent';
            $remarks = isset($record->remarks) ? $record->remarks : '';
        } else {
            continue;
        }
        
        if (!in_array($status, ['present', 'absent', 'late'])) {
            $status = 'absent';
        }
        
        $query = "INSERT INTO attendance (student_id, attendance_date, status, remarks) 
                  VALUES (:student_id, :date, :status, :remarks)
                  ON DUPLICATE KEY UPDATE 
                  status = VALUES(status), 
                  remarks = VALUES(remarks)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":student_id", $studentId);
        $stmt->bindParam(":date", $date);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":remarks", $remarks);
        
        if ($stmt->execute()) {
            $success_count++;
        } else {
            $error_count++;
            error_log("Error saving attendance for student: $studentId");
        }
    }
    
    $db->commit();
    
    error_log("Saved $success_count records for date: $date");
    
    echo json_encode([
        "success" => true,
        "message" => "Attendance for $date saved successfully! ($success_count records)",
        "records_saved" => $success_count,
        "date_saved" => $date
    ]);
    
} catch(Exception $e) {
    $db->rollBack();
    error_log("Attendance save error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>