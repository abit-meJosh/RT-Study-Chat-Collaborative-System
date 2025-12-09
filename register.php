<?php

// --- PROCESS REGISTER ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $json = file_get_contents("user.json");
    $data = json_decode($json, true);

    $newUser = $_POST['username'];
    $newPass = $_POST['password'];

    // Check duplicate username
    foreach ($data['user'] as $u) {
        if ($u['username'] === $newUser) {
            die("Username already exists!");
        }
    }

    // Add new user
    $data['user'][] = [
        "username" => $newUser,
        "password" => $newPass
    ];

    file_put_contents("user.json", json_encode($data, JSON_PRETTY_PRINT));

    header("Location: login.php");
    exit();
}
?>
<!DOCTYPE html>
<html>
<head>
<title>Register</title>
</head>
<body>

<h2>Register</h2>

<form action="register.php" method="POST">
    <label>Username:</label>
    <input type="text" name="username" required><br><br>

    <label>Password:</label>
    <input type="password" name="password" required><br><br>

    <button type="submit">Register</button>
</form>

<p>Already have an account? <a href="login.php">Login</a></p>

</body>
</html>