import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { AuthView } from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth";
import { api } from "@hwm/convex";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/accept-invitation")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const { token } = Route.useSearch();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const navigate = useNavigate();
  const session = authClient.useSession();

  const [status, setStatus] = useState<"pending" | "accepting" | "success" | "error">("pending");
  const [error, setError] = useState<string | null>(null);

  const createDomainUser = useMutation(api.teams.index.createDomainUserFromInvitation);

  // Store token in sessionStorage for post-signup flow
  useEffect(() => {
    if (token && !isAuthenticated) {
      sessionStorage.setItem("pendingInvitation", token);
    }
  }, [token, isAuthenticated]);

  // Check for stored invitation token after authentication
  useEffect(() => {
    const storedToken = sessionStorage.getItem("pendingInvitation");
    if (isAuthenticated && storedToken && status === "pending") {
      acceptInvitation(storedToken);
    } else if (isAuthenticated && token && status === "pending") {
      acceptInvitation(token);
    }
  }, [isAuthenticated, token, status]);

  async function acceptInvitation(invitationToken: string) {
    setStatus("accepting");
    setError(null);

    try {
      // 1. Accept invitation via Better Auth
      const result = await authClient.organization.acceptInvitation({
        invitationId: invitationToken,
      });

      if (!result.data) {
        throw new Error(result.error?.message || "Failed to accept invitation");
      }

      // 2. Get the organization ID from the accepted invitation
      const orgId = result.data.member?.organizationId;
      if (!orgId) {
        throw new Error("No organization ID in acceptance result");
      }

      // 3. Create domain user record
      const user = session.data?.user;
      if (user) {
        await createDomainUser({
          betterAuthUserId: user.id,
          betterAuthOrgId: orgId,
          name: user.name ?? user.email.split("@")[0],
          email: user.email,
        });
      }

      // 4. Set this org as active
      await authClient.organization.setActive({ organizationId: orgId });

      // 5. Clean up and redirect
      sessionStorage.removeItem("pendingInvitation");
      setStatus("success");

      // Small delay for user to see success message
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 1500);
    } catch (err) {
      console.error("Failed to accept invitation:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    }
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No token provided
  if (!token && !sessionStorage.getItem("pendingInvitation")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              No invitation token provided. Please check your email for the correct link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600">Welcome!</CardTitle>
            <CardDescription>
              You've successfully joined the organization. Redirecting to dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invitation Error</CardTitle>
            <CardDescription>{error || "Failed to accept invitation"}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The invitation may have expired or already been used.
            </p>
            <Button onClick={() => navigate({ to: "/" })} variant="outline">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Accepting state (authenticated user)
  if (isAuthenticated && status === "accepting") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Accepting invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated - show signup form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Your Organization</CardTitle>
          <CardDescription>
            Create an account or sign in to accept your invitation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthView
            pathname="sign-up"
            redirectTo={`/accept-invitation?token=${token}`}
          />
          <p className="text-sm text-muted-foreground text-center mt-4">
            Already have an account?{" "}
            <a
              href={`/auth/sign-in?redirectTo=/accept-invitation?token=${token}`}
              className="text-primary hover:underline"
            >
              Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
