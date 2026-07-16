import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  LuArrowLeft, 
  LuCar, 
  LuCalendar, 
  LuSettings, 
  LuWrench, 
  LuChevronLeft, 
  LuChevronRight, 
  LuFileText, 
  LuBriefcase, 
  LuShieldCheck, 
  LuFileSpreadsheet, 
  LuTriangleAlert,
  LuGauge,
  LuUser,
  LuSparkles,
  LuFileStack,
  LuPrinter,
  LuPen,
  LuCheck,
  LuX,
  LuPlus,
  LuClipboardList
} from 'react-icons/lu';
import api from '../services/api';
import GlassCard from '../components/UI/GlassCard';
import StatusBadge from '../components/UI/StatusBadge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import NeonButton from '../components/UI/NeonButton';
import ThaiDateInput from '../components/UI/ThaiDateInput';
import { formatThaiDate } from '../utils/thaiDate';
import { getFileUrl } from '../utils/fileUrl';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const handlePrint = async () => {
    if (!vehicle) return;
    toast.info('กำลังสร้างไฟล์ PDF รายงานรถยนต์...');
    
    let imgs = [];
    if (vehicle.image_url) {
      try { imgs = JSON.parse(vehicle.image_url); } catch { imgs = [vehicle.image_url]; }
    }
    const mainImage = imgs[0] ? getFileUrl(imgs[0]) : '';
    
    const loadHtml2Pdf = () => {
      return new Promise((resolve) => {
        if (window.html2pdf) {
          resolve(window.html2pdf);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve(window.html2pdf);
        document.body.appendChild(script);
      });
    };
    
    try {
      const html2pdf = await loadHtml2Pdf();
      
      const getExpLabel = (dateStr) => {
        if (!dateStr) return '-';
        const today = new Date(); today.setHours(0,0,0,0);
        const exp = new Date(dateStr); exp.setHours(0,0,0,0);
        const days = Math.round((exp - today) / 86400000);
        if (days < 0) return 'หมดอายุแล้ว';
        return `เหลือ ${days} วัน`;
      };
      
      const formatThaiDateShort = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const months = [
          'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
          'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
      };

      const getSeverityLabel = (sev) => {
        const labels = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง', critical: 'วิกฤต' };
        return labels[sev] || sev;
      };

      // Split plate_number: e.g. "ฮร 9024 กรุงเทพมหานคร" => plate="ฮร 9024", province="กรุงเทพมหานคร"
      const parsePlate = (plateStr) => {
        if (!plateStr) return { plate: '-', province: '' };
        const match = plateStr.match(/^(.+\d+)\s+(.+)$/);
        if (match) return { plate: match[1].trim(), province: match[2].trim() };
        return { plate: plateStr, province: '' };
      };
      const { plate: plateDisplay, province: plateProvince } = parsePlate(vehicle.plate_number);

      const element = document.createElement('div');
      element.style.padding = '20px';
      element.style.background = '#ffffff';
      element.style.width = '750px';

      element.innerHTML = `
        <div style="font-family: 'Sarabun', sans-serif; color: #1e293b; font-size: 13px; line-height: 1.5; padding: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0B203E; padding-bottom: 12px; margin-bottom: 20px;">
            <div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #0B203E;">รายงานข้อมูลยานพาหนะ</h1>
              <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">ระบบจัดการซ่อมบำรุงและประวัติรถยนต์ SPK AMS</p>
            </div>
            <div style="border: 3px solid #1e293b; border-radius: 8px; padding: 6px 18px; font-size: 16px; font-weight: 800; color: #1e293b; text-align: center; background: #f8fafc;">
              ${plateDisplay}
              ${plateProvince ? `<span style="font-size: 9px; color: #64748b; display: block; margin-top: 2px; font-weight: 600;">${plateProvince}</span>` : ''}
            </div>
          </div>

          <div style="display: flex; gap: 24px; margin-bottom: 15px;">
            <div style="flex: 1.3;">
              <div style="font-size: 13px; font-weight: 700; color: #163660; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 0 0 10px 0;">ข้อมูลยานพาหนะพื้นฐาน</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px;">
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">ยี่ห้อ / รุ่น</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${vehicle.brand} ${vehicle.model || '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">ปีจดทะเบียน / สี</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${vehicle.year || '-'} / ${vehicle.color || '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">ประเภทเชื้อเพลิง</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${
                    vehicle.fuel_type === 'gasoline' ? 'เบนซิน' :
                    vehicle.fuel_type === 'diesel' ? 'ดีเซล' :
                    vehicle.fuel_type === 'electric' ? 'ไฟฟ้า' :
                    vehicle.fuel_type === 'hybrid' ? 'ไฮบริด' : vehicle.fuel_type || '-'
                  }</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">ระยะไมล์ปัจจุบัน</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${Number(vehicle.mileage || 0).toLocaleString()} km</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">เลขตัวถัง (VIN)</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a; font-family: monospace;">${vehicle.vin || '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">เลขเครื่องยนต์</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a; font-family: monospace;">${vehicle.engine_number || '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">แผนกสังกัด / ขึ้นทะเบียน</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${vehicle.department || '-'} / ${vehicle.work_registration || '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">ผู้ขับขี่ / ผู้ดูแล</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${vehicle.driver_name || '-'}</span>
                </div>
              </div>

              <div style="font-size: 13px; font-weight: 700; color: #1d4ed8; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 15px 0 10px 0;">รายละเอียดประกันภัย ภาษี และ พ.ร.บ.</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px;">
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">บริษัทประกันภัย / ระดับ</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${vehicle.insurance_company || '-'} ${vehicle.insurance_level ? `(ชั้น ${vehicle.insurance_level})` : ''}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">วันหมดอายุประกัน</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${vehicle.insurance_expire ? formatThaiDateShort(vehicle.insurance_expire) : '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">ผู้ดำเนินการภาษี / ค่าภาษี</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${vehicle.tax_provider || '-'} ${vehicle.tax_price ? `(฿${Number(vehicle.tax_price).toLocaleString()})` : ''}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">วันหมดอายุภาษี</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${vehicle.tax_expire ? formatThaiDateShort(vehicle.tax_expire) : '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">ผู้ให้บริการ พ.ร.บ. / ราคา</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${vehicle.act_provider || '-'} ${vehicle.act_price ? `(฿${Number(vehicle.act_price).toLocaleString()})` : ''}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">วันหมดอายุ พ.ร.บ.</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${vehicle.act_expire ? formatThaiDateShort(vehicle.act_expire) : '-'}</span>
                </div>
              </div>
            </div>

            <div style="flex: 0.7;">
              <div style="font-size: 13px; font-weight: 700; color: #1d4ed8; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 0 0 10px 0;">รูปรถยนต์</div>
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; height: 140px; background: #f8fafc; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                ${mainImage ? `<img src="${mainImage}" style="width: 100%; height: 100%; object-fit: cover;" />` : '<span style="color:#94a3b8; font-size:10px;">ไม่มีรูปรถในระบบ</span>'}
              </div>
              
              <div style="font-size: 13px; font-weight: 700; color: #1d4ed8; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 0 0 10px 0;">สถานะวันหมดอายุการต่ออายุ</div>
              <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; font-weight:600; color:#475569;">🛡️ ประกันภัย:</td>
                  <td style="padding: 4px 0; text-align:right; font-weight:700;">${getExpLabel(vehicle.insurance_expire)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight:600; color:#475569;">📄 ภาษีประจำปี:</td>
                  <td style="padding: 4px 0; text-align:right; font-weight:700;">${getExpLabel(vehicle.tax_expire)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight:600; color:#475569;">⚡ พ.ร.บ.:</td>
                  <td style="padding: 4px 0; text-align:right; font-weight:700;">${getExpLabel(vehicle.act_expire)}</td>
                </tr>
              </table>
            </div>
          </div>

          <div style="font-size: 13px; font-weight: 700; color: #1d4ed8; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 15px 0 6px 0;">ประวัติการซ่อมบำรุงล่าสุด (5 รายการล่าสุด)</div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1;">
                <th style="width: 15%; text-align: left; padding: 6px 8px; font-size: 10px; color: #475569; font-weight: 700;">เลขที่ใบซ่อม</th>
                <th style="width: 50%; text-align: left; padding: 6px 8px; font-size: 10px; color: #475569; font-weight: 700;">รายการแจ้งซ่อม / หัวข้อ</th>
                <th style="width: 15%; text-align: left; padding: 6px 8px; font-size: 10px; color: #475569; font-weight: 700;">ความรุนแรง</th>
                <th style="width: 20%; text-align: left; padding: 6px 8px; font-size: 10px; color: #475569; font-weight: 700;">วันที่บันทึก</th>
              </tr>
            </thead>
            <tbody>
              ${vehicle.repair_history && vehicle.repair_history.length > 0 ? vehicle.repair_history.slice(0, 5).map(t => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="font-weight: 700; color: #0B203E; padding: 6px 8px; font-size: 11px;">${t.ticket_id}</td>
                  <td style="padding: 6px 8px; font-size: 11px;">${t.title}</td>
                  <td style="padding: 6px 8px; font-size: 11px;">${getSeverityLabel(t.severity)}</td>
                  <td style="padding: 6px 8px; font-size: 11px;">${formatThaiDateShort(t.created_at)}</td>
                </tr>
              `).join('') : '<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding: 12px 0;">ไม่มีประวัติการแจ้งซ่อม</td></tr>'}
            </tbody>
          </table>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 30px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8;">
            <span>เอกสารฉบับนี้พิมพ์จากระบบ SPK AMS เมื่อวันที่ ${formatThaiDateShort(new Date())}</span>
            <span>หน้า 1 จาก 1</span>
          </div>
        </div>
      `;

      const opt = {
        margin:       10,
        filename:     `vehicle-report-${vehicle.plate_number}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success('ดาวน์โหลดไฟล์ PDF สำเร็จ!');
    } catch (err) {
      console.error(err);
      toast.error('ไม่สามารถดาวน์โหลดไฟล์ PDF ได้');
    }
  };

  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'manager';
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);

  const fetchInsuranceCompanies = async () => {
    try {
      const { data } = await api.get('/insurance-companies');
      setInsuranceCompanies(data.data || []);
    } catch (err) {
      console.error('Failed to load insurance companies', err);
    }
  };

  const startEditing = () => {
    if (!vehicle) return;
    setEditForm({
      plate_number: vehicle.plate_number || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      color: vehicle.color || '',
      fuel_type: vehicle.fuel_type || 'gasoline',
      department: vehicle.department || '',
      vin: vehicle.vin || '',
      engine_number: vehicle.engine_number || '',
      assigned_driver: vehicle.driver_name || vehicle.assigned_driver || '',
      work_registration: vehicle.work_registration || '',
      mileage: vehicle.mileage || '0',
      status: vehicle.status || 'active',
      notes: vehicle.notes || '',
      insurance_company: vehicle.insurance_company || '',
      insurance_level: vehicle.insurance_level || '1',
      insurance_price: vehicle.insurance_price || '0',
      insurance_renew_date: vehicle.insurance_renew_date ? vehicle.insurance_renew_date.split('T')[0] : '',
      insurance_expire: vehicle.insurance_expire ? vehicle.insurance_expire.split('T')[0] : '',
      tax_provider: vehicle.tax_provider || '',
      tax_price: vehicle.tax_price || '0',
      tax_inspection_fee: vehicle.tax_inspection_fee || '0',
      tax_renew_date: vehicle.tax_renew_date ? vehicle.tax_renew_date.split('T')[0] : '',
      tax_expire: vehicle.tax_expire ? vehicle.tax_expire.split('T')[0] : '',
      act_provider: vehicle.act_provider || '',
      act_price: vehicle.act_price || '0',
      act_renew_date: vehicle.act_renew_date ? vehicle.act_renew_date.split('T')[0] : '',
      act_expire: vehicle.act_expire ? vehicle.act_expire.split('T')[0] : '',
    });
    setIsEditing(true);
  };

  const handleInputChange = (key, value) => {
    setEditForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!editForm.plate_number || !editForm.brand) {
      toast.error('กรุณากรอกข้อมูลเลขทะเบียนและยี่ห้อรถยนต์');
      return;
    }
    
    setSaving(true);
    const payload = {
      plate_number: editForm.plate_number,
      brand: editForm.brand,
      model: editForm.model,
      year: parseInt(editForm.year) || null,
      color: editForm.color,
      engine_number: editForm.engine_number,
      vin: editForm.vin,
      mileage: parseInt(editForm.mileage) || 0,
      fuel_type: editForm.fuel_type,
      insurance_expire: editForm.insurance_expire || null,
      tax_expire: editForm.tax_expire || null,
      tax_provider: editForm.tax_provider || null,
      tax_price: parseFloat(editForm.tax_price) || 0,
      tax_renew_date: editForm.tax_renew_date || null,
      act_expire: editForm.act_expire || null,
      act_provider: editForm.act_provider || null,
      act_price: parseFloat(editForm.act_price) || 0,
      act_renew_date: editForm.act_renew_date || null,
      tax_inspection_fee: parseFloat(editForm.tax_inspection_fee) || 0,
      status: editForm.status,
      department: editForm.department,
      notes: editForm.notes,
      image_url: vehicle.image_url || null,
      document_url: vehicle.document_url || null,
      insurance_company: editForm.insurance_company || null,
      insurance_price: parseFloat(editForm.insurance_price) || 0,
      insurance_renew_date: editForm.insurance_renew_date || null,
      insurance_level: editForm.insurance_level || null,
      assigned_driver: editForm.assigned_driver || null,
      work_registration: editForm.work_registration || null
    };

    try {
      await api.put(`/vehicles/${id}`, payload);
      toast.success('แก้ไขข้อมูลรถยนต์สำเร็จ!');
      setIsEditing(false);
      
      setLoading(true);
      const { data } = await api.get(`/vehicles/${id}`);
      setVehicle(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลรถยนต์ได้');
    } finally {
      setLoading(false);
      setSaving(false);
    }
  };

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('specs'); // specs | pm | history | docs
  const [docTab, setDocTab] = useState('insurance'); // insurance | tax | act

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const { data } = await api.get(`/vehicles/${id}`);
        setVehicle(data.data);
      } catch (err) {
        setError('ไม่สามารถเรียกข้อมูลยานพาหนะนี้ได้');
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
    fetchInsuranceCompanies();
  }, [id]);

  // Helper: compute days left + UI badge with premium soft colors
  const getExpiryStatus = (dateStr) => {
    if (!dateStr) return { color: 'var(--text-muted)', bg: 'transparent', label: '-', days: null };
    const today = new Date(); today.setHours(0,0,0,0);
    const exp = new Date(dateStr); exp.setHours(0,0,0,0);
    const days = Math.round((exp - today) / 86400000);
    if (days < 0) return { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', label: 'หมดอายุแล้ว', days };
    if (days <= 30) return { color: '#ea580c', bg: 'rgba(234,88,12,0.08)', label: `เหลือ ${days} วัน`, days };
    if (days <= 90) return { color: '#b45309', bg: 'rgba(180,83,9,0.06)', label: `เหลือ ${days} วัน`, days };
    return { color: '#047857', bg: 'rgba(4,120,87,0.06)', label: `เหลือ ${days} วัน`, days };
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-danger text-center">{error}</div>;

  const statuses = {
    active: 'พร้อมใช้งาน',
    maintenance: 'กำลังซ่อมบำรุง',
    disabled: 'งดใช้งาน',
    sold: 'จำหน่ายออก'
  };

  const getSeverityLabel = (sev) => {
    const labels = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง', critical: 'วิกฤต' };
    return labels[sev] || sev;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Page Header with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate('/vehicles')} 
            style={{
              background: '#ffffff',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            title="กลับ"
          >
            <LuArrowLeft size={18} />
          </button>
          <button 
            onClick={handlePrint} 
            style={{
              background: '#ffffff',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            title="พิมพ์รายละเอียด (PDF)"
          >
            <LuPrinter size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>รายละเอียดข้อมูลรถยนต์</h1>
            <p className="page-subtitle" style={{ margin: 0 }}>ข้อมูลรายละเอียด สถิติ และประวัติยานพาหนะ</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <NeonButton 
            variant="success" 
            onClick={() => navigate(`/tickets/new?vehicleId=${vehicle.id}`)}
            style={{ height: '38px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LuPlus size={16} /> สร้างใบแจ้งซ่อม
          </NeonButton>
          {canEdit && (
            <>
              {isEditing ? (
                <>
                  <NeonButton 
                    variant="ghost" 
                    onClick={() => setIsEditing(false)} 
                    disabled={saving}
                    style={{ height: '38px', padding: '0 16px' }}
                  >
                    ยกเลิก
                  </NeonButton>
                  <NeonButton 
                    variant="primary" 
                    onClick={handleSave} 
                    disabled={saving}
                    style={{ height: '38px', padding: '0 16px' }}
                  >
                    {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                  </NeonButton>
                </>
              ) : (
                <NeonButton 
                  variant="primary" 
                  onClick={startEditing}
                  style={{ height: '38px', padding: '0 16px' }}
                >
                  ✏️ แก้ไขข้อมูล
                </NeonButton>
              )}
            </>
          )}
        </div>
      </div>

      {/* 2. Hero Vehicle Header Card */}
      <GlassCard style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Styled License Plate */}
        <div style={{
          background: '#ffffff',
          border: '3px solid #1e293b',
          borderRadius: '8px',
          padding: '8px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '150px',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative'
        }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', letterSpacing: '0.5px', lineHeight: 1.1 }}>
            {(() => { const m = vehicle.plate_number?.match(/^(.+\d+)\s+(.+)$/); return m ? m[1].trim() : vehicle.plate_number; })()}
          </span>
          {(() => { const m = vehicle.plate_number?.match(/^(.+\d+)\s+(.+)$/); return m ? <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>{m[2].trim()}</span> : null; })()}
        </div>

        {/* Basic specifications */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {vehicle.brand} {vehicle.model}
            </h2>
            <StatusBadge type="vehicle" value={vehicle.status} label={statuses[vehicle.status]} />
          </div>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <LuGauge size={15} style={{ color: 'var(--color-primary)' }} />
              <strong>เลขไมล์:</strong> {Number(vehicle.mileage).toLocaleString()} km
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <LuUser size={15} style={{ color: 'var(--color-accent)' }} />
              <strong>ผู้ดูแล:</strong> {vehicle.driver_name || 'ไม่มี'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <LuSparkles size={15} style={{ color: '#059669' }} />
              <strong>แผนก:</strong> {vehicle.department || 'ทั่วไป'}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* 3. Main Split Grid */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Left Column: Vehicle Image (40%) */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {(() => {
            let images = [];
            if (vehicle.image_url) {
              try { images = JSON.parse(vehicle.image_url); } catch { images = [vehicle.image_url]; }
            }
            if (images.length === 0) return (
              <GlassCard style={{ padding: 0, overflow: 'hidden', height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37,99,235,0.02)' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <LuCar size={48} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>ไม่มีรูปรถในระบบ</p>
                </div>
              </GlassCard>
            );
            return <ImageCarousel images={images} brand={vehicle.brand} model={vehicle.model} />;
          })()}
        </div>

        {/* Right Column: Tabbed Cards (60%) */}
        <div style={{ flex: '1.5', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <GlassCard style={{ padding: '20px' }}>
            {/* Top Navigation Tabs */}
            <div style={{
              display: 'flex',
              gap: '6px',
              background: 'rgba(37, 99, 235, 0.04)',
              padding: '5px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              marginBottom: '16px',
              width: 'fit-content'
            }}>
              {[
                { key: 'specs', label: 'ข้อมูลรถยนต์', icon: <LuCar size={15} /> },
                { key: 'pm', label: 'กำหนด PM', icon: <LuSettings size={15} /> },
                { key: 'history', label: 'ประวัติซ่อม', icon: <LuWrench size={15} /> },
                { key: 'docs', label: 'เอกสารแนบ', icon: <LuFileStack size={15} /> }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 14px',
                    borderRadius: '9px',
                    border: 'none',
                    background: activeTab === tab.key 
                      ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)' 
                      : 'transparent',
                    color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab.key ? 700 : 500,
                    fontSize: '0.82rem',
                    transition: 'all 0.2s',
                    boxShadow: activeTab === tab.key ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none'
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTENT: SPECS */}
            {activeTab === 'specs' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                <SpecRow label="ยี่ห้อ / รุ่น" value={`${vehicle.brand} ${vehicle.model || ''}`} isEditing={isEditing}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.brand} 
                      onChange={(e) => handleInputChange('brand', e.target.value)} 
                      placeholder="ยี่ห้อ"
                      style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem' }} 
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.model} 
                      onChange={(e) => handleInputChange('model', e.target.value)} 
                      placeholder="รุ่น"
                      style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem' }} 
                    />
                  </div>
                </SpecRow>
                <SpecRow label="เลขทะเบียน" value={vehicle.plate_number} isEditing={isEditing}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editForm.plate_number} 
                    onChange={(e) => handleInputChange('plate_number', e.target.value)} 
                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%' }} 
                  />
                </SpecRow>
                <SpecRow label="ปีจดทะเบียน" value={vehicle.year} isEditing={isEditing}>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={editForm.year} 
                    onChange={(e) => handleInputChange('year', e.target.value)} 
                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%' }} 
                  />
                </SpecRow>
                <SpecRow label="สีรถ" value={vehicle.color} isEditing={isEditing}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editForm.color} 
                    onChange={(e) => handleInputChange('color', e.target.value)} 
                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%' }} 
                  />
                </SpecRow>
                <SpecRow label="ประเภทเชื้อเพลิง" value={
                  vehicle.fuel_type === 'gasoline' ? 'เบนซิน' :
                  vehicle.fuel_type === 'diesel' ? 'ดีเซล' :
                  vehicle.fuel_type === 'electric' ? 'ไฟฟ้า (EV)' :
                  vehicle.fuel_type === 'hybrid' ? 'ไฮบริด' : vehicle.fuel_type
                } isEditing={isEditing}>
                  <select 
                    className="form-select" 
                    value={editForm.fuel_type} 
                    onChange={(e) => handleInputChange('fuel_type', e.target.value)}
                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%' }}
                  >
                    <option value="gasoline">เบนซิน</option>
                    <option value="diesel">ดีเซล</option>
                    <option value="electric">ไฟฟ้า (EV)</option>
                    <option value="hybrid">ไฮบริด</option>
                    <option value="lpg">LPG</option>
                  </select>
                </SpecRow>
                <SpecRow label="แผนกที่สังกัด" value={vehicle.department} isEditing={isEditing}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editForm.department} 
                    onChange={(e) => handleInputChange('department', e.target.value)} 
                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%' }} 
                  />
                </SpecRow>
                <SpecRow label="เลขตัวถัง (VIN)" value={vehicle.vin} isMono isEditing={isEditing}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editForm.vin} 
                    onChange={(e) => handleInputChange('vin', e.target.value)} 
                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%', fontFamily: 'var(--font-mono)' }} 
                  />
                </SpecRow>
                <SpecRow label="เลขเครื่องยนต์" value={vehicle.engine_number} isMono isEditing={isEditing}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editForm.engine_number} 
                    onChange={(e) => handleInputChange('engine_number', e.target.value)} 
                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%', fontFamily: 'var(--font-mono)' }} 
                  />
                </SpecRow>
                <SpecRow label="ผู้ขับขี่ประจำรถ" value={vehicle.driver_name} isEditing={isEditing}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editForm.assigned_driver} 
                    onChange={(e) => handleInputChange('assigned_driver', e.target.value)} 
                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%' }} 
                  />
                </SpecRow>
                <SpecRow label="ขึ้นทะเบียนงาน" value={vehicle.work_registration} isEditing={isEditing}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editForm.work_registration} 
                    onChange={(e) => handleInputChange('work_registration', e.target.value)} 
                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%' }} 
                  />
                </SpecRow>

                {/* Additional inline fields for editing mileage & status easily */}
                {isEditing && (
                  <>
                    <SpecRow label="ระยะไมล์ปัจจุบัน (km)" value={vehicle.mileage} isEditing={isEditing}>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={editForm.mileage} 
                        onChange={(e) => handleInputChange('mileage', e.target.value)} 
                        style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%' }} 
                      />
                    </SpecRow>
                    <SpecRow label="สถานะรถยนต์" value={vehicle.status} isEditing={isEditing}>
                      <select 
                        className="form-select" 
                        value={editForm.status} 
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100%' }}
                      >
                        <option value="active">พร้อมใช้งาน</option>
                        <option value="maintenance">กำลังซ่อมบำรุง</option>
                        <option value="disabled">งดใช้งาน</option>
                        <option value="sold">จำหน่ายออก</option>
                      </select>
                    </SpecRow>
                  </>
                )}
                
                {(isEditing || vehicle.notes) && (
                  <div style={{ gridColumn: 'span 2', marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>📝 หมายเหตุเพิ่มเติม</span>
                    {isEditing ? (
                      <textarea
                        className="form-input"
                        value={editForm.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        style={{ padding: '8px', fontSize: '0.85rem', width: '100%', minHeight: '60px', marginTop: '4px' }}
                      />
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>{vehicle.notes}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: PM SCHEDULES */}
            {activeTab === 'pm' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {vehicle.maintenance_schedules?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>ไม่มีกำหนดการบำรุงรักษาเชิงป้องกัน (PM)</div>
                ) : (
                  vehicle.maintenance_schedules?.map((sched) => (
                    <div 
                      key={sched.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{sched.service_type}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          กำหนดครั้งต่อไป: {formatThaiDate(sched.next_due_date)} {sched.next_due_mileage ? `หรือ ${sched.next_due_mileage.toLocaleString()} km` : ''}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: REPAIR HISTORY */}
            {activeTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {vehicle.repair_history?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>ไม่มีประวัติการแจ้งซ่อม</div>
                ) : (
                  vehicle.repair_history?.map((t) => (
                    <Link 
                      key={t.id} 
                      to={`/tickets/${t.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.background = 'var(--color-primary-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-primary)' }}>{t.ticket_id}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>({getSeverityLabel(t.severity)})</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '3px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '380px' }}>
                          {t.title}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <StatusBadge type="status" value={t.status} label={
                          t.status === 'reported' ? 'แจ้งเรื่อง' :
                          t.status === 'reviewing' ? 'ตรวจสอบ' :
                          t.status === 'approved' ? 'อนุมัติแล้ว' :
                          t.status === 'repairing' ? 'กำลังซ่อม' :
                          t.status === 'completed' ? 'เสร็จสิ้น' : 'ปิดงาน'
                        } />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatThaiDate(t.created_at)}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: DOCUMENTS */}
            {activeTab === 'docs' && (
              <div>
                {(() => {
                  let docs = [];
                  if (vehicle.document_url) {
                    try { docs = JSON.parse(vehicle.document_url); } catch { docs = [vehicle.document_url]; }
                  }
                  if (docs.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        ไม่มีไฟล์เอกสารแนบในระบบ
                      </div>
                    );
                  }

                  return (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: '12px'
                    }}>
                      {docs.map((docPath, idx) => {
                        const fileName = docPath.split('/').pop();
                        const ext = fileName.split('.').pop().toUpperCase();
                        return (
                          <a
                            key={idx}
                            href={getFileUrl(docPath)}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 14px',
                              background: 'rgba(255,255,255,0.01)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '10px',
                              textDecoration: 'none',
                              color: 'inherit',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--color-primary)';
                              e.currentTarget.style.background = 'var(--color-primary-subtle)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--glass-border)';
                              e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                            }}
                          >
                            <LuBriefcase size={24} style={{ color: ext === 'PDF' ? '#dc2626' : 'var(--color-accent)', flexShrink: 0 }} />
                            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span
                                style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                title={fileName}
                              >
                                {fileName}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                {ext} FILE
                              </span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* 4. Insurance / Tax / ACT Section - 3 Side-by-Side Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          { 
            key: 'insurance', 
            icon: <LuShieldCheck size={20}/>, 
            title: 'ประกันภัย', 
            color: 'var(--color-primary)', 
            gradient: 'linear-gradient(135deg, var(--color-primary-glow) 0%, var(--color-primary-subtle) 100%)',
            borderColor: 'var(--color-primary-ring)',
            dateKey: 'insurance_expire',
            fields: [
              { label: 'บริษัท', value: vehicle.insurance_company, editKey: 'insurance_company', type: 'insurance-select' },
              { label: 'ชั้นประกัน', value: vehicle.insurance_level ? `ชั้น ${vehicle.insurance_level}` : null, editKey: 'insurance_level', type: 'insurance-level' },
              { label: 'เบี้ยประกัน', value: vehicle.insurance_price ? `฿${Number(vehicle.insurance_price).toLocaleString('th-TH',{minimumFractionDigits:2})}` : null, editKey: 'insurance_price', type: 'number', highlight: true },
              { label: 'ต่อประกันล่าสุด', value: vehicle.insurance_renew_date ? formatThaiDate(vehicle.insurance_renew_date) : null, editKey: 'insurance_renew_date', type: 'date' },
              { label: 'วันหมดอายุ', dateKey: 'insurance_expire', editKey: 'insurance_expire', type: 'date' }
            ]
          },
          { 
            key: 'tax', 
            icon: <LuFileSpreadsheet size={20}/>, 
            title: 'ภาษีรถประจำปี', 
            color: '#d97706', 
            gradient: 'linear-gradient(135deg, rgba(217,119,6,0.08) 0%, rgba(217,119,6,0.02) 100%)',
            borderColor: 'rgba(217,119,6,0.15)',
            dateKey: 'tax_expire',
            fields: [
              { label: 'ผู้ดำเนินการ', value: vehicle.tax_provider, editKey: 'tax_provider', type: 'text' },
              { label: 'ค่าภาษี', value: vehicle.tax_price ? `฿${Number(vehicle.tax_price).toLocaleString('th-TH',{minimumFractionDigits:2})}` : null, editKey: 'tax_price', type: 'number', highlight: true },
              { label: 'ค่าตรวจสภาพ', value: vehicle.tax_inspection_fee ? `฿${Number(vehicle.tax_inspection_fee).toLocaleString('th-TH',{minimumFractionDigits:2})}` : null, editKey: 'tax_inspection_fee', type: 'number' },
              { label: 'ต่อภาษีล่าสุด', value: vehicle.tax_renew_date ? formatThaiDate(vehicle.tax_renew_date) : null, editKey: 'tax_renew_date', type: 'date' },
              { label: 'วันหมดอายุ', dateKey: 'tax_expire', editKey: 'tax_expire', type: 'date' }
            ]
          },
          { 
            key: 'act', 
            icon: <LuTriangleAlert size={20}/>, 
            title: 'พ.ร.บ.', 
            color: '#059669', 
            gradient: 'linear-gradient(135deg, rgba(5,150,105,0.08) 0%, rgba(5,150,105,0.02) 100%)',
            borderColor: 'rgba(5,150,105,0.15)',
            dateKey: 'act_expire',
            fields: [
              { label: 'ผู้ให้บริการ', value: vehicle.act_provider, editKey: 'act_provider', type: 'text' },
              { label: 'ราคา พ.ร.บ.', value: vehicle.act_price ? `฿${Number(vehicle.act_price).toLocaleString('th-TH',{minimumFractionDigits:2})}` : null, editKey: 'act_price', type: 'number', highlight: true },
              { label: 'ต่อ พ.ร.บ. ล่าสุด', value: vehicle.act_renew_date ? formatThaiDate(vehicle.act_renew_date) : null, editKey: 'act_renew_date', type: 'date' },
              { label: 'วันหมดอายุ', dateKey: 'act_expire', editKey: 'act_expire', type: 'date' }
            ]
          }
        ].map(section => {
          const expiry = getExpiryStatus(vehicle[section.dateKey]);
          const urgent = expiry.days !== null && expiry.days <= 30;
          return (
            <GlassCard key={section.key} style={{ 
              padding: 0, 
              background: section.gradient,
              border: `1px solid ${section.borderColor}`,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Card Header */}
              <div style={{ 
                padding: '14px 18px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: `1px solid ${section.borderColor}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '10px', 
                    background: `${section.color}15`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: section.color 
                  }}>
                    {section.icon}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{section.title}</span>
                </div>
                <span style={{ 
                  fontSize: '0.72rem', fontWeight: 700, 
                  color: urgent ? '#dc2626' : expiry.color, 
                  background: urgent ? 'rgba(220,38,38,0.08)' : expiry.bg, 
                  padding: '3px 10px', borderRadius: '20px',
                  border: `1px solid ${urgent ? 'rgba(220,38,38,0.2)' : `${expiry.color}22`}`,
                  whiteSpace: 'nowrap'
                }}>
                  {urgent && '⚠ '}{expiry.label}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {section.fields.map((field, idx) => {
                  // Expiry date field
                  if (field.dateKey) {
                    const fExpiry = getExpiryStatus(vehicle[field.dateKey]);
                    if (isEditing) {
                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{field.label}</span>
                          <ThaiDateInput value={editForm[field.editKey]} onChange={(val) => handleInputChange(field.editKey, val)} />
                        </div>
                      );
                    }
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: idx > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{field.label}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                          {vehicle[field.dateKey] && <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatThaiDate(vehicle[field.dateKey])}</span>}
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: fExpiry.color, background: fExpiry.bg, padding: '1px 6px', borderRadius: '4px' }}>{fExpiry.label}</span>
                        </div>
                      </div>
                    );
                  }

                  // Regular fields in edit mode
                  if (isEditing) {
                    let input;
                    if (field.type === 'insurance-select') {
                      input = (
                        <select className="form-select" value={editForm[field.editKey]} onChange={(e) => handleInputChange(field.editKey, e.target.value)} style={{ padding: '5px 8px', fontSize: '0.82rem', width: '100%' }}>
                          <option value="">-- เลือก --</option>
                          {insuranceCompanies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      );
                    } else if (field.type === 'insurance-level') {
                      input = (
                        <select className="form-select" value={editForm[field.editKey]} onChange={(e) => handleInputChange(field.editKey, e.target.value)} style={{ padding: '5px 8px', fontSize: '0.82rem', width: '100%' }}>
                          <option value="1">ชั้น 1</option><option value="2">ชั้น 2</option><option value="3">ชั้น 3</option><option value="2+">ชั้น 2+</option><option value="3+">ชั้น 3+</option>
                        </select>
                      );
                    } else if (field.type === 'date') {
                      input = <ThaiDateInput value={editForm[field.editKey]} onChange={(val) => handleInputChange(field.editKey, val)} />;
                    } else {
                      input = (
                        <input 
                          type={field.type === 'number' ? 'number' : 'text'} 
                          className="form-input" 
                          value={editForm[field.editKey]} 
                          onChange={(e) => handleInputChange(field.editKey, e.target.value)} 
                          style={{ padding: '5px 8px', fontSize: '0.82rem', width: '100%', textAlign: field.type === 'number' ? 'right' : 'left' }} 
                        />
                      );
                    }
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{field.label}</span>
                        {input}
                      </div>
                    );
                  }

                  // Regular fields in view mode
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: idx > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{field.label}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: field.highlight ? section.color : 'var(--text-primary)' }}>{field.value || '-'}</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

function ImageCarousel({ images, brand, model }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  const activeImg = images[currentIndex];
  const imgSrc = getFileUrl(activeImg);

  return (
    <GlassCard style={{ padding: 0, overflow: 'hidden', height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <img 
        src={imgSrc} 
        alt={`${brand} ${model} รูปที่ ${currentIndex + 1}`} 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />

      {images.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            type="button"
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.4)',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s',
              zIndex: 5
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
          >
            <LuChevronLeft size={16} />
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0, 0, 0, 0.4)',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s',
              zIndex: 5
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
          >
            <LuChevronRight size={16} />
          </button>

          {/* Indicator dots */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '4px 8px',
            borderRadius: '10px',
            backdropFilter: 'blur(4px)',
            zIndex: 5
          }}>
            {images.map((_, idx) => (
              <div
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: idx === currentIndex ? 'var(--color-primary)' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              />
            ))}
          </div>
        </>
      )}
    </GlassCard>
  );
}

function SpecRow({ label, value, isMono, isEditing, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      {isEditing ? (
        children
      ) : (
        <span style={{ 
          fontSize: '0.88rem', 
          fontWeight: 700, 
          color: 'var(--text-primary)',
          fontFamily: isMono ? 'var(--font-mono)' : 'inherit',
          letterSpacing: isMono ? '0.2px' : 'normal'
        }}>
          {value || '-'}
        </span>
      )}
    </div>
  );
}

function InfoRow({ label, value, dateStr, expiry, highlight, isEditing, children }) {
  if (isEditing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.02)', gap: '16px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          {children}
        </div>
      </div>
    );
  }

  if (value === undefined && dateStr === undefined) return null;
  
  if (expiry) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <span style={{ 
            fontSize: '0.72rem', 
            fontWeight: 700, 
            color: expiry.color, 
            background: expiry.bg, 
            padding: '1px 6px', 
            borderRadius: '4px',
            display: 'inline-block',
            border: `1px solid ${expiry.color}22`
          }}>
            {expiry.label}
          </span>
          {dateStr && (
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatThaiDate(dateStr)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ 
        fontSize: '0.82rem', 
        fontWeight: 700, 
        color: highlight ? 'var(--color-primary)' : 'var(--text-primary)' 
      }}>
        {value || '-'}
      </span>
    </div>
  );
}
