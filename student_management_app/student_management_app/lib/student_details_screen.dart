import 'package:flutter/material.dart';

class StudentDetailsScreen extends StatelessWidget {
  final Map<String, String> student;
  const StudentDetailsScreen({super.key, required this.student});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(student['name'] ?? 'Details')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(leading: const Icon(Icons.badge), title: const Text('ID'), subtitle: Text(student['id'] ?? '')),
                ListTile(leading: const Icon(Icons.book), title: const Text('Course'), subtitle: Text(student['course'] ?? '')),
                ListTile(leading: const Icon(Icons.email), title: const Text('Email'), subtitle: Text(student['email'] ?? '')),
                ListTile(leading: const Icon(Icons.phone), title: const Text('Phone'), subtitle: Text(student['phone'] ?? '')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}