-- =========================================================================
-- ZappOS - Phase 16 Warehouse Management, Inventory & Distribution.
-- All operational records are tenant scoped. Stock state changes are only
-- performed through deterministic security-definer functions below.
-- =========================================================================

CREATE TYPE public.warehouse_inventory_status AS ENUM (
  'received', 'quality_inspection', 'available', 'reserved', 'allocated',
  'picked', 'packed', 'loaded', 'in_transit', 'delivered', 'returned',
  'damaged', 'disposed', 'archived'
);

CREATE TYPE public.warehouse_task_type AS ENUM (
  'receiving', 'putaway', 'picking', 'packing', 'loading', 'cycle_count',
  'transfer', 'inspection', 'cleanup', 'maintenance'
);

CREATE TYPE public.warehouse_task_status AS ENUM (
  'open', 'assigned', 'in_progress', 'blocked', 'completed', 'cancelled'
);

CREATE OR REPLACE FUNCTION public.warehouse_can_read(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_any_role(
    _company_id,
    ARRAY[
      'admin','warehouse_manager','warehouse_supervisor','warehouse_operator',
      'inventory_controller','forklift_operator','receiving_clerk','packing_clerk',
      'quality_inspector','dispatcher','viewer'
    ]::public.app_role[]
  );
$$;

CREATE OR REPLACE FUNCTION public.warehouse_can_operate(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_any_role(
    _company_id,
    ARRAY[
      'admin','warehouse_manager','warehouse_supervisor','warehouse_operator',
      'inventory_controller','forklift_operator','receiving_clerk','packing_clerk',
      'quality_inspector'
    ]::public.app_role[]
  );
$$;

CREATE OR REPLACE FUNCTION public.warehouse_can_manage(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_any_role(
    _company_id,
    ARRAY['admin','warehouse_manager','warehouse_supervisor','inventory_controller']::public.app_role[]
  );
$$;

CREATE OR REPLACE FUNCTION public.warehouse_can_view_finance(_company_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_any_role(
    _company_id,
    ARRAY['admin','warehouse_manager','inventory_controller']::public.app_role[]
  );
$$;

-- ---------- Warehouse structure ----------------------------------------
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  timezone TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','maintenance')),
  max_weight_kg NUMERIC(14,3),
  max_volume_m3 NUMERIC(14,3),
  is_temperature_controlled BOOLEAN NOT NULL DEFAULT false,
  temperature_min_c NUMERIC(6,2),
  temperature_max_c NUMERIC(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE public.warehouse_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL DEFAULT 'storage' CHECK (zone_type IN (
    'storage','temperature_controlled','hazardous','overflow','staging','cross_dock','loading','quality'
  )),
  temperature_min_c NUMERIC(6,2),
  temperature_max_c NUMERIC(6,2),
  accepts_hazardous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(warehouse_id, code)
);

CREATE TABLE public.warehouse_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES public.warehouse_zones(id) ON DELETE SET NULL,
  aisle TEXT,
  row_code TEXT,
  shelf_code TEXT,
  bin_code TEXT,
  location_code TEXT NOT NULL,
  location_type TEXT NOT NULL DEFAULT 'bin' CHECK (location_type IN (
    'bin','shelf','staging','loading_bay','dock_door','overflow','quality','cross_dock'
  )),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','blocked','maintenance','full')),
  distance_rank INTEGER NOT NULL DEFAULT 100 CHECK (distance_rank >= 0),
  max_weight_kg NUMERIC(14,3),
  max_volume_m3 NUMERIC(14,3),
  current_weight_kg NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (current_weight_kg >= 0),
  current_volume_m3 NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (current_volume_m3 >= 0),
  accepts_hazardous BOOLEAN NOT NULL DEFAULT false,
  temperature_min_c NUMERIC(6,2),
  temperature_max_c NUMERIC(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(warehouse_id, location_code)
);

CREATE TABLE public.warehouse_docks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','maintenance','blocked')),
  max_vehicle_length_m NUMERIC(8,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(warehouse_id, code)
);

-- ---------- Product, identity and stock --------------------------------
CREATE TABLE public.inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

CREATE TABLE public.inventory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit_of_measure TEXT NOT NULL DEFAULT 'each',
  barcode TEXT NOT NULL,
  qr_payload TEXT NOT NULL,
  rfid_identifier TEXT,
  length_cm NUMERIC(10,2),
  width_cm NUMERIC(10,2),
  height_cm NUMERIC(10,2),
  weight_kg NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (weight_kg >= 0),
  is_dangerous_goods BOOLEAN NOT NULL DEFAULT false,
  hazard_class TEXT,
  temperature_min_c NUMERIC(6,2),
  temperature_max_c NUMERIC(6,2),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, sku),
  UNIQUE(company_id, barcode),
  UNIQUE(company_id, qr_payload)
);

-- Cost is deliberately separated so warehouse operators cannot read finance.
CREATE TABLE public.inventory_product_costs (
  product_id UUID PRIMARY KEY REFERENCES public.inventory_products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  unit_cost NUMERIC(14,4) NOT NULL CHECK (unit_cost >= 0),
  currency_code TEXT NOT NULL DEFAULT 'ZAR',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.inventory_products(id) ON DELETE RESTRICT,
  serial_number TEXT,
  batch_number TEXT,
  lot_number TEXT,
  expiry_date DATE,
  status public.warehouse_inventory_status NOT NULL DEFAULT 'received',
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity >= 0),
  reserved_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0 AND reserved_quantity <= quantity),
  allocated_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0 AND allocated_quantity <= quantity),
  source_receiving_line_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX warehouse_stock_identity_idx ON public.warehouse_stock(
  company_id, warehouse_id, product_id, COALESCE(location_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(serial_number,''), COALESCE(batch_number,''), COALESCE(lot_number,''), status
);

-- ---------- Receiving, orders, packing and loading --------------------
CREATE TABLE public.warehouse_inbound_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  purchase_order_reference TEXT,
  supplier_name TEXT,
  expected_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'expected' CHECK (status IN ('expected','arrived','unloading','inspecting','accepted','rejected','putaway_complete','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_receiving_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  inbound_shipment_id UUID NOT NULL REFERENCES public.warehouse_inbound_shipments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.inventory_products(id) ON DELETE RESTRICT,
  expected_quantity NUMERIC(14,3) NOT NULL CHECK (expected_quantity >= 0),
  received_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  accepted_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (accepted_quantity >= 0),
  rejected_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),
  serial_number TEXT,
  batch_number TEXT,
  lot_number TEXT,
  expiry_date DATE,
  damage_notes TEXT,
  photo_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  inspection_status TEXT NOT NULL DEFAULT 'pending' CHECK (inspection_status IN ('pending','accepted','rejected','partial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.warehouse_stock
  ADD CONSTRAINT warehouse_stock_receiving_line_fkey
  FOREIGN KEY (source_receiving_line_id) REFERENCES public.warehouse_receiving_lines(id) ON DELETE SET NULL;

CREATE TABLE public.warehouse_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  order_reference TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  status TEXT NOT NULL DEFAULT 'awaiting_picking' CHECK (status IN ('draft','awaiting_picking','picking','awaiting_packing','packing','ready_for_dispatch','loaded','dispatched','cancelled')),
  requested_dispatch_at TIMESTAMPTZ,
  customer_visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, order_reference)
);

CREATE TABLE public.warehouse_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_order_id UUID NOT NULL REFERENCES public.warehouse_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.inventory_products(id) ON DELETE RESTRICT,
  requested_quantity NUMERIC(14,3) NOT NULL CHECK (requested_quantity > 0),
  allocated_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (allocated_quantity >= 0),
  picked_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (picked_quantity >= 0),
  packed_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (packed_quantity >= 0),
  replacement_product_id UUID REFERENCES public.inventory_products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_order_id UUID NOT NULL REFERENCES public.warehouse_orders(id) ON DELETE CASCADE,
  package_reference TEXT NOT NULL,
  barcode TEXT NOT NULL,
  qr_payload TEXT NOT NULL,
  length_cm NUMERIC(10,2),
  width_cm NUMERIC(10,2),
  height_cm NUMERIC(10,2),
  expected_weight_kg NUMERIC(12,3),
  verified_weight_kg NUMERIC(12,3),
  evidence_metadata JSONB NOT NULL DEFAULT '[]'::jsonb,
  packed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  packed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, package_reference),
  UNIQUE(company_id, barcode),
  UNIQUE(company_id, qr_payload)
);

