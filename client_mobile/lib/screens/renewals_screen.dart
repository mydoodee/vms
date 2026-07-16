import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class RenewalsScreen extends StatefulWidget {
  final Map<String, dynamic> vehicle;

  const RenewalsScreen({super.key, required this.vehicle});

  @override
  State<RenewalsScreen> createState() => _RenewalsScreenState();
}

class _RenewalsScreenState extends State<RenewalsScreen> {
  List<dynamic> _renewals = [];
  bool _isLoading = true;
  String? _error;
  String _filterType = 'all'; // 'all', 'insurance', 'tax'

  @override
  void initState() {
    super.initState();
    _loadRenewals();
  }

  Future<void> _loadRenewals() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await ApiService().getRenewals(widget.vehicle['id']);
      setState(() {
        _renewals = data;
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
      return '${d.day} ${months[d.month]} ${d.year + 543}';
    } catch (_) {
      return date.toString().split('T')[0];
    }
  }

  String _getInsuranceLevelText(String? level) {
    switch (level) {
      case 'class_1':
      case '1':
        return 'ชั้น 1';
      case 'class_2':
      case '2':
        return 'ชั้น 2';
      case 'class_3':
      case '3':
        return 'ชั้น 3';
      case 'class_2_plus':
        return 'ชั้น 2+';
      case 'class_3_plus':
        return 'ชั้น 3+';
      case 'compulsory':
        return 'พ.ร.บ.';
      default:
        return level ?? '-';
    }
  }

  List<dynamic> get _filteredRenewals {
    if (_filterType == 'all') return _renewals;
    return _renewals.where((r) => r['type'] == _filterType).toList();
  }

