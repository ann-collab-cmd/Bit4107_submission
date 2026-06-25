import 'package:flutter_test/flutter_test.dart';
import 'package:student_management_app/main.dart';

void main() {
  testWidgets('shows the login screen', (tester) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('Student Management System'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);
    expect(find.text('Register Student'), findsOneWidget);
  });
}
