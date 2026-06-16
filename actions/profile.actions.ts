"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getDbUserId } from "./user.actions"

export async function getProfileByUsername(username:string) {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                name: true,
                username: true,
                bio: true,
                image: true,
                location: true,
                website: true,
                createdAt: true,
            }
        })

        if (!user) return null

        const [followersCount, followingCount, postsCount] = await Promise.all([
            prisma.follows.count({ where: { followingId: user.id } }),
            prisma.follows.count({ where: { followerId: user.id } }),
            prisma.post.count({ where: { authorId: user.id } }),
        ])

        return {
            ...user,
            _count: {
                followers: followersCount,
                following: followingCount,
                posts: postsCount,
            }
        }
    } catch (error) {
        console.error("Error fetching profile:", error)
        throw new Error(error instanceof Error ? error.message : String(error))
    }

}

export async function getUserPosts(userId: string) {
    try {
        const posts = await prisma.post.findMany({
            where:{authorId: userId},
            include: {
                author:{
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "asc"
                    }
                },
                likes: {
                    select: {
                        userId: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                },
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        return posts
    } catch (error) {
        console.error("Error fetching user posts:", error);
        throw new Error("Failed to fetch user post")
    }
}

export async function getUserLikedPosts(userId: string) {
    try {
        const likedPost = await prisma.post.findMany({
            where: {
                likes: {
                    some: {
                        userId
                    }
                }
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "asc"
                    }
                },
                likes: {
                    select: {
                        userId: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        return likedPost
    } catch (error) {
        console.error("Error fething liked posts:",error);
        throw new Error("Failed to fetch liked posts")
    }
}

export async function updateProfile(formdata: FormData) {
    try {
        const { userId : clerkId } = await auth()
        if(!clerkId) throw new Error("Unauthorized")
        
        const name = formdata.get("name") as string
        const bio = formdata.get("bio") as string
        const location = formdata.get("location") as string
        const website = formdata.get("website") as string

        const user = await prisma.user.update({
            where: {clerkId},
            data: {
                name,
                bio,
                location,
                website
            }
        })

        revalidatePath("/profile")
        return {success: true, user}
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Failed to update profile" };
    }
}

export async function isFollowing(userId: string) {
    try {
        const currentUserId = await getDbUserId()
        if(!currentUserId) return false
        const follow = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: userId
                }
            }
        })

        return !!follow

    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
}