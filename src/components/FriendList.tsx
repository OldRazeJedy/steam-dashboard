// src/components/FriendList.tsx
import { type Friend } from "~/services/steamService";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { format } from "date-fns";

interface FriendListProps {
  friends: Friend[];
}

export function FriendList({ friends }: FriendListProps) {
  if (friends.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Friend List ({friends.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {friends.map((friend) => (
            <div
              key={friend.steamid}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <p className="font-medium">Steam ID: {friend.steamid}</p>
                <p className="text-muted-foreground text-sm">
                  Friends since:{" "}
                  {format(new Date(friend.friend_since * 1000), "PPP")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
