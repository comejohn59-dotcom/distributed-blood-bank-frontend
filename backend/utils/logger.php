<?php
require_once __DIR__ . '/../config/db.php';

class Logger {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection(); // mysqli
    }
    
    public function log($user_id, $action, $entity, $entity_id = null, $details = '') {
        try {
            $query = "INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address, user_agent) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->conn->prepare($query);
            
            $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
            $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            $entity_id_val = $entity_id ?? 0;
            
            $stmt->bind_param('ississs', $user_id, $action, $entity, $entity_id_val, $details, $ip_address, $user_agent);
            
            return $stmt->execute();
        } catch(Exception $e) {
            error_log("Logging error: " . $e->getMessage());
            return false;
        }
    }
    
    public function createNotification($user_id, $message, $type = 'info', $related_id = null, $related_type = null) {
        try {
            $query = "INSERT INTO notifications (user_id, message, type, related_id, related_type) 
                      VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->conn->prepare($query);
            
            $related_id_val = $related_id ?? 0;
            $related_type_val = $related_type ?? '';
            $stmt->bind_param('issis', $user_id, $message, $type, $related_id_val, $related_type_val);
            
            return $stmt->execute();
        } catch(Exception $e) {
            error_log("Notification error: " . $e->getMessage());
            return false;
        }
    }
    
    public function checkLowStock($blood_bank_id = null) {
        try {
            $query = "SELECT bi.*, bb.name as blood_bank_name 
                      FROM blood_inventory bi
                      JOIN blood_banks bb ON bi.blood_bank_id = bb.blood_bank_id
                      WHERE bi.quantity < 10"; // Low stock threshold
            
            if ($blood_bank_id) {
                $query .= " AND bi.blood_bank_id = ?";
            }
            
            $stmt = $this->conn->prepare($query);
            
            if ($blood_bank_id) {
                $stmt->bind_param('i', $blood_bank_id);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            $low_stock_items = $result->fetch_all(MYSQLI_ASSOC);
            
            foreach ($low_stock_items as $item) {
                $message = "Low stock alert: Blood group {$item['blood_group']} has {$item['quantity']} units remaining at {$item['blood_bank_name']}";
                $this->createNotification($item['blood_bank_id'], $message, 'low_stock', $item['inventory_id'], 'blood_inventory');
            }
            
            return $low_stock_items;
        } catch(Exception $e) {
            error_log("Low stock check error: " . $e->getMessage());
            return false;
        }
    }
    
    public function checkExpiringBlood($days = 7) {
        try {
            $expiry_date = date('Y-m-d', strtotime("+$days days"));
            
            $query = "SELECT bi.*, bb.name as blood_bank_name 
                      FROM blood_inventory bi
                      JOIN blood_banks bb ON bi.blood_bank_id = bb.blood_bank_id
                      WHERE bi.expiry_date <= ? AND bi.quantity > 0";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('s', $expiry_date);
            $stmt->execute();
            $result = $stmt->get_result();
            $expiring_items = $result->fetch_all(MYSQLI_ASSOC);
            
            foreach ($expiring_items as $item) {
                $message = "Expiry alert: {$item['quantity']} units of blood group {$item['blood_group']} will expire on {$item['expiry_date']} at {$item['blood_bank_name']}";
                $this->createNotification($item['blood_bank_id'], $message, 'expiry', $item['inventory_id'], 'blood_inventory');
            }
            
            return $expiring_items;
        } catch(Exception $e) {
            error_log("Expiry check error: " . $e->getMessage());
            return false;
        }
    }
}
?>