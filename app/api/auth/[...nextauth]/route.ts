import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/user/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          let data: any = null;
          try {
            data = await response.json();
          } catch {
            data = null;
          }

          if (!response.ok || !data?.success) {
            const message =
              data?.message ||
              (response.status === 401 || response.status === 403
                ? "Invalid email or password"
                : "Unable to sign in");
            const nextStep = data?.data?.nextStep;
            const errorPayload = {
              message,
              code: nextStep === "verify-otp" ? "UNVERIFIED" : "LOGIN_FAILED",
              status: response.status,
              email: data?.data?.email ?? credentials.email,
              nextStep: nextStep ?? null,
              needsSecurityQuestions:
                data?.data?.needsSecurityQuestions ?? false,
            };
            throw new Error(JSON.stringify(errorPayload));
          }

          if (response.ok && data.success) {
            const userData = data.data ?? {};

            // plan fields might be absent
            const plan = userData.plan ?? null;
            const planId = plan?._id ?? null;
            const planTitle = plan?.title ?? null;
            const planValid = plan?.valid ?? null;

            return {
              id: userData._id,
              // prefer API email (fallback to typed email)
              email: userData.email ?? credentials.email,
              name:
                userData.name ??
                (userData.email ?? credentials.email).split("@")[0],
              accessToken: userData.accessToken,

              role: userData.role,
              isValid: userData.isValid ?? false,
              payAsYouGo: userData.payAsYouGo ?? false,

              // NEW: normalize extra profile fields into the user object
              phoneNumber: userData.phoneNum ?? null, // API field: phoneNum
              country: userData.address ?? null, // API field: address → country

              // plan (optional)
              planId,
              planTitle,
              planValid,

              // refreshToken: userData.refreshToken, // optional if you need it later
            };
          }
          return null;
        } catch (error) {
          console.error("Login error:", error);
          const fallbackMessage =
            error instanceof Error ? error.message : "Unable to sign in";
          throw new Error(fallbackMessage);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.role = user.role;
        token.userId = user.id;
        token.isValid = (user as any).isValid;
        token.payAsYouGo = (user as any).payAsYouGo;

        // propagate new profile fields
        token.phoneNumber = (user as any).phoneNumber ?? null;
        token.country = (user as any).country ?? null;

        // plan fields (may be null)
        token.planId = (user as any).planId ?? null;
        token.planTitle = (user as any).planTitle ?? null;
        token.planValid = (user as any).planValid ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.user.role = token.role as string | undefined;
      session.user.id = token.userId as string;

      // flags
      (session.user as typeof session.user & { isValid?: boolean }).isValid =
        (token.isValid as boolean | undefined) ?? false;

      (
        session.user as typeof session.user & { payAsYouGo?: boolean }
      ).payAsYouGo = (token.payAsYouGo as boolean | undefined) ?? false;

      // NEW: expose to client session
      (
        session.user as typeof session.user & { phoneNumber?: string | null }
      ).phoneNumber = (token.phoneNumber as string | null) ?? null;

      (
        session.user as typeof session.user & { country?: string | null }
      ).country = (token.country as string | null) ?? null;

      // plan (keep optional and null-safe)
      (
        session.user as typeof session.user & { planId?: string | null }
      ).planId = (token.planId as string | null) ?? null;
      (
        session.user as typeof session.user & { planTitle?: string | null }
      ).planTitle = (token.planTitle as string | null) ?? null;
      (
        session.user as typeof session.user & { planValid?: string | null }
      ).planValid = (token.planValid as string | null) ?? null;

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
