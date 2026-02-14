
-- Add days_of_week column: array of integers (1=Mon, 2=Tue, ... 7=Sun)
-- NULL means "every day"
ALTER TABLE public.transport_schedules 
ADD COLUMN days_of_week integer[] DEFAULT NULL;

COMMENT ON COLUMN public.transport_schedules.days_of_week IS 'Days when this schedule runs. 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun. NULL means every day.';
