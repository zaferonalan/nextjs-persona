"use client"
import React, { useState } from 'react'
import { Button } from './ui/button'
import { Loader2Icon } from 'lucide-react'
import toast from 'react-hot-toast'
import { toggleFollow } from '@/actions/user.actions'

function FollowButton({userId}: {userId: string}) {
    const [isLoading, setisLoading] = useState(false)

    const handleFollow = async() => {
        setisLoading(true)

        try {
            await toggleFollow(userId)
            toast.success("User following success")
        } catch (error) {
            toast.error("Error following user")
            console.log("Error following user",error);
        }finally{
            setisLoading(false)
        }
    }

  return (
    <Button 
        variant={'secondary'}
        size={'sm'}
        disabled={isLoading}
        className='w-20'
        onClick={handleFollow}
    >
        {isLoading ? <Loader2Icon className='size-4 animate-spin'/> : "Follow"}
    </Button>
  )
}

export default FollowButton