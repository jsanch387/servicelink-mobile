import { AppointmentNotesCard } from '../../create-appointment/components/AppointmentNotesCard';

/**
 * Visit-level notes only (multi-job edit). Vehicles live on each job.
 *
 * @param {{ notes: string; onChangeNotes: (notes: string) => void }} props
 */
export function EditAppointmentNotesStep({ notes, onChangeNotes }) {
  return <AppointmentNotesCard notes={notes} onChangeNotes={onChangeNotes} />;
}
