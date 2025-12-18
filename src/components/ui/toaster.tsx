import { useToast } from "@/hooks/use-toast";
import { AnimatePresence } from "framer-motion";
import { HolographicToast } from "@/components/ui/holographic-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(function ({ id, title, description, action, variant, ...props }) {
          return (
            <HolographicToast
              key={id}
              id={id}
              title={title as string}
              description={description as string}
              action={action}
              variant={variant as any || "default"}
              onDismiss={() => dismiss(id)}
              duration={5000}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
