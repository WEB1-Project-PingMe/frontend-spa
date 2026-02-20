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
import { useNavigate, Link, useLocation } from "react-router-dom"
import { useEffect } from "react"

type LoginResponse = {
    token: string
    user: {
        _id: string
    }
}

export function LoginForm({
    className,
    authenicate,
    ...props
}: React.ComponentProps<"div"> & { authenicate: (status: boolean) => void }) {
    const navigate = useNavigate()
    const location = useLocation()
    const forceToLogin = Boolean((location.state as { forceToLogin?: boolean } | null)?.forceToLogin)

    useEffect(() => {
        const token = localStorage.getItem("sessionToken")
        if (token && !forceToLogin) {
            authenicate(true)
            navigate("/chats")
        }
    }, [authenicate, forceToLogin, navigate])

    const loginMutation = useMutation({
        mutationFn: async ({ email, password }: { email: FormDataEntryValue | null; password: FormDataEntryValue | null }) => {
            const response = await fetch("https://pingme-backend-nu.vercel.app/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            })

            if (!response.ok) {
                throw new Error("Login failed")
            }

            return (await response.json()) as LoginResponse
        },
        onSuccess: (data) => {
            localStorage.setItem("sessionToken", data.token)
            localStorage.setItem("currentUserId", data.user._id)
            authenicate(true)
            navigate("/chats")
        },
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        const formData = new FormData(e.currentTarget)
        const email = formData.get("email")
        const password = formData.get("password")
        loginMutation.mutate({ email, password })
    }

    return (
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
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="<name>@gmail.com"
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
                                <Button type="submit" disabled={loginMutation.isPending}>Login</Button>
                                <FieldDescription className="text-center">
                                    Don&apos;t have an account? <Link to="/register" className="text-sm underline">Register</Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
