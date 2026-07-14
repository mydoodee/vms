import 'package:flutter/material.dart';
import '../services/api_service.dart';

class MaintenanceReportScreen extends StatefulWidget {
  final Map<String, dynamic> vehicle;

  const MaintenanceReportScreen({super.key, required this.vehicle});

  @override
  State<MaintenanceReportScreen> createState() => _MaintenanceReportScreenState();
}

class _MaintenanceReportScreenState extends State<MaintenanceReportScreen> {
  List<dynamic> _tickets = [];
  bool _isLoading = true;
  String? _error;

  double _totalSpent = 0;
  double _partsCost = 0;
  double _laborCost = 0;

  @override
  void initState() {
    super.initState();
    _loadReportData();
  }

  Future<void> _loadReportData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final tickets = await ApiService().getTickets();
      
      // Filter tickets for this vehicle
      final vehicleTickets = tickets.where((t) => t['vehicle_id'] == widget.vehicle['id']).toList();

      double total = 0;
      double parts = 0;
      double labor = 0;

      for (var t in vehicleTickets) {
        if (t['status'] == 'completed') {
          parts += double.tryParse(t['parts_cost']?.toString() ?? '0') ?? 0;
          labor += double.tryParse(t['labor_cost']?.toString() ?? '0') ?? 0;
          total += double.tryParse(t['total_cost']?.toString() ?? '0') ?? 0;
        }
      }

