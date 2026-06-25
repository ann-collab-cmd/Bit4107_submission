import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';

// Standard relative paths to prevent any package-name linking mismatches
import 'firebase_options.dart';                   
import 'screens/login_screen.dart';
import 'theme/app_theme.dart';

void main() async {
  // Ensures Flutter framework services are ready before initializing native plugins
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase using your custom project options
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Student Management System',
      theme: AppTheme.light,
      home: const LoginScreen(),
    );
  }
}