CREATE TABLE public.warehouse_dock_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  dock_id UUID NOT NULL REFERENCES public.warehouse_docks(id) ON DELETE RESTRICT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  trailer_reference TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound','cross_dock')),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL CHECK (scheduled_end > scheduled_start),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','arrived','loading','complete','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dock_id, scheduled_start)
);

CREATE TABLE public.warehouse_loading_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_order_id UUID NOT NULL REFERENCES public.warehouse_orders(id) ON DELETE CASCADE,
  dock_schedule_id UUID REFERENCES public.warehouse_dock_schedules(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  trailer_reference TEXT,
  seal_number TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','loading','verified','complete','cancelled')),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  loaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_cross_dock_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  inbound_shipment_id UUID NOT NULL REFERENCES public.warehouse_inbound_shipments(id) ON DELETE CASCADE,
  warehouse_order_id UUID NOT NULL REFERENCES public.warehouse_orders(id) ON DELETE CASCADE,
  staging_location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  inbound_dock_schedule_id UUID REFERENCES public.warehouse_dock_schedules(id) ON DELETE SET NULL,
  outbound_dock_schedule_id UUID REFERENCES public.warehouse_dock_schedules(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','staged','transferred','loaded','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Transfer, counting, workforce and alerts ------------------
CREATE TABLE public.warehouse_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.warehouse_stock(id) ON DELETE RESTRICT,
  from_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  to_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  from_location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  to_location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  transfer_type TEXT NOT NULL CHECK (transfer_type IN ('warehouse','bin','zone','emergency','cross_dock')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','in_transit','received','cancelled')),
  reason TEXT,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_cycle_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  count_type TEXT NOT NULL CHECK (count_type IN ('scheduled','random','spot')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','submitted','approved','rejected')),
  scheduled_for TIMESTAMPTZ,
  counted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_cycle_count_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cycle_count_id UUID NOT NULL REFERENCES public.warehouse_cycle_counts(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.warehouse_stock(id) ON DELETE RESTRICT,
  expected_quantity NUMERIC(14,3) NOT NULL CHECK (expected_quantity >= 0),
  counted_quantity NUMERIC(14,3),
  variance_quantity NUMERIC(14,3),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cycle_count_id, stock_id)
);

CREATE TABLE public.warehouse_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  task_type public.warehouse_task_type NOT NULL,
  status public.warehouse_task_status NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  title TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  employee_role public.app_role NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id, employee_role)
);

CREATE TABLE public.warehouse_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('forklift','pallet_jack','reach_truck','scanner','tablet','dock_equipment')),
  asset_tag TEXT NOT NULL,
  maintenance_status TEXT NOT NULL DEFAULT 'available' CHECK (maintenance_status IN ('available','assigned','maintenance','out_of_service')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  next_maintenance_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, asset_tag)
);

