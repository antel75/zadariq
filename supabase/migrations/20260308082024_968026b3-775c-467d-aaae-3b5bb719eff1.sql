UPDATE transport_schedules 
SET days_of_week = ARRAY[1,2,3,4,5,6], updated_at = now()
WHERE line_name = 'Linija 431' 
  AND departure_time IN ('08:30', '10:30', '12:15')
  AND type = 'ferry';