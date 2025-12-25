<?php
class Response {
    public static function send($success, $data = null, $message = "", $http_code = 200) {
        // Clear any accidental buffered output (HTML, warnings) so responses are valid JSON
        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        http_response_code($http_code);
        header('Content-Type: application/json');

        $response = [
            'success' => $success,
            'data' => $data,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        echo json_encode($response);
        exit();
    }
    
    public static function success($data = null, $message = "Operation successful") {
        self::send(true, $data, $message, 200);
    }
    
    public static function error($message = "An error occurred", $http_code = 400) {
        self::send(false, null, $message, $http_code);
    }
    
    public static function notFound($message = "Resource not found") {
        self::send(false, null, $message, 404);
    }
    
    public static function unauthorized($message = "Unauthorized access") {
        self::send(false, null, $message, 401);
    }
    
    public static function forbidden($message = "Access forbidden") {
        self::send(false, null, $message, 403);
    }
}
?>