CREATE TABLE public.warehouse_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock','stock_expiry','damaged_inventory','receiving_delay','dock_congestion','equipment_failure','capacity_limit','temperature')),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
  source_type TEXT,
  source_id UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  title TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.warehouse_scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('barcode','qr','rfid','manual')),
  stock_id UUID REFERENCES public.warehouse_stock(id) ON DELETE SET NULL,
  scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.warehouse_stock(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL,
  from_status public.warehouse_inventory_status,
  to_status public.warehouse_inventory_status,
  from_location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  to_location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity >= 0),
  reference_type TEXT,
  reference_id UUID,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.warehouse_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Indexes -----------------------------------------------------
CREATE INDEX warehouse_stock_company_status_idx ON public.warehouse_stock(company_id, warehouse_id, status);
CREATE INDEX warehouse_stock_product_expiry_idx ON public.warehouse_stock(company_id, product_id, expiry_date);
CREATE INDEX warehouse_tasks_queue_idx ON public.warehouse_tasks(company_id, warehouse_id, status, priority, due_at);
CREATE INDEX warehouse_alerts_open_idx ON public.warehouse_alerts(company_id, status, severity, created_at DESC);
CREATE INDEX warehouse_movements_stock_idx ON public.warehouse_inventory_movements(stock_id, created_at DESC);
CREATE INDEX warehouse_audit_company_idx ON public.warehouse_audit_logs(company_id, created_at DESC);
CREATE INDEX warehouse_docks_schedule_idx ON public.warehouse_dock_schedules(company_id, warehouse_id, scheduled_start);

-- ---------- Updated timestamps -----------------------------------------
DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'warehouses','warehouse_zones','warehouse_locations','warehouse_docks',
    'inventory_categories','inventory_products','inventory_product_costs','warehouse_stock',
    'warehouse_inbound_shipments','warehouse_receiving_lines','warehouse_orders',
    'warehouse_order_lines','warehouse_dock_schedules','warehouse_loading_jobs',
    'warehouse_cross_dock_jobs','warehouse_transfers','warehouse_cycle_counts',
    'warehouse_cycle_count_lines','warehouse_tasks','warehouse_employees','warehouse_equipment'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated ON public.%I', table_name, table_name);
    EXECUTE format('CREATE TRIGGER %I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', table_name, table_name);
  END LOOP;
END $$;

-- ---------- Row-level security -----------------------------------------
DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'warehouses','warehouse_zones','warehouse_locations','warehouse_docks',
    'inventory_categories','inventory_products','warehouse_inbound_shipments',
    'warehouse_receiving_lines','warehouse_orders','warehouse_order_lines',
    'warehouse_packages','warehouse_dock_schedules','warehouse_loading_jobs',
    'warehouse_cross_dock_jobs','warehouse_transfers','warehouse_cycle_counts',
    'warehouse_cycle_count_lines','warehouse_tasks','warehouse_employees',
    'warehouse_equipment','warehouse_alerts','warehouse_scan_history'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.warehouse_can_read(company_id))', table_name || '_warehouse_read', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.warehouse_can_operate(company_id))', table_name || '_warehouse_insert', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.warehouse_can_operate(company_id)) WITH CHECK (public.warehouse_can_operate(company_id))', table_name || '_warehouse_update', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.warehouse_can_manage(company_id))', table_name || '_warehouse_delete', table_name);
  END LOOP;
