-- SQL Script to set up database tables in Supabase for Organize.io
-- Paste this script into your Supabase SQL Editor (https://supabase.com) and run it.

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Create bank_accounts table
create table if not exists public.bank_accounts (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  "bankName" text not null,
  type text not null,
  "initialBalance" numeric not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.bank_accounts enable row level security;

-- Create policy to allow authenticated users to manage their own data
create policy "Users can manage their own bank accounts" on public.bank_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- 2. Create credit_cards table
create table if not exists public.credit_cards (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  "bankName" text not null,
  "limit" numeric not null,
  "closingDay" integer not null,
  "dueDay" integer not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.credit_cards enable row level security;

-- Create policy
create policy "Users can manage their own credit cards" on public.credit_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- 3. Create loans table
create table if not exists public.loans (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  lender text not null,
  "totalAmount" numeric not null,
  "interestRate" numeric,
  "startDate" text not null,
  "installmentsTotal" integer not null,
  "installmentsPaid" integer not null,
  "monthlyPayment" numeric not null,
  "bankAccountId" text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.loans enable row level security;

-- Create policy
create policy "Users can manage their own loans" on public.loans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- 4. Create transactions table
create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null,
  amount numeric not null,
  type text not null,
  date text not null,
  "categoryId" text not null,
  "paymentMethod" text not null,
  "bankAccountId" text,
  "creditCardId" text,
  "loanId" text,
  status text not null,
  notes text,
  "isInstallmentPayment" boolean,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.transactions enable row level security;

-- Create policy
create policy "Users can manage their own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- 5. Create monthly_goals table
create table if not exists public.monthly_goals (
  id text primary key, -- user_id + '_' + month
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month text not null,
  "targetAmount" numeric not null,
  "incomeTarget" numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.monthly_goals enable row level security;

-- Create policy
create policy "Users can manage their own monthly goals" on public.monthly_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- 6. Create category_budgets table
create table if not exists public.category_budgets (
  id text primary key, -- user_id + '_' + categoryId
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  "categoryId" text not null,
  "limitAmount" numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.category_budgets enable row level security;

-- Create policy
create policy "Users can manage their own category budgets" on public.category_budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- 7. Create user_profiles table
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  currency text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Create policy
create policy "Users can manage their own profile" on public.user_profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
