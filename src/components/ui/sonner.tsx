import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      offset={24}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group toast !bg-[rgba(20,20,20,0.92)] !text-white !border-transparent !shadow-[0_4px_24px_rgba(0,0,0,0.28)] !rounded-xl !px-4 !py-3 !text-[13px] !font-medium !tracking-[0.01em] backdrop-blur-sm min-w-[220px] max-w-[320px]",
          description: "group-[.toast]:!text-white/70 !text-[12px]",
          actionButton: "group-[.toast]:bg-white/20 group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white/70",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
