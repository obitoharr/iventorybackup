//lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pklzmwqyzzucwzwykmvk.supabase.co";
const supabaseKey = "sb_publishable_jaAjc10KQ0p6TplbzmG-Hg_jKqfSnpx";

export const supabase = createClient(supabaseUrl, supabaseKey);
