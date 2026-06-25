import 'package:flutter/material.dart';

import '../db/database_helper.dart';
import '../models/student.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  List<Student> _students = [];
  List<Attendance> _reports = [];
  Map<int, String> _todayStatus = {};
  final _db = DatabaseHelper.instance;
  bool _isLoading = true;

  String get _today => DateTime.now().toIso8601String().substring(0, 10);

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final baseStudents = await _db.getStudents();
    final baseReports = await _db.getAttendanceReport();
    final todayReports = await _db.getAttendanceReport(date: _today);

    if (!mounted) return;
    setState(() {
      _students = baseStudents;
      _reports = baseReports;
      _todayStatus = {
        for (final report in todayReports) report.studentId: report.status,
      };
      _isLoading = false;
    });
  }

  Future<void> _markAttendance(Student student, String status) async {
    if (student.id == null) return;

    final attendance = Attendance(
      studentId: student.id!,
      studentName: student.name,
      date: _today,
      status: status,
    );

    await _db.recordAttendance(attendance);
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${student.name} marked $status')),
    );
    _loadInitialData();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: AppScaffold(
        title: 'Attendance Suite',
        body: Column(
          children: [
            const Material(
              color: Colors.white,
              child: TabBar(
                tabs: [
                  Tab(
                    icon: Icon(Icons.fact_check_outlined),
                    text: 'Take Attendance',
                  ),
                  Tab(
                    icon: Icon(Icons.assessment_outlined),
                    text: 'Reports',
                  ),
                ],
              ),
            ),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : TabBarView(
                      children: [
                        _TakeAttendanceTab(
                          students: _students,
                          todayStatus: _todayStatus,
                          onMark: _markAttendance,
                        ),
                        _ReportsTab(reports: _reports),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TakeAttendanceTab extends StatelessWidget {
  final List<Student> students;
  final Map<int, String> todayStatus;
  final void Function(Student student, String status) onMark;

  const _TakeAttendanceTab({
    required this.students,
    required this.todayStatus,
    required this.onMark,
  });

  @override
  Widget build(BuildContext context) {
    if (students.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Register students first before taking attendance.',
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: students.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final student = students[index];
        final status = todayStatus[student.id];
        return Card(
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 8,
            ),
            leading: Icon(
              status == null
                  ? Icons.radio_button_unchecked
                  : status == 'Present'
                      ? Icons.check_circle
                      : Icons.cancel,
              color: status == null
                  ? Colors.blueGrey
                  : status == 'Present'
                      ? AppTheme.secondary
                      : AppTheme.danger,
            ),
            title: Text(
              student.name,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
            subtitle: Text(
              '${student.admission} | ${status ?? 'Not marked today'}',
            ),
            trailing: Wrap(
              spacing: 4,
              children: [
                IconButton.filledTonal(
                  tooltip: 'Mark present',
                  icon: const Icon(Icons.check),
                  color: AppTheme.secondary,
                  onPressed: () => onMark(student, 'Present'),
                ),
                IconButton.filledTonal(
                  tooltip: 'Mark absent',
                  icon: const Icon(Icons.close),
                  color: AppTheme.danger,
                  onPressed: () => onMark(student, 'Absent'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ReportsTab extends StatelessWidget {
  final List<Attendance> reports;

  const _ReportsTab({required this.reports});

  @override
  Widget build(BuildContext context) {
    if (reports.isEmpty) {
      return const Center(child: Text('No attendance records yet.'));
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: reports.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final report = reports[index];
        final isPresent = report.status == 'Present';
        return Card(
          child: ListTile(
            leading: Icon(
              isPresent ? Icons.check_circle : Icons.cancel,
              color: isPresent ? AppTheme.secondary : AppTheme.danger,
            ),
            title: Text(
              report.studentName,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
            subtitle: Text('Date: ${report.date}'),
            trailing: DecoratedBox(
              decoration: BoxDecoration(
                color: (isPresent ? AppTheme.secondary : AppTheme.danger)
                    .withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                child: Text(
                  report.status.toUpperCase(),
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: isPresent ? AppTheme.secondary : AppTheme.danger,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
