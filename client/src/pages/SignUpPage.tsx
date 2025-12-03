import { SignUp } from "@/lib/clerk";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { posthog } from "@/lib/posthog";

/**
 * SignUpPage - Branded registration page
 *
 * Features:
 * - Split layout: Animated brand panel (left) + Auth form (right)
 * - Floating animated blur effects
 * - Acta logo and tagline
 * - Responsive mobile design
 */
export default function SignUpPage() {
  useEffect(() => {
    posthog.capture('sign_up_page_viewed');
  }, []);
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Animated Brand (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[40%] bg-white relative overflow-hidden rounded-[42px] m-20">
        {/* Animated Green Blur - Top Right */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            right: '-100px',
            top: '150px',
            width: '600px',
            height: '600px',
          }}
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 40, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 17.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-full h-full rounded-full bg-green-600/40" style={{ filter: 'blur(120px)' }} />
        </motion.div>

        {/* Animated Orange Blur - Bottom Left */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: '-150px',
            bottom: '100px',
            width: '550px',
            height: '550px',
          }}
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 30, -40, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 15.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-full h-full rounded-full bg-amber-500/50" style={{ filter: 'blur(100px)' }} />
        </motion.div>

        {/* Logo - Top Left */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute left-16 top-16 z-10"
        >
          <img src="/actalogo.svg" alt="Acta" className="h-6 w-auto" />
        </motion.div>

        {/* Tagline - Bottom Left */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute left-16 bottom-32 max-w-md z-10"
        >
          <h2 className="text-black text-4xl font-semibold leading-tight">
            Tus actas -a partir de ahora- se escriben solas.
          </h2>
        </motion.div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo (Only on mobile) */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img src="/actalogo.svg" alt="Acta" className="h-8" />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3 text-center">
              Comienza gratis
            </h2>
            <p className="text-muted-foreground text-base">
              Crea tu cuenta y empieza a gestionar tus actas hoy
            </p>
          </div>

          {/* Clerk Sign Up Component */}
          <SignUp
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "shadow-xl border border-border/50 bg-card w-full rounded-2xl",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "bg-background hover:bg-muted border-border text-foreground font-medium rounded-lg h-11",
                socialButtonsBlockButtonText: "font-medium text-sm",
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-lg shadow-sm",
                formFieldInput:
                  "bg-background border-border focus:border-primary h-11 rounded-lg",
                footerActionLink: "text-primary hover:text-primary/80 font-medium",
                identityPreviewText: "text-foreground",
                identityPreviewEditButton: "text-muted-foreground hover:text-foreground",
                formFieldLabel: "text-foreground font-medium text-sm",
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground text-sm",
                formResendCodeLink: "text-primary hover:text-primary/80",
                otpCodeFieldInput: "border-border rounded-lg",
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
          />
        </motion.div>
      </div>
    </div>
  );
}
