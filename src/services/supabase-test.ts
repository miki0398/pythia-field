import { supabase } from "./supabase-client";

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .limit(1);

    if (error) throw error;

    console.log("✅ Supabase connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Supabase connection failed:", error);
    return false;
  }
}