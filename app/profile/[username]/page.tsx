import { cache } from "react";
import { getProfileByUsername as fetchProfileByUsername, getUserLikedPosts, getUserPosts, isFollowing } from "@/actions/profile.actions";
import { notFound } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";

const getProfileByUsername = cache(fetchProfileByUsername);

export async function generateMetadata({ params }: { params: { username: string } }) {
    const { username } = await params
    const user = await getProfileByUsername(username);
    if (!user) return;

    return {
        title: `${user.name ?? user.username}`,
        description: user.bio || `Check out ${user.username}'s profile.`,
    };
    }

async function ProfilePageServer({ params }: { params: { username: string } }) {
    const  {username } = await params
    const user = await getProfileByUsername(username);

    if (!user) notFound();

    const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
        getUserPosts(user.id),
        getUserLikedPosts(user.id),
        isFollowing(user.id),
    ]);

    return (
        <ProfilePageClient
        user={user}
        posts={posts}
        likedPosts={likedPosts}
        isFollowing={isCurrentUserFollowing}
        />
    );
}
export default ProfilePageServer;