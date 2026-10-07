-- =============================================================================
-- LumiVue Database Schema Migration for Supabase
-- Version: 20261007_001_initial_schema.sql
-- Description: Sets up medical cases, patient clinical contexts, analysis runs,
--              evidence firewall validation logs, and Supabase Storage bucket.
-- =============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Enum Types matching API Contract
-- -----------------------------------------------------------------------------
do $$ begin
    create type finding_type as enum (
        'suspected_pneumonia',
        'no_pneumonia_detected',
        'inconclusive',
        'rejected'
    );
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type confidence_level as enum (
        'low',
        'moderate',
        'high'
    );
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type image_quality_status as enum (
        'good',
        'acceptable',
        'poor',
        'rejected'
    );
exception
    when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Patient Clinical Records Table
-- -----------------------------------------------------------------------------
create table if not exists public.patients (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    age text,
    sex text,
    spo2 text,
    temperature text,
    symptom_duration text,
    symptoms text[] default '{}'::text[],
    clinical_notes text
);

-- -----------------------------------------------------------------------------
-- 3. Radiograph Scans Table (Files uploaded & metadata)
-- -----------------------------------------------------------------------------
create table if not exists public.radiographs (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    patient_id uuid references public.patients(id) on delete set null,
    file_name text not null,
    file_path text not null,
    file_type text not null, -- 'image/png', 'image/jpeg', 'application/dicom'
    storage_bucket text not null default 'radiographs',
    image_url text not null,
    image_quality image_quality_status default 'good',
    quality_details jsonb default '{}'::jsonb
);

-- -----------------------------------------------------------------------------
-- 4. Diagnostic Analyses Table (Results from DenseNet-121 + MedGemma + Firewall)
-- -----------------------------------------------------------------------------
create table if not exists public.analyses (
    id uuid primary key default gen_random_uuid(),
    analysis_id text unique not null,
    created_at timestamptz not null default now(),
    radiograph_id uuid references public.radiographs(id) on delete cascade,
    patient_id uuid references public.patients(id) on delete set null,
    
    -- Model inference results
    finding finding_type not null,
    model_score numeric(4, 3) not null check (model_score >= 0.0 and model_score <= 1.0),
    confidence confidence_level not null,
    
    -- Confidence factors breakdown
    confidence_factors jsonb not null default '{
        "image_signal": false,
        "clinical_context_supportive": false,
        "adequate_image_quality": false
    }'::jsonb,
    
    -- Visual Localization (Grad-CAM & BBox ROI)
    heatmap_url text,
    bbox_xmin integer,
    bbox_ymin integer,
    bbox_xmax integer,
    bbox_ymax integer,
    
    -- Clinical evidence recorded
    clinical_evidence text[] default '{}'::text[],
    
    -- AI Generated Clinical Explanation & Narrative
    explanation text not null,
    
    -- Evidence Firewall gate validation
    firewall_supported boolean not null default true,
    firewall_image_evidence boolean not null default true,
    firewall_clinical_evidence boolean not null default true,
    
    -- Audit / Sign-off
    physician_signed_off boolean not null default false,
    signed_off_by text,
    signed_off_at timestamptz
);

-- -----------------------------------------------------------------------------
-- 5. Indexes for fast retrieval
-- -----------------------------------------------------------------------------
create index if not exists idx_analyses_created_at on public.analyses (created_at desc);
create index if not exists idx_analyses_finding on public.analyses (finding);
create index if not exists idx_analyses_analysis_id on public.analyses (analysis_id);
create index if not exists idx_radiographs_patient_id on public.radiographs (patient_id);

-- -----------------------------------------------------------------------------
-- 6. Row Level Security (RLS) Setup
-- -----------------------------------------------------------------------------
alter table public.patients enable row level security;
alter table public.radiographs enable row level security;
alter table public.analyses enable row level security;

-- Default permissive read/write policy for authenticated clinical staff or public anon key
create policy "Enable read access for all users" on public.patients
    for select using (true);
create policy "Enable insert access for all users" on public.patients
    for insert with check (true);

create policy "Enable read access for all users" on public.radiographs
    for select using (true);
create policy "Enable insert access for all users" on public.radiographs
    for insert with check (true);

create policy "Enable read access for all users" on public.analyses
    for select using (true);
create policy "Enable insert access for all users" on public.analyses
    for insert with check (true);
create policy "Enable update access for all users" on public.analyses
    for update using (true);

-- -----------------------------------------------------------------------------
-- 7. Storage Bucket setup for X-ray images and heatmaps
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('radiographs', 'radiographs', true)
on conflict (id) do nothing;

create policy "Radiograph storage public read" on storage.objects
    for select using (bucket_id = 'radiographs');

create policy "Radiograph storage public insert" on storage.objects
    for insert with check (bucket_id = 'radiographs');