END $$;

ALTER TABLE public.inventory_product_costs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_product_costs TO authenticated;
GRANT ALL ON public.inventory_product_costs TO service_role;
CREATE POLICY inventory_product_costs_finance_read ON public.inventory_product_costs FOR SELECT TO authenticated
  USING (public.warehouse_can_view_finance(company_id));
CREATE POLICY inventory_product_costs_finance_write ON public.inventory_product_costs FOR ALL TO authenticated
  USING (public.warehouse_can_view_finance(company_id))
  WITH CHECK (public.warehouse_can_view_finance(company_id));

ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_audit_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.warehouse_stock, public.warehouse_inventory_movements, public.warehouse_audit_logs TO authenticated;
GRANT ALL ON public.warehouse_stock, public.warehouse_inventory_movements, public.warehouse_audit_logs TO service_role;
CREATE POLICY warehouse_stock_read ON public.warehouse_stock FOR SELECT TO authenticated
  USING (public.warehouse_can_read(company_id));
CREATE POLICY warehouse_inventory_movements_read ON public.warehouse_inventory_movements FOR SELECT TO authenticated
  USING (public.warehouse_can_read(company_id));
CREATE POLICY warehouse_audit_logs_read ON public.warehouse_audit_logs FOR SELECT TO authenticated
  USING (public.warehouse_can_manage(company_id));

