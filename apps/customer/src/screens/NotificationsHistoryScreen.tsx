import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Modal } from '@mana/ui';
import {
  Bell,
  CheckCheck,
  Tag,
  Clock,
  Sparkles,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationService } from '@mana/services';
import type { Notification, NotificationPreference } from '@mana/types';

export const NotificationsHistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const customerId = 'default-customer';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState<boolean>(false);

  const loadData = () => {
    NotificationService.getNotifications(customerId).then(setNotifications);
    NotificationService.getNotificationPreferences(customerId).then(setPreferences);
  };

  useEffect(() => {
    // Populate sample notification if empty for rich initial experience
    NotificationService.getNotifications(customerId).then(async (list) => {
      if (list.length === 0) {
        // Create initial festival and promotional notification for demonstration
        await NotificationService.sendSystemNotification({
          recipientId: customerId,
          title: 'మకర సంక్రాంతి శుభాకాంక్షలు! (Makara Sankranti Greetings)',
          body: 'సంక్రాంతి పర్వదిన పూజా సమయాలు మరియు విశేషాలను మీ మన క్యాలెండర్‌లో చూడండి.',
          type: 'festival',
        });

        await NotificationService.createAndSendPromotionalCampaign({
          businessId: 'SLJ001',
          campaignId: 'DIWALI2027',
          title: 'సంక్రాంతి ప్రత్యేక బంగారు ఆభరణాల ఆఫర్ (Sri Lakshmi Jewellery)',
          body: 'అన్ని బంగారు మరియు వజ్రాభరణాలపై తయారీ కూలిలో 50% తగ్గింపు! ద్వారకా నగర్, వైజాగ్.',
          targetAudience: { all: true },
        });

        loadData();
      } else {
        setNotifications(list);
        NotificationService.getNotificationPreferences(customerId).then(setPreferences);
      }
    });
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    await NotificationService.markAsRead(notif.id);
    await NotificationService.recordDeliveryEvent(notif.id, 'opened', notif.campaign_id || undefined);

    // Deep Link Navigation: Check destination route
    if (notif.data && typeof notif.data === 'object' && 'route' in notif.data) {
      await NotificationService.recordDeliveryEvent(notif.id, 'clicked', notif.campaign_id || undefined);
      navigate(notif.data.route as string);
    } else if (notif.campaign_id) {
      navigate(`/campaigns/${notif.campaign_id}`);
    } else if (notif.type === 'festival' || notif.type === 'calendar') {
      navigate('/calendar');
    }
    loadData();
  };

  const handleMarkAllRead = async () => {
    await NotificationService.markAllAsRead(customerId);
    loadData();
  };

  const handleUpdatePref = async (key: keyof NotificationPreference, value: boolean) => {
    if (!preferences) return;
    const updated = await NotificationService.updateNotificationPreferences(customerId, {
      [key]: value,
    });
    setPreferences(updated);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">నోటిఫికేషన్లు (Notifications)</h2>
          <p className="text-xs text-[#64748B]">పండుగలు, రిమైండర్లు మరియు ప్రత్యేక ఆఫర్లు</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPrefsModalOpen(true)}
            className="p-1.5 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1677F2] transition-colors"
            title="Notification Settings"
          >
            <SlidersHorizontal size={16} />
          </button>
          {notifications.some((n) => !n.read_at && !n.is_read) && (
            <button
              onClick={handleMarkAllRead}
              className="p-1.5 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1677F2] transition-colors"
              title="Mark All As Read"
            >
              <CheckCheck size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-2.5">
          {notifications.map((notif) => {
            const isUnread = !notif.read_at && !notif.is_read;
            const isPromo = notif.type === 'promotional';

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                  isUnread
                    ? 'bg-blue-50/40 border-[#1677F2]/40 shadow-sm'
                    : 'bg-white border-[#E2E8F0] hover:border-[#cbd5e1]'
                }`}
              >
                {/* Unread blue dot */}
                {isUnread && (
                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-[#1677F2]" />
                )}

                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isPromo
                        ? 'bg-amber-100 text-amber-700'
                        : notif.type === 'festival'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isPromo ? (
                      <Tag size={16} />
                    ) : notif.type === 'festival' ? (
                      <Sparkles size={16} />
                    ) : (
                      <Bell size={16} />
                    )}
                  </div>

                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-[#0F172A] leading-snug">
                        {notif.title}
                      </h4>
                      <Badge
                        variant={isPromo ? 'warning' : notif.type === 'festival' ? 'primary' : 'neutral'}
                        size="sm"
                      >
                        {isPromo ? 'ఆఫర్' : notif.type === 'festival' ? 'పండుగ' : 'అలర్ట్'}
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs text-[#475569] leading-relaxed line-clamp-2">
                      {notif.body}
                    </p>

                    <div className="mt-2 pt-1.5 border-t border-[#E2E8F0]/60 flex items-center justify-between text-[10px] text-[#94a3b8]">
                      <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isPromo && notif.business_id && (
                        <span className="text-[#1677F2] font-semibold flex items-center gap-0.5">
                          ఆఫర్ చూడండి (View Deal) <ChevronRight size={11} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl text-center text-[#64748B]">
          <Bell size={32} className="mx-auto text-[#94a3b8] mb-2" />
          <h3 className="font-bold text-sm text-[#0F172A]">ఎటువంటి నోటిఫికేషన్లు లేవు</h3>
          <p className="text-xs text-[#94a3b8] mt-1">No notifications received yet.</p>
        </div>
      )}

      {/* Preferences Modal */}
      <Modal
        isOpen={isPrefsModalOpen}
        onClose={() => setIsPrefsModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-[#1677F2]" />
            <span>నోటిఫికేషన్ ప్రాధాన్యతలు (Preferences)</span>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-[#64748B]">
            మీకు కావలసిన నోటిఫికేషన్ల వర్గాలను ఇక్కడ ఆన్ లేదా ఆఫ్ చేసుకోవచ్చు:
          </p>

          {preferences && (
            <div className="space-y-2 pt-2">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-[#0F172A] block">పండుగలు & శుభదినాలు (Festivals)</span>
                  <span className="text-[11px] text-[#64748B]">సంక్రాంతి, ఉగాది, దీపావళి మొదలైనవి</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enable_festivals}
                  onChange={(e) => handleUpdatePref('enable_festivals', e.target.checked)}
                  className="w-4 h-4 text-[#1677F2] rounded focus:ring-[#1677F2]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-[#0F172A] block">క్యాలెండర్ & పంచాంగం (Calendar Updates)</span>
                  <span className="text-[11px] text-[#64748B]">ఏకాదశి, పౌర్ణమి, అమావాస్య అలర్ట్‌లు</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enable_calendar ?? true}
                  onChange={(e) => handleUpdatePref('enable_calendar', e.target.checked)}
                  className="w-4 h-4 text-[#1677F2] rounded focus:ring-[#1677F2]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-[#0F172A] block">వ్యక్తిగత రిమైండర్లు (Personal Reminders)</span>
                  <span className="text-[11px] text-[#64748B]">పుట్టినరోజులు, వార్షికోత్సవాలు, పూజలు</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enable_reminders}
                  onChange={(e) => handleUpdatePref('enable_reminders', e.target.checked)}
                  className="w-4 h-4 text-[#1677F2] rounded focus:ring-[#1677F2]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-[#0F172A] block">వ్యాపార భాగస్వామ్య ఆఫర్లు (Promotions)</span>
                  <span className="text-[11px] text-[#64748B]">స్థానిక వ్యాపారాల పండుగ ప్రత్యేక డిస్కౌంట్లు</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enable_promotions}
                  onChange={(e) => handleUpdatePref('enable_promotions', e.target.checked)}
                  className="w-4 h-4 text-[#1677F2] rounded focus:ring-[#1677F2]"
                />
              </label>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
