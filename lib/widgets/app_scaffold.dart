import 'package:flutter/material.dart';
import '../screens/dashboard_screen.dart';
import '../screens/students_screen.dart';
import '../screens/api_screen.dart';
import '../screens/attendance_screen.dart';
import '../screens/settings_screen.dart';
import '../theme/app_theme.dart';

class AppScaffold extends StatelessWidget {
  final String title;
  final Widget body;
  final Widget? floatingActionButton;

  const AppScaffold({
    super.key,
    required this.title,
    required this.body,
    this.floatingActionButton,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(
            tooltip: 'Settings',
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            ),
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            // FIXED: Replaced standard DrawerHeader with a flexible Container to handle long text safely
            Container(
              width: double.infinity,
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 20,
                bottom: 20,
                left: 16,
                right: 16,
              ),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.primary, AppTheme.secondary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.school, color: Colors.white),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Student Management System',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Manage students, attendance, and API data seamlessly.',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.84),
                      fontSize: 12,
                      height: 1.3, // Makes paragraph spacing neat
                    ),
                  ),
                ],
              ),
            ),
            _navTile(
              context,
              'Dashboard',
              Icons.dashboard_outlined,
              const DashboardScreen(),
            ),
            _navTile(
              context,
              'Students',
              Icons.groups_outlined,
              const StudentsScreen(),
            ),
            _navTile(
              context,
              'Attendance',
              Icons.fact_check_outlined,
              const AttendanceScreen(),
            ),
            _navTile(
              context,
              'API Records',
              Icons.cloud_sync_outlined,
              const ApiConsumerScreen(),
            ),
            ListTile(
              leading: const Icon(Icons.settings_outlined),
              title: const Text('Settings'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SettingsScreen()),
                );
              },
            ),
          ],
        ),
      ),
      floatingActionButton: floatingActionButton,
      body: SafeArea(
        child: Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xfff8fafc), Color(0xffeef6ff), Colors.white],
            ),
          ),
          child: body,
        ),
      ),
    );
  }

  Widget _navTile(
    BuildContext context,
    String title,
    IconData icon,
    Widget targetScreen,
  ) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      onTap: () {
        Navigator.pop(context);
        _open(context, targetScreen);
      },
    );
  }

  void _open(BuildContext context, Widget targetScreen) {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => targetScreen),
    );
  }
}