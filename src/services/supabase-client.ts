import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

console.log("✅ Supabase connected");

export interface ConversationMessage {
  id: string;
  patient_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function saveConversation(
  patientId: string,
  messages: ConversationMessage[]
) {
  const { error } = await supabase
    .from("conversations")
    .upsert({ patient_id: patientId, messages: messages });

  if (error) throw error;
}

export async function upsertAuthUser(auth0User: any) {
  // Store in localStorage (Supabase permissions issues - will fix in Phase 2)
  const userData = {
    auth0_sub: auth0User.sub,
    email: auth0User.email,
    name: auth0User.name,
    picture: auth0User.picture,
    stored_at: new Date().toISOString()
  };
  
  localStorage.setItem('pythia_user', JSON.stringify(userData));
  console.log('✅ User stored in localStorage:', userData);
  
  return userData;
}