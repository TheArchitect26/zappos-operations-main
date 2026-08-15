-- Restore the governed global fitment checklist if staging/test cleanup removed it.

WITH existing AS (
  SELECT id FROM public.fitment_checklist_templates
  WHERE company_id IS NULL AND name='Zapp Box / P1 standard fitment checklist' AND version=1
  LIMIT 1
), inserted AS (
  INSERT INTO public.fitment_checklist_templates(company_id,name,version,status)
  SELECT NULL,'Zapp Box / P1 standard fitment checklist',1,'active'
  WHERE NOT EXISTS(SELECT 1 FROM existing)
  RETURNING id
), template AS (
  SELECT id FROM existing UNION ALL SELECT id FROM inserted
)
INSERT INTO public.fitment_checklist_template_steps(template_id,step_number,title,instructions,mandatory,critical)
SELECT template.id,step_number,title,instructions,true,critical
FROM template CROSS JOIN (VALUES
  (1,'Confirm assigned vehicle and fitment reference','Verify vehicle registration/VIN and fitment job reference before work starts.',false),
  (2,'Confirm device serial/IMEI and company ownership','Match device serial and IMEI against the company device registry.',true),
  (3,'Confirm SIM/ICCID assignment','Confirm SIM ICCID and APN metadata match the fitment job.',true),
  (4,'Inspect device and wiring harness condition','Inspect enclosure, loom, connector pins, fuse holder, and tamper materials.',false),
  (5,'Isolate vehicle power safely','Follow workshop safety procedure before permanent power wiring.',true),
  (6,'Confirm mounting position','Confirm stable mounting position that does not obstruct controls or airbags.',false),
  (7,'Connect permanent power','Connect protected permanent power and record manual voltage evidence.',true),
  (8,'Connect ignition sense','Connect ignition sense and record off/on transition result.',true),
  (9,'Connect ground','Confirm ground continuity and secure termination.',true),
  (10,'Install GNSS/GSM antennas','Confirm placement, cable path, and strain relief.',true),
  (11,'Connect CAN/J1939 interface where applicable','Validate harness and mark not applicable only with reason.',false),
  (12,'Secure wiring and tamper protection','Secure loom, cable ties, tamper labels, and fuse accessibility.',false),
  (13,'Perform static electrical/connectivity tests','Record power, ignition, GNSS/GSM and connectivity test results.',true),
  (14,'Perform road test and submit evidence','Complete manual field road test or record why it is blocked.',true)
) AS steps(step_number,title,instructions,critical)
ON CONFLICT(template_id,step_number) DO UPDATE SET title=excluded.title,instructions=excluded.instructions,critical=excluded.critical;

