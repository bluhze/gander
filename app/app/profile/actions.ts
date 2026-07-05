"use server";

import { createClient } from "@/lib/supabase/server";
import { parseBirthdateInput } from "@/lib/profile";
import { revalidatePath } from "next/cache";

export type ProfileInput = {
  displayName: string;
  birthdate: string;
  state: string;
};

export async function upsertProfile(input: ProfileInput) {
  const displayName = input.displayName.trim();
  const state = input.state;

  if (!displayName || displayName.length > 50) {
    return { error: "Name must be 1–50 characters." };
  }

  const parsedBirthdate = parseBirthdateInput(input.birthdate);
  if (!parsedBirthdate.ok) {
    return { error: parsedBirthdate.error };
  }

  if (!/^[A-Z]{2}$/.test(state)) {
    return { error: "Please select a valid state." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
      birthdate: parsedBirthdate.iso,
      state,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/profile");
  revalidatePath("/app/setup");
  return { success: true as const };
}
