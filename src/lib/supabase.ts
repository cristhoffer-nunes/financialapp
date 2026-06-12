/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const supabaseUrl = (meta.env && meta.env.VITE_SUPABASE_URL) || 'https://dnrfuolqgkltcvbejkso.supabase.co';
const supabaseAnonKey = (meta.env && meta.env.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_KTpL0CzpwW-LfBUj8QkRFw_0Ql81NbL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
