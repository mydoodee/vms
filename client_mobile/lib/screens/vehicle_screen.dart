import 'dart:convert';
import 'package:flutter/material.dart';
import 'renewals_screen.dart';
import '../services/api_service.dart';

class VehicleScreen extends StatelessWidget {
  final Map<String, dynamic> vehicle;

  const VehicleScreen({super.key, required this.vehicle});

  String _getFuelLabel(String? type) {
    switch (type) {
      case 'gasoline':
        return 'เบนซิน';
      case 'diesel':
        return 'ดีเซล';
      case 'electric':
        return 'ไฟฟ้า';
      case 'hybrid':
        return 'ไฮบริด';
      default:
        return type ?? '-';
    }
  }

  IconData _getFuelIcon(String? type) {
    switch (type) {
      case 'electric':
        return Icons.bolt;
      case 'hybrid':
        return Icons.eco;
      default:
        return Icons.local_gas_station_outlined;
    }
  }

  String _formatDate(String? rawDate) {
    if (rawDate == null) return '-';
    try {
      final date = DateTime.parse(rawDate);
      final months = [
        '',
        'ม.ค.',
        'ก.พ.',
        'มี.ค.',
        'เม.ย.',
        'พ.ค.',
        'มิ.ย.',
        'ก.ค.',
        'ส.ค.',
        'ก.ย.',
        'ต.ค.',
        'พ.ย.',
        'ธ.ค.',
      ];
      return '${date.day} ${months[date.month]} ${date.year + 543}';
    } catch (_) {
      return rawDate.split('T')[0];
    }
  }

  bool _isExpiringSoon(String? rawDate) {
    if (rawDate == null) return false;
    try {
      final date = DateTime.parse(rawDate);
      final now = DateTime.now();
      final diff = date.difference(now).inDays;
      return diff < 30 && diff >= 0;
    } catch (_) {
      return false;
    }
  }

