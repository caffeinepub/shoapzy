import { UserRole } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  LogIn,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function SetupAdmin() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ["role", identity?.getPrincipal().toString()],
    queryFn: async () => {
      try {
        return await actor!.getCallerUserRole();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !!identity,
  });

  const principalId = identity?.getPrincipal().toString();

  async function handleClaimAdmin() {
    if (!actor || !identity) {
      setError(
        "Actor or identity not available. Please refresh and try again.",
      );
      return;
    }
    setIsPending(true);
    setError(null);
    try {
      await actor.claimAdminRole();
      await queryClient.invalidateQueries({ queryKey: ["role"] });
      setSuccess(true);
    } catch (err: any) {
      const msg =
        err?.message ?? String(err) ?? "An unexpected error occurred.";
      setError(msg);
    } finally {
      setIsPending(false);
    }
  }

  if (!identity) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4">
        <Card className="w-full max-w-md bg-white/5 border-white/10 text-white shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-orange-500/20 p-4 rounded-full">
                <LogIn className="w-10 h-10 text-orange-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Login Required
            </CardTitle>
            <CardDescription className="text-gray-400">
              You must be logged in to set up an admin account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/login">
              <Button
                data-ocid="setup_admin.login_button"
                className="bg-orange-500 hover:bg-orange-600 text-white w-full"
              >
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (roleLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
        <Loader2
          data-ocid="setup_admin.loading_state"
          className="w-8 h-8 animate-spin text-orange-400"
        />
      </div>
    );
  }

  if (role === UserRole.admin || success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4">
        <Card className="w-full max-w-md bg-white/5 border-white/10 text-white shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/20 p-4 rounded-full">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              You are already an Admin!
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your account has admin privileges. Head to the dashboard to manage
              the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/admin">
              <Button
                data-ocid="setup_admin.admin_dashboard_button"
                className="bg-orange-500 hover:bg-orange-600 text-white w-full"
              >
                Go to Admin Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10 text-white shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-500/20 p-4 rounded-full">
              <ShieldCheck className="w-10 h-10 text-orange-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Admin Setup
          </CardTitle>
          <CardDescription className="text-gray-400 leading-relaxed">
            Click below to claim admin role for your account. This should be
            done only once by the first admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">
              Your Principal ID
            </p>
            <p className="text-xs text-orange-300 font-mono break-all">
              {principalId}
            </p>
          </div>

          {error && (
            <div
              data-ocid="setup_admin.error_state"
              className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
            >
              <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <Button
            data-ocid="setup_admin.primary_button"
            onClick={handleClaimAdmin}
            disabled={isPending || !actor}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-base font-semibold disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming Admin Role...
              </>
            ) : (
              "Claim Admin Role"
            )}
          </Button>

          {!actor && (
            <p className="text-xs text-yellow-400 text-center">
              Connecting to backend... please wait.
            </p>
          )}

          <p className="text-xs text-gray-500 text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-orange-400 hover:text-orange-300 underline"
            >
              Go to Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
