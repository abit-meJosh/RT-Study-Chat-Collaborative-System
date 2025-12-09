<?php
session_start();

// Logout
if (isset($_GET['logout'])) {
session_destroy();
header("Location: login.php");
exit();
}

// Process login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $jsonData = file_get_contents("user.json");
    $data = json_decode($jsonData, true);

    $user = $_POST['username'];
    $pass = $_POST['password'];

    foreach ($data['user'] as $u) {
        if ($u['username'] === $user && $u['password'] === $pass) {
            $_SESSION['username'] = $user;
            header("Location: dashboard.php");
            exit();
        }
    }

    $error = "Invalid username or password!";
}
?>
<!DOCTYPE html>
<html>
<head>
<title>Login</title>
</head>
<body>

<h2>Login</h2>

<?php if (isset($error)) echo "<p style='color:red;'>$error</p>"; ?>

<form method="POST" action="login.php">
    <label>Username:</label>
    <input type="text" name="username" required><br><br>

    <label>Password:</label>
    <input type="password" name="password" required><br><br>

    <button type="submit">Login</button>
</form>

<p>No account? <a href="register.php">Register</a></p>

</body>
</html>