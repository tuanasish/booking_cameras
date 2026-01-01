'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import { formatMoney } from '@/lib/utils/format';
import clsx from 'clsx';

interface Settings {
  id: string;
  delivery_fee_per_km: number;
  default_deposit: number;
  late_fee_divisor: number;
}

interface Camera {
  id: string;
  name: string;
  model_line: string | null;
  price_6h: number;
  price_24h: number | null;
  price_additional_day: number | null;
  quantity: number;
  is_active: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'cameras'>('settings');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [cameraForm, setCameraForm] = useState({
    name: '',
    model_line: '',
    price_6h: '',
    price_24h: '',
    price_additional_day: '',
    quantity: '1',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, camerasRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/cameras?all=true'),
      ]);

      const settingsData = await settingsRes.json();
      const camerasData = await camerasRes.json();

      if (settingsData.data && settingsData.data.length > 0) {
        setSettings(settingsData.data[0]);
      }
      setCameras(camerasData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: settings.id,
          delivery_fee_per_km: settings.delivery_fee_per_km,
          default_deposit: settings.default_deposit,
          late_fee_divisor: settings.late_fee_divisor,
        }),
      });

      if (response.ok) {
        alert('Đã lưu cấu hình thành công');
      } else {
        alert('Lỗi khi lưu cấu hình');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCameraModal = (camera?: Camera) => {
    if (camera) {
      setEditingCamera(camera);
      setCameraForm({
        name: camera.name,
        model_line: camera.model_line || '',
        price_6h: camera.price_6h.toString(),
        price_24h: camera.price_24h?.toString() || '',
        price_additional_day: camera.price_additional_day?.toString() || '',
        quantity: camera.quantity.toString(),
      });
    } else {
      setEditingCamera(null);
      setCameraForm({
        name: '',
        model_line: '',
        price_6h: '',
        price_24h: '',
        price_additional_day: '',
        quantity: '1',
      });
    }
    setShowCameraModal(true);
  };

  const handleSaveCamera = async () => {
    if (!cameraForm.name || !cameraForm.price_6h) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: cameraForm.name,
        model_line: cameraForm.model_line || null,
        price_6h: parseInt(cameraForm.price_6h),
        price_24h: cameraForm.price_24h ? parseInt(cameraForm.price_24h) : null,
        price_additional_day: cameraForm.price_additional_day
          ? parseInt(cameraForm.price_additional_day)
          : null,
        quantity: parseInt(cameraForm.quantity),
        is_active: true,
      };

      const url = editingCamera
        ? `/api/cameras/${editingCamera.id}`
        : '/api/cameras';
      const method = editingCamera ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowCameraModal(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Lỗi khi lưu máy ảnh');
      }
    } catch (error) {
      console.error('Error saving camera:', error);
      alert('Lỗi khi lưu máy ảnh');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCamera = async (cameraId: string, cameraName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa máy "${cameraName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/cameras/${cameraId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      } else {
        alert('Lỗi khi xóa máy ảnh');
      }
    } catch (error) {
      console.error('Error deleting camera:', error);
      alert('Lỗi khi xóa máy ảnh');
    }
  };

  const handleToggleCameraActive = async (cameraId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/cameras/${cameraId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error toggling camera status:', error);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#111318]">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-border-dark bg-[#111318] px-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Cài đặt hệ thống</h1>
          <p className="text-sm text-[#9da6b9] mt-1">Quản lý giá, quy tắc thuê và kho thiết bị</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border-dark">
            <button
              onClick={() => setActiveTab('settings')}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2',
                activeTab === 'settings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-[#9da6b9] hover:text-white'
              )}
            >
              Cấu hình hệ thống
            </button>
            <button
              onClick={() => setActiveTab('cameras')}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2',
                activeTab === 'cameras'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-[#9da6b9] hover:text-white'
              )}
            >
              Quản lý máy ảnh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Settings Tab */}
              {activeTab === 'settings' && settings && (
                <div className="bg-[#1a1f29] rounded-xl border border-border-dark p-6">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border-dark">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">payments</span>
                    </div>
                    <h2 className="text-lg font-bold text-white">Giá & Quy tắc</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#9da6b9]">Phí giao máy (VNĐ/km)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={settings.delivery_fee_per_km}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              delivery_fee_per_km: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-[#111318] border border-border-dark rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                        <span className="absolute right-4 top-3 text-[#9da6b9] text-sm">đ</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#9da6b9]">Cọc mặc định (VNĐ)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={settings.default_deposit}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              default_deposit: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-[#111318] border border-border-dark rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                        <span className="absolute right-4 top-3 text-[#9da6b9] text-sm">đ</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[#9da6b9]">Hệ số phí trả trễ</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={settings.late_fee_divisor}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              late_fee_divisor: parseInt(e.target.value) || 5,
                            })
                          }
                          className="w-full bg-[#111318] border border-border-dark rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                        <span className="absolute right-4 top-3 text-[#9da6b9] text-sm">
                          (Giá 6h ÷ {settings.late_fee_divisor})
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className={clsx(
                      'px-6 py-2 rounded-lg font-bold text-white transition-colors',
                      saving
                        ? 'bg-slate-600 cursor-not-allowed'
                        : 'bg-primary hover:bg-blue-600'
                    )}
                  >
                    {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                  </button>
                </div>
              )}

              {/* Cameras Tab */}
              {activeTab === 'cameras' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Danh sách máy ảnh</h2>
                    <button
                      onClick={() => handleOpenCameraModal()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">add</span>
                      Thêm máy mới
                    </button>
                  </div>

                  <div className="bg-[#1a1f29] rounded-xl border border-border-dark overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#111318] border-b border-border-dark">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#9da6b9] uppercase">
                              Tên máy
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#9da6b9] uppercase">
                              Dòng máy
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-[#9da6b9] uppercase">
                              Giá 6h
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-[#9da6b9] uppercase">
                              Giá 12h
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-[#9da6b9] uppercase">
                              Giá 24h
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-[#9da6b9] uppercase">
                              SL
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-[#9da6b9] uppercase">
                              Trạng thái
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-[#9da6b9] uppercase">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark">
                          {cameras.map((camera) => (
                            <tr
                              key={camera.id}
                              className={clsx(
                                'hover:bg-[#111318] transition-colors',
                                !camera.is_active && 'opacity-50'
                              )}
                            >
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-white">{camera.name}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-[#9da6b9]">{camera.model_line || '-'}</p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <p className="text-sm text-white">{formatMoney(camera.price_6h)}đ</p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <p className="text-sm text-white">
                                  {camera.price_24h ? formatMoney(camera.price_24h) + 'đ' : '-'}
                                </p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <p className="text-sm text-white">
                                  {camera.price_additional_day
                                    ? formatMoney(camera.price_additional_day) + 'đ'
                                    : '-'}
                                </p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <p className="text-sm text-white">{camera.quantity}</p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={camera.is_active}
                                      onChange={() =>
                                        handleToggleCameraActive(camera.id, camera.is_active)
                                      }
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-[#282e39] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                  </label>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenCameraModal(camera)}
                                    className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                                    title="Sửa"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCamera(camera.id, camera.name)}
                                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Xóa"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowCameraModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111318] rounded-xl border border-border-dark shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-border-dark sticky top-0 bg-[#111318]">
                <h2 className="text-xl font-bold text-white">
                  {editingCamera ? 'Sửa máy ảnh' : 'Thêm máy ảnh mới'}
                </h2>
                <button
                  onClick={() => setShowCameraModal(false)}
                  className="p-2 hover:bg-[#282e39] rounded text-[#9da6b9] hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Tên máy *"
                    icon="photo_camera"
                    value={cameraForm.name}
                    onChange={(e) => setCameraForm({ ...cameraForm, name: e.target.value })}
                    placeholder="VD: Canon M10"
                  />

                  <Input
                    label="Dòng máy"
                    icon="category"
                    value={cameraForm.model_line}
                    onChange={(e) => setCameraForm({ ...cameraForm, model_line: e.target.value })}
                    placeholder="VD: Canon M"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#9da6b9] mb-2 block">
                      Giá 6h (VNĐ) *
                    </label>
                    <input
                      type="number"
                      value={cameraForm.price_6h}
                      onChange={(e) => setCameraForm({ ...cameraForm, price_6h: e.target.value })}
                      className="w-full bg-input-dark border border-border-dark rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="500000"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#9da6b9] mb-2 block">Giá 24h (VNĐ)</label>
                    <input
                      type="number"
                      value={cameraForm.price_24h}
                      onChange={(e) => setCameraForm({ ...cameraForm, price_24h: e.target.value })}
                      className="w-full bg-input-dark border border-border-dark rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="800000"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#9da6b9] mb-2 block">Giá +ngày (VNĐ)</label>
                    <input
                      type="number"
                      value={cameraForm.price_additional_day}
                      onChange={(e) =>
                        setCameraForm({ ...cameraForm, price_additional_day: e.target.value })
                      }
                      className="w-full bg-input-dark border border-border-dark rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="150000"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#9da6b9] mb-2 block">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={cameraForm.quantity}
                    onChange={(e) => setCameraForm({ ...cameraForm, quantity: e.target.value })}
                    className="w-full bg-input-dark border border-border-dark rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-border-dark">
                <button
                  onClick={() => setShowCameraModal(false)}
                  className="px-4 py-2 rounded-lg border border-border-dark bg-[#1a1f29] text-white hover:bg-[#282e39] transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveCamera}
                  disabled={saving}
                  className={clsx(
                    'px-6 py-2 rounded-lg font-bold text-white transition-colors',
                    saving
                      ? 'bg-slate-600 cursor-not-allowed'
                      : 'bg-primary hover:bg-blue-600'
                  )}
                >
                  {saving ? 'Đang lưu...' : editingCamera ? 'Cập nhật' : 'Thêm máy'}
                </button>
              </div>
      </div>
          </div>
        </>
      )}
    </div>
  );
}
