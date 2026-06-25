import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

import '../models/student.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('students.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 3,
      onCreate: _createDB,
      onUpgrade: _onUpgrade,
    );
  }

  Future _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        admission TEXT,
        course TEXT,
        email TEXT,
        password TEXT,
        yearOfStudy TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId INTEGER,
        studentName TEXT,
        date TEXT,
        status TEXT,
        UNIQUE(studentId, date)
      )
    ''');
  }

  Future _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute(
        'ALTER TABLE students ADD COLUMN yearOfStudy TEXT DEFAULT "1"',
      );
      await db.execute('''
        CREATE TABLE attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          studentId INTEGER,
          studentName TEXT,
          date TEXT,
          status TEXT
        )
      ''');
    }

    if (oldVersion < 3) {
      await db.execute('''
        CREATE TABLE IF NOT EXISTS attendance_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          studentId INTEGER,
          studentName TEXT,
          date TEXT,
          status TEXT,
          UNIQUE(studentId, date)
        )
      ''');
      await db.execute('''
        INSERT OR REPLACE INTO attendance_new (studentId, studentName, date, status)
        SELECT studentId, studentName, date, status
        FROM attendance
        WHERE studentId IS NOT NULL AND date IS NOT NULL
      ''');
      await db.execute('DROP TABLE attendance');
      await db.execute('ALTER TABLE attendance_new RENAME TO attendance');
    }
  }

  Future<int> createStudent(Student student) async {
    final db = await instance.database;
    return await db.insert('students', student.toMap());
  }

  Future<List<Student>> getStudents({String query = ''}) async {
    final db = await instance.database;
    if (query.isEmpty) {
      final result = await db.query('students', orderBy: 'name COLLATE NOCASE');
      return result.map((e) => Student.fromMap(e)).toList();
    } else {
      final result = await db.query(
        'students',
        where: 'name LIKE ? OR admission LIKE ? OR course LIKE ?',
        whereArgs: ['%$query%', '%$query%', '%$query%'],
        orderBy: 'name COLLATE NOCASE',
      );
      return result.map((e) => Student.fromMap(e)).toList();
    }
  }

  Future<Student?> getStudentByEmail(String email) async {
    final db = await instance.database;
    final result = await db.query(
      'students',
      where: 'LOWER(email) = ?',
      whereArgs: [email.trim().toLowerCase()],
      limit: 1,
    );

    if (result.isEmpty) return null;
    return Student.fromMap(result.first);
  }

  Future<int> countStudents() async {
    final db = await instance.database;
    final result = await db.rawQuery('SELECT COUNT(*) AS total FROM students');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<int> countAttendanceForDate(String date, String status) async {
    final db = await instance.database;
    final result = await db.rawQuery(
      'SELECT COUNT(*) AS total FROM attendance WHERE date = ? AND status = ?',
      [date, status],
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<Map<String, int>> getCourseCounts() async {
    final db = await instance.database;
    final result = await db.rawQuery('''
      SELECT course, COUNT(*) AS total
      FROM students
      WHERE TRIM(COALESCE(course, '')) != ''
      GROUP BY course
      ORDER BY total DESC, course COLLATE NOCASE
    ''');

    return {
      for (final row in result)
        row['course'] as String: (row['total'] as int?) ?? 0,
    };
  }

  Future<int> updateStudent(Student student) async {
    final db = await instance.database;
    return await db.update(
      'students',
      student.toMap(),
      where: 'id = ?',
      whereArgs: [student.id],
    );
  }

  Future<int> deleteStudent(int id) async {
    final db = await instance.database;
    await db.delete('attendance', where: 'studentId = ?', whereArgs: [id]);
    return await db.delete('students', where: 'id = ?', whereArgs: [id]);
  }

  Future<int> recordAttendance(Attendance attendance) async {
    final db = await instance.database;
    return await db.insert(
      'attendance',
      attendance.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Attendance>> getAttendanceReport({String? date}) async {
    final db = await instance.database;
    final result = await db.query(
      'attendance',
      where: date == null ? null : 'date = ?',
      whereArgs: date == null ? null : [date],
      orderBy: 'date DESC, studentName COLLATE NOCASE',
    );
    return result.map((e) => Attendance.fromMap(e)).toList();
  }
}
