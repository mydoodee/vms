import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';

class NewTicketScreen extends StatefulWidget {
  final int vehicleId;
  final String plateNumber;

  const NewTicketScreen(
      {super.key, required this.vehicleId, required this.plateNumber});

  @override
  State<NewTicketScreen> createState() => _NewTicketScreenState();
}

class _NewTicketScreenState extends State<NewTicketScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  String _severity = 'medium';
  int? _selectedGarageId;

  List<dynamic> _garages = [];
  final List<File> _images = [];

  bool _isLoading = false;
  bool _isLoadingGarages = true;
  String? _errorMessage;

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadGarages();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadGarages() async {
    try {
      final garages = await ApiService().getGarages();
      setState(() {
        _garages = garages;
        _isLoadingGarages = false;
      });
    } catch (_) {
      setState(() {
        _isLoadingGarages = false;
      });
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final pickedFile = await _picker.pickImage(
        source: source,
        imageQuality: 75,
        maxWidth: 1200,
      );

      if (pickedFile != null) {
        setState(() {
          _images.add(File(pickedFile.path));
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('เกิดข้อผิดพลาดในการเลือกรูป: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  void _showImageSourcePicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Text('เลือกรูปภาพ',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.cyan.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.camera_alt, color: Colors.cyanAccent),
                ),
                title: const Text('ถ่ายรูปจากกล้อง',
                    style: TextStyle(color: Colors.white)),
                subtitle: const Text('เปิดกล้องถ่ายภาพอาการเสีย',
                    style: TextStyle(color: Colors.white38, fontSize: 12)),
                onTap: () {
                  Navigator.of(context).pop();
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.purple.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.photo_library,
                      color: Colors.purpleAccent),
                ),
                title: const Text('เลือกจากแกลเลอรี',
                    style: TextStyle(color: Colors.white)),
                subtitle: const Text('เลือกรูปจากคลังภาพในเครื่อง',
                    style: TextStyle(color: Colors.white38, fontSize: 12)),
                onTap: () {
                  Navigator.of(context).pop();
                  _pickImage(ImageSource.gallery);
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitTicket() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await ApiService().createTicket(
        vehicleId: widget.vehicleId,
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        severity: _severity,
        garageId: _selectedGarageId,
        imageFiles: _images,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text('ส่งใบแจ้งซ่อมสำเร็จเรียบร้อยแล้ว'),
              ],
            ),
            backgroundColor: Colors.green.shade700,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const backgroundColor = Color(0xFF0F172A);
    const cardColor = Color(0xFF1E293B);
    final primaryColor = Colors.cyanAccent.shade400;

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: const Text('แจ้งซ่อมบำรุง',
            style:
                TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: cardColor,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Vehicle Info Banner
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.cyan.withOpacity(0.1),
                      cardColor,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: primaryColor.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: primaryColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.directions_car,
                          color: primaryColor, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('แจ้งซ่อมสำหรับรถทะเบียน',
                            style: TextStyle(
                                color: Colors.white54, fontSize: 12)),
                        const SizedBox(height: 2),
                        Text(
                          widget.plateNumber,
                          style: TextStyle(
                              color: primaryColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              letterSpacing: 1),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Step indicator
              _buildStepLabel(1, 'หัวข้ออาการเสีย'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _titleController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'เช่น แอร์ไม่เย็น, เปลี่ยนน้ำมันเครื่อง',
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: cardColor,
                  prefixIcon: Icon(Icons.title,
                      color: primaryColor.withOpacity(0.5)),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(
                        color: primaryColor.withOpacity(0.5), width: 1),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'กรุณาระบุหัวข้อการแจ้งซ่อม';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),

              _buildStepLabel(2, 'รายละเอียดเพิ่มเติม'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _descriptionController,
                style: const TextStyle(color: Colors.white),
                maxLines: 4,
                decoration: InputDecoration(
                  hintText: 'อธิบายอาการเสียเพิ่มเติม...',
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: cardColor,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(
                        color: primaryColor.withOpacity(0.5), width: 1),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'กรุณาระบุอาการเสียเพิ่มเติม';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),

              // Severity Selector
              _buildStepLabel(3, 'ระดับความรุนแรง'),
              const SizedBox(height: 8),
              Row(
                children: [
                  _buildSeverityChip('low', 'ต่ำ', Colors.green,
                      Icons.keyboard_arrow_down),
                  const SizedBox(width: 6),
                  _buildSeverityChip(
                      'medium', 'ปานกลาง', Colors.blue, Icons.remove),
                  const SizedBox(width: 6),
                  _buildSeverityChip('high', 'สูง', Colors.orange,
                      Icons.keyboard_arrow_up),
                  const SizedBox(width: 6),
                  _buildSeverityChip('critical', 'วิกฤต', Colors.red,
                      Icons.priority_high),
                ],
              ),
              const SizedBox(height: 20),

              // Garage Selector
              _buildStepLabel(4, 'เลือกอู่ซ่อม (ถ้าทราบ)'),
              const SizedBox(height: 8),
              if (_isLoadingGarages)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: cardColor,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.cyanAccent)),
                      SizedBox(width: 12),
                      Text('กำลังโหลดรายชื่ออู่...',
                          style: TextStyle(color: Colors.white54)),
                    ],
                  ),
                )
              else
                DropdownButtonFormField<int>(
                  dropdownColor: cardColor,
                  initialValue: _selectedGarageId,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: cardColor,
                    prefixIcon: Icon(Icons.store,
                        color: primaryColor.withOpacity(0.5)),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none),
                  ),
                  items: [
                    const DropdownMenuItem<int>(
                      value: null,
                      child: Text('ไม่ระบุ / ให้แอดมินเลือกอู่ให้'),
                    ),
                    ..._garages.map((g) => DropdownMenuItem<int>(
                          value: g['id'],
                          child: Text(g['name']),
                        )),
                  ],
                  onChanged: (val) {
                    setState(() {
                      _selectedGarageId = val;
                    });
                  },
                ),
              const SizedBox(height: 24),

              // Photos Grid section
              _buildStepLabel(5, 'ภาพถ่ายแนบ'),
              const SizedBox(height: 8),
              if (_images.isEmpty)
                GestureDetector(
                  onTap: _showImageSourcePicker,
                  child: Container(
                    height: 120,
                    decoration: BoxDecoration(
                      color: cardColor,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: Colors.white.withOpacity(0.08),
                          style: BorderStyle.solid),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_a_photo,
                            color: primaryColor.withOpacity(0.4), size: 36),
                        const SizedBox(height: 8),
                        const Text('แตะเพื่อเพิ่มรูปภาพ',
                            style: TextStyle(
                                color: Colors.white30, fontSize: 13)),
                      ],
                    ),
                  ),
                )
              else
                Column(
                  children: [
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                      ),
                      itemCount: _images.length + 1, // +1 for add button
                      itemBuilder: (context, index) {
                        if (index == _images.length) {
                          return GestureDetector(
                            onTap: _showImageSourcePicker,
                            child: Container(
                              decoration: BoxDecoration(
                                color: cardColor,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                    color: Colors.white.withOpacity(0.08)),
                              ),
                              child: Icon(Icons.add_a_photo,
                                  color: primaryColor.withOpacity(0.4),
                                  size: 28),
                            ),
                          );
                        }
                        return Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.file(_images[index],
                                  width: double.infinity,
                                  height: double.infinity,
                                  fit: BoxFit.cover),
                            ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _images.removeAt(index);
                                  });
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.7),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.close,
                                      color: Colors.white, size: 14),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),

              const SizedBox(height: 32),

              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                    border:
                        Border.all(color: Colors.redAccent.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          color: Colors.redAccent, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(_errorMessage!,
                            style: const TextStyle(
                                color: Colors.redAccent, fontSize: 13)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Submit Button
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  gradient: LinearGradient(
                    colors: [primaryColor, Colors.cyan.shade600],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: primaryColor.withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _submitTicket,
                  icon: _isLoading
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                  Color(0xFF0F172A))),
                        )
                      : const Icon(Icons.send, size: 20),
                  label: Text(
                    _isLoading ? 'กำลังส่ง...' : 'ส่งใบแจ้งซ่อมบำรุง',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    foregroundColor: const Color(0xFF0F172A),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepLabel(int step, String label) {
    return Row(
      children: [
        Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: Colors.cyanAccent.shade400.withOpacity(0.15),
            shape: BoxShape.circle,
            border: Border.all(
                color: Colors.cyanAccent.shade400.withOpacity(0.3)),
          ),
          child: Center(
            child: Text(
              '$step',
              style: TextStyle(
                  color: Colors.cyanAccent.shade400,
                  fontSize: 11,
                  fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(label,
            style: const TextStyle(
                color: Colors.white70,
                fontSize: 13,
                fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildSeverityChip(
      String value, String label, Color color, IconData icon) {
    final isSelected = _severity == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _severity = value;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? color.withOpacity(0.15) : const Color(0xFF1E293B),
            border: Border.all(
              color: isSelected ? color : Colors.white10,
              width: isSelected ? 1.5 : 1,
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            children: [
              Icon(icon,
                  color: isSelected ? color : Colors.white30, size: 18),
              const SizedBox(height: 4),
              Text(label,
                  style: TextStyle(
                      color: isSelected ? color : Colors.white54,
                      fontSize: 12,
                      fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ),
    );
  }
}
