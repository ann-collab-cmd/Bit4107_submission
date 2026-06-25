import 'package:http/http.dart' as http;
import 'dart:convert';

class DatabaseService {
  // If using Android Emulator, replace localhost with 10.0.2.2
  // If testing on a physical phone, use your machine's local IP (e.g., 192.168.x.x)
  static const String _baseUrl = "http://localhost/student_api"; 

  // Handle User Login via MySQL
  static Future<Map<String, dynamic>?> loginUser(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse("$_baseUrl/login.php"),
        body: {
          "email": email,
          "password": password,
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        print("Server Error: ${response.statusCode}");
        return null;
      }
    } catch (e) {
      print("Connection Error: $e");
      return null;
    }
  }

  // Fetch Student Dashboard Summary Metrics
  static Future<Map<String, dynamic>?> fetchDashboardMetrics() async {
    try {
      final response = await http.get(Uri.parse("$_baseUrl/get_dashboard_stats.php"));
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        print("Server Error fetching metrics: ${response.statusCode}");
        return null;
      }
    } catch (e) {
      print("Network error gathering metrics: $e");
      return null;
    }
  }

  // Fetch Student List
  static Future<List<dynamic>> fetchStudents() async {
    try {
      final response = await http.get(Uri.parse("$_baseUrl/get_students.php"));

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception("Failed to load students");
      }
    } catch (e) {
      print("Error fetching data: $e");
      return [];
    }
  }
}
