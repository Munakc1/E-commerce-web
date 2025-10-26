import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          // Base toast styling: solid thrift-green as requested
          toast:
            "group toast group-[.toaster]:bg-[hsl(var(--thrift-green))] group-[.toaster]:text-white group-[.toaster]:border-[hsl(var(--thrift-green))] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-white/90",
          actionButton:
            "group-[.toast]:bg-white group-[.toast]:text-[hsl(var(--thrift-green))]",
          cancelButton:
            "group-[.toast]:bg-white/20 group-[.toast]:text-white hover:group-[.toast]:bg-white/30",
          // Keep success aligned with the base
          success:
            "group-[.toaster]:bg-[hsl(var(--thrift-green))] group-[.toaster]:text-white group-[.toaster]:border-[hsl(var(--thrift-green))]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast, Sonner }
