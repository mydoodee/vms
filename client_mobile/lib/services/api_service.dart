import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http_parser/http_parser.dart';

class ApiService {
  static const String defaultBaseUrl = 'https://app.spkconstruction.co.th/vms/api';
  String _baseUrl = defaultBaseUrl;

  String get baseUrl => _baseUrl;

  // Singleton instance
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _baseUrl = prefs.getString('vms_base_url') ?? defaultBaseUrl;
    _token = prefs.getString('vms_token');
    final userStr = prefs.getString('vms_user');
    if (userStr != null) {
      try {
        _user = json.decode(userStr);
      } catch (_) {}
    }
  }

  Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('vms_base_url', url);
    _baseUrl = url;
  }

  String? _token;
  Map<String, dynamic>? _user;

  String? get token => _token;
  Map<String, dynamic>? get user => _user;

  Future<String?> getToken() async {
    return _token;
  }

  Future<Map<String, dynamic>?> getUser() async {
    return _user;
  }

  Map<String, String> _getHeaders(String? token) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // Authentication: Login
  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _getHeaders(null),
      body: json.encode({
        'username': username,
        'password': password,
      }),
    );

    final data = json.decode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      _token = data['data']['token'];
      _user = data['data']['user'];

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('vms_token', _token!);
      await prefs.setString('vms_user', json.encode(_user));
      return data;
    } else {
      throw Exception(data['message'] ?? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  }

  // Logout
  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('vms_token');
    await prefs.remove('vms_user');
  }

  // Fetch Vehicles
  Future<List<dynamic>> getVehicles() async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/vehicles'),
      headers: _getHeaders(token),
    );

    final data = json.decode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data['data'] as List<dynamic>;
    } else {
      throw Exception(data['message'] ?? 'ไม่สามารถเรียกข้อมูลยานพาหนะได้');
    }
  }

  // Fetch Garages
  Future<List<dynamic>> getGarages() async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/garages'),
      headers: _getHeaders(token),
    );

    final data = json.decode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data['data'] as List<dynamic>;
    } else {
      throw Exception(data['message'] ?? 'ไม่สามารถเรียกข้อมูลอู่ได้');
    }
  }

  // Fetch Renewals for a Vehicle
  Future<List<dynamic>> getRenewals(int vehicleId) async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/renewals/vehicle/$vehicleId'),
      headers: _getHeaders(token),
    );

    final data = json.decode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data['data'] as List<dynamic>;
    } else {
      throw Exception(data['message'] ?? 'ไม่สามารถเรียกข้อมูลการต่ออายุประกัน/ภาษีได้');
    }
  }

  // Fetch Tickets
  Future<List<dynamic>> getTickets() async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/tickets'),
      headers: _getHeaders(token),
    );

    final data = json.decode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data['data'] as List<dynamic>;
    } else {
      throw Exception(data['message'] ?? 'ไม่สามารถเรียกข้อมูลประวัติการแจ้งซ่อมได้');
    }
  }

  // Create Ticket (Multipart upload with images)
  Future<Map<String, dynamic>> createTicket({
    required int vehicleId,
    required String title,
    required String description,
    required String severity,
    int? garageId,
    required List<File> imageFiles,
  }) async {
    final token = await getToken();
    final uri = Uri.parse('$baseUrl/tickets');
    
    final request = http.MultipartRequest('POST', uri);
    request.headers.addAll({
      'Authorization': 'Bearer $token',
    });

    request.fields['vehicle_id'] = vehicleId.toString();
    request.fields['title'] = title;
    request.fields['description'] = description;
    request.fields['severity'] = severity;
    if (garageId != null) {
      request.fields['garage_id'] = garageId.toString();
    }

    for (int i = 0; i < imageFiles.length; i++) {
      final file = imageFiles[i];
      final stream = http.ByteStream(file.openRead());
      final length = await file.length();
      
      final multipartFile = http.MultipartFile(
        'files', // Matches the node multer array upload name 'files'
        stream,
        length,
        filename: file.path.split('/').last,
        contentType: MediaType('image', 'jpeg'),
      );
      request.files.add(multipartFile);
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    final data = json.decode(response.body);
    if (response.statusCode == 201 && data['success'] == true) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'ไม่สามารถสร้างใบแจ้งซ่อมได้');
    }
  }
  // Upload Avatar
  Future<Map<String, dynamic>> uploadAvatar(File imageFile) async {
    final token = await getToken();
    final uri = Uri.parse('$baseUrl/auth/avatar');

    final request = http.MultipartRequest('POST', uri);
    request.headers.addAll({
      'Authorization': 'Bearer $token',
    });

    final stream = http.ByteStream(imageFile.openRead());
    final length = await imageFile.length();
    final ext = imageFile.path.split('.').last.toLowerCase();

    final multipartFile = http.MultipartFile(
      'avatar',
      stream,
      length,
      filename: 'avatar.$ext',
      contentType: MediaType('image', ext == 'png' ? 'png' : 'jpeg'),
    );
    request.files.add(multipartFile);

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    final data = json.decode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      // Update cached user
      _user = data['data'];
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('vms_user', json.encode(_user));
      return data;
    } else {
      throw Exception(data['message'] ?? 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้');
    }
  }

  // Get full avatar URL
  String? getAvatarUrl(String? path) {
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http')) return path;
    // Build URL relative to server root (not /api)
    final serverRoot = _baseUrl.replaceAll('/api', '');
    return '$serverRoot/$path';
  }

  // Check App Version
  Future<Map<String, dynamic>?> checkVersion() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/app/version'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (_) {}
    return null;
  }
}