      setState(() {
        _tickets = vehicleTickets;
        _totalSpent = total;
        _partsCost = parts;
        _laborCost = labor;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  String _formatNumber(double num) {
    final str = num.toStringAsFixed(2);
    RegExp reg = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
    String mathFunc(Match match) => '${match[1]},';
    
    // Split decimal part
    final parts = str.split('.');
    final formattedInt = parts[0].replaceAllMapped(reg, mathFunc);
    return '$formattedInt.${parts[1]}';
  }

  String _formatDate(dynamic date) {
    if (date == null) return '-';
    try {
      final d = DateTime.parse(date.toString());
      final months = [
        '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      return '${d.day} ${months[d.month]} ${d.year + 543}';
    } catch (_) {
      return date.toString().split('T')[0];
    }
  }

  @override
  Widget build(BuildContext context) {
    const backgroundColor = Color(0xFF0F172A);
    const cardColor = Color(0xFF1E293B);
    final primaryColor = Colors.cyanAccent.shade400;

    final completedTickets = _tickets.where((t) => t['status'] == 'completed').toList();
    final activeTickets = _tickets.where((t) => t['status'] != 'completed' && t['status'] != 'cancelled').toList();

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: const Text(
          'รายงานการซ่อมบำรุง',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: cardColor,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Colors.cyanAccent))
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline,
                            color: Colors.redAccent, size: 48),
                        const SizedBox(height: 12),
                        Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                        const SizedBox(height: 16),
                        ElevatedButton(
                            onPressed: _loadReportData,
                            child: const Text('ลองใหม่')),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadReportData,
                  color: Colors.cyanAccent,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Vehicle summary card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: cardColor,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withOpacity(0.05)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: primaryColor.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(Icons.directions_car,
                                    color: primaryColor, size: 30),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${widget.vehicle['brand']} ${widget.vehicle['model'] ?? ''}',
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'ทะเบียน: ${widget.vehicle['plate_number']} • เลขไมล์: ${widget.vehicle['mileage']} km',
                                      style: const TextStyle(
                                          color: Colors.white54, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Financial Summary Card
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [cardColor, Colors.cyan.withOpacity(0.1)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: primaryColor.withOpacity(0.15)),
                          ),
                          child: Column(
                            children: [
                              const Text(
                                'ยอดรวมค่าใช้จ่ายการซ่อมเสร็จสิ้น',
                                style: TextStyle(color: Colors.white54, fontSize: 13),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '฿${_formatNumber(_totalSpent)}',
                                style: TextStyle(
                                    color: primaryColor,
                                    fontSize: 28,
                                    fontWeight: FontWeight.w900),
                              ),
                              const Divider(color: Colors.white10, height: 24),
                              Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      children: [
                                        const Text('ค่าอะไหล่',
                                            style: TextStyle(
                                                color: Colors.white60,
                                                fontSize: 11)),
                                        const SizedBox(height: 4),
                                        Text(
                                          '฿${_formatNumber(_partsCost)}',
                                          style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    width: 1,
                                    height: 30,
                                    color: Colors.white10,
                                  ),
                                  Expanded(
                                    child: Column(
                                      children: [
                                        const Text('ค่าแรง',
                                            style: TextStyle(
                                                color: Colors.white60,
                                                fontSize: 11)),
                                        const SizedBox(height: 4),
                                        Text(
                                          '฿${_formatNumber(_laborCost)}',
                                          style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Stats Summary Row
                        Row(
                          children: [
                            _buildCountCard('ประวัติซ่อมทั้งหมด', _tickets.length.toString(),
                                Colors.cyanAccent.shade400, Icons.assignment_outlined),
                            const SizedBox(width: 10),
                            _buildCountCard('กำลังดำเนินการ', activeTickets.length.toString(),
                                Colors.orange, Icons.run_circle_outlined),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // List Header
                        Row(
                          children: [
                            Icon(Icons.list_alt, color: primaryColor, size: 20),
                            const SizedBox(width: 8),
                            const Text(
                              'รายละเอียดประวัติการซ่อมบำรุง',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Tickets list with cost summaries
                        if (_tickets.isEmpty) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 40),
                            child: const Center(
                              child: Text('ไม่มีรายการประวัติการซ่อมบำรุง',
                                  style: TextStyle(color: Colors.white38)),
                            ),
                          )
                        ] else ...[
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _tickets.length,
                            separatorBuilder: (_, _) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final t = _tickets[index];
                              final isCompleted = t['status'] == 'completed';
                              final tCost = double.tryParse(t['total_cost']?.toString() ?? '0') ?? 0;

                              return Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: cardColor,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.white.withOpacity(0.04)),
                                ),
                                child: Column(
                                  children: [
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                t['title'] ?? 'ไม่ระบุหัวข้อ',
                                                style: const TextStyle(
                                                    color: Colors.white,
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 14),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                'แจ้งซ่อม: ${_formatDate(t['created_at'])}',
                                                style: const TextStyle(
                                                    color: Colors.white38, fontSize: 11),
                                              ),
                                            ],
                                          ),
                                        ),
                                        _buildStatusBadge(t['status']),
                                      ],
                                    ),
                                    const Divider(color: Colors.white10, height: 24),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          isCompleted ? 'ค่าใช้จ่ายซ่อมเสร็จสิ้น:' : 'ประมาณการอู่:',
                                          style: const TextStyle(
                                              color: Colors.white54, fontSize: 12),
                                        ),
                                        Text(
                                          '฿${tCost.toStringAsFixed(2)}',
                                          style: TextStyle(
                                              color: isCompleted
                                                  ? primaryColor
                                                  : Colors.white70,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 14),
                                        ),
                                      ],
                                    ),
                                    if (isCompleted) ...[
                                      const SizedBox(height: 6),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text(
                                            'รายละเอียดค่าชิ้นส่วน / ค่าแรง:',
                                            style: TextStyle(
                                                color: Colors.white38, fontSize: 11),
                                          ),
                                          Text(
                                            'อะไหล่: ฿${(double.tryParse(t['parts_cost']?.toString() ?? '0') ?? 0).toStringAsFixed(0)} / ค่าแรง: ฿${(double.tryParse(t['labor_cost']?.toString() ?? '0') ?? 0).toStringAsFixed(0)}',
                                            style: const TextStyle(
                                                color: Colors.white38, fontSize: 11),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ],
                                ),
                              );
                            },
                          ),
                        ],
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildCountCard(String label, String value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.15)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: TextStyle(
                        color: color, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    label,
                    style: const TextStyle(color: Colors.white54, fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String? status) {
    Color color;
    String text;

    switch (status) {
      case 'pending':
        color = Colors.amber;
        text = 'รออนุมัติ';
        break;
      case 'approved':
        color = Colors.blue;
        text = 'อนุมัติแล้ว';
        break;
      case 'in_progress':
        color = Colors.orange;
        text = 'กำลังซ่อม';
        break;
      case 'completed':
        color = Colors.green;
        text = 'เสร็จสิ้น';
        break;
      case 'cancelled':
        color = Colors.red;
        text = 'ยกเลิก';
        break;
      default:
        color = Colors.grey;
        text = status ?? 'ไม่ระบุ';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        border: Border.all(color: color.withOpacity(0.5)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
