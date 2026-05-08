<?php
date_default_timezone_set('Asia/Manila');

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, must-revalidate");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Get parameters from request
    $range = isset($_GET['range']) ? $_GET['range'] : '7';
    $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : null;
    $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : null;
    $month = isset($_GET['month']) ? (int)$_GET['month'] : null;
    $year = isset($_GET['year']) ? (int)$_GET['year'] : null;
    
    // Get total students count
    $studentQuery = "SELECT COUNT(*) as total FROM students";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->execute();
    $totalStudents = $studentStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get today's date
    $today = date('Y-m-d');
    
    // Get today's attendance percentage
    $todayQuery = "SELECT 
                    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
                    COUNT(*) as total_records
                   FROM attendance
                   WHERE attendance_date = :date";
    $todayStmt = $db->prepare($todayQuery);
    $todayStmt->bindParam(":date", $today);
    $todayStmt->execute();
    $todayData = $todayStmt->fetch(PDO::FETCH_ASSOC);
    
    $totalRecordsToday = $todayData['total_records'] ?? 0;
    $presentCountToday = $todayData['present_count'] ?? 0;
    $todayPercent = $totalRecordsToday > 0 ? round(($presentCountToday / $totalRecordsToday) * 100, 1) : 0;
    
    // Get overall average attendance percentage
    $avgQuery = "SELECT 
                    ROUND(AVG(CASE WHEN status = 'present' THEN 100 
                                  WHEN status = 'late' THEN 50 
                                  ELSE 0 END), 1) as avg_percent
                 FROM attendance";
    $avgStmt = $db->prepare($avgQuery);
    $avgStmt->execute();
    $avgResult = $avgStmt->fetch(PDO::FETCH_ASSOC);
    $overallAvg = $avgResult['avg_percent'] ?: 0;
    
    // Get students with low attendance (below 75%)
    $lowQuery = "SELECT 
                    s.id,
                    s.name,
                    s.course,
                    COUNT(a.id) as total_days,
                    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
                    ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0) * 100, 1) as percentage
                 FROM students s
                 LEFT JOIN attendance a ON s.id = a.student_id
                 GROUP BY s.id, s.name, s.course
                 HAVING percentage < 75 AND percentage > 0
                 ORDER BY percentage ASC";
    
    $lowStmt = $db->prepare($lowQuery);
    $lowStmt->execute();
    $lowStudents = $lowStmt->fetchAll(PDO::FETCH_ASSOC);
    $lowCount = count($lowStudents);
    
    // Get attendance trend data based on range
    $trendData = [];
    
    if ($range === 'month' || ($month && $year)) {
        // Show specific month
        $targetMonth = $month ?: date('n');
        $targetYear = $year ?: date('Y');
        
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $targetMonth, $targetYear);
        for($day = 1; $day <= $daysInMonth; $day++) {
            $date = sprintf("%04d-%02d-%02d", $targetYear, $targetMonth, $day);
            $dateObj = DateTime::createFromFormat('Y-m-d', $date);
            
            $trendQuery = "SELECT 
                            COUNT(*) as total_records,
                            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
                            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count
                           FROM attendance 
                           WHERE attendance_date = :date";
            $trendStmt = $db->prepare($trendQuery);
            $trendStmt->bindParam(":date", $date);
            $trendStmt->execute();
            $data = $trendStmt->fetch(PDO::FETCH_ASSOC);
            
            $rate = 0;
            if ($data['total_records'] > 0) {
                $weightedSum = ($data['present_count'] * 100) + ($data['late_count'] * 50);
                $rate = round($weightedSum / $data['total_records'], 1);
            }
            
            $trendData[] = [
                'date' => $date,
                'rate' => $rate,
                'day' => $day
            ];
        }
    } 
    else if ($range === 'custom' && $startDate && $endDate) {
        // Custom date range
        $current = strtotime($startDate);
        $end = strtotime($endDate);
        
        while ($current <= $end) {
            $date = date('Y-m-d', $current);
            
            $trendQuery = "SELECT 
                            COUNT(*) as total_records,
                            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
                            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count
                           FROM attendance 
                           WHERE attendance_date = :date";
            $trendStmt = $db->prepare($trendQuery);
            $trendStmt->bindParam(":date", $date);
            $trendStmt->execute();
            $data = $trendStmt->fetch(PDO::FETCH_ASSOC);
            
            $rate = 0;
            if ($data['total_records'] > 0) {
                $weightedSum = ($data['present_count'] * 100) + ($data['late_count'] * 50);
                $rate = round($weightedSum / $data['total_records'], 1);
            }
            
            $trendData[] = [
                'date' => $date,
                'rate' => $rate
            ];
            
            $current = strtotime('+1 day', $current);
        }
    }
    else {
        // Default: Last X days (7, 30, 90, etc.)
        $days = (int)$range;
        for($i = $days - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            
            $trendQuery = "SELECT 
                            COUNT(*) as total_records,
                            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
                            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count
                           FROM attendance 
                           WHERE attendance_date = :date";
            $trendStmt = $db->prepare($trendQuery);
            $trendStmt->bindParam(":date", $date);
            $trendStmt->execute();
            $data = $trendStmt->fetch(PDO::FETCH_ASSOC);
            
            $rate = 0;
            if ($data['total_records'] > 0) {
                $weightedSum = ($data['present_count'] * 100) + ($data['late_count'] * 50);
                $rate = round($weightedSum / $data['total_records'], 1);
            }
            
            $trendData[] = [
                'date' => $date,
                'rate' => $rate
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'total_students' => (int)$totalStudents,
        'today_attendance' => (float)$todayPercent,
        'overall_average' => (float)$overallAvg,
        'low_attendance_count' => (int)$lowCount,
        'low_attendance_students' => $lowStudents,
        'trend_data' => $trendData,
        'current_date' => $today,
        'range_used' => $range
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