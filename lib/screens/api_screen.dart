import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';

class ApiConsumerScreen extends StatefulWidget {
  const ApiConsumerScreen({super.key});

  @override
  State<ApiConsumerScreen> createState() => _ApiConsumerScreenState();
}

class _ApiConsumerScreenState extends State<ApiConsumerScreen> {
  List<Map<String, dynamic>> _apiRecords = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchApiData();
  }

  Future<void> _fetchApiData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final url = Uri.parse('https://jsonplaceholder.typicode.com/users');
      final response = await http.get(url).timeout(const Duration(seconds: 12));

      if (!mounted) return;

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body) as List<dynamic>;
        setState(() {
          _apiRecords = decoded.cast<Map<String, dynamic>>();
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
          _error = 'Server responded with code ${response.statusCode}.';
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = 'Failed to load live records. Check internet connection.';
      });
    }
  }

  // METHOD TO SHOW FULL PROFILE DETAILS WHEN CLICKED
  void _showRecordDetails(BuildContext context, Map<String, dynamic> user) {
    final company = user['company'] as Map<String, dynamic>?;
    final address = user['address'] as Map<String, dynamic>?;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.account_circle, color: AppTheme.primary, size: 28),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                (user['name'] as String?) ?? 'User Details',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: ListBody(
            children: [
              _buildDetailRow('Username', user['username']),
              _buildDetailRow('Email', user['email']),
              _buildDetailRow('Phone', user['phone']),
              _buildDetailRow('Website', user['website']),
              const Divider(height: 24),
              _buildDetailRow('Company', company?['name']),
              _buildDetailRow('Catchphrase', company?['catchPhrase']),
              const Divider(height: 24),
              _buildDetailRow('City', address?['city']),
              _buildDetailRow('Street', address?['street']),
              _buildDetailRow('Suite', address?['suite']),
              _buildDetailRow('Zip Code', address?['zipcode']),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(color: Colors.black87, height: 1.3),
          children: [
            TextSpan(
              text: '$label: ',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            TextSpan(text: '${value ?? '-'}'),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'API Data Records',
      body: RefreshIndicator(
        onRefresh: _fetchApiData,
        child: _buildBody(context),
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 80),
          const Icon(Icons.cloud_off_outlined,
              size: 56, color: Colors.blueGrey),
          const SizedBox(height: 12),
          Text(
            _error!,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 18),
          Center(
            child: FilledButton.icon(
              onPressed: _fetchApiData,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ),
        ],
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _apiRecords.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final user = _apiRecords[i];
        final company = user['company'] as Map<String, dynamic>?;
        final address = user['address'] as Map<String, dynamic>?;

        return Card(
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 10,
            ),
            // THIS MAKES THE CARD CLICKABLE
            onTap: () => _showRecordDetails(context, user),
            leading: CircleAvatar(
              backgroundColor: AppTheme.secondary.withValues(alpha: 0.12),
              foregroundColor: AppTheme.secondary,
              child: const Icon(Icons.cloud_done_outlined),
            ),
            title: Text(
              (user['name'] as String?) ?? 'Unknown user',
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                [
                  'Username: ${user['username'] ?? '-'}',
                  'Email: ${user['email'] ?? '-'}',
                  'Company: ${company?['name'] ?? '-'}',
                  'City: ${address?['city'] ?? '-'}',
                ].join('\n'),
              ),
            ),
            trailing: const Icon(Icons.verified_outlined, size: 20),
          ),
        );
      },
    );
  }
}