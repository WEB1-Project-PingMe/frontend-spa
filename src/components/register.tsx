import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useMutation } from "@tanstack/react-query"
import { useNavigate, Link } from "react-router-dom"

export default function Register({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const navigate = useNavigate()

    const registerMutation = useMutation({
        mutationFn: async ({
            name,
            email,
            password,
        }: {
            name: FormDataEntryValue | null
            email: FormDataEntryValue | null
            password: FormDataEntryValue | null
        }) => {
            const response = await fetch("https://pingme-backend-nu.vercel.app/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            })

            if (!response.ok) {
                throw new Error("Register failed")
            }

            return response.json()
        },
        onSuccess: () => {
            navigate("/login")
        },
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        const formData = new FormData(e.currentTarget)
        const name = formData.get("name")
        const email = formData.get("email")
        const password = formData.get("password")

        registerMutation.mutate({ name, email, password })
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className={cn("flex flex-col gap-6", className)} {...props}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Login to your account</CardTitle>
                            <CardDescription>
                                Enter your email below to login to your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    handleSubmit(e)
                                }}
                            >
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="name">Name</FieldLabel>
                                        <Input
                                            id="name"
                                            type="text"
                                            name="name"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </Field>
                                </FieldGroup>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="email">Email</FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            placeholder="m@example.com"
                                            required
                                        />
                                    </Field>
                                    <Field>
                                        <div className="flex items-center">
                                            <FieldLabel htmlFor="password">Password</FieldLabel>
                                            <a
                                                href="#"
                                                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                            >
                                                Forgot your password?
                                            </a>
                                        </div>
                                        <Input id="password" type="password" name="password" required />
                                    </Field>
                                    <Field>
                                        <Button type="submit" disabled={registerMutation.isPending}>Login</Button>
                                        <FieldDescription className="text-center">
                                            Already have an account? <Link to="/login" className="text-sm underline">Login</Link>
                                        </FieldDescription>
                                    </Field>
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
