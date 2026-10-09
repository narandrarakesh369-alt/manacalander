import React, { useState, useEffect } from 'react';
import { Card, Button, EmptyState, Modal, Input } from '@mana/ui';
import { Plus, CalendarCheck, Clock, Bell, Trash2 } from 'lucide-react';
import { EventsService } from '@mana/services';
import type { UserEvent, EventCategory } from '@mana/types';

export const EventsScreen: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<UserEvent[]>([]);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2027-01-15');
  const [time, setTime] = useState('08:30');
  const [category, setCategory] = useState<EventCategory>('custom');
  const [reminder, setReminder] = useState(true);

  const loadEvents = () => {
    EventsService.getEventsForMonth(2027, 1).then(setEvents);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreateEvent = async () => {
    if (!title.trim()) return;

    await EventsService.createEvent({
      title: title.trim(),
      event_date: date,
      start_time: time,
      category,
      reminder_enabled: reminder,
    });

    setTitle('');
    setIsModalOpen(false);
    loadEvents();
  };

  const handleDeleteEvent = async (id: string) => {
    await EventsService.deleteEvent(id);
    loadEvents();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0F172A]">నా ఈవెంట్లు (My Events)</h2>
          <p className="text-xs text-[#64748B]">వ్యక్తిగత రిమైండర్లు & పూజలు</p>
        </div>
        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsModalOpen(true)}
        >
          ఈవెంట్ జోడించండి
        </Button>
      </div>

      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((ev) => (
            <Card key={ev.id} padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-[#0F172A]">{ev.title}</h4>
                    <span className="text-[10px] bg-slate-100 text-[#475569] px-2 py-0.2 rounded-full font-medium capitalize">
                      {ev.category || 'Event'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-[#1677F2]" />
                      {ev.event_date} {ev.start_time ? `at ${ev.start_time}` : ''}
                    </span>
                    {ev.reminder_enabled && (
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <Bell size={12} /> రిమైండర్ ఆన్‌లో ఉంది
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="p-1.5 text-[#94a3b8] hover:text-red-600 transition-colors"
                  title="Delete Event"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarCheck size={28} />}
          title="ఎటువంటి ఈవెంట్లు లేవు (No Events Yet)"
          description="మీ ముఖ్యమైన దినాలు, పూజా సమయాలు మరియు పుట్టినరోజులను ఇక్కడ భద్రపరుచుకోండి."
          action={
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              ఈవెంట్ సృష్టించండి
            </Button>
          }
        />
      )}

      {/* Add Event Modal Foundation */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="నూతన ఈవెంట్ (Add Personal Event)"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateEvent}>
              Save Event
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-left">
          <Input
            label="ఈవెంట్ పేరు (Event Title)"
            placeholder="ఉదా: పుట్టినరోజు లేదా పూజ"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1">
              రకం (Category)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-white focus:outline-none focus:border-[#1677F2]"
            >
              <option value="birthday">పుట్టినరోజు (Birthday)</option>
              <option value="anniversary">పెళ్లి రోజు (Anniversary)</option>
              <option value="appointment">అపాయింట్‌మెంట్ (Appointment)</option>
              <option value="reminder">రిమైండర్ (Reminder)</option>
              <option value="custom">ఇతర ఈవెంట్ (Custom Event)</option>
            </select>
          </div>
          <Input
            label="తేదీ (Date)"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="సమయం (Time)"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
