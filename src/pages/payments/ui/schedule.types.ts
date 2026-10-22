import type { useYearSchedule } from '../model/useYearSchedule.hook';

export type Schedule = ReturnType<typeof useYearSchedule>;

export type ScheduleProps = {
  schedule: Schedule;
};
