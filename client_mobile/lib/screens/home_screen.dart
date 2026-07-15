import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
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
  static const String _currentAppVersion = '1.0.0';
  int _currentIndex = 0;
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _assignedVehicle;
  List<dynamic> _tickets = [];
  List<dynamic> _vehicles = [];
  Map<String, dynamic>? _selectedVehicle;

  bool _isLoading = true;
  String? _error;

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
          final assignedDriver =
              (v['assigned_driver'] ?? '').toString().toLowerCase().trim();
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
          final match = vehicles.firstWhere((v) => v['id'] == _selectedVehicle!['id'], orElse: () => null);
          _selectedVehicle = match != null ? match as Map<String, dynamic> : null;
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
        content: const Text('คุณต้องการออกจากระบบหรือไม่?',
            style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('ยกเลิก', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style:
                ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
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
          child: CircularProgressIndicator(color: Colors.cyanAccent));
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.redAccent, size: 48),
              const SizedBox(height: 16),
              Text(_error!,
                  style: const TextStyle(color: Colors.redAccent, fontSize: 16),
                  textAlign: TextAlign.center),
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
    final pendingCount =
        _tickets.where((t) => t['status'] == 'pending').length;
    final inProgressCount =
        _tickets.where((t) => t['status'] == 'in_progress').length;
    final completedCount =
        _tickets.where((t) => t['status'] == 'completed').length;

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
                    child: ClipOval(
                      child: _buildAvatarContent(size: 60),
                    ),
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
                              fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: primaryColor.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                _user?['role'] ?? '-',
                                style: TextStyle(
                                    color: primaryColor,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'แผนก: ${_user?['department'] ?? '-'}',
                              style: const TextStyle(
                                  color: Colors.white60, fontSize: 12),
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
                _buildStatCard('รอดำเนินการ', pendingCount.toString(),
                    Colors.amber, Icons.hourglass_empty),
                const SizedBox(width: 10),
                _buildStatCard('กำลังซ่อม', inProgressCount.toString(),
                    Colors.orange, Icons.build),
                const SizedBox(width: 10),
                _buildStatCard('เสร็จสิ้น', completedCount.toString(),
                    Colors.green, Icons.check_circle),
              ],
            ),
            const SizedBox(height: 24),

            // Assigned Vehicle Summary
            Row(
              children: [
                Icon(Icons.directions_car, color: primaryColor, size: 20),
                const SizedBox(width: 8),
                Text(
                  _assignedVehicle != null ? 'รถยนต์ประจำตัวของคุณ' : 'เลือกตรวจสอบข้อมูลรถยนต์คันอื่น',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Dropdown selector if no vehicle is assigned
            if (_assignedVehicle == null && _vehicles.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.cyan.withOpacity(0.15)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<Map<String, dynamic>>(
                    dropdownColor: const Color(0xFF1E293B),
                    hint: const Text('เลือกทะเบียนรถยนต์...', style: TextStyle(color: Colors.white30, fontSize: 14)),
                    value: _selectedVehicle,
                    isExpanded: true,
                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                    items: _vehicles.map((v) {
                      return DropdownMenuItem<Map<String, dynamic>>(
                        value: v as Map<String, dynamic>,
                        child: Text('${v['plate_number']} - ${v['brand']} ${v['model'] ?? ''}'),
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
                        builder: (_) =>
                            VehicleScreen(vehicle: activeV!)),
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
                        child: Icon(Icons.directions_car,
                            color: primaryColor, size: 32),
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
                                  fontSize: 16),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                        color: Colors.blue.withOpacity(0.3)),
                                  ),
                                  child: Text(
                                    (_assignedVehicle ?? _selectedVehicle)!['plate_number'],
                                    style: const TextStyle(
                                        color: Colors.blue,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Icon(Icons.speed,
                                    color: Colors.orange.shade300, size: 14),
                                const SizedBox(width: 4),
                                Text(
                                  '${_formatNumber((_assignedVehicle ?? _selectedVehicle)!['mileage'])} km',
                                  style: TextStyle(
                                      color: Colors.orange.shade300,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios,
                          color: Colors.white30, size: 16),
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
                            builder: (_) => RenewalsScreen(vehicle: (_assignedVehicle ?? _selectedVehicle)!),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.green.withOpacity(0.2)),
                        ),
                        child: const Column(
                          children: [
                            Icon(Icons.history, color: Colors.green),
                            SizedBox(height: 6),
                            Text('ประวัติต่อประกัน/ภาษี', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
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
                            builder: (_) => MaintenanceReportScreen(vehicle: (_assignedVehicle ?? _selectedVehicle)!),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.blue.withOpacity(0.2)),
                        ),
                        child: const Column(
                          children: [
                            Icon(Icons.bar_chart, color: Colors.blue),
                            SizedBox(height: 6),
                            Text('รายงานซ่อมบำรุง', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
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
                    Icon(Icons.directions_car_filled_outlined,
                        color: Colors.white24, size: 48),
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
                          fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                if (_tickets.length > 3)
                  TextButton(
                    onPressed: () {
                      _onTabTapped(2); // Switch to tickets tab
                    },
                    child: const Text('ดูทั้งหมด →',
                        style: TextStyle(color: Colors.cyan, fontSize: 13)),
                  )
              ],
            ),
            const SizedBox(height: 8),

            // Recent Tickets (top 3)
            if (_tickets.isEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: const Center(
                  child: Text('ไม่มีการแจ้งซ่อมในระบบ',
                      style: TextStyle(color: Colors.white38)),
                ),
              )
            ] else ...[
              ..._tickets.take(3).map((ticket) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _buildTicketCard(ticket),
                  )),
            ],
            const SizedBox(height: 80), // Space for FAB
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
      String label, String value, Color color, IconData icon) {
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
                  color: color, fontSize: 24, fontWeight: FontWeight.w900),
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
            .push(MaterialPageRoute(
                builder: (_) =>
                    TicketDetailScreen(ticketId: ticket['id'])))
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
                        fontSize: 14),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'ทะเบียน: ${ticket['plate_number'] ?? '-'} • ${_formatTicketDate(ticket['created_at'])}',
                    style:
                        const TextStyle(color: Colors.white54, fontSize: 12),
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

    final hasImage = images.isNotEmpty && images[0].toString().trim().isNotEmpty;
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
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (hasImage)
              Image.network(
                imageUrl,
                height: 140,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 140,
                  color: Colors.white.withOpacity(0.02),
                  child: const Icon(Icons.directions_car, color: Colors.white30, size: 48),
                ),
              )
            else
              Container(
                height: 140,
                color: Colors.white.withOpacity(0.02),
                child: const Icon(Icons.directions_car, color: Colors.white30, size: 48),
              ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        vehicle['plate_number'] ?? 'ไม่ระบุทะเบียน',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          letterSpacing: 0.5,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: primaryColor.withOpacity(0.3), width: 1),
                        ),
                        child: Text(
                          vehicle['brand'] ?? 'ยี่ห้ออื่น',
                          style: TextStyle(
                            color: primaryColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'รุ่น: ${vehicle['model'] ?? '-'} • ปี: ${vehicle['year'] ?? '-'}',
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.person_outline, size: 14, color: Colors.white38),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          'ผู้ขับขี่: ${vehicle['assigned_driver'] ?? 'ไม่ได้มอบหมาย'}',
                          style: const TextStyle(color: Colors.white38, fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => VehicleScreen(vehicle: vehicle),
                              ),
                            ).then((_) => _loadData());
                          },
                          icon: const Icon(Icons.info_outline, size: 16),
                          label: const Text('ดูข้อมูลรถ'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white70,
                            side: BorderSide(color: Colors.white.withOpacity(0.12)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => NewTicketScreen(
                                  vehicleId: vehicle['id'],
                                  plateNumber: vehicle['plate_number'],
                                ),
                              ),
                            ).then((_) => _loadData());
                          },
                          icon: const Icon(Icons.add_comment, size: 16, color: Color(0xFF0F172A)),
                          label: const Text('แจ้งซ่อม'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryColor,
                            foregroundColor: const Color(0xFF0F172A),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            textStyle: const TextStyle(fontWeight: FontWeight.bold),
                          ),
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
    );
  }

  Widget _buildVehiclesList() {
    if (_isLoading) {
      return const Center(
          child: CircularProgressIndicator(color: Colors.cyanAccent));
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
            Icon(Icons.directions_car_outlined, color: Colors.white24, size: 64),
            SizedBox(height: 16),
            Text('ไม่มีข้อมูลรถยนต์ในระบบ',
                style: TextStyle(color: Colors.white54, fontSize: 16)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      color: Colors.cyanAccent,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _vehicles.length,
        separatorBuilder: (_, _) => const SizedBox(height: 14),
        itemBuilder: (context, index) {
          return _buildVehicleCard(_vehicles[index]);
        },
      ),
    );
  }

  // ============ TICKETS TAB ============
  Widget _buildTicketsList() {
    if (_isLoading) {
      return const Center(
          child: CircularProgressIndicator(color: Colors.cyanAccent));
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
            Text('ยังไม่มีรายการแจ้งซ่อม',
                style: TextStyle(color: Colors.white54, fontSize: 16)),
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
                color: const Color(0xFF0F172A)),
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
            color: const Color(0xFF0F172A)),
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
                  child: ClipOval(
                    child: _buildAvatarContent(size: 90),
                  ),
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
                      border: Border.all(color: const Color(0xFF0F172A), width: 2),
                    ),
                    child: const Icon(Icons.camera_alt, size: 16, color: Color(0xFF0F172A)),
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
                fontWeight: FontWeight.bold),
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
                icon: Icons.badge_outlined, label: 'ชื่อ-สกุล', value: _user?['fullname'] ?? '-'),
            _ProfileInfoItem(
                icon: Icons.work_outline, label: 'บทบาท', value: _user?['role'] ?? '-'),
            _ProfileInfoItem(
                icon: Icons.business_outlined,
                label: 'แผนก',
                value: _user?['department'] ?? '-'),
          ]),
          const SizedBox(height: 16),

          // Vehicle Info
          if (_assignedVehicle != null)
            _buildProfileInfoCard([
              _ProfileInfoItem(
                  icon: Icons.directions_car,
                  label: 'รถประจำตัว',
                  value:
                      '${_assignedVehicle!['brand']} ${_assignedVehicle!['model'] ?? ''}'),
              _ProfileInfoItem(
                  icon: Icons.confirmation_number_outlined,
                  label: 'ทะเบียน',
                  value: _assignedVehicle!['plate_number'] ?? '-'),
            ]),
          const SizedBox(height: 16),

          // Stats
          _buildProfileInfoCard([
            _ProfileInfoItem(
                icon: Icons.list_alt,
                label: 'แจ้งซ่อมทั้งหมด',
                value: '${_tickets.length} รายการ'),
            _ProfileInfoItem(
                icon: Icons.pending_actions,
                label: 'รอดำเนินการ',
                value:
                    '${_tickets.where((t) => t['status'] == 'pending').length} รายการ'),
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
                    title: const Text('ประวัติการต่อประกัน/ภาษี', style: TextStyle(color: Colors.white, fontSize: 14)),
                    trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white30, size: 14),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => RenewalsScreen(vehicle: _assignedVehicle!),
                        ),
                      );
                    },
                  ),
                  const Divider(color: Colors.white10, height: 1),
                  ListTile(
                    leading: const Icon(Icons.bar_chart, color: Colors.blue),
                    title: const Text('รายงานการซ่อมบำรุง', style: TextStyle(color: Colors.white, fontSize: 14)),
                    trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white30, size: 14),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => MaintenanceReportScreen(vehicle: _assignedVehicle!),
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
                    const Text('AMS Mobile v1.0.0',
                        style: TextStyle(color: Colors.white54, fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 4),
                const Text('SPK Construction Co., Ltd.',
                    style: TextStyle(color: Colors.white30, fontSize: 11)),
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
              label: const Text('ออกจากระบบ',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent.withOpacity(0.15),
                foregroundColor: Colors.redAccent,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
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
                        Text(item.label,
                            style: const TextStyle(
                                color: Colors.white54, fontSize: 12)),
                        const SizedBox(height: 2),
                        Text(item.value,
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.bold)),
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
            color: color, fontSize: 11, fontWeight: FontWeight.bold),
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

    final titles = ['แดชบอร์ด', 'จัดการรถยนต์', 'รายการแจ้งซ่อม', 'โปรไฟล์'];

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
          style:
              const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
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
      floatingActionButton: _currentIndex != 3 &&
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
              icon:
                  const Icon(Icons.add_comment, color: Color(0xFF0F172A)),
              label: const Text(
                'แจ้งซ่อม',
                style: TextStyle(
                    color: Color(0xFF0F172A), fontWeight: FontWeight.bold),
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
          selectedLabelStyle:
              const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
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
            _showUpdateDialog(serverVersion, downloadUrl, releaseNotes);
          }
        }
      }
    } catch (_) {}
  }

  void _showUpdateDialog(String newVersion, String downloadUrl, String releaseNotes) {
    showDialog(
      context: context,
      barrierDismissible: false, // Force user to update or choose later
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.system_update, color: Colors.cyanAccent),
            SizedBox(width: 12),
            Text('มีอัปเดตเวอร์ชันใหม่!', style: TextStyle(color: Colors.white, fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('เวอร์ชันปัจจุบัน: $_currentAppVersion', style: const TextStyle(color: Colors.white54, fontSize: 13)),
            Text('เวอร์ชันล่าสุด: $newVersion', style: const TextStyle(color: Colors.cyanAccent, fontSize: 14, fontWeight: FontWeight.bold)),
            if (releaseNotes.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text('รายละเอียดการอัปเดต:', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(releaseNotes, style: const TextStyle(color: Colors.white60, fontSize: 12)),
            ],
            const SizedBox(height: 12),
            const Text('กรุณาอัปเดตแอปพลิเคชันเพื่อใช้งานฟังก์ชันใหม่ล่าสุดและปรับปรุงประสิทธิภาพการทำงาน', style: TextStyle(color: Colors.white54, fontSize: 12)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('ภายหลัง', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              final uri = Uri.parse(downloadUrl);
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.cyanAccent.shade400,
              foregroundColor: const Color(0xFF0F172A),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('ดาวน์โหลด APK'),
          ),
        ],
      ),
    );
  }
}

class _ProfileInfoItem {
  final IconData icon;
  final String label;
  final String value;

  _ProfileInfoItem(
      {required this.icon, required this.label, required this.value});
}
