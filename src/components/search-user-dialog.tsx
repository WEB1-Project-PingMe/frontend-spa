import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, ChevronRightIcon } from "lucide-react"
import { useState } from "react"

type FoundUser = {
    _id: string
    name: string
}

export function SearchUserDialog() {
    const token = localStorage.getItem("sessionToken")
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState("")

    const { data: foundUsers = [] } = useQuery<FoundUser[]>({
        queryKey: ["user-search", searchTerm, token],
        queryFn: async () => {
            const response = await fetch("https://pingme-backend-nu.vercel.app/users/search/" + searchTerm, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            })

            if (!response.ok) {
                throw new Error("Failed to search users")
            }

            const data = await response.json()
            return (data.users as FoundUser[] | undefined) ?? []
        },
        enabled: searchTerm.length >= 3 || searchTerm === "a",
        staleTime: 30_000,
    })

    const createConversationMutation = useMutation({
        mutationFn: async (user: FoundUser) => {
            const response = await fetch("https://pingme-backend-nu.vercel.app/conversations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    participantId: [user._id],
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to create conversation")
            }

            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["conversations"] })
        },
    })

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setSearchTerm("a")}>
                    <Plus />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Add new User</DialogTitle>
                    <DialogDescription>
                        Enter the details of the user you want to add.
                    </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                    <Field>
                        <Label htmlFor="name-1">Name</Label>
                        <Input
                            id="name-1"
                            name="name"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                    </Field>
                </FieldGroup>
                {foundUsers.length > 0 && (
                    <div className="mt-4">
                        <Label className="mb-2">Found Users:</Label>
                        {foundUsers.map((user) => (
                            <Item
                                key={user._id}
                                variant="outline"
                                size="sm"
                                className="mb-2"
                                onClick={() => createConversationMutation.mutate(user)}
                            >
                                <ItemContent>
                                    <ItemTitle>{user.name}</ItemTitle>
                                </ItemContent>
                                <ItemActions>
                                    <ChevronRightIcon className="size-4" />
                                </ItemActions>
                            </Item>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
