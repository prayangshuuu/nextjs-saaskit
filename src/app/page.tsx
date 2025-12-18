import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function HomePage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (accessToken) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
