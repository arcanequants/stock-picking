import { createSupabaseServerClient } from "@/lib/supabase";

export interface AuthState {
  user: { email: string } | null;
  isSubscribed: boolean;
  subscriptionStatus: string | null;
}

export async function getAuthState(): Promise<AuthState> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return { user: null, isSubscribed: false, subscriptionStatus: null };
    }

    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("subscription_status")
      .eq("email", user.email.toLowerCase())
      .single();

    const status = subscriber?.subscription_status ?? null;
    const isSubscribed = status === "active" || status === "trialing";

    return {
      user: { email: user.email },
      isSubscribed,
      subscriptionStatus: status,
    };
  } catch {
    return { user: null, isSubscribed: false, subscriptionStatus: null };
  }
}
