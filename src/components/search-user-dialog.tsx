import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item"
import { Plus, ChevronRightIcon } from "lucide-react"
import { useState } from "react"

export function SearchUserDialog() {
  const token = localStorage.getItem("sessionToken");
  const [foundUsers, setFoundUsers] = useState([]);

  const searchUser = (e) => {
    if(!e) e = "a"; // Default search term to fetch some users
    if(e.length < 3) return; // Avoid searching for very short terms
    fetch('https://pingme-backend-nu.vercel.app/users/search/' + e, {
      headers: {
        'Content-Type': 'application/json',
            ...(token && {"Authorization": `Bearer ${token}`}),
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      setFoundUsers(data.users);
    })
  }

  const selectUser = (user) => {
    console.log("User selected:", user);
    fetch('https://pingme-backend-nu.vercel.app/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && {"Authorization": `Bearer ${token}`}),
      },
      body: JSON.stringify({
        participantId: [user._id],
      }),
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      console.log('Conversation created successfully:', data);
    })
  }


  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" onClick={() => searchUser()}> 
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
            <Input id="name-1" name="name" onChange={(e) => searchUser(e.target.value)} />
          </Field>
        </FieldGroup>
        {foundUsers.length > 0 && (
          <div className="mt-4">
            <Label className="mb-2">Found Users:</Label>
            {foundUsers.map((user) => (
              <Item variant="outline" size="sm" className="mb-2" onClick={() => selectUser(user)}>
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