  bool _isExpired(String? rawDate) {
    if (rawDate == null) return false;
    try {
      final date = DateTime.parse(rawDate);
      return date.isBefore(DateTime.now());
    } catch (_) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    const backgroundColor = Color(0xFF0F172A);
    const cardColor = Color(0xFF1E293B);
    final primaryColor = Colors.cyanAccent.shade400;

    List<String> images = [];
    if (vehicle['image_url'] != null) {
      try {
        final parsed = json.decode(vehicle['image_url'].toString());
        if (parsed is List) {
          images = parsed.map((e) => e.toString()).toList();
        } else {
          images = [vehicle['image_url'].toString()];
        }
      } catch (_) {
        images = [vehicle['image_url'].toString()];
      }
    }

    final hasImage = images.isNotEmpty && images[0].trim().isNotEmpty;
    final serverBase = ApiService().baseUrl.replaceAll('/api', '');
    final imageUrl = hasImage
        ? (images[0].startsWith('http')
              ? images[0]
              : '$serverBase/${images[0]}')
        : '';

    return Scaffold(
      backgroundColor: backgroundColor,
      body: CustomScrollView(
        slivers: [
          // Collapsible App Bar
          SliverAppBar(
            expandedHeight: 240,
            pinned: true,
            backgroundColor: cardColor,
            iconTheme: const IconThemeData(color: Colors.white),
            title: Text(
              'ข้อมูลรถ ทะเบียน ${vehicle['plate_number']}',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.cyan.shade900.withOpacity(0.3), cardColor],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 35),
                      if (hasImage)
                        Container(
                          decoration: BoxDecoration(
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.3),
                                blurRadius: 15,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(14),
                            child: Container(
                              width: 140,
                              height: 95,
                              decoration: BoxDecoration(
                                color: cardColor,
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.08),
                                ),
                              ),
                              child: Image.network(
                                imageUrl,
                                fit: BoxFit.cover,
                                loadingBuilder:
                                    (context, child, loadingProgress) {
                                      if (loadingProgress == null) return child;
                                      return const Center(
                                        child: SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.cyanAccent,
                                          ),
                                        ),
                                      );
                                    },
                                errorBuilder: (context, error, stackTrace) =>
                                    Container(
                                      color: Colors.white10,
                                      child: const Icon(
                                        Icons.broken_image,
                                        color: Colors.white24,
                                      ),
                                    ),
                              ),
                            ),
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                primaryColor.withOpacity(0.2),
                                Colors.cyan.shade900.withOpacity(0.1),
                              ],
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.directions_car,
                            color: primaryColor,
                            size: 48,
                          ),
                        ),
                      const SizedBox(height: 12),
                      Text(
                        '${vehicle['brand']} ${vehicle['model'] ?? ''}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: primaryColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: primaryColor.withOpacity(0.3),
                          ),
                        ),
                        child: Text(
                          vehicle['plate_number'] ?? '-',
                          style: TextStyle(
                            color: primaryColor,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              collapseMode: CollapseMode.parallax,
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Quick Stats Row
                  Row(
                    children: [
                      _buildQuickStat(
                        Icons.speed,
                        '${_formatNumber(vehicle['mileage'])} km',
                        'เลขไมล์',
                        Colors.orange,
                      ),
                      const SizedBox(width: 10),
                      _buildQuickStat(
                        _getFuelIcon(vehicle['fuel_type']),
                        _getFuelLabel(vehicle['fuel_type']),
                        'เชื้อเพลิง',
                        Colors.green,
                      ),
                      const SizedBox(width: 10),
                      _buildQuickStat(
                        Icons.calendar_today,
                        vehicle['year']?.toString() ?? '-',
                        'ปีจดทะเบียน',
                        Colors.blue,
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Technical Specs Card
                  _buildSectionCard(
                    title: 'ข้อมูลทางเทคนิค',
                    icon: Icons.settings_outlined,
                    children: [
                      _buildSpecRow(
                        'สีรถ',
                        vehicle['color'] ?? '-',
                        Icons.color_lens_outlined,
                      ),
                      _buildSpecRow(
                        'เลขตัวถัง (VIN)',
                        vehicle['vin'] ?? '-',
                        Icons.fingerprint_outlined,
                      ),
                      _buildSpecRow(
                        'เลขเครื่องยนต์',
                        vehicle['engine_number'] ?? '-',
                        Icons.settings_outlined,
                      ),
                      _buildSpecRow(
                        'แผนกสังกัด',
                        vehicle['department'] ?? '-',
                        Icons.business_outlined,
                      ),
                      _buildSpecRow(
                        'ผู้ใช้งาน',
                        vehicle['assigned_driver'] ?? '-',
                        Icons.person_outlined,
                      ),
                      _buildSpecRow(
                        'ขึ้นทะเบียนงาน',
                        vehicle['work_registration'] ?? '-',
                        Icons.app_registration_outlined,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Insurance Card
                  _buildSectionCard(
                    title: 'ข้อมูลประกันภัย',
                    icon: Icons.shield_outlined,
                    children: [
                      _buildSpecRow(
                        'บริษัทประกันภัย',
                        vehicle['insurance_company'] ?? '-',
                        Icons.business,
                      ),
                      _buildSpecRow(
                        'ระดับประกันภัย',
                        vehicle['insurance_level'] != null
                            ? (const [
                                    '1',
                                    '2',
                                    '2+',
                                    '3',
                                    '3+',
                                  ].contains(vehicle['insurance_level'])
                                  ? 'ชั้น ${vehicle['insurance_level']}'
                                  : vehicle['insurance_level'].toString())
                            : '-',
                        Icons.shield_outlined,
                      ),
                      _buildSpecRow(
                        'ค่าเบี้ยประกัน',
                        vehicle['insurance_price'] != null
                            ? '฿${double.parse(vehicle['insurance_price'].toString()).toStringAsFixed(2)}'
                            : '-',
                        Icons.payments_outlined,
                      ),
                      _buildDateRow(
                        'วันหมดอายุประกันภัย',
                        vehicle['insurance_expire'],
                        Icons.event_busy_outlined,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Tax Card
                  _buildSectionCard(
                    title: 'ข้อมูลภาษีประจำปี',
                    icon: Icons.receipt_long_outlined,
                    children: [
                      _buildSpecRow(
                        'ผู้ดำเนินการภาษี',
                        vehicle['tax_provider'] ?? '-',
                        Icons.business_outlined,
                      ),
                      _buildSpecRow(
                        'ค่าภาษีประจำปี',
                        vehicle['tax_price'] != null
                            ? '฿${double.parse(vehicle['tax_price'].toString()).toStringAsFixed(2)}'
                            : '-',
                        Icons.payments_outlined,
                      ),
                      _buildDateRow(
                        'วันที่ต่อภาษีล่าสุด',
                        vehicle['tax_renew_date'],
                        Icons.calendar_today_outlined,
                      ),
                      _buildDateRow(
                        'วันหมดอายุภาษีประจำปี',
                        vehicle['tax_expire'],
                        Icons.event_outlined,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Act Card
                  _buildSectionCard(
                    title: 'ข้อมูล พ.ร.บ.',
                    icon: Icons.offline_bolt_outlined,
                    children: [
                      _buildSpecRow(
                        'บริษัท พ.ร.บ.',
                        vehicle['act_provider'] ?? '-',
                        Icons.business_outlined,
                      ),
                      _buildSpecRow(
                        'ราคา พ.ร.บ.',
                        vehicle['act_price'] != null
                            ? '฿${double.parse(vehicle['act_price'].toString()).toStringAsFixed(2)}'
                            : '-',
                        Icons.payments_outlined,
                      ),
                      _buildDateRow(
                        'วันที่ต่อ พ.ร.บ. ล่าสุด',
                        vehicle['act_renew_date'],
                        Icons.calendar_today_outlined,
                      ),
                      _buildDateRow(
                        'วันหมดอายุ พ.ร.บ.',
                        vehicle['act_expire'],
                        Icons.event_outlined,
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Renewals History Button
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      gradient: LinearGradient(
                        colors: [
                          Colors.cyanAccent.shade400,
                          Colors.cyan.shade600,
                        ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.cyanAccent.shade400.withOpacity(0.2),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => RenewalsScreen(vehicle: vehicle),
                          ),
                        );
                      },
                      icon: const Icon(Icons.history, size: 20),
                      label: const Text(
                        'ดูประวัติการต่อประกัน/ภาษี',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        foregroundColor: const Color(0xFF0F172A),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStat(
    IconData icon,
    String value,
    String label,
    Color color,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
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
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(color: Colors.white54, fontSize: 10),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
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
                Icon(icon, color: Colors.cyanAccent.shade400, size: 20),
                const SizedBox(width: 10),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const Divider(color: Colors.white10, height: 1),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(children: children),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            color: Colors.cyanAccent.shade400.withOpacity(0.6),
            size: 18,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateRow(String label, String? rawDate, IconData icon) {
    final formattedDate = _formatDate(rawDate);
    final expired = _isExpired(rawDate);
    final expiringSoon = _isExpiringSoon(rawDate);

    Color valueColor = Colors.white;
    Widget? badge;

    if (expired) {
      valueColor = Colors.redAccent;
      badge = Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: Colors.redAccent.withOpacity(0.15),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
        ),
        child: const Text(
          'หมดอายุ',
          style: TextStyle(
            color: Colors.redAccent,
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    } else if (expiringSoon) {
      valueColor = Colors.amber;
      badge = Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: Colors.amber.withOpacity(0.15),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: Colors.amber.withOpacity(0.3)),
        ),
        child: const Text(
          'ใกล้หมดอายุ',
          style: TextStyle(
            color: Colors.amber,
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            color: Colors.cyanAccent.shade400.withOpacity(0.6),
            size: 18,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      formattedDate,
                      style: TextStyle(
                        color: valueColor,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (badge != null) ...[const SizedBox(width: 8), badge],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatNumber(dynamic num) {
    if (num == null) return '0';
    final str = num.toString();
    RegExp reg = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
    String mathFunc(Match match) => '${match[1]},';
    return str.replaceAllMapped(reg, mathFunc);
  }
}
