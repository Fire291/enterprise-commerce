import { zodResolver } from "@hookform/resolvers/zod"
import { signupUser } from "app/actions"
import { Button } from "components/Button"
import { DialogFooter } from "components/Dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/Form/Form"
import { GenericModal } from "components/GenericModal"
import { Input } from "components/Input"
import { Logo } from "components/Logo"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useModalStore } from "stores/modalStore"
import { z } from "zod"

const passwordRegexp = new RegExp(/(?=.*\d)(?=.*\W)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/)

const formSchema = z.object({
  email: z.string().email().min(3).max(64),
  password: z.string().min(8).max(20).regex(passwordRegexp, "Password must have at least one number, one symbol, one uppercase letter, and be at least 12 characters"),
})

const formFields = [
  { label: "Email", name: "email", type: "text" },
  { label: "Password", name: "password", type: "password" },
] as const

export function SignupModal() {
  const modals = useModalStore((s) => s.modals)
  const closeModal = useModalStore((s) => s.closeModal)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  async function onSubmit(payload: z.infer<typeof formSchema>) {
    const { email, password } = payload
    const user = await signupUser({ email, password })

    if (user) {
      closeModal("signup")
      toast.success("You have successfully signed up! You can now log in.")
      return
    }

    toast.error("Couldn't create user. The email address may be already in use.")
  }

  return (
    <GenericModal title="Signup" open={!!modals["signup"]} onOpenChange={() => closeModal("signup")}>
      <Form {...form}>
        <Logo className="mt-6 flex size-24 w-full justify-center" />
        {form.formState.errors.root?.message && <p className="mt-6 w-full text-[14px] leading-tight tracking-tight text-red-400">{form.formState.errors.root?.message}</p>}
        <form name="loginForm" id="loginForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
          {formFields.map((singleField) => (
            <FormField
              key={singleField.name}
              control={form.control}
              name={singleField.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{singleField.label}</FormLabel>
                  <FormControl>
                    <Input type={singleField.type} className="text-sm" placeholder="shadcn" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs font-normal text-red-400" />
                </FormItem>
              )}
            />
          ))}
        </form>
      </Form>

      <DialogFooter>
        <Button
          size="lg"
          form="loginForm"
          className="hover:text-white"
          variant="secondary"
          isAnimated={false}
          type="submit"
          disabled={form.formState.isSubmitting}
          isLoading={form.formState.isSubmitting}
        >
          Submit
        </Button>
      </DialogFooter>
    </GenericModal>
  )
}
