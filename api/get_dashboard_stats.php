<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
 
    $studentQuery = "SELECT COUNT(*) as total FROM students";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->execute();
    $totalStudents = $studentStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    
    $today = date('Y-m-d');
    $todayQuery = "SELECT 
                    COUNT(DISTINCT a.student_id) as present_count
                   FROM attendance a
                   WHERE a.attendance_date = :date AND a.status = 'present'";
    $todayStmt = $db->prepare($todayQuery);
    $todayStmt->bindParam(":date", $today);
    $todayStmt->execute();
    $todayData = $todayStmt->fetch(PDO::FETCH_ASSOC);
    $todayPercent = $totalStudents > 0 ? round(($todayData['present_count'] / $totalStudents) * 100, 1) : 0;
    
    
    $avgQuery = "SELECT 
                    ROUND(AVG(CASE WHEN status = 'present' THEN 100 ELSE 0 END), 1) as avg_percent
                 FROM attendance";
    $avgStmt = $db->prepare($avgQuery);
    $avgStmt->execute();
    $avgResult = $avgStmt->fetch(PDO::FETCH_ASSOC);
    $overallAvg = $avgResult['avg_percent'] ?: 0;
    
    
    $lowQuery = "SELECT 
                    s.id,
                    s.name,
                    s.course,
                    COUNT(a.id) as total_days,
                    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
                    ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0) * 100, 1) as percentage
                 FROM students s
                 INNER JOIN attendance a ON s.id = a.student_id
                 GROUP BY s.id, s.name, s.course
                 HAVING percentage < 75
                 ORDER BY percentage ASC";
    
    $lowStmt = $db->prepare($lowQuery);
    $lowStmt->execute();
    $lowStudents = $lowStmt->fetchAll(PDO::FETCH_ASSOC);
    $lowCount = count($lowStudents);
    
   
    $trendData = [];
    $totalStudentsCount = $totalStudents;
    
    for($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $trendQuery = "SELECT 
                        COUNT(DISTINCT CASE WHEN status = 'present' THEN student_id END) as present_count
                       FROM attendance 
                       WHERE attendance_date = :date";
        $trendStmt = $db->prepare($trendQuery);
        $trendStmt->bindParam(":date", $date);
        $trendStmt->execute();
        $data = $trendStmt->fetch(PDO::FETCH_ASSOC);
        
        $percent = $totalStudentsCount > 0 ? round(($data['present_count'] / $totalStudentsCount) * 100, 1) : 0;
        $trendData[] = [
            'date' => $date,
            'rate' => $percent
        ];
    }
    
    echo json_encode([
        'success' => true,
        'total_students' => (int)$totalStudents,
        'today_attendance' => (float)$todayPercent,
        'overall_average' => (float)$overallAvg,
        'low_attendance_count' => (int)$lowCount,
        'low_attendance_students' => $lowStudents,
        'trend_data' => $trendData
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'total_students' => 0,
        'today_attendance' => 0,
        'overall_average' => 0,
        'low_attendance_count' => 0,
        'low_attendance_students' => [],
        'trend_data' => []
    ]);
}
?>