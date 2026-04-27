-- ============================================================
-- Corrige el esquema de las tablas de stock para que coincida
-- con lo que espera el código de la aplicación (Block 5 / AD16).
-- ============================================================

-- ─── stock_locations: añadir is_active ───────────────────────
alter table public.stock_locations
  add column if not exists is_active boolean not null default true;

-- ─── stock_items: renombrar columnas y añadir las que faltan ─
-- Renombrar current_holder_type → holder_type
alter table public.stock_items
  rename column current_holder_type to holder_type;

-- Renombrar current_holder_id → holder_id
alter table public.stock_items
  rename column current_holder_id to holder_id;

-- Añadir cantidad (la interfaz StockItem la expone pero no estaba en el esquema)
alter table public.stock_items
  add column if not exists quantity integer not null default 1 check (quantity >= 0);

-- Reemplazar status (text) por is_active (boolean)
alter table public.stock_items
  add column if not exists is_active boolean not null default true;

alter table public.stock_items
  drop column if exists status;

-- ─── stock_movements: renombrar columnas ─────────────────────
-- stock_item_id → item_id
alter table public.stock_movements
  rename column stock_item_id to item_id;

-- from_holder_type → from_type
alter table public.stock_movements
  rename column from_holder_type to from_type;

-- from_holder_id → from_id
alter table public.stock_movements
  rename column from_holder_id to from_id;

-- to_holder_type → to_type
alter table public.stock_movements
  rename column to_holder_type to to_type;

-- to_holder_id → to_id
alter table public.stock_movements
  rename column to_holder_id to to_id;
