import 'package:flutter/material.dart';
import 'login_screen.dart';
import 'registration_screen.dart';
import 'student_details_screen.dart';
import 'about_dev_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final List<Map<String, String>> _students = [
    {
      'name': 'Ann Maina',
      'id': 'BIT/2020/11234',
      'course': 'Information Technology',
      'email': 'ann@mku.ac.ke',
      'phone': '0712345678',
    },
  ];

  void _goToRegistration() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const RegistrationScreen()),
    );
    if (result != null && result is Map<String, String>) {
      setState(() {
        _students.add(result);
      });
    }
  }

  void _signOut() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.account_circle),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const AboutDevScreen()),
            ),
          ),
        ],
      ),
      body: ListView.builder(
        itemCount: _students.length,
        itemBuilder: (context, index) {
          final student = _students[index];
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person)),
              title: Text(student['name']!),
              subtitle: Text('Reg No: ${student['id']}'),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        StudentDetailsScreen(student: student),
                  ),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _goToRegistration,
        child: const Icon(Icons.add),
      ),
    );
  }
}
