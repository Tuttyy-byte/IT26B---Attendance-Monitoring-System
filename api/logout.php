<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

session_start();

// Destroy all session data
session_unset();
session_destroy();

echo json_encode([
    "success" => true,
    "message" => "Logged out successfully"
]);
?>