import 'package:flutter/material.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _nameController = TextEditingController(text: 'Class Admin');
  bool _notifications = true;
  bool _compactLists = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Profile',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Full Name',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  value: _notifications,
                  onChanged: (value) {
                    setState(() => _notifications = value);
                  },
                  secondary: const Icon(Icons.notifications_outlined),
                  title: const Text('Notifications'),
                  subtitle: const Text('Show local status messages.'),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  value: _compactLists,
                  onChanged: (value) {
                    setState(() => _compactLists = value);
                  },
                  secondary: const Icon(Icons.view_list_outlined),
                  title: const Text('Compact Lists'),
                  subtitle: const Text('Use denser student and report lists.'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Card(
            child: ListTile(
              leading: Icon(Icons.info_outline),
              title: Text('About'),
              subtitle: Text(
                'This is a simple student management system app. It allows you to manage students, track attendance, and view API data.',
              ),
              trailing: Text('v1.0.0'),
            ),
          ),
        ],
      ),
    );
  }
}
