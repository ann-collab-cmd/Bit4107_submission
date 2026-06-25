// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:convert';
import 'dart:html' as html;

import '../models/student.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static const _studentsKey = 'student_management_students';
  static const _attendanceKey = 'student_management_attendance';

  DatabaseHelper._init();

  Future<int> createStudent(Student student) async {
    final students = _students();
    final nextId = _nextId(students);
    final savedStudent = Student(
      id: nextId,
      name: student.name,
      admission: student.admission,
      course: student.course,
      email: student.email,
      password: student.password,
      yearOfStudy: student.yearOfStudy,
    );

    students.add(savedStudent);
    _saveStudents(students);
    return nextId;
  }

  Future<List<Student>> getStudents({String query = ''}) async {
    final text = query.trim().toLowerCase();
    final students = _students()
      ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));

    if (text.isEmpty) return students;

    return students.where((student) {
      return student.name.toLowerCase().contains(text) ||
          student.admission.toLowerCase().contains(text) ||
          student.course.toLowerCase().contains(text);
    }).toList();
  }

  Future<Student?> getStudentByEmail(String email) async {
    final lookup = email.trim().toLowerCase();
    for (final student in _students()) {
      if (student.email.trim().toLowerCase() == lookup) {
        return student;
      }
    }
    return null;
  }

  Future<int> countStudents() async {
    return _students().length;
  }

  Future<int> countAttendanceForDate(String date, String status) async {
    return _attendance()
        .where((record) => record.date == date && record.status == status)
        .length;
  }

  Future<Map<String, int>> getCourseCounts() async {
    final counts = <String, int>{};
    for (final student in _students()) {
      final course = student.course.trim();
      if (course.isEmpty) continue;
      counts[course] = (counts[course] ?? 0) + 1;
    }

    final entries = counts.entries.toList()
      ..sort((a, b) {
        final countCompare = b.value.compareTo(a.value);
        if (countCompare != 0) return countCompare;
        return a.key.toLowerCase().compareTo(b.key.toLowerCase());
      });

    return Map.fromEntries(entries);
  }

  Future<int> updateStudent(Student student) async {
    final students = _students();
    final index = students.indexWhere((item) => item.id == student.id);
    if (index == -1) return 0;

    students[index] = student;
    _saveStudents(students);

    final reports = _attendance().map((record) {
      if (record.studentId != student.id) return record;
      return Attendance(
        id: record.id,
        studentId: record.studentId,
        studentName: student.name,
        date: record.date,
        status: record.status,
      );
    }).toList();
    _saveAttendance(reports);

    return 1;
  }

  Future<int> deleteStudent(int id) async {
    final students = _students();
    final before = students.length;
    students.removeWhere((student) => student.id == id);
    _saveStudents(students);

    final reports = _attendance()
      ..removeWhere((record) => record.studentId == id);
    _saveAttendance(reports);

    return before - students.length;
  }

  Future<int> recordAttendance(Attendance attendance) async {
    final reports = _attendance();
    final existingIndex = reports.indexWhere(
      (record) =>
          record.studentId == attendance.studentId &&
          record.date == attendance.date,
    );

    final savedAttendance = Attendance(
      id: existingIndex == -1
          ? _nextAttendanceId(reports)
          : reports[existingIndex].id,
      studentId: attendance.studentId,
      studentName: attendance.studentName,
      date: attendance.date,
      status: attendance.status,
    );

    if (existingIndex == -1) {
      reports.add(savedAttendance);
    } else {
      reports[existingIndex] = savedAttendance;
    }

    _saveAttendance(reports);
    return savedAttendance.id ?? 0;
  }

  Future<List<Attendance>> getAttendanceReport({String? date}) async {
    final reports = _attendance()
      ..sort((a, b) {
        final dateCompare = b.date.compareTo(a.date);
        if (dateCompare != 0) return dateCompare;
        return a.studentName
            .toLowerCase()
            .compareTo(b.studentName.toLowerCase());
      });

    if (date == null) return reports;
    return reports.where((record) => record.date == date).toList();
  }

  List<Student> _students() {
    final raw = html.window.localStorage[_studentsKey];
    if (raw == null || raw.isEmpty) return [];
    final decoded = json.decode(raw) as List<dynamic>;
    return decoded.cast<Map<String, dynamic>>().map(Student.fromMap).toList();
  }

  List<Attendance> _attendance() {
    final raw = html.window.localStorage[_attendanceKey];
    if (raw == null || raw.isEmpty) return [];
    final decoded = json.decode(raw) as List<dynamic>;
    return decoded
        .cast<Map<String, dynamic>>()
        .map(Attendance.fromMap)
        .toList();
  }

  void _saveStudents(List<Student> students) {
    html.window.localStorage[_studentsKey] = json.encode(
      students.map((student) => student.toMap()).toList(),
    );
  }

  void _saveAttendance(List<Attendance> attendance) {
    html.window.localStorage[_attendanceKey] = json.encode(
      attendance.map((record) => record.toMap()).toList(),
    );
  }

  int _nextId(List<Student> students) {
    if (students.isEmpty) return 1;
    return students
            .map((student) => student.id ?? 0)
            .reduce((value, next) => value > next ? value : next) +
        1;
  }

  int _nextAttendanceId(List<Attendance> attendance) {
    if (attendance.isEmpty) return 1;
    return attendance
            .map((record) => record.id ?? 0)
            .reduce((value, next) => value > next ? value : next) +
        1;
  }
}
