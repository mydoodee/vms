import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LuArrowLeft } from 'react-icons/lu';
import api from '../services/api';
import GlassCard from '../components/UI/GlassCard';
import NeonButton from '../components/UI/NeonButton';
import FileUpload from '../components/UI/FileUpload';
import { useToast } from '../contexts/ToastContext';

export default function CreateTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedVehicleId = searchParams.get('vehicleId');
  const { toast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [vehicleId, setVehicleId] = useState(preselectedVehicleId || '');
  const [problemType, setProblemType] = useState('engine');
  const [severity, setSeverity] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('0');
  const [garageId, setGarageId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, garagesRes] = await Promise.all([
          api.get('/vehicles'),
          api.get('/garages?status=active')
        ]);
        setVehicles(vehiclesRes.data.data);
        setGarages(garagesRes.data.data);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleId) {
      toast.warning('กรุณาเลือกยานพาหนะ');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      // 1. Create Ticket
      const { data } = await api.post('/tickets', {
        vehicle_id: parseInt(vehicleId),
        problem_type: problemType,
        severity,
        title,
        description,
        estimated_cost: parseFloat(estimatedCost) || 0,
        garage_id: garageId ? parseInt(garageId) : null
      });

      const ticketId = data.data.id;

      // 2. Upload attachments if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('ticket_id', ticketId);
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });

        await api.post(`/uploads/${ticketId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('ส่งแจ้งซ่อมเรียบร้อยแล้ว');
      navigate('/tickets');
    } catch (err) {
      setError(err.response?.data?.message || 'การบันทึกข้อมูลล้มเหลว');
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header style-back" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <NeonButton variant="ghost" size="sm" onClick={() => navigate(-1)} icon={<LuArrowLeft />}>
          กลับ
        </NeonButton>
        <div>
          <h1 className="page-title">แจ้งซ่อมใหม่</h1>
          <p className="page-subtitle">กรอกรายละเอียดความเสียหาย ถ่ายรูปปัญหา และส่งเรื่องเพื่อให้ผู้มีอำนาจพิจารณา</p>
        </div>
      </div>

      <GlassCard>
        <form onSubmit={handleSubmit}>
          {error && <div className="text-danger mb-md">{error}</div>}

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">เลือกยานพาหนะ *</label>
              <select 
                className="form-select"
                required
                value={vehicleId} 
                onChange={(e) => setVehicleId(e.target.value)}
                disabled={loading || submitting}
              >
                <option value="">-- กรุณาเลือกรถ --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate_number} - {v.brand} {v.model} ({v.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">ประเภทปัญหา *</label>
              <select
                className="form-select"
                value={problemType}
                onChange={(e) => setProblemType(e.target.value)}
                disabled={submitting}
              >
                <option value="engine">เครื่องยนต์ (Engine)</option>
                <option value="brake">ระบบเบรค (Brake)</option>
                <option value="tire">ยางรถยนต์ (Tire)</option>
                <option value="air_conditioner">ระบบแอร์ (Air Conditioner)</option>
                <option value="battery">แบตเตอรี่ (Battery)</option>
                <option value="electrical">ระบบไฟส่องสว่าง (Electrical)</option>
                <option value="body">ตัวถัง/สี (Body)</option>
                <option value="suspension">ระบบช่วงล่าง (Suspension)</option>
                <option value="transmission">เกียร์ (Transmission)</option>
                <option value="other">อื่นๆ (Other)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">ความเร่งด่วน *</label>
              <select
                className="form-select"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                disabled={submitting}
              >
                <option value="low">ต่ำ (Low)</option>
                <option value="medium">ปานกลาง (Medium)</option>
                <option value="high">สูง (High)</option>
                <option value="critical">วิกฤต (Critical)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">ประมาณการค่าใช้จ่ายเบื้องต้น (บาท)</label>
              <input
                type="number"
                className="form-input"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Garage selector */}
          <div className="form-group">
            <label className="form-label">อู่ / ศูนย์บริการที่จะส่งซ่อม (ถ้าทราบ)</label>
            <select
              className="form-select"
              value={garageId}
              onChange={(e) => setGarageId(e.target.value)}
              disabled={submitting}
            >
              <option value="">-- ยังไม่ได้กำหนด / ระบุภายหลัง --</option>
              {garages.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}{g.phone ? ` (${g.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">หัวข้อความผิดปกติ / อาการ *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="ตัวอย่างเช่น เครื่องยนต์สตาร์ทไม่ติด, มีเสียงเอี๊ยดเวลากดเบรค"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">รายละเอียดความเสียหายเพิ่มเติม</label>
            <textarea
              className="form-textarea"
              rows="4"
              placeholder="กรุณาอธิบายอาการเพิ่มเติมอย่างละเอียด..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label font-bold">อัปเดตไฟล์ / รูปภาพ หรือวิดีโอ (จำกัด 300MB)</label>
            <FileUpload onFilesSelected={(files) => setSelectedFiles(files)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
            <NeonButton variant="ghost" disabled={submitting} onClick={() => navigate(-1)}>
              ยกเลิก
            </NeonButton>
            <NeonButton type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'กำลังส่งข้อมูล...' : 'ส่งเรื่องแจ้งซ่อม'}
            </NeonButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
