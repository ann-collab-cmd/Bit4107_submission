import 'package:flutter/material.dart';

import '../db/database_helper.dart';
import '../models/student.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import 'register_screen.dart';

class StudentsScreen extends StatefulWidget {
  const StudentsScreen({super.key});

  @override
  State<StudentsScreen> createState() => _StudentsScreenState();
}

class _StudentsScreenState extends State<StudentsScreen> {
  List<Student> _students = [];
  final _searchController = TextEditingController();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _refreshStudentList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _refreshStudentList() async {
    final data = await DatabaseHelper.instance.getStudents(
      query: _searchController.text.trim(),
    );
    if (!mounted) return;
    setState(() {
      _students = data;
      _isLoading = false;
    });
  }

  Future<void> _deleteStudent(Student student) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete student?'),
        content: Text(
          'This will remove ${student.name} and their attendance records.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton.icon(
            onPressed: () => Navigator.pop(context, true),
            icon: const Icon(Icons.delete_outline),
            label: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true || student.id == null) return;

    await DatabaseHelper.instance.deleteStudent(student.id!);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Student deleted')),
    );
    _refreshStudentList();
  }

  Future<void> _openStudentForm([Student? student]) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => RegisterScreen(studentToEdit: student),
      ),
    );
    if (result == true) _refreshStudentList();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Student Database',
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openStudentForm(),
        icon: const Icon(Icons.person_add_alt_1_outlined),
        label: const Text('Add Student'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: (_) => _refreshStudentList(),
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isEmpty
                    ? null
                    : IconButton(
                        tooltip: 'Clear search',
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          _searchController.clear();
                          _refreshStudentList();
                        },
                      ),
                hintText: 'Search by name, admission, or course',
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Text(
                  '${_students.length} record${_students.length == 1 ? '' : 's'}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.blueGrey,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _students.isEmpty
                    ? _EmptyStudents(onAdd: () => _openStudentForm())
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
                        itemCount: _students.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = _students[index];
                          return _StudentTile(
                            student: item,
                            onEdit: () => _openStudentForm(item),
                            onDelete: () => _deleteStudent(item),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _StudentTile extends StatelessWidget {
  final Student student;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _StudentTile({
    required this.student,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final initial = student.name.trim().isEmpty
        ? '?'
        : student.name.trim().substring(0, 1).toUpperCase();

    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: AppTheme.primary.withValues(alpha: 0.12),
          foregroundColor: AppTheme.primary,
          child: Text(initial),
        ),
        title: Text(
          student.name,
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            '${student.admission} | ${student.course} | Year ${student.yearOfStudy}',
          ),
        ),
        trailing: Wrap(
          spacing: 2,
          children: [
            IconButton(
              tooltip: 'Edit',
              icon: const Icon(Icons.edit_outlined),
              color: AppTheme.primary,
              onPressed: onEdit,
            ),
            IconButton(
              tooltip: 'Delete',
              icon: const Icon(Icons.delete_outline),
              color: AppTheme.danger,
              onPressed: onDelete,
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyStudents extends StatelessWidget {
  final VoidCallback onAdd;

  const _EmptyStudents({required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.groups_outlined, size: 54, color: Colors.blueGrey),
            const SizedBox(height: 12),
            Text(
              'No student records found',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Add your first student to start managing records and attendance.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.person_add_alt_1_outlined),
              label: const Text('Add Student'),
            ),
          ],
        ),
      ),
    );
  }
}
