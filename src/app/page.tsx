import { db } from "~/server/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await db.query.posts.findMany();

  console.log(posts);
  return (
    <main className="flex p-8">
      <div>
        {posts.map((post) => (
          <div key={post.id} className="border p-4">
            <h2 className="text-xl">{post.name}</h2>
            <p>{post.createdAt.toString()}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