-- ---------- Immutable audit helper -------------------------------------
CREATE OR REPLACE FUNCTION public.log_warehouse_audit(
  _company_id UUID,
  _warehouse_id UUID,
  _entity_type TEXT,
  _entity_id UUID,
  _event_type TEXT,
  _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO public.warehouse_audit_logs(company_id, warehouse_id, entity_type, entity_id, event_type, actor_id, metadata)
  VALUES (_company_id, _warehouse_id, _entity_type, _entity_id, _event_type, auth.uid(), COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- ---------- Deterministic stock lifecycle ------------------------------
CREATE OR REPLACE FUNCTION public.warehouse_transition_stock(
  _stock_id UUID,
  _to_status public.warehouse_inventory_status,
  _quantity NUMERIC,
  _movement_type TEXT,
  _to_location_id UUID DEFAULT NULL,
  _reference_type TEXT DEFAULT NULL,
  _reference_id UUID DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS public.warehouse_stock
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _stock public.warehouse_stock;
  _allowed BOOLEAN := false;
  _next public.warehouse_stock;
BEGIN
  SELECT * INTO _stock FROM public.warehouse_stock WHERE id = _stock_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock record not found'; END IF;
  IF NOT public.warehouse_can_operate(_stock.company_id) THEN RAISE EXCEPTION 'Warehouse operation role required'; END IF;
  IF _quantity <= 0 OR _quantity > _stock.quantity THEN RAISE EXCEPTION 'Quantity must be greater than zero and within available stock'; END IF;

  _allowed := CASE _stock.status::text
    WHEN 'received' THEN _to_status::text IN ('quality_inspection','available','damaged','returned')
    WHEN 'quality_inspection' THEN _to_status::text IN ('available','damaged','disposed','returned')
    WHEN 'available' THEN _to_status::text IN ('reserved','allocated','damaged','disposed','archived')
    WHEN 'reserved' THEN _to_status::text IN ('available','allocated','picked')
    WHEN 'allocated' THEN _to_status::text IN ('available','picked')
    WHEN 'picked' THEN _to_status::text IN ('packed','available','damaged')
    WHEN 'packed' THEN _to_status::text IN ('loaded','picked','damaged')
    WHEN 'loaded' THEN _to_status::text IN ('in_transit','packed')
    WHEN 'in_transit' THEN _to_status::text IN ('delivered','returned','damaged')
    WHEN 'delivered' THEN _to_status::text IN ('returned','archived')
    WHEN 'returned' THEN _to_status::text IN ('quality_inspection','available','disposed')
    WHEN 'damaged' THEN _to_status::text IN ('quality_inspection','disposed','archived')
    WHEN 'disposed' THEN _to_status::text IN ('archived')
    ELSE false
  END;
  IF NOT _allowed THEN
    RAISE EXCEPTION 'Illegal inventory transition from % to %', _stock.status, _to_status;
  END IF;

  IF _to_location_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.warehouse_locations l
    WHERE l.id = _to_location_id AND l.company_id = _stock.company_id AND l.warehouse_id = _stock.warehouse_id
  ) THEN RAISE EXCEPTION 'Destination location is not in the stock warehouse'; END IF;

  IF _quantity < _stock.quantity THEN
    UPDATE public.warehouse_stock
    SET quantity = quantity - _quantity, updated_at = now()
    WHERE id = _stock_id;

    INSERT INTO public.warehouse_stock(
      company_id, warehouse_id, product_id, location_id, serial_number, batch_number,
      lot_number, expiry_date, status, quantity, source_receiving_line_id
    ) VALUES (
      _stock.company_id, _stock.warehouse_id, _stock.product_id,
      COALESCE(_to_location_id, _stock.location_id), _stock.serial_number, _stock.batch_number,
      _stock.lot_number, _stock.expiry_date, _to_status, _quantity, _stock.source_receiving_line_id
    ) RETURNING * INTO _next;
  ELSE
    UPDATE public.warehouse_stock
    SET status = _to_status, location_id = COALESCE(_to_location_id, location_id), updated_at = now()
    WHERE id = _stock_id
    RETURNING * INTO _next;
  END IF;

  INSERT INTO public.warehouse_inventory_movements(
    company_id, stock_id, movement_type, from_status, to_status, from_location_id,
    to_location_id, quantity, reference_type, reference_id, performed_by, metadata
  ) VALUES (
    _stock.company_id, _next.id, _movement_type, _stock.status, _to_status, _stock.location_id,
    COALESCE(_to_location_id, _stock.location_id), _quantity, _reference_type, _reference_id, auth.uid(), COALESCE(_metadata, '{}'::jsonb)
  );
  PERFORM public.log_warehouse_audit(
    _stock.company_id, _stock.warehouse_id, 'stock', _next.id, 'inventory_transition',
    jsonb_build_object('from_status', _stock.status, 'to_status', _to_status, 'quantity', _quantity, 'movement_type', _movement_type, 'source_stock_id', _stock.id)
  );
  RETURN _next;
END;
$$;

CREATE OR REPLACE FUNCTION public.warehouse_receive_stock(
  _receiving_line_id UUID,
  _accepted_quantity NUMERIC,
  _rejected_quantity NUMERIC DEFAULT 0,
  _damage_notes TEXT DEFAULT NULL,
  _photo_evidence JSONB DEFAULT '[]'::jsonb
) RETURNS public.warehouse_stock
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _line public.warehouse_receiving_lines;
  _shipment public.warehouse_inbound_shipments;
  _stock public.warehouse_stock;
BEGIN
  SELECT * INTO _line FROM public.warehouse_receiving_lines WHERE id = _receiving_line_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Receiving line not found'; END IF;
  SELECT * INTO _shipment FROM public.warehouse_inbound_shipments WHERE id = _line.inbound_shipment_id;
  IF NOT public.warehouse_can_operate(_line.company_id) THEN RAISE EXCEPTION 'Warehouse operation role required'; END IF;
  IF _accepted_quantity < 0 OR _rejected_quantity < 0 OR _accepted_quantity + _rejected_quantity = 0 OR _accepted_quantity + _rejected_quantity > _line.expected_quantity THEN
    RAISE EXCEPTION 'A non-zero received quantity within the expected quantity is required';
  END IF;

  UPDATE public.warehouse_receiving_lines
  SET received_quantity = _accepted_quantity + _rejected_quantity,
      accepted_quantity = _accepted_quantity,
      rejected_quantity = _rejected_quantity,
      damage_notes = _damage_notes,
      photo_evidence = COALESCE(_photo_evidence, '[]'::jsonb),
      inspection_status = CASE WHEN _rejected_quantity = 0 THEN 'accepted' WHEN _accepted_quantity = 0 THEN 'rejected' ELSE 'partial' END
  WHERE id = _line.id;

  PERFORM public.log_warehouse_audit(
    _line.company_id, _shipment.warehouse_id, 'receiving_line', _line.id, 'receiving_recorded',
    jsonb_build_object(
      'accepted_quantity', _accepted_quantity,
      'rejected_quantity', _rejected_quantity,
      'damage_notes', _damage_notes,
      'photo_evidence', COALESCE(_photo_evidence, '[]'::jsonb)
    )
  );

  IF _accepted_quantity = 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.warehouse_stock(
    company_id, warehouse_id, product_id, serial_number, batch_number, lot_number,
    expiry_date, status, quantity, source_receiving_line_id
  ) VALUES (
    _line.company_id, _shipment.warehouse_id, _line.product_id, _line.serial_number,
    _line.batch_number, _line.lot_number, _line.expiry_date, 'received', _accepted_quantity, _line.id
  ) RETURNING * INTO _stock;

  INSERT INTO public.warehouse_inventory_movements(company_id, stock_id, movement_type, to_status, quantity, reference_type, reference_id, performed_by, metadata)
  VALUES (_stock.company_id, _stock.id, 'receiving', 'received', _accepted_quantity, 'receiving_line', _line.id, auth.uid(), jsonb_build_object('rejected_quantity', _rejected_quantity));
  PERFORM public.log_warehouse_audit(_stock.company_id, _stock.warehouse_id, 'receiving_line', _line.id, 'receiving_accepted', jsonb_build_object('stock_id', _stock.id, 'accepted_quantity', _accepted_quantity, 'rejected_quantity', _rejected_quantity));
  RETURN _stock;
END;
$$;

CREATE OR REPLACE FUNCTION public.warehouse_assign_putaway(_stock_id UUID, _manual_location_id UUID DEFAULT NULL)
RETURNS public.warehouse_stock
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _stock public.warehouse_stock;
  _product public.inventory_products;
  _location UUID;
BEGIN
  SELECT * INTO _stock FROM public.warehouse_stock WHERE id = _stock_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Stock record not found'; END IF;
  IF NOT public.warehouse_can_operate(_stock.company_id) THEN RAISE EXCEPTION 'Warehouse operation role required'; END IF;
  SELECT * INTO _product FROM public.inventory_products WHERE id = _stock.product_id;

  IF _manual_location_id IS NOT NULL THEN
    SELECT id INTO _location FROM public.warehouse_locations
    WHERE id = _manual_location_id AND company_id = _stock.company_id AND warehouse_id = _stock.warehouse_id
      AND status = 'available';
  ELSE
    SELECT l.id INTO _location
    FROM public.warehouse_locations l
    WHERE l.company_id = _stock.company_id AND l.warehouse_id = _stock.warehouse_id AND l.status = 'available'
      AND (l.max_weight_kg IS NULL OR l.current_weight_kg + (_product.weight_kg * _stock.quantity) <= l.max_weight_kg)
      AND (NOT _product.is_dangerous_goods OR l.accepts_hazardous)
      AND (_product.temperature_min_c IS NULL OR l.temperature_min_c IS NULL OR l.temperature_min_c <= _product.temperature_min_c)
      AND (_product.temperature_max_c IS NULL OR l.temperature_max_c IS NULL OR l.temperature_max_c >= _product.temperature_max_c)
    ORDER BY l.distance_rank, l.location_code
    LIMIT 1;
  END IF;
  IF _location IS NULL THEN RAISE EXCEPTION 'No compatible put-away location available'; END IF;

  UPDATE public.warehouse_locations
  SET current_weight_kg = current_weight_kg + (_product.weight_kg * _stock.quantity)
  WHERE id = _location;
  RETURN public.warehouse_transition_stock(_stock.id, 'available', _stock.quantity, 'putaway', _location, 'putaway', _stock.id, jsonb_build_object('manual_override', _manual_location_id IS NOT NULL));
END;
$$;

CREATE OR REPLACE FUNCTION public.warehouse_schedule_dock(
  _warehouse_id UUID, _dock_id UUID, _direction TEXT, _scheduled_start TIMESTAMPTZ,
  _scheduled_end TIMESTAMPTZ, _vehicle_id UUID DEFAULT NULL, _trailer_reference TEXT DEFAULT NULL
) RETURNS public.warehouse_dock_schedules
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _company_id UUID; _schedule public.warehouse_dock_schedules;
BEGIN
  SELECT company_id INTO _company_id FROM public.warehouses WHERE id = _warehouse_id;
  IF _company_id IS NULL OR NOT public.warehouse_can_manage(_company_id) THEN RAISE EXCEPTION 'Warehouse management role required'; END IF;
  IF _direction NOT IN ('inbound','outbound','cross_dock') OR _scheduled_end <= _scheduled_start THEN RAISE EXCEPTION 'Invalid dock schedule'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.warehouse_dock_schedules s
    WHERE s.dock_id = _dock_id AND s.status NOT IN ('cancelled','complete')
      AND tstzrange(s.scheduled_start, s.scheduled_end, '[)') && tstzrange(_scheduled_start, _scheduled_end, '[)')
  ) THEN RAISE EXCEPTION 'Dock is already scheduled for that time window'; END IF;
  INSERT INTO public.warehouse_dock_schedules(company_id, warehouse_id, dock_id, vehicle_id, trailer_reference, direction, scheduled_start, scheduled_end)
  VALUES (_company_id, _warehouse_id, _dock_id, _vehicle_id, _trailer_reference, _direction, _scheduled_start, _scheduled_end)
  RETURNING * INTO _schedule;
  PERFORM public.log_warehouse_audit(_company_id, _warehouse_id, 'dock_schedule', _schedule.id, 'dock_scheduled', jsonb_build_object('direction', _direction));
  RETURN _schedule;
END;
$$;

CREATE OR REPLACE FUNCTION public.warehouse_approve_cycle_count(_cycle_count_id UUID, _approve BOOLEAN, _note TEXT DEFAULT NULL)
RETURNS public.warehouse_cycle_counts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _count public.warehouse_cycle_counts; _line public.warehouse_cycle_count_lines;
BEGIN
  SELECT * INTO _count FROM public.warehouse_cycle_counts WHERE id = _cycle_count_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cycle count not found'; END IF;
  IF NOT public.warehouse_can_manage(_count.company_id) THEN RAISE EXCEPTION 'Warehouse supervisor approval required'; END IF;
  IF _count.status <> 'submitted' THEN RAISE EXCEPTION 'Only submitted cycle counts can be approved'; END IF;
  IF _approve THEN
    FOR _line IN SELECT * FROM public.warehouse_cycle_count_lines WHERE cycle_count_id = _count.id LOOP
      IF _line.counted_quantity IS NULL THEN RAISE EXCEPTION 'Every count line must be counted before approval'; END IF;
      UPDATE public.warehouse_stock SET quantity = _line.counted_quantity WHERE id = _line.stock_id;
      INSERT INTO public.warehouse_inventory_movements(company_id, stock_id, movement_type, quantity, reference_type, reference_id, performed_by, metadata)
      VALUES (_count.company_id, _line.stock_id, 'cycle_count_adjustment', ABS(_line.counted_quantity - _line.expected_quantity), 'cycle_count', _count.id, auth.uid(), jsonb_build_object('expected', _line.expected_quantity, 'counted', _line.counted_quantity));
    END LOOP;
  END IF;
  UPDATE public.warehouse_cycle_counts SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END, approved_by = auth.uid() WHERE id = _count.id RETURNING * INTO _count;
  PERFORM public.log_warehouse_audit(_count.company_id, _count.warehouse_id, 'cycle_count', _count.id, CASE WHEN _approve THEN 'cycle_count_approved' ELSE 'cycle_count_rejected' END, jsonb_build_object('note', _note));
  RETURN _count;
END;
$$;

CREATE OR REPLACE FUNCTION public.warehouse_record_scan(
  _company_id UUID, _identifier TEXT, _identifier_type TEXT, _warehouse_id UUID DEFAULT NULL
) RETURNS public.warehouse_stock
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _stock public.warehouse_stock;
BEGIN
  IF NOT public.warehouse_can_read(_company_id) THEN RAISE EXCEPTION 'Warehouse access required'; END IF;
  IF _identifier_type NOT IN ('barcode','qr','rfid','manual') THEN RAISE EXCEPTION 'Unknown identifier type'; END IF;
  SELECT s.* INTO _stock FROM public.warehouse_stock s
  JOIN public.inventory_products p ON p.id = s.product_id
  WHERE s.company_id = _company_id AND (
    p.barcode = _identifier OR p.qr_payload = _identifier OR p.rfid_identifier = _identifier OR s.serial_number = _identifier
  ) LIMIT 1;
  INSERT INTO public.warehouse_scan_history(company_id, warehouse_id, identifier, identifier_type, stock_id, scanned_by)
  VALUES (_company_id, _warehouse_id, _identifier, _identifier_type, _stock.id, auth.uid());
  RETURN _stock;
END;
$$;

CREATE OR REPLACE FUNCTION public.warehouse_transition_task(
  _task_id UUID, _to_status public.warehouse_task_status, _assigned_to UUID DEFAULT NULL
) RETURNS public.warehouse_tasks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _task public.warehouse_tasks; _next public.warehouse_tasks; _allowed BOOLEAN := false;
BEGIN
  SELECT * INTO _task FROM public.warehouse_tasks WHERE id = _task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Warehouse task not found'; END IF;
  IF NOT public.warehouse_can_operate(_task.company_id) THEN RAISE EXCEPTION 'Warehouse operation role required'; END IF;
  IF _task.assigned_to IS NOT NULL AND _task.assigned_to <> auth.uid() AND NOT public.warehouse_can_manage(_task.company_id) THEN
    RAISE EXCEPTION 'Only the assignee or a supervisor may update this task';
  END IF;
  _allowed := CASE _task.status::text
    WHEN 'open' THEN _to_status::text IN ('assigned','in_progress','cancelled')
    WHEN 'assigned' THEN _to_status::text IN ('in_progress','blocked','cancelled')
    WHEN 'in_progress' THEN _to_status::text IN ('blocked','completed','cancelled')
    WHEN 'blocked' THEN _to_status::text IN ('assigned','in_progress','cancelled')
    ELSE false
  END;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal warehouse task transition from % to %', _task.status, _to_status; END IF;
  UPDATE public.warehouse_tasks
  SET status = _to_status, assigned_to = COALESCE(_assigned_to, assigned_to, auth.uid()),
      completed_at = CASE WHEN _to_status = 'completed' THEN now() ELSE completed_at END
  WHERE id = _task.id RETURNING * INTO _next;
  PERFORM public.log_warehouse_audit(_task.company_id, _task.warehouse_id, 'warehouse_task', _task.id, 'task_transition', jsonb_build_object('from', _task.status, 'to', _to_status));
  RETURN _next;
END;
$$;

CREATE OR REPLACE FUNCTION public.warehouse_transition_loading(
  _loading_job_id UUID, _to_status TEXT, _seal_number TEXT DEFAULT NULL
) RETURNS public.warehouse_loading_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _job public.warehouse_loading_jobs; _next public.warehouse_loading_jobs; _allowed BOOLEAN := false;
BEGIN
  SELECT * INTO _job FROM public.warehouse_loading_jobs WHERE id = _loading_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loading job not found'; END IF;
  IF NOT public.warehouse_can_operate(_job.company_id) THEN RAISE EXCEPTION 'Warehouse operation role required'; END IF;
  _allowed := CASE _job.status
    WHEN 'queued' THEN _to_status IN ('loading','cancelled')
    WHEN 'loading' THEN _to_status IN ('verified','cancelled')
    WHEN 'verified' THEN _to_status IN ('complete','loading')
    ELSE false
  END;
  IF NOT _allowed THEN RAISE EXCEPTION 'Illegal loading transition from % to %', _job.status, _to_status; END IF;
  IF _to_status IN ('verified','complete') AND COALESCE(NULLIF(trim(_seal_number), ''), _job.seal_number) IS NULL THEN
    RAISE EXCEPTION 'A seal number is required before loading verification';
  END IF;
  UPDATE public.warehouse_loading_jobs
  SET status = _to_status, seal_number = COALESCE(NULLIF(trim(_seal_number), ''), seal_number),
      verified_by = CASE WHEN _to_status IN ('verified','complete') THEN auth.uid() ELSE verified_by END,
      loaded_at = CASE WHEN _to_status = 'complete' THEN now() ELSE loaded_at END
  WHERE id = _job.id RETURNING * INTO _next;
  IF _to_status = 'complete' THEN
    UPDATE public.warehouse_orders SET status = 'loaded' WHERE id = _job.warehouse_order_id;
  END IF;
  PERFORM public.log_warehouse_audit(_job.company_id, NULL, 'loading_job', _job.id, 'loading_transition', jsonb_build_object('from', _job.status, 'to', _to_status));
  RETURN _next;
END;
$$;

CREATE OR REPLACE FUNCTION public.warehouse_inventory_valuation(_company_id UUID)
RETURNS TABLE(product_id UUID, quantity NUMERIC, inventory_value NUMERIC, currency_code TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.product_id, SUM(s.quantity), SUM(s.quantity * c.unit_cost), MAX(c.currency_code)
  FROM public.warehouse_stock s
  JOIN public.inventory_product_costs c ON c.product_id = s.product_id AND c.company_id = s.company_id
  WHERE s.company_id = _company_id
    AND s.status NOT IN ('disposed','archived')
    AND public.warehouse_can_view_finance(_company_id)
  GROUP BY s.product_id;
$$;

-- Customer portal access is a narrow, customer-scoped status function only.
CREATE OR REPLACE FUNCTION public.customer_warehouse_order_status(_job_id UUID)
RETURNS TABLE(order_reference TEXT, status TEXT, ready_for_dispatch BOOLEAN, proof_of_loading_available BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT wo.order_reference, wo.status, wo.status IN ('ready_for_dispatch','loaded','dispatched'),
         EXISTS (SELECT 1 FROM public.warehouse_loading_jobs lj WHERE lj.warehouse_order_id = wo.id AND lj.status = 'complete')
  FROM public.warehouse_orders wo
  WHERE wo.job_id = _job_id
    AND wo.customer_visible = true
    AND EXISTS (
      SELECT 1 FROM public.customer_portal_memberships cpm
      WHERE cpm.user_id = auth.uid() AND cpm.company_id = wo.company_id AND cpm.customer_id = wo.customer_id AND cpm.status = 'active'
    );
$$;

REVOKE ALL ON FUNCTION public.log_warehouse_audit(UUID, UUID, TEXT, UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.warehouse_transition_stock(UUID, public.warehouse_inventory_status, NUMERIC, TEXT, UUID, TEXT, UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.warehouse_receive_stock(UUID, NUMERIC, NUMERIC, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.warehouse_assign_putaway(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.warehouse_schedule_dock(UUID, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.warehouse_approve_cycle_count(UUID, BOOLEAN, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.warehouse_record_scan(UUID, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.warehouse_transition_task(UUID, public.warehouse_task_status, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.warehouse_transition_loading(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.warehouse_inventory_valuation(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.customer_warehouse_order_status(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.warehouse_transition_stock(UUID, public.warehouse_inventory_status, NUMERIC, TEXT, UUID, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.warehouse_receive_stock(UUID, NUMERIC, NUMERIC, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.warehouse_assign_putaway(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.warehouse_schedule_dock(UUID, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.warehouse_approve_cycle_count(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.warehouse_record_scan(UUID, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.warehouse_transition_task(UUID, public.warehouse_task_status, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.warehouse_transition_loading(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.warehouse_inventory_valuation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.customer_warehouse_order_status(UUID) TO authenticated;
