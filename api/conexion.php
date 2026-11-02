<?php
declare(strict_types=1);

require_once __DIR__ . '/config.local.php';

function obtenerConexion(): PDO {
    static $conexion = null;

    if ($conexion instanceof PDO) {
        return $conexion;
    }

    $dsn = 'mysql:host=' . DB_HOST .
           ';port=' . DB_PORT .
           ';dbname=' . DB_NAME .
           ';charset=utf8mb4';

    try {
        $conexion = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        return $conexion;

    } catch (PDOException $e) {
        error_log($e->getMessage());
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode([
            'ok' => false,
            'mensaje' => 'Error de conexión con la base de datos.'
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }
}
