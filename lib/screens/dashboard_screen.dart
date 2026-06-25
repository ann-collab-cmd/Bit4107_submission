import 'package:flutter/material.dart';

import '../db/database_service.dart'; // Point to your online network service
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import 'api_screen.dart';
import 'attendance_screen.dart';
import 'students_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Dashboard',
      body: FutureBuilder<_DashboardStats>(
        future: _loadStats(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final stats = snapshot.data ?? _DashboardStats.empty();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Overview',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 6),
              Text(
                'Quick summary of students, attendance, and system modules.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.blueGrey,
                    ),
              ),
              const SizedBox(height: 18),
              LayoutBuilder(
                builder: (context, constraints) {
                  final columns = constraints.maxWidth > 760 ? 4 : 2;
                  return GridView.count(
                    crossAxisCount: columns,
                    shrinkWrap: true,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: constraints.maxWidth > 760 ? 1.7 : 1.2,
                    children: [
                      _StatCard(
                        label: 'Students',
                        value: '${stats.studentCount}',
                        icon: Icons.groups_outlined,
                        color: AppTheme.primary,
                        onTap: () => _open(context, const StudentsScreen()),
                      ),
                      _StatCard(
                        label: 'Present Today',
                        value: '${stats.presentToday}',
                        icon: Icons.check_circle_outline,
                        color: AppTheme.secondary,
                        onTap: () => _open(context, const AttendanceScreen()),
                      ),
                      _StatCard(
                        label: 'Absent Today',
                        value: '${stats.absentToday}',
                        icon: Icons.cancel_outlined,
                        color: AppTheme.warning,
                        onTap: () => _open(context, const AttendanceScreen()),
                      ),
                      _StatCard(
                        label: 'Courses',
                        value: '${stats.courseCounts.length}',
                        icon: Icons.menu_book_outlined,
                        color: const Color(0xff7c3aed),
                        onTap: () => _open(context, const StudentsScreen()),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 20),
              _ModulePanel(
                courses: stats.courseCounts,
                onStudents: () => _open(context, const StudentsScreen()),
                onAttendance: () => _open(context, const AttendanceScreen()),
                onApi: () => _open(context, const ApiConsumerScreen()),
              ),
            ],
          );
        },
      ),
    );
  }

  // Adjusted to pull values dynamically via HTTP endpoints
  Future<_DashboardStats> _loadStats() async {
    try {
      // 1. Fetch live metrics map from your API endpoint 
      // (Assuming your API backend offers a compact stats endpoint)
      final statsMap = await DatabaseService.fetchDashboardMetrics();

      if (statsMap != null) {
        return _DashboardStats(
          studentCount: statsMap['student_count'] ?? 0,
          presentToday: statsMap['present_today'] ?? 0,
          absentToday: statsMap['absent_today'] ?? 0,
          courseCounts: Map<String, int>.from(statsMap['course_counts'] ?? {}),
        );
      }
    } catch (e) {
      print("Failed parsing metrics over network: $e");
    }

    return _DashboardStats.empty();
  }

  void _open(BuildContext context, Widget screen) {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => screen),
    );
  }
}

class _DashboardStats {
  final int studentCount;
  final int presentToday;
  final int absentToday;
  final Map<String, int> courseCounts;

  _DashboardStats({
    required this.studentCount,
    required this.presentToday,
    required this.absentToday,
    required this.courseCounts,
  });

  factory _DashboardStats.empty() {
    return _DashboardStats(
      studentCount: 0,
      presentToday: 0,
      absentToday: 0,
      courseCounts: const {},
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 30),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: Theme.of(context)
                        .textTheme
                        .headlineMedium
                        ?.copyWith(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    label,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.blueGrey,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ModulePanel extends StatelessWidget {
  final Map<String, int> courses;
  final VoidCallback onStudents;
  final VoidCallback onAttendance;
  final VoidCallback onApi;

  const _ModulePanel({
    required this.courses,
    required this.onStudents,
    required this.onAttendance,
    required this.onApi,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Project Modules',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                ActionChip(
                  avatar: const Icon(Icons.groups_outlined),
                  label: const Text('Manage Students'),
                  onPressed: onStudents,
                ),
                ActionChip(
                  avatar: const Icon(Icons.fact_check_outlined),
                  label: const Text('Take Attendance'),
                  onPressed: onAttendance,
                ),
                ActionChip(
                  avatar: const Icon(Icons.cloud_sync_outlined),
                  label: const Text('View API Data'),
                  onPressed: onApi,
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              'Students by Course',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 10),
            if (courses.isEmpty)
              const Text(
                  'No courses yet. Register students to populate this summary.')
            else
              ...courses.entries.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Expanded(child: Text(entry.key)),
                      Text(
                        '${entry.value}',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
