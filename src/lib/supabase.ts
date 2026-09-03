import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { projectId, publicAnonKey } from "../../utils/supabase/info"

const supabaseGlobal = globalThis as typeof globalThis & {
  __fplTeamAssistantSupabase?: SupabaseClient
}

export const supabase =
  supabaseGlobal.__fplTeamAssistantSupabase ??
  createClient(`https://${projectId}.supabase.co`, publicAnonKey)

supabaseGlobal.__fplTeamAssistantSupabase = supabase
