<?php
declare(strict_types=1);
function responder(array $datos, int $codigo = 200): never {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}
function recibirJson(): array {
    $datos = json_decode(file_get_contents('php://input') ?: '[]', true);
    return is_array($datos) ? $datos : [];
}