  @override
  Widget build(BuildContext context) {
    const backgroundColor = Color(0xFF0F172A);
    const cardColor = Color(0xFF1E293B);
    final primaryColor = Colors.cyanAccent.shade400;

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: const Text(
          'ประวัติการต่อประกัน/ภาษี',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: cardColor,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Vehicle Header Info
          Container(
            padding: const EdgeInsets.all(16),
            color: cardColor,
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.directions_car, color: primaryColor),
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
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'ทะเบียน: ${widget.vehicle['plate_number']}',
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Filters row
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildFilterChip('all', 'ทั้งหมด', Icons.list),
                  const SizedBox(width: 8),
                  _buildFilterChip('insurance', 'ประกันภัย', Icons.shield),
                  const SizedBox(width: 8),
                  _buildFilterChip('tax', 'ภาษีประจำปี', Icons.receipt_long),
                  const SizedBox(width: 8),
                  _buildFilterChip('act', 'พ.ร.บ.', Icons.offline_bolt),
                ],
              ),
            ),
          ),

          // Main Content List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Colors.cyanAccent),
                  )
                : _error != null
                ? Center(
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
                          const SizedBox(height: 12),
                          Text(
                            _error!,
                            style: const TextStyle(color: Colors.redAccent),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _loadRenewals,
                            child: const Text('ลองใหม่'),
                          ),
                        ],
                      ),
                    ),
                  )
                : _filteredRenewals.isEmpty
                ? const Center(
                    child: Text(
                      'ไม่มีข้อมูลประวัติการต่ออายุ',
                      style: TextStyle(color: Colors.white38),
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadRenewals,
                    color: Colors.cyanAccent,
                    child: ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _filteredRenewals.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        return _buildRenewalCard(_filteredRenewals[index]);
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String type, String label, IconData icon) {
    final isSelected = _filterType == type;
    final activeColor = type == 'insurance'
        ? Colors.blue
        : type == 'tax'
        ? Colors.green
        : type == 'act'
        ? Colors.orangeAccent
        : Colors.cyanAccent.shade400;

    return ChoiceChip(
      iconTheme: IconThemeData(
        color: isSelected ? const Color(0xFF0F172A) : Colors.white54,
        size: 16,
      ),
      avatar: Icon(icon),
      label: Text(label),
      selected: isSelected,
      onSelected: (val) {
        if (val) {
          setState(() {
            _filterType = type;
          });
        }
      },
      selectedColor: activeColor,
      backgroundColor: const Color(0xFF1E293B),
      labelStyle: TextStyle(
        color: isSelected ? const Color(0xFF0F172A) : Colors.white70,
        fontWeight: FontWeight.bold,
        fontSize: 12,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    );
  }

  Widget _buildRenewalCard(dynamic renewal) {
    final type = renewal['type'] ?? 'insurance';
    final isInsurance = type == 'insurance';
    final isAct = type == 'act';
    final accentColor = isInsurance
        ? Colors.blue
        : isAct
        ? Colors.orangeAccent
        : Colors.green;
    final totalCost =
        double.tryParse(renewal['total_cost']?.toString() ?? '0') ?? 0;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Accent colored side bar
              Container(width: 6, color: accentColor),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(
                                isInsurance
                                    ? Icons.shield
                                    : isAct
                                    ? Icons.offline_bolt
                                    : Icons.receipt_long,
                                color: accentColor,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                isInsurance
                                    ? 'ประกันภัย'
                                    : isAct
                                    ? 'พ.ร.บ.'
                                    : 'ภาษีประจำปี',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                            ],
                          ),
                          Text(
                            '฿${totalCost.toStringAsFixed(2)}',
                            style: TextStyle(
                              color: accentColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                      const Divider(color: Colors.white10, height: 20),

                      // Details
                      _buildDetailRow(
                        'วันที่ต่ออายุ',
                        _formatDate(renewal['renew_date']),
                      ),
                      _buildDetailRow(
                        'วันที่หมดอายุ',
                        _formatDate(renewal['expire_date']),
                      ),
                      if (isInsurance) ...[
                        _buildDetailRow(
                          'ผู้รับประกัน',
                          renewal['provider'] ?? '-',
                        ),
                        _buildDetailRow(
                          'ประเภทประกัน',
                          _getInsuranceLevelText(renewal['insurance_level']),
                        ),
                      ] else if (isAct) ...[
                        _buildDetailRow(
                          'บริษัท พ.ร.บ.',
                          renewal['provider'] ?? '-',
                        ),
                      ] else ...[
                        _buildDetailRow(
                          'ผู้ดำเนินการ',
                          renewal['provider'] ?? '-',
                        ),
                      ],

                      if (renewal['notes'] != null &&
                          renewal['notes'].toString().trim().isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A).withOpacity(0.4),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'หมายเหตุ: ${renewal['notes']}',
                            style: const TextStyle(
                              color: Colors.white38,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],

                      // Attachments Section
                      if (renewal['attachments'] != null) ...[
                        _buildAttachments(renewal['attachments']),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(color: Colors.white54, fontSize: 12),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttachments(dynamic attachmentsJson) {
    List<dynamic> list = [];
    try {
      if (attachmentsJson is String) {
        list = json.decode(attachmentsJson);
      } else if (attachmentsJson is List) {
        list = attachmentsJson;
      }
    } catch (_) {}

    if (list.isEmpty) return const SizedBox();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        const Text(
          'เอกสารแนบ:',
          style: TextStyle(
            color: Colors.white54,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 6),
        SizedBox(
          height: 50,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: list.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, idx) {
              final path = list[idx].toString();
              final serverBase = ApiService().baseUrl.replaceAll('/api', '');
              final cleanPath = path.startsWith('http')
                  ? path
                  : '$serverBase/$path';

              return GestureDetector(
                onTap: () => _showFullImage(context, cleanPath),
                child: Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white10),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      cleanPath,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => const Icon(
                        Icons.broken_image,
                        size: 20,
                        color: Colors.white30,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showFullImage(BuildContext context, String url) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            InteractiveViewer(child: Image.network(url, fit: BoxFit.contain)),
            CircleAvatar(
              backgroundColor: Colors.black54,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
