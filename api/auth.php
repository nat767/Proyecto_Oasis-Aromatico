<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/conexion.php';
require_once __DIR__ . '/respuesta.php';
$db = obtenerConexion();
$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$accion = $_GET['accion'] ?? '';
if ($metodo === 'GET' && $accion === 'sesion') responder(['ok'=>true, 'autenticado'=>isset($_SESSION['usuario']), 'usuario'=>$_SESSION['usuario'] ?? null]);
$datos = recibirJson();
if ($metodo === 'POST' && $accion === 'registro') {
    $nombre = trim((string)($datos['nombre'] ?? ''));
    $apellido = trim((string)($datos['apellido'] ?? ''));
    $correo = strtolower(trim((string)($datos['correo'] ?? '')));
    $password = (string)($datos['password'] ?? '');
    if ($nombre === '' || $apellido === '' || !filter_var($correo, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) responder(['ok'=>false, 'mensaje'=>'Completa los datos y utiliza una contraseña de al menos 8 caracteres.'], 422);
    $rol = ((int)$db->query('SELECT COUNT(*) FROM usuarios')->fetchColumn() === 0) ? 'ADMIN' : 'EMPLEADO';
    try {
        $stmt = $db->prepare('INSERT INTO usuarios (nombre, apellido, correo, password, rol) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$nombre, $apellido, $correo, password_hash($password, PASSWORD_DEFAULT), $rol]);
        responder(['ok'=>true, 'mensaje'=>'Usuario registrado correctamente.']);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') responder(['ok'=>false, 'mensaje'=>'Ese correo ya está registrado.'], 409);
        responder(['ok'=>false, 'mensaje'=>'No se pudo registrar el usuario.'], 500);
    }
}
if ($metodo === 'POST' && $accion === 'login') {
    $correo = strtolower(trim((string)($datos['correo'] ?? '')));
    $password = (string)($datos['password'] ?? '');
    $stmt = $db->prepare('SELECT id, nombre, apellido, correo, password, rol, activo FROM usuarios WHERE correo = ? LIMIT 1');
    $stmt->execute([$correo]); $usuario = $stmt->fetch();
    if (!$usuario || !(int)$usuario['activo'] || !password_verify($password, $usuario['password'])) responder(['ok'=>false, 'mensaje'=>'El correo o la contraseña son incorrectos.'], 401);
    session_regenerate_id(true); unset($usuario['password'], $usuario['activo']); $_SESSION['usuario'] = $usuario;
    responder(['ok'=>true, 'usuario'=>$usuario]);
}
if ($metodo === 'POST' && $accion === 'logout') { $_SESSION = []; session_destroy(); responder(['ok'=>true, 'mensaje'=>'Sesión cerrada.']); }
responder(['ok'=>false, 'mensaje'=>'Solicitud no válida.'], 404);
