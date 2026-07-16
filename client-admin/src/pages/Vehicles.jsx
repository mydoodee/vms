import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LuPlus, LuEye, LuTrash2, LuPen, LuCar, LuCalendar, LuFileText, LuBriefcase, LuImage, LuFileStack, LuPrinter } from 'react-icons/lu';
import api from '../services/api';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import NeonButton from '../components/UI/NeonButton';
import Modal from '../components/UI/Modal';
import ConfirmModal from '../components/UI/ConfirmModal';
import { useToast } from '../contexts/ToastContext';
import ThaiDateInput from '../components/UI/ThaiDateInput';
import { getFileUrl } from '../utils/fileUrl';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const printVehicleReport = async (vehicleId) => {
    try {
      toast.info('กำลังสร้างไฟล์ PDF รายงานรถยนต์...');
      const { data } = await api.get(`/vehicles/${vehicleId}`);
      const v = data.data;
      
      let imgs = [];
      if (v.image_url) {
        try { imgs = JSON.parse(v.image_url); } catch { imgs = [v.image_url]; }
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
      const { plate: plateDisplay, province: plateProvince } = parsePlate(v.plate_number);

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
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${v.brand} ${v.model || '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">ปีจดทะเบียน / สี</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${v.year || '-'} / ${v.color || '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">ประเภทเชื้อเพลิง</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${
                    v.fuel_type === 'gasoline' ? 'เบนซิน' :
                    v.fuel_type === 'diesel' ? 'ดีเซล' :
                    v.fuel_type === 'electric' ? 'ไฟฟ้า' :
                    v.fuel_type === 'hybrid' ? 'ไฮบริด' : v.fuel_type || '-'
                  }</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">ระยะไมล์ปัจจุบัน</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${Number(v.mileage || 0).toLocaleString()} km</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">เลขตัวถัง (VIN)</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a; font-family: monospace;">${v.vin || '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">เลขเครื่องยนต์</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a; font-family: monospace;">${v.engine_number || '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">แผนกสังกัด / ขึ้นทะเบียน</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${v.department || '-'} / ${v.work_registration || '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">ผู้ขับขี่ / ผู้ดูแล</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${v.driver_name || '-'}</span>
                </div>
              </div>

              <div style="font-size: 13px; font-weight: 700; color: #1d4ed8; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 15px 0 10px 0;">รายละเอียดประกันภัย ภาษี และ พ.ร.บ.</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px;">
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">บริษัทประกันภัย / ระดับ</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${v.insurance_company || '-'} ${v.insurance_level ? `(ชั้น ${v.insurance_level})` : ''}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">วันหมดอายุประกัน</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${v.insurance_expire ? formatThaiDateShort(v.insurance_expire) : '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">ผู้ดำเนินการภาษี / ค่าภาษี</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${v.tax_provider || '-'} ${v.tax_price ? `(฿${Number(v.tax_price).toLocaleString()})` : ''}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">วันหมดอายุภาษี</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${v.tax_expire ? formatThaiDateShort(v.tax_expire) : '-'}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">ผู้ให้บริการ พ.ร.บ. / ราคา</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${v.act_provider || '-'} ${v.act_price ? `(฿${Number(v.act_price).toLocaleString()})` : ''}</span>
                </div>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 9px; color: #64748b; font-weight: 600;">วันหมดอายุ พ.ร.บ.</span>
                  <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${v.act_expire ? formatThaiDateShort(v.act_expire) : '-'}</span>
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
                  <td style="padding: 4px 0; text-align:right; font-weight:700;">${getExpLabel(v.insurance_expire)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight:600; color:#475569;">📄 ภาษีประจำปี:</td>
                  <td style="padding: 4px 0; text-align:right; font-weight:700;">${getExpLabel(v.tax_expire)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight:600; color:#475569;">⚡ พ.ร.บ.:</td>
                  <td style="padding: 4px 0; text-align:right; font-weight:700;">${getExpLabel(v.act_expire)}</td>
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
              ${v.repair_history && v.repair_history.length > 0 ? v.repair_history.slice(0, 5).map(t => `
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
        filename:     `vehicle-report-${v.plate_number}.pdf`,
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

  // Form states
  const [plateNumber, setPlateNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('gasoline');
  const [insuranceExpire, setInsuranceExpire] = useState('');
  const [taxExpire, setTaxExpire] = useState('');
  const [taxProvider, setTaxProvider] = useState('');
  const [taxPrice, setTaxPrice] = useState('0');
  const [taxRenewDate, setTaxRenewDate] = useState('');
  const [actExpire, setActExpire] = useState('');
  const [actProvider, setActProvider] = useState('');
  const [actPrice, setActPrice] = useState('0');
  const [actRenewDate, setActRenewDate] = useState('');
  const [taxInspectionFee, setTaxInspectionFee] = useState('0');
  const [activeSubTab, setActiveSubTab] = useState('insurance'); // 'insurance' | 'tax' | 'act'
  const [status, setStatus] = useState('active');
  const [department, setDepartment] = useState('');
  const [notes, setNotes] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const showToast = (message, type = 'success') => {
    if (type === 'success') toast.success(message);
    else toast.error(message);
  };
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [insurancePrice, setInsurancePrice] = useState('0');
  const [insuranceRenewDate, setInsuranceRenewDate] = useState('');
  const [insuranceLevel, setInsuranceLevel] = useState('1');
  
  const [assignedDriver, setAssignedDriver] = useState('');
  const [workRegistration, setWorkRegistration] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('specs'); // 'specs' | 'insurance' | 'docs'
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [newDocFiles, setNewDocFiles] = useState([]);
  
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data.data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลรถยนต์ได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsuranceCompanies = async () => {
    try {
      const { data } = await api.get('/insurance-companies');
      setInsuranceCompanies(data.data || []);
    } catch (err) {
      console.error('Failed to load insurance companies', err);
    }
  };

  const handleAddCompany = async () => {
    if (!newCompanyName || !newCompanyName.trim()) return;
    setLoadingCompanies(true);
    try {
      const { data } = await api.post('/insurance-companies', { name: newCompanyName });
      toast.success('เพิ่มบริษัทประกันภัยสำเร็จ!');
      setInsuranceCompanies(prev => [...prev, data.data]);
      setInsuranceCompany(data.data.name);
      setShowNewCompanyInput(false);
      setNewCompanyName('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'ไม่สามารถเพิ่มบริษัทประกันภัยได้');
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchInsuranceCompanies();
  }, []);

  const openAddModal = () => {
    setEditingVehicle(null);
    setPlateNumber('');
    setBrand('');
    setModel('');
    setYear(new Date().getFullYear());
    setColor('');
    setEngineNumber('');
    setVin('');
    setMileage('0');
    setFuelType('gasoline');
    setInsuranceExpire('');
    setTaxExpire('');
    setTaxProvider('');
    setTaxPrice('0');
    setTaxRenewDate('');
    setActExpire('');
    setActProvider('');
    setActPrice('0');
    setActRenewDate('');
    setTaxInspectionFee('0');
    setActiveSubTab('insurance');
    setStatus('active');
    setDepartment(user?.department || '');
    setNotes('');
    setExistingImages([]);
    setNewFiles([]);
    setPreviewUrls([]);
    setInsuranceCompany('');
    setInsurancePrice('0');
    setInsuranceRenewDate('');
    setInsuranceLevel('1');
    setAssignedDriver('');
    setWorkRegistration('');
    setActiveFormTab('specs');
    setExistingDocuments([]);
    setNewDocFiles([]);
    setShowNewCompanyInput(false);
    setNewCompanyName('');
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setPlateNumber(vehicle.plate_number);
    setBrand(vehicle.brand);
    setModel(vehicle.model || '');
    setYear(vehicle.year || '');
    setColor(vehicle.color || '');
    setEngineNumber(vehicle.engine_number || '');
    setVin(vehicle.vin || '');
    setMileage(vehicle.mileage || '0');
    setFuelType(vehicle.fuel_type || 'gasoline');
    setInsuranceExpire(vehicle.insurance_expire ? vehicle.insurance_expire.split('T')[0] : '');
    setTaxExpire(vehicle.tax_expire ? vehicle.tax_expire.split('T')[0] : '');
    setTaxProvider(vehicle.tax_provider || '');
    setTaxPrice(vehicle.tax_price || '0');
    setTaxRenewDate(vehicle.tax_renew_date ? vehicle.tax_renew_date.split('T')[0] : '');
    setActExpire(vehicle.act_expire ? vehicle.act_expire.split('T')[0] : '');
    setActProvider(vehicle.act_provider || '');
    setActPrice(vehicle.act_price || '0');
    setActRenewDate(vehicle.act_renew_date ? vehicle.act_renew_date.split('T')[0] : '');
    setTaxInspectionFee(vehicle.tax_inspection_fee ? String(vehicle.tax_inspection_fee) : '0');
    setActiveSubTab('insurance');
    setStatus(vehicle.status);
    setDepartment(vehicle.department || '');
    setNotes(vehicle.notes || '');
    // Parse existing images
    let imgs = [];
    if (vehicle.image_url) {
      try { imgs = JSON.parse(vehicle.image_url); } catch { imgs = [vehicle.image_url]; }
    }
    setExistingImages(imgs);
    setPreviewUrls(imgs.map(p => getFileUrl(p)));
    setNewFiles([]);
    setInsuranceCompany(vehicle.insurance_company || '');
    setInsurancePrice(vehicle.insurance_price || '0');
    setInsuranceRenewDate(vehicle.insurance_renew_date ? vehicle.insurance_renew_date.split('T')[0] : '');
    setInsuranceLevel(vehicle.insurance_level || '1');
    setAssignedDriver(vehicle.assigned_driver || '');
    setWorkRegistration(vehicle.work_registration || '');
    setActiveFormTab('specs');
    let docs = [];
    if (vehicle.document_url) {
      try { docs = JSON.parse(vehicle.document_url); } catch { docs = [vehicle.document_url]; }
    }
    setExistingDocuments(docs);
    setNewDocFiles([]);
    setShowNewCompanyInput(false);
    setNewCompanyName('');
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/vehicles/${deleteId}`);
      fetchVehicles();
      showToast('ลบข้อมูลรถยนต์สำเร็จ!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'ไม่สามารถลบข้อมูลได้', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Upload new image files
    let uploadedPaths = [];
    if (newFiles.length > 0) {
      try {
        const formData = new FormData();
        newFiles.forEach(f => formData.append('files', f));
        const uploadRes = await api.post('/uploads/vehicle/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedPaths = uploadRes.data.data.map(f => f.file_path);
      } catch (uploadErr) {
        showToast('อัปโหลดรูปรถไม่สำเร็จ: ' + (uploadErr.response?.data?.message || uploadErr.message), 'error');
        setSaving(false);
        return;
      }
    }

    // Upload new document files
    let uploadedDocPaths = [];
    if (newDocFiles.length > 0) {
      try {
        const formData = new FormData();
        newDocFiles.forEach(f => formData.append('files', f));
        const uploadRes = await api.post('/uploads/vehicle/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedDocPaths = uploadRes.data.data.map(f => f.file_path);
      } catch (uploadErr) {
        showToast('อัปโหลดเอกสารไม่สำเร็จ: ' + (uploadErr.response?.data?.message || uploadErr.message), 'error');
        setSaving(false);
        return;
      }
    }

    // Combine existing kept items + newly uploaded
    const allImages = [...existingImages, ...uploadedPaths];
    const allDocs = [...existingDocuments, ...uploadedDocPaths];

    const payload = {
      plate_number: plateNumber,
      brand,
      model,
      year: parseInt(year) || null,
      color,
      engine_number: engineNumber,
      vin,
      mileage: parseInt(mileage) || 0,
      fuel_type: fuelType,
      insurance_expire: insuranceExpire || null,
      tax_expire: taxExpire || null,
      tax_provider: taxProvider || null,
      tax_price: parseFloat(taxPrice) || 0,
      tax_renew_date: taxRenewDate || null,
      act_expire: actExpire || null,
      act_provider: actProvider || null,
      act_price: parseFloat(actPrice) || 0,
      act_renew_date: actRenewDate || null,
      tax_inspection_fee: parseFloat(taxInspectionFee) || 0,
      status,
      department,
      notes,
      image_url: allImages.length > 0 ? JSON.stringify(allImages) : null,
      document_url: allDocs.length > 0 ? JSON.stringify(allDocs) : null,
      insurance_company: insuranceCompany || null,
      insurance_price: parseFloat(insurancePrice) || 0,
      insurance_renew_date: insuranceRenewDate || null,
      insurance_level: insuranceLevel || null,
      assigned_driver: assignedDriver || null,
      work_registration: workRegistration || null
    };

    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, payload);
        showToast('แก้ไขข้อมูลรถยนต์สำเร็จ!', 'success');
      } else {
        await api.post('/vehicles', payload);
        showToast('เพิ่มข้อมูลรถยนต์สำเร็จ!', 'success');
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      showToast(err.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Helper: days until expiry → color badge
  const ExpiryBadge = ({ dateStr, label }) => {
    if (!dateStr) return <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>-</span>;
    const today = new Date(); today.setHours(0,0,0,0);
    const exp = new Date(dateStr); exp.setHours(0,0,0,0);
    const days = Math.round((exp - today) / 86400000);
    let color, bg, text;
    if (days < 0) { 
      color = '#dc2626'; bg = 'rgba(220,38,38,0.10)'; text = 'หมดอายุแล้ว'; 
    } else {
      if (days <= 30) { 
        color = '#ea580c'; bg = 'rgba(234,88,12,0.10)'; 
      } else if (days <= 90) { 
        color = '#b45309'; bg = 'rgba(180,83,9,0.08)'; 
      } else { 
        color = '#047857'; bg = 'rgba(4,120,87,0.08)'; 
      }

      // Calculate exact months and days
      let years = exp.getFullYear() - today.getFullYear();
      let months = exp.getMonth() - today.getMonth();
      let d = exp.getDate() - today.getDate();

      if (d < 0) {
        months--;
        const prevMonth = new Date(exp.getFullYear(), exp.getMonth(), 0);
        d += prevMonth.getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }

      const totalMonths = years * 12 + months;
      if (totalMonths > 0) {
        text = `${totalMonths}ด ${d}ว.`;
      } else {
        text = `${d}ว.`;
      }
    }
    const dObj = new Date(dateStr);
    const fmt = `${dObj.getDate().toString().padStart(2,'0')}/${(dObj.getMonth()+1).toString().padStart(2,'0')}/${dObj.getFullYear()+543}`;
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
        <span style={{ fontSize:'0.72rem', fontWeight:700, color, background:bg, padding:'1px 6px', borderRadius:'4px', display:'inline-block', border: `1px solid ${color}22` }}>{text}</span>
        <span style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{fmt}</span>
      </div>
    );
  };

  const columns = [
    { 
      key: 'image_url', 
      label: 'รูปภาพ', 
      render: (val) => {
        if (!val) return <div style={{ width: '52px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>ไม่มีรูป</div>;
        let imgs = [];
        try { imgs = JSON.parse(val); } catch { imgs = [val]; }
        const first = imgs[0];
        if (!first) return <div style={{ width: '52px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>ไม่มีรูป</div>;
        return (
          <div style={{ position: 'relative', width: '52px', height: '38px' }}>
            <img src={getFileUrl(first)} alt="รูปรถ" style={{ width: '52px', height: '38px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--glass-border)' }} />
            {imgs.length > 1 && <span style={{ position: 'absolute', top: '1px', right: '1px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.55rem', padding: '1px 3px', borderRadius: '3px' }}>+{imgs.length - 1}</span>}
          </div>
        );
      }
    },
    { key: 'plate_number', label: 'ทะเบียน', sortable: true, render: (val) => <span style={{ fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.5px' }}>{val}</span> },
    { key: 'brand', label: 'ยี่ห้อ', sortable: true, render: (val) => <span style={{ fontSize: '0.82rem' }}>{val}</span> },
    { key: 'model', label: 'รุ่น', sortable: true, render: (val) => <span style={{ fontSize: '0.82rem' }}>{val || '-'}</span> },
    { key: 'driver_name', label: 'ผู้ขับ', sortable: true, render: (val) => <span style={{ fontSize: '0.78rem' }}>{val || '-'}</span> },
    { 
      key: 'mileage', 
      label: 'ไมล์ (km)', 
      sortable: true,
      render: (val) => <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-accent)' }}>{Number(val).toLocaleString()}</span>
    },
    { 
      key: 'insurance_expire', 
      label: 'ประกัน หมดอายุ', 
      sortable: true,
      render: (val) => <ExpiryBadge dateStr={val} />
    },
    { 
      key: 'tax_expire', 
      label: 'ภาษี หมดอายุ', 
      sortable: true,
      render: (val) => <ExpiryBadge dateStr={val} />
    },
    { 
      key: 'act_expire', 
      label: 'พ.ร.บ. หมดอายุ', 
      sortable: true,
      render: (val) => <ExpiryBadge dateStr={val} />
    },
    { 
      key: 'status', 
      label: 'สถานะ', 
      sortable: true,
      render: (val) => {
        const statuses = {
          active: 'พร้อมใช้งาน',
          maintenance: 'กำลังซ่อม',
          disabled: 'งดใช้งาน',
          sold: 'จำหน่ายออก'
        };
        return <StatusBadge type="vehicle" value={val} label={statuses[val]} />;
      }
    }
  ];

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">จัดการยานพาหนะ</h1>
          <p className="page-subtitle">ทะเบียน ทราบสถานะการใช้งาน แผนกที่จัดสรร และบันทึกประวัติ</p>
        </div>
        {canEdit && (
          <NeonButton onClick={openAddModal} variant="primary" icon={<LuPlus />}>
            เพิ่มรถยนต์
          </NeonButton>
        )}
      </div>

      {error && <div className="text-danger mb-md">{error}</div>}

      <DataTable 
        columns={columns} 
        data={vehicles} 
        searchField="plate_number" 
        searchPlaceholder="ค้นหาเลขทะเบียน..."
        loading={loading}
        onRowClick={(row) => navigate(`/vehicles/${row.id}`)}
        actions={(row) => (
          <div style={{ display: 'flex', gap: '4px' }}>
            <NeonButton size="sm" variant="ghost" icon={<LuPrinter size={14} />} onClick={() => printVehicleReport(row.id)} title="พิมพ์รายละเอียด (PDF)" style={{ padding: '6px' }} />
            {canEdit && (
              <>
                <NeonButton size="sm" variant="ghost" icon={<LuPen size={14} />} onClick={() => openEditModal(row)} title="แก้ไข" style={{ padding: '6px' }} />
                <button
                  onClick={() => handleDelete(row.id)}
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'inline-flex', padding: '6px', color: 'var(--color-danger)', borderRadius: '8px' }}
                  title="ลบรถยนต์"
                >
                  <LuTrash2 size={14} />
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* Add / Edit modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !saving && setIsModalOpen(false)} 
        title={editingVehicle ? 'แก้ไขข้อมูลรถยนต์' : 'เพิ่มข้อมูลรถยนต์'}
        size="lg"
        footer={
          <>
            <NeonButton variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>ยกเลิก</NeonButton>
            <NeonButton variant="primary" onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  <span>กำลังบันทึก...</span>
                </div>
              ) : (
                'บันทึก'
              )}
            </NeonButton>
          </>
        }
      >
         <form onSubmit={handleSubmit} className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
          {/* Form Tabs */}
          <div style={{
            gridColumn: 'span 2',
            display: 'flex',
            gap: '6px',
            background: 'rgba(79,70,229,0.04)',
            padding: '6px',
            borderRadius: '14px',
            border: '1px solid var(--glass-border)',
            marginBottom: '4px'
          }}>
            {[
              { key: 'specs', icon: <LuCar size={15} />, label: 'สเปครถยนต์', step: '1' },
              { key: 'insurance', icon: <LuCalendar size={15} />, label: 'ประกัน / ภาษี', step: '2' },
              { key: 'docs', icon: <LuFileText size={15} />, label: 'รูป & เอกสาร', step: '3' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFormTab(tab.key)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeFormTab === tab.key
                    ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)'
                    : 'transparent',
                  color: activeFormTab === tab.key ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: activeFormTab === tab.key ? 700 : 500,
                  fontSize: '0.83rem',
                  transition: 'all 0.2s ease',
                  boxShadow: activeFormTab === tab.key ? '0 4px 12px rgba(79,70,229,0.25)' : 'none',
                }}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px', height: '20px',
                  borderRadius: '50%',
                  background: activeFormTab === tab.key ? 'rgba(255,255,255,0.2)' : 'rgba(79,70,229,0.08)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: activeFormTab === tab.key ? '#fff' : 'var(--color-primary)',
                  flexShrink: 0
                }}>{tab.step}</span>
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeFormTab === 'specs' && (
            <>
              {/* Section: ข้อมูลหลัก */}
              <div style={{ gridColumn: 'span 2', marginBottom: '-4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg, var(--color-primary), var(--color-accent))', borderRadius: '2px' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ข้อมูลพื้นฐาน</span>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">🔖 เลขทะเบียน *</label>
                <input type="text" required className="form-input" placeholder="เช่น กก 1234 กทม" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">🚗 ยี่ห้อ *</label>
                <input type="text" required className="form-input" placeholder="เช่น Toyota, Honda" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">📦 รุ่น</label>
                <input type="text" className="form-input" placeholder="เช่น Fortuner, Civic" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">📅 ปีที่จดทะเบียน</label>
                <input type="number" className="form-input" placeholder="เช่น 2020" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">🎨 สี</label>
                <input type="text" className="form-input" placeholder="เช่น ขาว, ดำ, เงิน" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">⛽ ประเภทเชื้อเพลิง</label>
                <select className="form-select" value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                  <option value="gasoline">เบนซิน</option>
                  <option value="diesel">ดีเซล</option>
                  <option value="electric">ไฟฟ้า (EV)</option>
                  <option value="hybrid">ไฮบริด</option>
                  <option value="lpg">LPG</option>
                </select>
              </div>

              {/* Section: การใช้งาน */}
              <div style={{ gridColumn: 'span 2', marginTop: '4px', marginBottom: '-4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg, #059669, #047857)', borderRadius: '2px' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>การใช้งานและสถานะ</span>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">👤 ผู้ใช้งานประจำ / คนขับ</label>
                <input type="text" className="form-input" placeholder="กรอกชื่อผู้ใช้งานประจำรถ" value={assignedDriver} onChange={(e) => setAssignedDriver(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">🏢 แผนกที่สังกัด</label>
                <input type="text" className="form-input" placeholder="เช่น แผนกขนส่ง" value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">📏 เลขไมล์ปัจจุบัน (km)</label>
                <input type="number" className="form-input" placeholder="0" value={mileage} onChange={(e) => setMileage(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">🔧 ขึ้นทะเบียนงาน</label>
                <input type="text" className="form-input" placeholder="ระบุการขึ้นทะเบียนงาน" value={workRegistration} onChange={(e) => setWorkRegistration(e.target.value)} />
              </div>

              {/* Section: เทคนิค */}
              <div style={{ gridColumn: 'span 2', marginTop: '4px', marginBottom: '-4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg, #7c3aed, #4f46e5)', borderRadius: '2px' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ข้อมูลทางเทคนิค</span>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">⚙️ เลขเครื่องยนต์</label>
                <input type="text" className="form-input" placeholder="Engine Number" value={engineNumber} onChange={(e) => setEngineNumber(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">🔢 เลขตัวถัง (VIN)</label>
                <input type="text" className="form-input" placeholder="Vehicle Identification Number" value={vin} onChange={(e) => setVin(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">📋 สถานะรถยนต์</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="active">✅ พร้อมใช้งาน</option>
                  <option value="maintenance">🔧 กำลังซ่อม</option>
                  <option value="disabled">⛔ งดใช้งาน</option>
                  <option value="sold">💰 จำหน่ายออก</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">📝 หมายเหตุ</label>
                <input type="text" className="form-input" placeholder="หมายเหตุเพิ่มเติม" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </>
          )}

          {/* TAB 2: Insurance & Tax & Act */}
          {activeFormTab === 'insurance' && (
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sub-tabs header */}
              <div style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.03)',
                padding: '4px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                width: '100%',
                gap: '4px'
              }}>
                {['insurance', 'tax', 'act'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveSubTab(tab)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: activeSubTab === tab 
                        ? (tab === 'insurance' ? 'var(--color-primary)' : tab === 'tax' ? 'var(--color-accent)' : 'var(--color-success)') 
                        : 'transparent',
                      color: activeSubTab === tab ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {tab === 'insurance' ? '🛡️ ประกันภัย' : tab === 'tax' ? '📄 ภาษีประจำปี' : '⚡ พ.ร.บ.'}
                  </button>
                ))}
              </div>

              {/* Sub-tab content */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '4px' }}>
                {activeSubTab === 'insurance' && (
                  <>
                    <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                      <label className="form-label">บริษัทประกันภัย</label>
                      {!showNewCompanyInput ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            className="form-select"
                            value={insuranceCompany}
                            onChange={(e) => {
                              if (e.target.value === 'new') {
                                setShowNewCompanyInput(true);
                              } else {
                                setInsuranceCompany(e.target.value);
                              }
                            }}
                            style={{ flex: 1 }}
                          >
                            <option value="">-- เลือกบริษัทประกัน --</option>
                            {insuranceCompanies.map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                            <option value="new" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>+ เพิ่มบริษัทใหม่</option>
                          </select>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="ระบุบริษัทใหม่"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={handleAddCompany}
                            disabled={loadingCompanies}
                            style={{
                              background: 'var(--color-primary)',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              color: '#fff',
                              padding: '0 12px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.85rem'
                            }}
                          >
                            {loadingCompanies ? '...' : 'เพิ่ม'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowNewCompanyInput(false); setNewCompanyName(''); }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-secondary)',
                              padding: '0 12px',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            ยกเลิก
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">ระดับประกันภัย</label>
                      <select className="form-select" value={insuranceLevel} onChange={(e) => setInsuranceLevel(e.target.value)}>
                        <option value="1">ชั้น 1</option>
                        <option value="2">ชั้น 2</option>
                        <option value="2+">ชั้น 2+</option>
                        <option value="3">ชั้น 3</option>
                        <option value="3+">ชั้น 3+</option>
                        <option value="อื่น ๆ">อื่น ๆ</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">ราคาเบี้ยประกันภัย (บาท)</label>
                      <input type="number" className="form-input" placeholder="0.00" value={insurancePrice} onChange={(e) => setInsurancePrice(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">วันที่ต่อประกันล่าสุด</label>
                      <ThaiDateInput value={insuranceRenewDate} onChange={(v) => setInsuranceRenewDate(v)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">วันหมดอายุประกันภัย</label>
                      <ThaiDateInput value={insuranceExpire} onChange={(v) => setInsuranceExpire(v)} />
                    </div>
                  </>
                )}

                {activeSubTab === 'tax' && (
                  <>
                    <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                      <label className="form-label">ผู้ให้บริการ / บริษัทต่อภาษี</label>
                      <input type="text" className="form-input" placeholder="เช่น กรมการขนส่งทางบก" value={taxProvider} onChange={(e) => setTaxProvider(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">ค่าภาษีประจำปี (บาท)</label>
                      <input type="number" className="form-input" placeholder="0.00" value={taxPrice} onChange={(e) => setTaxPrice(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">ค่าตรวจสภาพ (บาท)</label>
                      <input type="number" className="form-input" placeholder="0.00" value={taxInspectionFee} onChange={(e) => setTaxInspectionFee(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">วันที่ต่อภาษีล่าสุด</label>
                      <ThaiDateInput value={taxRenewDate} onChange={(v) => setTaxRenewDate(v)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">วันหมดอายุภาษีประจำปี</label>
                      <ThaiDateInput value={taxExpire} onChange={(v) => setTaxExpire(v)} />
                    </div>
                  </>
                )}

                {activeSubTab === 'act' && (
                  <>
                    <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                      <label className="form-label">บริษัท / ผู้ให้บริการ พ.ร.บ.</label>
                      <input type="text" className="form-input" placeholder="เช่น วิริยะประกันภัย" value={actProvider} onChange={(e) => setActProvider(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                      <label className="form-label">ราคา พ.ร.บ. (บาท)</label>
                      <input type="number" className="form-input" placeholder="0.00" value={actPrice} onChange={(e) => setActPrice(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">วันที่ต่อ พ.ร.บ. ล่าสุด</label>
                      <ThaiDateInput value={actRenewDate} onChange={(v) => setActRenewDate(v)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">วันหมดอายุ พ.ร.บ.</label>
                      <ThaiDateInput value={actExpire} onChange={(v) => setActExpire(v)} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Images & Documents */}
          {activeFormTab === 'docs' && (
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Photo section */}
              <div style={{
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <LuImage size={18} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>รูปถ่ายรถยนต์</span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  {/* Existing images */}
                  {existingImages.map((imgPath, idx) => (
                    <div key={`existing-${idx}`} style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                      <img src={getFileUrl(imgPath)} alt={`รูป ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => {
                        setExistingImages(prev => prev.filter((_, i) => i !== idx));
                        setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
                      }} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: '#fff', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                  {/* New file previews */}
                  {newFiles.map((file, idx) => (
                    <div key={`new-${idx}`} style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--color-primary)', flexShrink: 0 }}>
                      <img src={URL.createObjectURL(file)} alt={`ใหม่ ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => {
                        setNewFiles(prev => prev.filter((_, i) => i !== idx));
                      }} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: '#fff', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="form-input" 
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                      setNewFiles(prev => [...prev, ...files]);
                    }
                    e.target.value = '';
                  }} 
                />
              </div>

              {/* Documents uploader card */}
              <div style={{
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <LuFileText size={18} style={{ color: 'var(--color-accent)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>เอกสารเกี่ยวกับรถ (เช่น สัญญาซื้อขาย, เล่มทะเบียน, พ.ร.บ.)</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {/* Existing documents */}
                  {existingDocuments.map((docPath, idx) => {
                    const fileName = docPath.split('/').pop();
                    return (
                      <div key={`doc-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <LuFileStack size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }} title={fileName}>{fileName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <a href={getFileUrl(docPath)} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none' }}>เปิดไฟล์</a>
                          <button type="button" onClick={() => setExistingDocuments(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.75rem', cursor: 'pointer' }}>ลบ</button>
                        </div>
                      </div>
                    );
                  })}
                  {/* New documents */}
                  {newDocFiles.map((file, idx) => (
                    <div key={`newdoc-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,178,255,0.03)', border: '1px solid var(--color-primary-dim)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <LuFileStack size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>{file.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </div>
                      <button type="button" onClick={() => setNewDocFiles(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.75rem', cursor: 'pointer' }}>ลบ</button>
                    </div>
                  ))}
                </div>
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.pdf" 
                  multiple
                  className="form-input" 
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                      setNewDocFiles(prev => [...prev, ...files]);
                    }
                    e.target.value = '';
                  }} 
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  * รองรับไฟล์ภาพ JPEG, PNG หรือไฟล์เอกสาร PDF ขนาดสูงสุดไม่เกิน 300MB
                </p>
              </div>
            </div>
          )}
        </form>
      </Modal>



      {/* Custom Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="ยืนยันการลบข้อมูลรถยนต์"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลรถยนต์คันนี้? การดำเนินการนี้จะลบข้อมูลประวัติการซ่อมบำรุงและข้อมูล PM ทั้งหมดของรถคันนี้ด้วย"
        confirmText="ลบข้อมูล"
        variant="danger"
      />
    </div>
  );
}
