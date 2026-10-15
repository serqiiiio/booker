import { Button } from "@/components/ui/button";
import { signOut } from "./actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="lg" className="h-11 w-full">
        Cerrar sesión
      </Button>
    </form>
  );
}
