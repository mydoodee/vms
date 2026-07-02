import 'package:flutter/material.dart';
import '../services/api_service.dart';

class TicketDetailScreen extends StatefulWidget {
  final int ticketId;

  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  Map<String, dynamic>? _ticket;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTicketDetails();
  }

  Future<void> _loadTicketDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await ApiService().getTickets();

      // Find the specific ticket from history list
      final matched = response.firstWhere(
        (t) => t['id'] == widget.ticketId,
        orElse: () => null,
      );

      if (matched == null) {
        throw Exception('ไม่พบรายละเอียดใบแจ้งซ่อมนี้');
      }

      setState(() {
        _ticket = matched as Map<String, dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
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
        return 'ซ่อมเสร็จสิ้น';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status ?? 'ไม่ระบุ';
    }
  }

  IconData _getStatusIcon(String? status) {
    switch (status) {
      case 'pending':
        return Icons.hourglass_empty;
      case 'approved':
        return Icons.check_circle_outline;
      case 'in_progress':
        return Icons.build;
      case 'completed':
        return Icons.done_all;
      case 'cancelled':
        return Icons.cancel_outlined;
      default:
        return Icons.info_outline;
    }
  }

  String _getSeverityText(String? severity) {
    switch (severity) {
      case 'low':
        return 'ต่ำ';
      case 'medium':
        return 'ปานกลาง';
      case 'high':
        return 'สูง';
      case 'critical':
        return 'วิกฤต';
      default:
        return severity ?? 'ปกติ';
    }
  }

  Color _getSeverityColor(String? severity) {
    switch (severity) {
      case 'low':
        return Colors.green;
      case 'medium':
        return Colors.blue;
      case 'high':
        return Colors.orange;
      case 'critical':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    const backgroundColor = Color(0xFF0F172A);
    const cardColor = Color(0xFF1E293B);

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: Text(
          _ticket != null ? 'ใบแจ้งซ่อม #${_ticket!['id']}' : 'รายละเอียดการแจ้งซ่อม',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
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
                        const SizedBox(height: 16),
                        Text(_error!,
                            style: const TextStyle(color: Colors.redAccent)),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _loadTicketDetails,
                          icon: const Icon(Icons.refresh),
                          label: const Text('ลองใหม่'),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadTicketDetails,
                  color: Colors.cyanAccent,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Status Banner
                        _buildStatusBanner(),
                        const SizedBox(height: 16),

                        // Title & Description
                        _buildSection(
                          icon: Icons.description_outlined,
                          title: 'รายละเอียดอาการเสีย',
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _ticket!['title'] ?? 'ไม่ระบุหัวข้อ',
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  _buildBadge(
                                    _getSeverityText(_ticket!['severity']),
                                    _getSeverityColor(_ticket!['severity']),
                                    icon: Icons.warning_amber_rounded,
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    'แจ้งเมื่อ: ${_formatDate(_ticket!['created_at'])}',
                                    style: const TextStyle(
                                        color: Colors.white38, fontSize: 12),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: backgroundColor.withOpacity(0.5),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                      color: Colors.white.withOpacity(0.05)),
                                ),
                                child: Text(
                                  _ticket!['description'] ?? 'ไม่มีรายละเอียด',
                                  style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 14,
                                      height: 1.5),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),

                        // Repair Info
                        _buildSection(
                          icon: Icons.build_outlined,
                          title: 'ข้อมูลการดำเนินการ',
                          child: Column(
                            children: [
                              _buildInfoRow(
                                  Icons.directions_car,
                                  'ทะเบียนรถ',
                                  _ticket!['plate_number'] ?? '-'),
                              _buildInfoRow(
                                  Icons.person_outline,
                                  'ผู้แจ้งเรื่อง',
                                  _ticket!['reported_by_name'] ?? '-'),
                              _buildInfoRow(
                                  Icons.store,
                                  'อู่ที่รับซ่อม',
                                  _ticket!['garage_name'] ??
                                      'รอดำเนินการเลือกอู่'),
                              _buildInfoRow(
                                  Icons.calendar_today,
                                  'วันที่เข้าซ่อม',
                                  _formatDate(
                                      _ticket!['repair_start_date'])),
                              _buildInfoRow(
                                  Icons.event_available,
                                  'วันที่ซ่อมเสร็จ',
                                  _formatDate(
                                      _ticket!['repair_end_date'])),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),

                        // Cost details
                        _buildSection(
                          icon: Icons.payments_outlined,
                          title: 'สรุปค่าใช้จ่ายการซ่อม',
                          child: Column(
                            children: [
                              _buildCostRow(
                                'ค่าอะไหล่',
                                _ticket!['parts_cost'],
                                Icons.settings,
                              ),
                              _buildCostRow(
                                'ค่าแรง',
                                _ticket!['labor_cost'],
                                Icons.engineering,
                              ),
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 8),
                                child: Container(
                                  height: 1,
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        Colors.transparent,
                                        Colors.cyanAccent.shade400
                                            .withOpacity(0.3),
                                        Colors.transparent,
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              _buildCostRow(
                                'ยอดรวมทั้งหมด',
                                _ticket!['total_cost'],
                                Icons.account_balance_wallet,
                                isTotal: true,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),

                        // Attached photos
                        if (_ticket!['attachments'] != null &&
                            (_ticket!['attachments'] as List).isNotEmpty) ...[
                          _buildSection(
                            icon: Icons.photo_library_outlined,
                            title:
                                'ภาพถ่ายประกอบ (${(_ticket!['attachments'] as List).length} รูป)',
                            child: GridView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                crossAxisSpacing: 10,
                                mainAxisSpacing: 10,
                              ),
                              itemCount:
                                  (_ticket!['attachments'] as List).length,
                              itemBuilder: (context, index) {
                                final attach =
                                    _ticket!['attachments'][index];
                                final filePath =
                                    attach['file_path'].toString();

                                final cleanPath = filePath.startsWith('http')
                                    ? filePath
                                    : 'https://app.spkconstruction.co.th/vms/$filePath';

                                return GestureDetector(
                                  onTap: () => _showFullImage(
                                      context, cleanPath),
                                  child: Container(
                                    decoration: BoxDecoration(
                                      borderRadius:
                                          BorderRadius.circular(14),
                                      border: Border.all(
                                          color: Colors.white
                                              .withOpacity(0.05)),
                                    ),
                                    child: ClipRRect(
                                      borderRadius:
                                          BorderRadius.circular(14),
                                      child: Image.network(
                                        cleanPath,
                                        fit: BoxFit.cover,
                                        loadingBuilder: (context, child,
                                            loadingProgress) {
                                          if (loadingProgress == null) {
                                            return child;
                                          }
                                          return Container(
                                            color: cardColor,
                                            child: const Center(
                                              child:
                                                  CircularProgressIndicator(
                                                color: Colors.cyanAccent,
                                                strokeWidth: 2,
                                              ),
                                            ),
                                          );
                                        },
                                        errorBuilder:
                                            (context, error, stackTrace) =>
                                                Container(
                                          color: cardColor,
                                          child: const Column(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Icon(Icons.broken_image,
                                                  color: Colors.white24,
                                                  size: 32),
                                              SizedBox(height: 4),
                                              Text('โหลดรูปไม่ได้',
                                                  style: TextStyle(
                                                      color: Colors.white24,
                                                      fontSize: 10)),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildStatusBanner() {
    final status = _ticket!['status'];
    final color = _getStatusColor(status);
    final text = _getStatusText(status);
    final icon = _getStatusIcon(status);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            color.withOpacity(0.15),
            color.withOpacity(0.05),
          ],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('สถานะปัจจุบัน',
                    style: TextStyle(color: Colors.white54, fontSize: 12)),
                const SizedBox(height: 2),
                Text(
                  text,
                  style: TextStyle(
                      color: color,
                      fontSize: 18,
                      fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '#${_ticket!['id']}',
              style: TextStyle(
                  color: color,
                  fontSize: 14,
                  fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(
      {required IconData icon,
      required String title,
      required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                Icon(icon, color: Colors.cyanAccent.shade400, size: 18),
                const SizedBox(width: 10),
                Text(title,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14)),
              ],
            ),
          ),
          const Divider(color: Colors.white10, height: 1),
          Padding(
            padding: const EdgeInsets.all(16),
            child: child,
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(String text, Color color, {IconData? icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        border: Border.all(color: color.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: color, size: 12),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: TextStyle(
                color: color, fontSize: 11, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon,
              color: Colors.cyanAccent.shade400.withOpacity(0.6), size: 18),
          const SizedBox(width: 12),
          SizedBox(
            width: 90,
            child: Text(label,
                style:
                    const TextStyle(color: Colors.white54, fontSize: 12)),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCostRow(String label, dynamic cost, IconData icon,
      {bool isTotal = false}) {
    final formattedCost = cost != null
        ? '฿${double.parse(cost.toString()).toStringAsFixed(2)}'
        : '฿0.00';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon,
              color: isTotal
                  ? Colors.cyanAccent.shade400
                  : Colors.white38,
              size: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: isTotal ? Colors.white : Colors.white60,
                fontSize: isTotal ? 14 : 13,
                fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
          Text(
            formattedCost,
            style: TextStyle(
              color: isTotal
                  ? Colors.cyanAccent.shade400
                  : Colors.white,
              fontSize: isTotal ? 18 : 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  void _showFullImage(BuildContext context, String url) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(12),
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: InteractiveViewer(
                child: Image.network(url, fit: BoxFit.contain),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: CircleAvatar(
                backgroundColor: Colors.black54,
                child: IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
