import 'dart:io';
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'vehicle_screen.dart';
import 'new_ticket_screen.dart';
import 'ticket_detail_screen.dart';
import 'renewals_screen.dart';
import 'maintenance_report_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  static const String _currentAppVersion = '1.0.6';
  int _currentIndex = 0;
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _assignedVehicle;
  List<dynamic> _tickets = [];
  List<dynamic> _vehicles = [];
  Map<String, dynamic>? _selectedVehicle;

  bool _isLoading = true;
  String? _error;

  final TextEditingController _vehicleSearchController =
      TextEditingController();
  String _vehicleSearchQuery = '';

  late final PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: 0);
    _loadData();
    _checkAppUpdate();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _vehicleSearchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final user = await ApiService().getUser();
      final vehicles = await ApiService().getVehicles();
      final tickets = await ApiService().getTickets();

      // Find vehicle assigned to this driver
      Map<String, dynamic>? assigned;
      if (user != null && user['fullname'] != null) {
        final driverName = user['fullname'].toString().toLowerCase().trim();
        for (var v in vehicles) {
          final assignedDriver = (v['assigned_driver'] ?? '')
              .toString()
              .toLowerCase()
              .trim();
          if (assignedDriver == driverName && driverName.isNotEmpty) {
            assigned = v as Map<String, dynamic>;
            break;
          }
        }
      }

      setState(() {
        _user = user;
        _vehicles = vehicles;
        _assignedVehicle = assigned;
        if (assigned != null) {
          _selectedVehicle = assigned;
        } else if (_selectedVehicle != null) {
          final match = vehicles.firstWhere(
            (v) => v['id'] == _selectedVehicle!['id'],
            orElse: () => null,
          );
          _selectedVehicle = match != null
              ? match as Map<String, dynamic>
              : null;
        }
        _tickets = tickets;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.logout, color: Colors.redAccent, size: 24),
            SizedBox(width: 12),
            Text('ออกจากระบบ', style: TextStyle(color: Colors.white)),
          ],
        ),
        content: const Text(
          'คุณต้องการออกจากระบบหรือไม่?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('ยกเลิก', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text('ยืนยัน'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await ApiService().logout();
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    }
  }

  void _onTabTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  // ============ DASHBOARD TAB ============
  Widget _buildDashboard() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.cyanAccent),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                color: Colors.redAccent,
                size: 48,
              ),
              const SizedBox(height: 16),
              Text(
                _error!,
                style: const TextStyle(color: Colors.redAccent, fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadData,
                icon: const Icon(Icons.refresh),
                label: const Text('ลองใหม่'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.cyanAccent.shade400,
                  foregroundColor: const Color(0xFF0F172A),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final primaryColor = Colors.cyanAccent.shade400;
    final pendingCount = _tickets.where((t) => t['status'] == 'pending').length;
    final inProgressCount = _tickets
        .where((t) => t['status'] == 'in_progress')
        .length;
    final completedCount = _tickets
        .where((t) => t['status'] == 'completed')
        .length;

    return RefreshIndicator(
      onRefresh: _loadData,
      color: Colors.cyanAccent,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Driver Welcome Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF1E293B),
                    Colors.cyan.withOpacity(0.15),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.cyan.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.cyanAccent.shade400,
                          Colors.cyan.shade700,
                        ],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: ClipOval(child: _buildAvatarContent(size: 60)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'สวัสดี, ${_user?['fullname'] ?? 'คนขับรถ'}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: primaryColor.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                _user?['role'] ?? '-',
                                style: TextStyle(
                                  color: primaryColor,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'แผนก: ${_user?['department'] ?? '-'}',
                              style: const TextStyle(
                                color: Colors.white60,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Stats Row
            Row(
              children: [
                _buildStatCard(
                  'รอดำเนินการ',
                  pendingCount.toString(),
                  Colors.amber,
                  Icons.hourglass_empty,
                ),
                const SizedBox(width: 10),
                _buildStatCard(
                  'กำลังซ่อม',
                  inProgressCount.toString(),
                  Colors.orange,
                  Icons.build,
                ),
                const SizedBox(width: 10),
                _buildStatCard(
                  'เสร็จสิ้น',
                  completedCount.toString(),
                  Colors.green,
                  Icons.check_circle,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Assigned Vehicle Summary
            Row(
              children: [
                Icon(Icons.directions_car, color: primaryColor, size: 20),
                const SizedBox(width: 8),
                Text(
                  _assignedVehicle != null
                      ? 'รถยนต์ประจำตัวของคุณ'
                      : 'เลือกตรวจสอบข้อมูลรถยนต์คันอื่น',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Dropdown selector if no vehicle is assigned
            if (_assignedVehicle == null && _vehicles.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.cyan.withOpacity(0.15)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<Map<String, dynamic>>(
                    dropdownColor: const Color(0xFF1E293B),
                    hint: const Text(
                      'เลือกทะเบียนรถยนต์...',
                      style: TextStyle(color: Colors.white30, fontSize: 14),
                    ),
                    value: _selectedVehicle,
                    isExpanded: true,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                    items: _vehicles.map((v) {
                      return DropdownMenuItem<Map<String, dynamic>>(
                        value: v as Map<String, dynamic>,
                        child: Text(
                          '${v['plate_number']} - ${v['brand']} ${v['model'] ?? ''}',
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setState(() {
                        _selectedVehicle = val;
                      });
                    },
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Display vehicle card if assigned OR selected
            if (_assignedVehicle != null || _selectedVehicle != null) ...[
              GestureDetector(
                onTap: () {
                  final activeV = _assignedVehicle ?? _selectedVehicle;
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => VehicleScreen(vehicle: activeV!),
                    ),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.cyan.withOpacity(0.15)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.cyan.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.directions_car,
                          color: primaryColor,
                          size: 32,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${(_assignedVehicle ?? _selectedVehicle)!['brand']} ${(_assignedVehicle ?? _selectedVehicle)!['model'] ?? ''}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                      color: Colors.blue.withOpacity(0.3),
                                    ),
                                  ),
                                  child: Text(
                                    (_assignedVehicle ??
                                        _selectedVehicle)!['plate_number'],
                                    style: const TextStyle(
                                      color: Colors.blue,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Icon(
                                  Icons.speed,
                                  color: Colors.orange.shade300,
                                  size: 14,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${_formatNumber((_assignedVehicle ?? _selectedVehicle)!['mileage'])} km',
                                  style: TextStyle(
                                    color: Colors.orange.shade300,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.arrow_forward_ios,
                        color: Colors.white30,
                        size: 16,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => RenewalsScreen(
                              vehicle: (_assignedVehicle ?? _selectedVehicle)!,
                            ),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.green.withOpacity(0.2),
                          ),
                        ),
                        child: const Column(
                          children: [
                            Icon(Icons.history, color: Colors.green),
                            SizedBox(height: 6),
                            Text(
                              'ประวัติต่อประกัน/ภาษี',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => MaintenanceReportScreen(
                              vehicle: (_assignedVehicle ?? _selectedVehicle)!,
                            ),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.blue.withOpacity(0.2),
                          ),
                        ),
                        child: const Column(
                          children: [
                            Icon(Icons.bar_chart, color: Colors.blue),
                            SizedBox(height: 6),
                            Text(
                              'รายงานซ่อมบำรุง',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ] else ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B).withOpacity(0.5),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                child: const Column(
                  children: [
                    Icon(
                      Icons.directions_car_filled_outlined,
                      color: Colors.white24,
                      size: 48,
                    ),
                    SizedBox(height: 12),
                    Text(
                      'กรุณาเลือกทะเบียนรถยนต์เพื่อตรวจสอบข้อมูล',
                      style: TextStyle(color: Colors.white54, fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Recent Tickets Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.history, color: primaryColor, size: 20),
                    const SizedBox(width: 8),
                    const Text(
                      'การแจ้งซ่อมล่าสุด',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                if (_tickets.length > 3)
                  TextButton(
                    onPressed: () {
                      _onTabTapped(2); // Switch to tickets tab
                    },
                    child: const Text(
                      'ดูทั้งหมด →',
                      style: TextStyle(color: Colors.cyan, fontSize: 13),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),

            // Recent Tickets (top 3)
            if (_tickets.isEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: const Center(
                  child: Text(
                    'ไม่มีการแจ้งซ่อมในระบบ',
                    style: TextStyle(color: Colors.white38),
                  ),
                ),
              ),
            ] else ...[
              ..._tickets
                  .take(3)
                  .map(
                    (ticket) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _buildTicketCard(ticket),
                    ),
                  ),
            ],
            const SizedBox(height: 80), // Space for FAB
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String label,
    String value,
    Color color,
    IconData icon,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 24,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(color: Colors.white60, fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketCard(dynamic ticket) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context)
            .push(
              MaterialPageRoute(
                builder: (_) => TicketDetailScreen(ticketId: ticket['id']),
              ),
            )
            .then((_) => _loadData());
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Row(
          children: [
            Container(
              width: 4,
              height: 50,
              decoration: BoxDecoration(
                color: _getStatusColor(ticket['status']),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    ticket['title'] ?? 'ไม่ระบุหัวข้อ',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'ทะเบียน: ${ticket['plate_number'] ?? '-'} • ${_formatTicketDate(ticket['created_at'])}',
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _buildStatusBadge(ticket['status']),
          ],
        ),
      ),
    );
  }

  // ============ VEHICLES TAB ============
  Widget _buildVehicleCard(dynamic vehicle) {
    final primaryColor = Colors.cyanAccent.shade400;
    final imagesJson = vehicle['images']?.toString() ?? '[]';
    List<dynamic> images = [];
    try {
      images = json.decode(imagesJson);
    } catch (_) {}

    final hasImage =
        images.isNotEmpty && images[0].toString().trim().isNotEmpty;
    final serverBase = ApiService().baseUrl.replaceAll('/api', '');
    final imageUrl = hasImage
        ? (images[0].toString().startsWith('http')
              ? images[0].toString()
              : '$serverBase/${images[0]}')
        : '';

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Car Image Thumbnail
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: 80,
                    height: 80,
                    color: Colors.white.withOpacity(0.05),
                    child: hasImage
                        ? Image.network(
                            imageUrl,
                            width: 80,
                            height: 80,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => const Center(
                              child: Icon(
                                Icons.directions_car,
                                color: Colors.white30,
                                size: 32,
                              ),
                            ),
                          )
                        : const Center(
                            child: Icon(
                              Icons.directions_car,
                              color: Colors.white30,
                              size: 32,
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                // Vehicle Information
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              vehicle['plate_number'] ?? 'ไม่ระบุทะเบียน',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                letterSpacing: 0.5,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: primaryColor.withOpacity(0.3),
                                width: 1,
                              ),
                            ),
                            child: Text(
                              vehicle['brand'] ?? 'ยี่ห้ออื่น',
                              style: TextStyle(
                                color: primaryColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 10,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'รุ่น: ${vehicle['model'] ?? '-'} • ปี: ${vehicle['year'] ?? '-'}',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.person_outline,
                            size: 13,
                            color: Colors.white38,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              'ผู้ขับขี่: ${vehicle['assigned_driver'] ?? 'ไม่ได้มอบหมาย'}',
                              style: const TextStyle(
                                color: Colors.white38,
                                fontSize: 11,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.of(context)
                          .push(
                            MaterialPageRoute(
                              builder: (_) => VehicleScreen(vehicle: vehicle),
                            ),
                          )
                          .then((_) => _loadData());
                    },
                    icon: const Icon(Icons.info_outline, size: 14),
                    label: const Text(
                      'ดูข้อมูลรถ',
                      style: TextStyle(fontSize: 12),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white70,
                      side: BorderSide(color: Colors.white.withOpacity(0.1)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 6),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context)
                          .push(
                            MaterialPageRoute(
                              builder: (_) => NewTicketScreen(
                                vehicleId: vehicle['id'],
                                plateNumber: vehicle['plate_number'],
                              ),
                            ),
                          )
                          .then((_) => _loadData());
                    },
                    icon: const Icon(Icons.add_comment, size: 14),
                    label: const Text(
                      'แจ้งซ่อม',
                      style: TextStyle(fontSize: 12),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: const Color(0xFF0F172A),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      textStyle: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVehiclesList() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.cyanAccent),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_error!, style: const TextStyle(color: Colors.redAccent)),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadData, child: const Text('ลองใหม่')),
          ],
        ),
      );
    }

    if (_vehicles.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.directions_car_outlined,
              color: Colors.white24,
              size: 64,
            ),
            SizedBox(height: 16),
            Text(
              'ไม่มีข้อมูลรถยนต์ในระบบ',
              style: TextStyle(color: Colors.white54, fontSize: 16),
            ),
          ],
        ),
      );
    }

    final query = _vehicleSearchQuery.trim().toLowerCase();
    final filteredVehicles = _vehicles.where((v) {
      if (query.isEmpty) return true;
      final plate = (v['plate_number'] ?? '').toString().toLowerCase();
      final brand = (v['brand'] ?? '').toString().toLowerCase();
      final model = (v['model'] ?? '').toString().toLowerCase();
      final driver = (v['assigned_driver'] ?? '').toString().toLowerCase();
      return plate.contains(query) ||
          brand.contains(query) ||
          model.contains(query) ||
          driver.contains(query);
    }).toList();

    return Column(
      children: [
        // Search Bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: TextField(
            controller: _vehicleSearchController,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'ค้นหาทะเบียน ยี่ห้อ รุ่น หรือคนขับ...',
              hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
              prefixIcon: const Icon(
                Icons.search,
                color: Colors.white38,
                size: 20,
              ),
              suffixIcon: _vehicleSearchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(
                        Icons.clear,
                        color: Colors.white38,
                        size: 18,
                      ),
                      onPressed: () {
                        setState(() {
                          _vehicleSearchController.clear();
                          _vehicleSearchQuery = '';
                        });
                      },
                    )
                  : null,
              filled: true,
              fillColor: const Color(0xFF1E293B),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.white.withOpacity(0.05)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: Colors.cyanAccent.shade400.withOpacity(0.5),
                ),
              ),
            ),
            onChanged: (val) {
              setState(() {
                _vehicleSearchQuery = val;
              });
            },
          ),
        ),
        // Vehicles List
        Expanded(
          child: filteredVehicles.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.search_off_outlined,
                        color: Colors.white24,
                        size: 48,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'ไม่พบผลการค้นหาสำหรับ "$_vehicleSearchQuery"',
                        style: const TextStyle(
                          color: Colors.white38,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  color: Colors.cyanAccent,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredVehicles.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 14),
                    itemBuilder: (context, index) {
                      return _buildVehicleCard(filteredVehicles[index]);
                    },
                  ),
                ),
        ),
      ],
    );
  }

  // ============ TICKETS TAB ============
  Widget _buildTicketsList() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.cyanAccent),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_error!, style: const TextStyle(color: Colors.redAccent)),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadData, child: const Text('ลองใหม่')),
          ],
        ),
      );
    }

    if (_tickets.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.build_outlined, color: Colors.white24, size: 64),
            SizedBox(height: 16),
            Text(
              'ยังไม่มีรายการแจ้งซ่อม',
              style: TextStyle(color: Colors.white54, fontSize: 16),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      color: Colors.cyanAccent,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _tickets.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          return _buildTicketCard(_tickets[index]);
        },
      ),
    );
  }

  // ============ AVATAR HELPERS ============
  Widget _buildAvatarContent({double size = 90}) {
    final avatarUrl = ApiService().getAvatarUrl(_user?['avatar_url']);
    if (avatarUrl != null) {
      return Image.network(
        avatarUrl,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => Center(
          child: Text(
            _user?['fullname']?.substring(0, 1).toUpperCase() ?? 'U',
            style: TextStyle(
              fontSize: size * 0.4,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF0F172A),
            ),
          ),
        ),
      );
    }
    return Center(
      child: Text(
        _user?['fullname']?.substring(0, 1).toUpperCase() ?? 'U',
        style: TextStyle(
          fontSize: size * 0.4,
          fontWeight: FontWeight.w900,
          color: const Color(0xFF0F172A),
        ),
      ),
    );
  }

  Future<void> _pickAndUploadAvatar() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 85,
    );
    if (pickedFile == null) return;

    try {
      final file = File(pickedFile.path);
      final result = await ApiService().uploadAvatar(file);
      if (result['success'] == true) {
        setState(() {
          _user = result['data'];
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('อัปโหลดรูปโปรไฟล์สำเร็จ!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('ไม่สามารถอัปโหลดรูปได้: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  // ============ PROFILE TAB ============
  Widget _buildProfile() {
    final primaryColor = Colors.cyanAccent.shade400;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SizedBox(height: 16),
          // Avatar with tap-to-change
          GestureDetector(
            onTap: _pickAndUploadAvatar,
            child: Stack(
              children: [
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.cyanAccent.shade400,
                        Colors.cyan.shade700,
                      ],
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.cyan.withOpacity(0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: ClipOval(child: _buildAvatarContent(size: 90)),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: Colors.cyanAccent.shade400,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFF0F172A),
                        width: 2,
                      ),
                    ),
                    child: const Icon(
                      Icons.camera_alt,
                      size: 16,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            _user?['fullname'] ?? 'ไม่ทราบชื่อ',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '@${_user?['username'] ?? '-'}',
            style: const TextStyle(color: Colors.white54, fontSize: 14),
          ),
          const SizedBox(height: 24),

          // Info Cards
          _buildProfileInfoCard([
            _ProfileInfoItem(
              icon: Icons.badge_outlined,
              label: 'ชื่อ-สกุล',
              value: _user?['fullname'] ?? '-',
            ),
            _ProfileInfoItem(
              icon: Icons.work_outline,
              label: 'บทบาท',
              value: _user?['role'] ?? '-',
            ),
            _ProfileInfoItem(
              icon: Icons.business_outlined,
              label: 'แผนก',
              value: _user?['department'] ?? '-',
            ),
          ]),
          const SizedBox(height: 16),

          // Vehicle Info
          if (_assignedVehicle != null)
            _buildProfileInfoCard([
              _ProfileInfoItem(
                icon: Icons.directions_car,
                label: 'รถประจำตัว',
                value:
                    '${_assignedVehicle!['brand']} ${_assignedVehicle!['model'] ?? ''}',
              ),
              _ProfileInfoItem(
                icon: Icons.confirmation_number_outlined,
                label: 'ทะเบียน',
                value: _assignedVehicle!['plate_number'] ?? '-',
              ),
            ]),
          const SizedBox(height: 16),

          // Stats
          _buildProfileInfoCard([
            _ProfileInfoItem(
              icon: Icons.list_alt,
              label: 'แจ้งซ่อมทั้งหมด',
              value: '${_tickets.length} รายการ',
            ),
            _ProfileInfoItem(
              icon: Icons.pending_actions,
              label: 'รอดำเนินการ',
              value:
                  '${_tickets.where((t) => t['status'] == 'pending').length} รายการ',
            ),
          ]),
          const SizedBox(height: 16),

          // Clickable Navigation List Card
          if (_assignedVehicle != null) ...[
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.history, color: Colors.green),
                    title: const Text(
                      'ประวัติการต่อประกัน/ภาษี',
                      style: TextStyle(color: Colors.white, fontSize: 14),
                    ),
                    trailing: const Icon(
                      Icons.arrow_forward_ios,
                      color: Colors.white30,
                      size: 14,
                    ),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) =>
                              RenewalsScreen(vehicle: _assignedVehicle!),
                        ),
                      );
                    },
                  ),
                  const Divider(color: Colors.white10, height: 1),
                  ListTile(
                    leading: const Icon(Icons.bar_chart, color: Colors.blue),
                    title: const Text(
                      'รายงานการซ่อมบำรุง',
                      style: TextStyle(color: Colors.white, fontSize: 14),
                    ),
                    trailing: const Icon(
                      Icons.arrow_forward_ios,
                      color: Colors.white30,
                      size: 14,
                    ),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => MaintenanceReportScreen(
                            vehicle: _assignedVehicle!,
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // App info
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.info_outline, color: primaryColor, size: 16),
                    const SizedBox(width: 8),
                    const Text(
                      'SPK AMS v1.0.5',
                      style: TextStyle(color: Colors.white54, fontSize: 13),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'SPK Construction Co., Ltd.',
                  style: TextStyle(color: Colors.white30, fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Logout Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _handleLogout,
              icon: const Icon(Icons.logout),
              label: const Text(
                'ออกจากระบบ',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent.withOpacity(0.15),
                foregroundColor: Colors.redAccent,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                side: const BorderSide(color: Colors.redAccent, width: 1),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildProfileInfoCard(List<_ProfileInfoItem> items) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        children: items.asMap().entries.map((entry) {
          final item = entry.value;
          final isLast = entry.key == items.length - 1;
          return Column(
            children: [
              Row(
                children: [
                  Icon(item.icon, color: Colors.cyanAccent.shade400, size: 20),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.label,
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          item.value,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (!isLast)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 10),
                  child: Divider(color: Colors.white10, height: 1),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }

  // ============ HELPERS ============
  Widget _buildStatusBadge(String? status) {
    Color color = _getStatusColor(status);
    String text = _getStatusText(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        border: Border.all(color: color.withOpacity(0.5)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'pending':
        return Colors.amber;
      case 'approved':
        return Colors.blue;
      case 'in_progress':
        return Colors.orange;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String? status) {
    switch (status) {
      case 'pending':
        return 'รออนุมัติ';
      case 'approved':
        return 'อนุมัติแล้ว';
      case 'in_progress':
        return 'กำลังซ่อม';
      case 'completed':
        return 'เสร็จสิ้น';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status ?? 'ไม่ระบุ';
    }
  }

  String _formatNumber(dynamic num) {
    if (num == null) return '0';
    final str = num.toString();
    RegExp reg = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
    String mathFunc(Match match) => '${match[1]},';
    return str.replaceAllMapped(reg, mathFunc);
  }

  String _formatTicketDate(dynamic date) {
    if (date == null) return '-';
    try {
      final d = DateTime.parse(date.toString());
      return '${d.day}/${d.month}/${d.year + 543}';
    } catch (_) {
      return date.toString().split('T')[0];
    }
  }

  // ============ BUILD ============
  @override
  Widget build(BuildContext context) {
    const backgroundColor = Color(0xFF0F172A);
    final primaryColor = Colors.cyanAccent.shade400;

    final titles = ['SPK AMS', 'จัดการรถยนต์', 'รายการแจ้งซ่อม', 'โปรไฟล์'];

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: ClipOval(
              child: Padding(
                padding: const EdgeInsets.all(2.0),
                child: Image.asset(
                  'assets/images/logo.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),
        ),
        title: Text(
          titles[_currentIndex],
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        actions: [
          if (_currentIndex != 3)
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.white70),
              onPressed: _loadData,
            ),
        ],
      ),
      body: PageView(
        controller: _pageController,
        onPageChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        children: [
          _buildDashboard(),
          _buildVehiclesList(),
          _buildTicketsList(),
          _buildProfile(),
        ],
      ),
      floatingActionButton:
          _currentIndex != 3 &&
              (_assignedVehicle != null || _selectedVehicle != null)
          ? FloatingActionButton.extended(
              onPressed: () {
                final activeV = _assignedVehicle ?? _selectedVehicle;
                Navigator.of(context)
                    .push(
                      MaterialPageRoute(
                        builder: (_) => NewTicketScreen(
                          vehicleId: activeV!['id'],
                          plateNumber: activeV['plate_number'],
                        ),
                      ),
                    )
                    .then((_) => _loadData());
              },
              backgroundColor: primaryColor,
              icon: const Icon(Icons.add_comment, color: Color(0xFF0F172A)),
              label: const Text(
                'แจ้งซ่อม',
                style: TextStyle(
                  color: Color(0xFF0F172A),
                  fontWeight: FontWeight.bold,
                ),
              ),
            )
          : null,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          border: Border(
            top: BorderSide(color: Colors.white.withOpacity(0.06)),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _onTabTapped,
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: primaryColor,
          unselectedItemColor: Colors.white38,
          selectedLabelStyle: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard),
              label: 'แดชบอร์ด',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.directions_car_outlined),
              activeIcon: Icon(Icons.directions_car),
              label: 'รถยนต์',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.build_outlined),
              activeIcon: Icon(Icons.build),
              label: 'แจ้งซ่อม',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'โปรไฟล์',
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _checkAppUpdate() async {
    try {
      final info = await ApiService().checkVersion();
      if (info != null && info['success'] == true) {
        final serverVersion = info['version']?.toString() ?? '1.0.0';
        final downloadUrl = info['downloadUrl']?.toString();
        final releaseNotes = info['releaseNotes']?.toString() ?? '';
        if (serverVersion != _currentAppVersion && downloadUrl != null) {
          if (mounted) {
            showModalBottomSheet(
              context: context,
              isDismissible: false,
              enableDrag: false,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (_) => _UpdateBottomSheet(
                currentVersion: _currentAppVersion,
                newVersion: serverVersion,
                downloadUrl: downloadUrl,
                releaseNotes: releaseNotes,
              ),
            );
          }
        }
      }
    } catch (_) {}
  }
}

// ============================================================
// PROFESSIONAL IN-APP UPDATE BOTTOM SHEET
// ============================================================
enum _UpdateState { available, downloading, readyToInstall, error }

class _UpdateBottomSheet extends StatefulWidget {
  final String currentVersion;
  final String newVersion;
  final String downloadUrl;
  final String releaseNotes;

  const _UpdateBottomSheet({
    required this.currentVersion,
    required this.newVersion,
    required this.downloadUrl,
    required this.releaseNotes,
  });

  @override
  State<_UpdateBottomSheet> createState() => _UpdateBottomSheetState();
}

class _UpdateBottomSheetState extends State<_UpdateBottomSheet>
    with SingleTickerProviderStateMixin {
  _UpdateState _state = _UpdateState.available;
  double _progress = 0;
  int _downloadedBytes = 0;
  int _totalBytes = 0;
  String? _apkPath;
  String _errorMsg = '';
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  String _formatBytes(int bytes) {
    if (bytes <= 0) return '0 B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  Future<void> _startDownload() async {
    setState(() {
      _state = _UpdateState.downloading;
      _progress = 0;
      _downloadedBytes = 0;
      _totalBytes = 0;
    });
    try {
      final request = http.Request('GET', Uri.parse(widget.downloadUrl));
      final response = await request.send();
      _totalBytes = response.contentLength ?? 0;

      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/spk_ams_update.apk');
      final sink = file.openWrite();

      await for (final chunk in response.stream) {
        sink.add(chunk);
        _downloadedBytes += chunk.length;
        if (mounted) {
          setState(() {
            _progress = _totalBytes > 0
                ? (_downloadedBytes / _totalBytes).clamp(0.0, 1.0)
                : 0;
          });
        }
      }
      await sink.flush();
      await sink.close();

      if (mounted) {
        setState(() {
          _apkPath = file.path;
          _state = _UpdateState.readyToInstall;
          _progress = 1.0;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _state = _UpdateState.error;
          _errorMsg = e.toString();
        });
      }
    }
  }

  Future<void> _installApk() async {
    if (_apkPath == null) return;
    await OpenFile.open(
      _apkPath!,
      type: 'application/vnd.android.package-archive',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle bar
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),
              // ========== HEADER ==========
              _buildHeader(),
              const SizedBox(height: 24),
              // ========== CONTENT ==========
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 400),
                switchInCurve: Curves.easeOut,
                switchOutCurve: Curves.easeIn,
                child: _buildContent(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        // Logo circle
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.cyanAccent.withOpacity(0.3),
                blurRadius: 20,
                spreadRadius: 2,
              ),
            ],
          ),
          child: ClipOval(
            child: Padding(
              padding: const EdgeInsets.all(6),
              child: Image.asset('assets/images/logo.png', fit: BoxFit.contain),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'SPK AMS',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  _VersionBadge(
                    label: widget.currentVersion,
                    color: Colors.white24,
                    textColor: Colors.white54,
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 6),
                    child: Icon(
                      Icons.arrow_forward,
                      size: 12,
                      color: Colors.white38,
                    ),
                  ),
                  _VersionBadge(
                    label: widget.newVersion,
                    color: Colors.cyanAccent.withOpacity(0.15),
                    textColor: Colors.cyanAccent,
                    isNew: true,
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildContent() {
    switch (_state) {
      case _UpdateState.available:
        return _buildAvailableState();
      case _UpdateState.downloading:
        return _buildDownloadingState();
      case _UpdateState.readyToInstall:
        return _buildReadyState();
      case _UpdateState.error:
        return _buildErrorState();
    }
  }

  Widget _buildAvailableState() {
    return Column(
      key: const ValueKey('available'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Release Notes
        if (widget.releaseNotes.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.auto_awesome,
                      size: 14,
                      color: Colors.cyanAccent,
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      'สิ่งใหม่ในเวอร์ชันนี้',
                      style: TextStyle(
                        color: Colors.cyanAccent,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  widget.releaseNotes,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: 20),
        // Primary Button
        ElevatedButton(
          onPressed: _startDownload,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.cyanAccent.shade400,
            foregroundColor: const Color(0xFF0F172A),
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            elevation: 0,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(Icons.download_rounded, size: 20),
              SizedBox(width: 8),
              Text(
                'ดาวน์โหลดและติดตั้ง',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        // Secondary Button
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          style: TextButton.styleFrom(foregroundColor: Colors.white38),
          child: const Text('ภายหลัง', style: TextStyle(fontSize: 14)),
        ),
      ],
    );
  }

  Widget _buildDownloadingState() {
    final pct = (_progress * 100).toStringAsFixed(0);
    final dlText = _totalBytes > 0
        ? '${_formatBytes(_downloadedBytes)} / ${_formatBytes(_totalBytes)}'
        : _formatBytes(_downloadedBytes);
    return Column(
      key: const ValueKey('downloading'),
      children: [
        const SizedBox(height: 8),
        // Animated circular progress
        SizedBox(
          width: 120,
          height: 120,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Outer ring (track)
              SizedBox(
                width: 120,
                height: 120,
                child: CircularProgressIndicator(
                  value: _progress,
                  strokeWidth: 8,
                  backgroundColor: Colors.white10,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Colors.cyanAccent.shade400,
                  ),
                  strokeCap: StrokeCap.round,
                ),
              ),
              // Center content
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$pct%',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const Text(
                    'กำลังโหลด',
                    style: TextStyle(color: Colors.white38, fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        // Progress bar
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: _progress,
            minHeight: 6,
            backgroundColor: Colors.white10,
            valueColor: AlwaysStoppedAnimation<Color>(
              Colors.cyanAccent.shade400,
            ),
          ),
        ),
        const SizedBox(height: 10),
        // File size
        Text(
          dlText,
          style: const TextStyle(color: Colors.white54, fontSize: 13),
        ),
        const SizedBox(height: 6),
        const Text(
          'กรุณาอย่าปิดแอประหว่างดาวน์โหลด',
          style: TextStyle(color: Colors.white24, fontSize: 11),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildReadyState() {
    return Column(
      key: const ValueKey('ready'),
      children: [
        const SizedBox(height: 8),
        // Success icon
        ScaleTransition(
          scale: _pulseAnim,
          child: Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.cyanAccent.withOpacity(0.12),
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.cyanAccent.withOpacity(0.4),
                width: 2,
              ),
            ),
            child: const Icon(
              Icons.check_circle_rounded,
              color: Colors.cyanAccent,
              size: 44,
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'ดาวน์โหลดเสร็จสมบูรณ์!',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'พร้อมติดตั้ง SPK AMS เวอร์ชันใหม่แล้ว',
          style: TextStyle(color: Colors.white54, fontSize: 13),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: _installApk,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.cyanAccent.shade400,
            foregroundColor: const Color(0xFF0F172A),
            minimumSize: const Size(double.infinity, 54),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            elevation: 0,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(Icons.install_mobile_rounded, size: 20),
              SizedBox(width: 8),
              Text(
                'ติดตั้งเลย',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          style: TextButton.styleFrom(foregroundColor: Colors.white38),
          child: const Text('ภายหลัง', style: TextStyle(fontSize: 13)),
        ),
      ],
    );
  }

  Widget _buildErrorState() {
    return Column(
      key: const ValueKey('error'),
      children: [
        const SizedBox(height: 8),
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: Colors.redAccent.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.error_outline_rounded,
            color: Colors.redAccent,
            size: 40,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'ดาวน์โหลดล้มเหลว',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่',
          style: TextStyle(color: Colors.white54, fontSize: 13),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _startDownload,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.cyanAccent.shade400,
            foregroundColor: const Color(0xFF0F172A),
            minimumSize: const Size(double.infinity, 52),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: const Text(
            'ลองใหม่อีกครั้ง',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 10),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          style: TextButton.styleFrom(foregroundColor: Colors.white38),
          child: const Text('ยกเลิก', style: TextStyle(fontSize: 13)),
        ),
      ],
    );
  }
}

class _VersionBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color textColor;
  final bool isNew;

  const _VersionBadge({
    required this.label,
    required this.color,
    required this.textColor,
    this.isNew = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        'v$label',
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: isNew ? FontWeight.w800 : FontWeight.w500,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

class _ProfileInfoItem {
  final IconData icon;
  final String label;
  final String value;

  _ProfileInfoItem({
    required this.icon,
    required this.label,
    required this.value,
  });
}
