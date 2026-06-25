class Student {
  int? id;
  String name;
  String admission;
  String course;
  String email;
  String password;
  String yearOfStudy; // Added for Week 6/7

  Student({
    this.id,
    required this.name,
    required this.admission,
    required this.course,
    required this.email,
    required this.password,
    required this.yearOfStudy,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'admission': admission,
      'course': course,
      'email': email,
      'password': password,
      'yearOfStudy': yearOfStudy,
    };
  }

  factory Student.fromMap(Map<String, dynamic> map) {
    return Student(
      id: map['id'],
      name: map['name'],
      admission: map['admission'],
      course: map['course'],
      email: map['email'],
      password: map['password'],
      yearOfStudy: map['yearOfStudy'] ?? '1',
    );
  }
}

class Attendance {
  int? id;
  int studentId;
  String studentName;
  String date;
  String status; // 'Present' or 'Absent'

  Attendance({
    this.id,
    required this.studentId,
    required this.studentName,
    required this.date,
    required this.status,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'studentId': studentId,
      'studentName': studentName,
      'date': date,
      'status': status,
    };
  }

  factory Attendance.fromMap(Map<String, dynamic> map) {
    return Attendance(
      id: map['id'],
      studentId: map['studentId'],
      studentName: map['studentName'] ?? '',
      date: map['date'],
      status: map['status'],
    );
  }
}
