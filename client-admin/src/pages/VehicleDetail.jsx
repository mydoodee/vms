import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { IoArrowBack, IoCarOutline, IoCalendarOutline, IoSettingsOutline, IoBuildOutline, IoChevronBack, IoChevronForward, IoDocumentAttachOutline, IoFileTrayFullOutline, IoShieldCheckmarkOutline, IoReceiptOutline, IoAlertCircleOutline } from 'react-icons/io5';
import api from '../services/api';
import GlassCard from '../components/UI/GlassCard';
import StatusBadge from '../components/UI/StatusBadge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import NeonButton from '../components/UI/NeonButton';
import { formatThaiDate } from '../utils/thaiDate';
import { getFileUrl } from '../utils/fileUrl';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  }, [id]);

  // Helper: compute days left + UI badge
  const getExpiryStatus = (dateStr) => {
    if (!dateStr) return { color: 'var(--text-muted)', bg: 'transparent', label: '-', days: null };
    const today = new Date(); today.setHours(0,0,0,0);
    const exp = new Date(dateStr); exp.setHours(0,0,0,0);
    const days = Math.round((exp - today) / 86400000);
    if (days < 0) return { color: '#ff5252', bg: 'rgba(255,82,82,0.12)', label: 'หมดอายุแล้ว', days };
    if (days <= 30) return { color: '#ffab40', bg: 'rgba(255,171,64,0.12)', label: `เหลือ ${days} วัน`, days };
    if (days <= 90) return { color: '#ffd740', bg: 'rgba(255,215,64,0.10)', label: `เหลือ ${days} วัน`, days };
    return { color: '#69f0ae', bg: 'rgba(105,240,174,0.10)', label: `เหลือ ${days} วัน`, days };
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-danger text-center">{error}</div>;

  const statuses = {
    active: 'พร้อมใช้งาน',
    maintenance: 'กำลังซ่อม',
    disabled: 'งดใช้งาน',
    sold: 'จำหน่ายออก'
  };

  const getSeverityLabel = (sev) => {
    const labels = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง', critical: 'วิกฤต' };
    return labels[sev] || sev;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <NeonButton variant="ghost" size="sm" onClick={() => navigate('/vehicles')} icon={<IoArrowBack />}>
          กลับ
        </NeonButton>
        <div>
          <h1 className="page-title">รายละเอียดข้อมูลรถยนต์</h1>
          <p className="page-subtitle">ทะเบียน {vehicle.plate_number} — {vehicle.brand} {vehicle.model}</p>
        </div>
      </div>

      <div className="grid grid-3 mb-lg">
        {/* Vehicle Spec Detail */}
        <GlassCard style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <IoCarOutline size={24} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>ข้อมูลทางเทคนิคและสเปค</h3>
          </div>
          
          <div className="grid grid-2" style={{ gap: '15px 30px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ยี่ห้อ / รุ่น</span>
              <p style={{ fontWeight: 600 }}>{vehicle.brand} {vehicle.model || '-'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>เลขทะเบียน</span>
              <p style={{ fontWeight: 600 }}>{vehicle.plate_number}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ปีจดทะเบียน</span>
              <p style={{ fontWeight: 600 }}>{vehicle.year || '-'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>สีรถ</span>
              <p style={{ fontWeight: 600 }}>{vehicle.color || '-'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>เลขตัวถัง (VIN)</span>
              <p style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{vehicle.vin || '-'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>เลขเครื่องยนต์</span>
              <p style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{vehicle.engine_number || '-'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ระยะไมล์ปัจจุบัน</span>
              <p style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{Number(vehicle.mileage).toLocaleString()} km</p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ประเภทเชื้อเพลิง</span>
              <p style={{ fontWeight: 600 }}>{
                vehicle.fuel_type === 'gasoline' ? 'เบนซิน' :
                vehicle.fuel_type === 'diesel' ? 'ดีเซล' :
                vehicle.fuel_type === 'electric' ? 'ไฟฟ้า' :
                vehicle.fuel_type === 'hybrid' ? 'ไฮบริด' : vehicle.fuel_type
              }</p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>แผนกที่สังกัด</span>
              <p style={{ fontWeight: 600 }}>{vehicle.department || '-'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ผู้ใช้งานประจำรถ (คนขับ)</span>
              <p style={{ fontWeight: 600, color: 'var(--color-primary-dim)' }}>{vehicle.driver_name || '-'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ขึ้นทะเบียนงาน</span>
              <p style={{ fontWeight: 600, color: 'var(--color-primary-dim)' }}>{vehicle.work_registration || '-'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>สถานะปัจจุบัน</span>
              <div style={{ marginTop: '2px' }}>
                <StatusBadge type="vehicle" value={vehicle.status} label={statuses[vehicle.status]} />
              </div>
            </div>
          </div>

          {vehicle.notes && (
            <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>หมายเหตุเพิ่มเติม</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{vehicle.notes}</p>
            </div>
          )}

          {/* Redesigned Vehicle Documents Section */}
          <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <IoDocumentAttachOutline size={20} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>เอกสารสำคัญประจำรถ (เล่มทะเบียน, สัญญาซื้อขาย, พ.ร.บ.)</span>
            </div>

            {(() => {
              let docs = [];
              if (vehicle.document_url) {
                try { docs = JSON.parse(vehicle.document_url); } catch { docs = [vehicle.document_url]; }
              }
              if (docs.length === 0) {
                return (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                    ไม่มีเอกสารแนบในระบบ
                  </p>
                );
              }

              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '12px',
                  marginTop: '10px'
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
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'all var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--glass-border)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        }}
                      >
                        <IoFileTrayFullOutline size={28} style={{ color: ext === 'PDF' ? '#ff5252' : 'var(--color-accent)', flexShrink: 0 }} />
                        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span
                            style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            title={fileName}
                          >
                            {fileName}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
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
        </GlassCard>

        {/* Right side column for Image and Insurance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {(() => {
            let images = [];
            if (vehicle.image_url) {
              try { images = JSON.parse(vehicle.image_url); } catch { images = [vehicle.image_url]; }
            }
            if (images.length === 0) return null;
            return <ImageCarousel images={images} brand={vehicle.brand} model={vehicle.model} />;
          })()}

          {/* Insurance & Tax & Act — Tabbed Card */}
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* Tab Header */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '10px 10px 0 0', borderBottom: '1px solid var(--glass-border)', marginBottom: '0' }}>
              {[
                { key: 'insurance', icon: <IoShieldCheckmarkOutline size={15}/>, label: 'ประกันภัย', color: 'var(--color-primary)', dateKey: 'insurance_expire' },
                { key: 'tax',       icon: <IoReceiptOutline size={15}/>,         label: 'ภาษีรถ', color: '#ffd740',             dateKey: 'tax_expire' },
                { key: 'act',       icon: <IoAlertCircleOutline size={15}/>,     label: 'พ.ร.บ.',         color: '#69f0ae',             dateKey: 'act_expire' },
              ].map(({ key, icon, label, color, dateKey }) => {
                const st = getExpiryStatus(vehicle[dateKey]);
                const isActive = docTab === key;
                const urgent = st.days !== null && st.days <= 30;
                return (
                  <button key={key} type="button" onClick={() => setDocTab(key)} style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    padding: '8px 6px', borderRadius: '7px', border: isActive ? `1.5px solid ${color}` : '1.5px solid transparent',
                    background: isActive ? `${color}18` : 'transparent',
                    color: isActive ? color : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                  }}>
                    {urgent && <span style={{ position:'absolute', top:4, right:6, width:6, height:6, borderRadius:'50%', background:'#ff5252' }} />}
                    <span style={{ display:'flex', alignItems:'center', gap:'4px', fontWeight: isActive ? 700 : 500, fontSize:'0.78rem' }}>{icon}{label}</span>
                    <span style={{ fontSize:'0.65rem', color: isActive ? st.color : 'var(--text-muted)', fontWeight: 600 }}>{st.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {docTab === 'insurance' && (
                <>
                  <InfoRow label="บริษัทประกันภัย" value={vehicle.insurance_company} />
                  <InfoRow label="ระดับประกันภัย" value={vehicle.insurance_level ? `ชั้น ${vehicle.insurance_level}` : null} />
                  <InfoRow label="ค่าเบี้ยประกันภัย" value={vehicle.insurance_price ? `฿${Number(vehicle.insurance_price).toLocaleString('th-TH',{minimumFractionDigits:2})}` : null} highlight />
                  <InfoRow label="ต่อประกันล่าสุด" value={vehicle.insurance_renew_date ? formatThaiDate(vehicle.insurance_renew_date) : null} />
                  <InfoRow label="วันหมดอายุ" dateStr={vehicle.insurance_expire} expiry={getExpiryStatus(vehicle.insurance_expire)} />
                </>
              )}
              {docTab === 'tax' && (
                <>
                  <InfoRow label="ผู้ดำเนินการภาษี" value={vehicle.tax_provider} />
                  <InfoRow label="ค่าภาษีประจำปี" value={vehicle.tax_price ? `฿${Number(vehicle.tax_price).toLocaleString('th-TH',{minimumFractionDigits:2})}` : null} highlight />
                  <InfoRow label="ค่าตรวจสภาพ" value={vehicle.tax_inspection_fee ? `฿${Number(vehicle.tax_inspection_fee).toLocaleString('th-TH',{minimumFractionDigits:2})}` : null} />
                  <InfoRow label="ต่อภาษีล่าสุด" value={vehicle.tax_renew_date ? formatThaiDate(vehicle.tax_renew_date) : null} />
                  <InfoRow label="วันหมดอายุ" dateStr={vehicle.tax_expire} expiry={getExpiryStatus(vehicle.tax_expire)} />
                </>
              )}
              {docTab === 'act' && (
                <>
                  <InfoRow label="บริษัท / ผู้ให้บริการ พ.ร.บ." value={vehicle.act_provider} />
                  <InfoRow label="ราคา พ.ร.บ." value={vehicle.act_price ? `฿${Number(vehicle.act_price).toLocaleString('th-TH',{minimumFractionDigits:2})}` : null} highlight />
                  <InfoRow label="ต่อ พ.ร.บ. ล่าสุด" value={vehicle.act_renew_date ? formatThaiDate(vehicle.act_renew_date) : null} />
                  <InfoRow label="วันหมดอายุ" dateStr={vehicle.act_expire} expiry={getExpiryStatus(vehicle.act_expire)} />
                </>
              )}
            </div>

            <div style={{ padding: '0 18px 16px' }}>
              <NeonButton variant="accent" className="w-full" onClick={() => navigate(`/tickets/new?vehicleId=${vehicle.id}`)}>
                สร้างใบแจ้งซ่อมสำหรับคันนี้
              </NeonButton>
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="grid grid-2">
        {/* PM Preventive Maintenance schedule list */}
        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <IoSettingsOutline size={24} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>กำหนดการบำรุงรักษาเชิงป้องกัน (PM)</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {vehicle.maintenance_schedules?.length === 0 ? (
              <div className="text-center text-muted py-md">ไม่มีข้อมูลกำหนดการ PM</div>
            ) : (
              vehicle.maintenance_schedules?.map((sched) => (
                <div 
                  key={sched.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{sched.service_type}</span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      ครบกำหนด: {formatThaiDate(sched.next_due_date)} หรือ {sched.next_due_mileage ? `${sched.next_due_mileage.toLocaleString()} km` : 'ไม่ระบุไมล์'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Repair History list */}
        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <IoBuildOutline size={24} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>ประวัติการแจ้งซ่อมล่าสุด</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {vehicle.repair_history?.length === 0 ? (
              <div className="text-center text-muted py-md">ไม่มีประวัติการแจ้งซ่อม</div>
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
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent-dim)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-accent)' }}>{t.ticket_id}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({getSeverityLabel(t.severity)})</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                      {t.title}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <StatusBadge type="status" value={t.status} label={
                      t.status === 'reported' ? 'แจ้งเรื่อง' :
                      t.status === 'reviewing' ? 'กำลังตรวจสอบ' :
                      t.status === 'approved' ? 'อนุมัติแล้ว' :
                      t.status === 'repairing' ? 'กำลังซ่อม' :
                      t.status === 'completed' ? 'ซ่อมเสร็จ' : 'ปิดงาน'
                    } />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatThaiDate(t.created_at)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </GlassCard>
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
    <GlassCard style={{ padding: 0, overflow: 'hidden', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <img 
        src={imgSrc} 
        alt={`${brand} ${model} รูปที่ ${currentIndex + 1}`} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.3s ease' }} 
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
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s',
              zIndex: 5
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
          >
            <IoChevronBack size={18} />
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
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s',
              zIndex: 5
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
          >
            <IoChevronForward size={18} />
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
                  width: '8px',
                  height: '8px',
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

function InfoRow({ label, value, dateStr, expiry, highlight }) {
  if (value === undefined && dateStr === undefined) return null;
  
  if (expiry) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <span style={{ 
            fontSize: '0.78rem', 
            fontWeight: 700, 
            color: expiry.color, 
            background: expiry.bg, 
            padding: '1px 6px', 
            borderRadius: '4px',
            display: 'inline-block'
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ 
        fontSize: '0.85rem', 
        fontWeight: 600, 
        color: highlight ? 'var(--color-accent)' : 'var(--text-primary)' 
      }}>
        {value || '-'}
      </span>
    </div>
  );
}
