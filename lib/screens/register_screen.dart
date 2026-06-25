import 'package:flutter/material.dart';

import '../db/database_helper.dart';
import '../models/student.dart';

class RegisterScreen extends StatefulWidget {
  final Student? studentToEdit;
  const RegisterScreen({super.key, this.studentToEdit});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final nameController = TextEditingController();
  final admissionController = TextEditingController();
  final courseController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final yearController = TextEditingController();

  final db = DatabaseHelper.instance;
  bool _obscurePassword = true;
  bool _isSaving = false;

  bool get isEdit => widget.studentToEdit != null;

  @override
  void initState() {
    super.initState();
    final student = widget.studentToEdit;
    if (student != null) {
      nameController.text = student.name;
      admissionController.text = student.admission;
      courseController.text = student.course;
      emailController.text = student.email;
      passwordController.text = student.password;
      yearController.text = student.yearOfStudy;
    }
  }

  @override
  void dispose() {
    nameController.dispose();
    admissionController.dispose();
    courseController.dispose();
    emailController.dispose();
    passwordController.dispose();
    yearController.dispose();
    super.dispose();
  }

  Future<void> saveStudent() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    final student = Student(
      id: widget.studentToEdit?.id,
      name: nameController.text.trim(),
      admission: admissionController.text.trim(),
      course: courseController.text.trim(),
      email: emailController.text.trim(),
      password: passwordController.text,
      yearOfStudy: yearController.text.trim(),
    );

    if (isEdit) {
      await db.updateStudent(student);
    } else {
      await db.createStudent(student);
    }

    if (!mounted) return;
    setState(() => _isSaving = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(isEdit
            ? 'Student updated successfully'
            : 'Student registered successfully'),
      ),
    );
    Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Student Details' : 'Register Student'),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 780),
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isEdit ? 'Update Student' : 'New Student',
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Required fields are marked with an asterisk.',
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: Colors.blueGrey),
                        ),
                        const SizedBox(height: 18),
                        _field(
                          controller: nameController,
                          label: 'Full Name *',
                          icon: Icons.person_outline,
                          validator: _required('Full name is required'),
                        ),
                        const SizedBox(height: 14),
                        _field(
                          controller: admissionController,
                          label: 'Admission/Reg No *',
                          icon: Icons.badge_outlined,
                          validator: _required('Admission number is required'),
                        ),
                        const SizedBox(height: 14),
                        _field(
                          controller: courseController,
                          label: 'Course *',
                          icon: Icons.menu_book_outlined,
                          validator: _required('Course is required'),
                        ),
                        const SizedBox(height: 14),
                        _field(
                          controller: yearController,
                          label: 'Year of Study *',
                          icon: Icons.calendar_today_outlined,
                          keyboardType: TextInputType.number,
                          validator: (value) {
                            final year = int.tryParse(value?.trim() ?? '');
                            if (year == null) return 'Enter a valid year';
                            if (year < 1 || year > 6) {
                              return 'Year should be between 1 and 6';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),
                        _field(
                          controller: emailController,
                          label: 'Email *',
                          icon: Icons.mail_outline,
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) {
                            final text = value?.trim() ?? '';
                            if (text.isEmpty) return 'Email is required';
                            if (!text.contains('@')) {
                              return 'Enter a valid email address';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),
                        TextFormField(
                          controller: passwordController,
                          obscureText: _obscurePassword,
                          decoration: InputDecoration(
                            labelText: 'Password *',
                            prefixIcon: const Icon(Icons.lock_outline),
                            suffixIcon: IconButton(
                              tooltip: _obscurePassword
                                  ? 'Show password'
                                  : 'Hide password',
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              },
                            ),
                          ),
                          validator: (value) {
                            if ((value ?? '').length < 4) {
                              return 'Password must be at least 4 characters';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        FilledButton.icon(
                          onPressed: _isSaving ? null : saveStudent,
                          icon: _isSaving
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : Icon(isEdit
                                  ? Icons.save_outlined
                                  : Icons.person_add_alt_1_outlined),
                          label: Text(isEdit ? 'Save Changes' : 'Register'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  TextFormField _field({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
      ),
      validator: validator,
    );
  }

  String? Function(String?) _required(String message) {
    return (value) {
      if ((value ?? '').trim().isEmpty) return message;
      return null;
    };
  }
}
