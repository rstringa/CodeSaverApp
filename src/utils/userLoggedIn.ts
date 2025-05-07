import { supabase } from "@lib/supabaseClient";


export const userLoggedIn = async () => {
  const { data } = await supabase.auth.getSession();
  console.log(data);
  if (data?.session?.user) {
    const userLoggedIn = data.session.user;
    return userLoggedIn;
  }
};

export const userData = async () => {
  const { data } = await supabase.auth.getSession();
  return data
}
