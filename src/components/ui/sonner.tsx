import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      closeButton
      position="top-right"
      offset={{ top: "84px", right: "20px" }}
      mobileOffset={{ top: "84px", right: "12px" }}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" strokeWidth={2} />,
        info: <Info className="h-5 w-5 text-sky-600 shrink-0" strokeWidth={2} />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" strokeWidth={2} />,
        error: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" strokeWidth={2} />,
        close: <X className="h-3 w-3 stroke-[2.5]" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg rounded-[20px] pr-9 font-sans text-sm",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "!left-auto !right-2.5 !top-2.5 !transform-none !h-6 !w-6 !rounded-full !border !border-border !bg-background/90 hover:!bg-secondary text-muted-foreground hover:text-foreground transition-all flex items-center justify-center cursor-pointer shadow-xs",
          success:
            "!bg-emerald-50 !border-emerald-200 !text-emerald-950 shadow-sm [&_[data-title]]:!text-emerald-950 [&_[data-description]]:!text-emerald-800",
          error:
            "!bg-rose-50 !border-rose-200 !text-rose-950 shadow-sm [&_[data-title]]:!text-rose-950 [&_[data-description]]:!text-rose-800",
          info: "!bg-sky-50 !border-sky-200 !text-sky-950 shadow-sm [&_[data-title]]:!text-sky-950 [&_[data-description]]:!text-sky-800",
          warning:
            "!bg-amber-50 !border-amber-200 !text-amber-950 shadow-sm [&_[data-title]]:!text-amber-950 [&_[data-description]]:!text-amber-800",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
