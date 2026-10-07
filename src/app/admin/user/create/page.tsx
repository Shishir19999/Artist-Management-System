import { BackLink } from "@/components/ui/DetailGate";
import { PageHeader } from "@/components/ui/States";
import UserForm from "@/features/users/UserForm";
import { routes } from "@/lib/client/routes";

export const metadata = { title: "New user" };

export default function CreateUserPage() {
  return (
    <>
      <PageHeader back={<BackLink href={routes.users}>All users</BackLink>} title="New user" />
      <UserForm />
    </>
  );
}
