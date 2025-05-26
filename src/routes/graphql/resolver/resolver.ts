import { createUserInputType } from "../types/CreateUserInput.js"
import { GraphQLSchema, GraphQLList, GraphQLObjectType, GraphQLNonNull, GraphQLString, subscribe } from 'graphql';
import { Prisma, PrismaClient, SubscribersOnAuthors } from "@prisma/client";
import { profileType } from "../types/Profile.js";
import { createProfileInput } from "../types/CreateProfileInput.js";
import { memberTypeId } from "../types/MemberTypeId.js";
import { memberType } from "../types/MemberType.js";
import { userType } from "../types/UserType.js"
import { postType } from "../types/PostType.js";
import { createPostInput } from "../types/CreatePostInput.js";
import { UUIDType } from "../types/uuid.js";
import { changeUserInputType } from "../types/ChangeUserInput.js";
import DataLoader from "dataloader";
import { changeProfileInput } from "../types/ChangeProfileInput.js";
import { changePostInput } from "../types/ChangePostInput.js";

const memberTypesResolver = () => {
    return {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(memberType))),
        resolve: async (root, args, context) => {
            return context.prisma.memberType.findMany()
        }
    }
}

const memberTypeResolver = () => {
    return {
        type: memberType,
        args: {
            id: { type: new GraphQLNonNull(memberTypeId) }
        },
        resolve: async (root, args, context) => {
            return context.prisma.memberType.findUnique({
                where: {
                    id: args.id
                }
            })
        }
    }
}

const usersResolver = () => {
    return {
        type: new GraphQLList(new GraphQLNonNull(userType)),
        resolve: async (root, args, context) => {
            const db: PrismaClient = context.prisma
            const users = await db.user.findMany()
            const ids = users.map((u) => u.id)
            return context.userDataloader.loadMany(ids)
        }
    }
}

const userResolver = () => {
    return {
        type: userType,
        args: {
            id: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: async (_, args, context) => {
            // const db = context.prisma
            return context.userDataloader.load(args.id)
            // return db.user.findUnique({ 
            //     where: { 
            //         id: args.id 
            //     }
            // })
        }
    }
}

const deleteUserResolver = () => {
    return {
        type: new GraphQLNonNull(GraphQLString),
        args: {
            id: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: async (_, args, context) => {
            const db = context.prisma
            const user = await db.user.findUnique({ 
                where: { 
                    id: args.id 
                },
                include: {
                    subscribedToUser: true,
                    userSubscribedTo: true
                }
            })

            if (user == undefined) throw new Error(`user not found ${args.id}`)
            if (user.subscribedToUser && user.subscribedToUser.length > 0) {
                console.log(user.subscribedToUser)
                for (const author of user.subscribedToUser) {
                    await db.userSubscribedTo.delete({
                        where: {
                            subscriberId_authorId: {
                                subscriberId: author.subscriberId,
                                authorId: author.authorId
                            }
                        }
                    })
                    // subsciberAuthorCache(db, 
                    //     context.subscribedToUserDataloader, 
                    //     context.userSubscribedToDataloader, 
                    //     author.authorId,
                    //     author.subscriberId
                    // )
                }
            }

            if (user.userSubscribedTo) {
                for (const subscriber of user.userSubscribedTo) {
                    await db.subscribersOnAuthors.delete({
                        where: {
                            subscriberId_authorId: {
                                subscriberId: subscriber.subscriberId,
                                authorId: subscriber.authorId
                            }
                        }
                    })
                    // subsciberAuthorCache(db, 
                    //     context.subscribedToUserDataloader, 
                    //     context.userSubscribedToDataloader, 
                    //     subscriber.authorId,
                    //     subscriber.subscriberId
                    // )
                }
            }

            await db.profile.deleteMany({ 
                where: { 
                    userId: args.id
                }
            })

            await db.post.deleteMany({ 
                where: { 
                    authorId: args.id
                }
            })

            await db.user.delete({ 
                where: { 
                    id: args.id
                }
            })

            context.userDataloader.clear(args.id)
            context.userPostDataloader.clear(args.id)
            //context.userProfileDataloader.clear(args.id)
            return "ok"
        }
    }
}

const changeUserResolver = () => {
    return {
        type: userType,
        args: {
            id: { type: new GraphQLNonNull(UUIDType) },
            dto: { type: new GraphQLNonNull(changeUserInputType) }
        },
        resolve: async (_, args, context) => {
            const user = await context.userDataloader.load(args.id)
            if (user == undefined) throw new Error('user not found')
            await context.userDataloader.clear(args.id)
            await context.prisma.user.update({
                where: {
                    id: args.id
                },
                data: {
                    name: args.dto.name,
                    balance: args.dto.balance
                }
            })
            const updated = await context.prisma.user.findUnique({ where: { id: user.id } })
            await context.userDataloader.prime(args.id, updated)
            return updated
        }
    }
}

const createUserResolver = () => {
    return {
        type: userType,
        args: {
            dto: { type: new GraphQLNonNull(createUserInputType) }
        },
        resolve: async (_, args, context) => {
            const user = await context.prisma.user.create({
                data: {
                    name: args.dto.name,
                    balance: args.dto.balance
                }
            })
            return context.prisma.user.findUnique({ where: { id: user.id } })
        }
    }
}

const createProfileResolver = () => {
    return {
        type: profileType,
        args: {
            dto: { type: new GraphQLNonNull(createProfileInput) }
        },
        resolve: async (_, args, context) => {
            const exist = await context.prisma.profile.findFirst({
                where: {
                    userId: args.dto.userId
                },
                include: {
                    memberType: true
                }
            })
            if (exist) throw new Error(`user ${args.dto.userId} already has profile`)
            const profile = await context.prisma.profile.create({
                data: {
                    userId: args.dto.userId,
                    isMale: args.dto.isMale,
                    yearOfBirth: args.dto.yearOfBirth,
                    memberTypeId: args.dto.memberTypeId
                }
            })
            //await profileCache(args.dto.userId, context.userProfileDataloader, context.prisma)
            return profile
        }
    }
}

const changeProfileResolver = () => {
    return {
        type: new GraphQLNonNull(profileType),
        args: {
            id: { type: new GraphQLNonNull(UUIDType) },
            dto: { type: new GraphQLNonNull(changeProfileInput) }
        },
        resolve: async (root, args, context) => {
            const db: PrismaClient = context.prisma
            let record = await db.profile.findUnique({
                where: {
                    id: args.id
                },
                select: {
                    userId: true
                }
            })
            if (record == null) throw new Error(`profile not found by id ${args.id}`) 
                console.log(record)
            
            await db.profile.update({
                where: {
                    id: args.id
                },
                data: {
                    isMale: args.dto.isMale,
                    yearOfBirth: args.dto.yearOfBirth,
                    memberTypeId: args.dto.memberTypeId,
                }
            })
            // await profileCache(record.userId, context.userProfileDataloader, db)
            // return context.userProfileDataloader.load(record.userId)
            return db.profile.findUnique({
                where: {
                    id: args.id
                }, include: {
                    memberType: true,
                }
            })
        }
    }
}

const createPostResolver = () => {
    return {
        type: postType,
        args: {
            dto: { type: new GraphQLNonNull(createPostInput) }
        },
        resolve: async (_, args, context) => {
            const post = await context.prisma.post.create({
                data: {
                    authorId: args.dto.authorId,
                    title: args.dto.title,
                    content: args.dto.content
                }
            })

            context.userDataloader.clear(args.dto.authorId)
            // await context.userPostDataloader.clear(args.dto.authorId)
            // const user = await context.prisma.user.findUnique({ 
            //     where: { id: args.dto.authorId }, 
            //     select: { id: true, posts: true } })
            // await context.userPostDataloader.prime(args.dto.authorId, user.posts)
            return post
        }
    }
}

const changePostResolver = () => {
    return {
        type: new GraphQLNonNull(postType),
        args: {
            id: { type: new GraphQLNonNull(UUIDType) },
            dto: { type: new GraphQLNonNull(changePostInput) }
        },
        resolve: async (root, args, context) => {
            const db: PrismaClient = context.prisma
            let record = await db.post.findUnique({
                where: {
                    id: args.id
                },
                select: {
                    authorId: true
                }
            })
            if (record == null) throw new Error(`post not found by id ${args.id}`) 
            
            // let contentOptional = args.dto.content ?? undefined
            await db.post.update({
                where: {
                    id: args.id
                },
                data: {
                    content: args.dto.content,
                    title: args.dto.title,
                }
            }).then(() => {
                context.userDataloader.clear(args.dto.authorId)
            })
            
            // await postCache(record.authorId, context.userPostDataloader, db)
            return db.post.findUnique({
                where: {
                    id: args.id
                }
            })
        }
    }
}

const deletePostResolver = () => {
    return {
        type: new GraphQLNonNull(GraphQLString),
        args: {
            id: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: async (_, args, context) => {
            const db: PrismaClient = context.prisma
            const post = await db.post.findUniqueOrThrow({
                where: {
                    id: args.id
                }
            })

            await db.post.delete({
                where: {
                    id: args.id
                }
            })
            context.userDataloader.clear(post.authorId)
            // await postCache(post.authorId, context.userPostDataloader, db)
            return "ok"
        }
    }
}

const subscribeToResolver = () => {
    return {
        type: new GraphQLNonNull(GraphQLString),
        args: {
            userId: { type: new GraphQLNonNull(UUIDType) },
            authorId: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: async (_, args, context) => {
            if (args.userId == args.authorId) throw new Error(`author must difer from user`);
            const db: PrismaClient = context.prisma

            await db.subscribersOnAuthors.create({
                data: {
                    subscriberId: args.userId,
                    authorId: args.authorId
                }
            })

            return "ok";
        }
    }
}

const unsubscribeFromResolver = () => {
    return {
        type: new GraphQLNonNull(GraphQLString),
        args: {
            userId: { type: new GraphQLNonNull(UUIDType) },
            authorId: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: async (_, args, context) => {
            const db: PrismaClient = context.prisma

            await db.subscribersOnAuthors.delete({
                where: {
                    subscriberId_authorId: {
                        subscriberId: args.userId,
                        authorId: args.authorId
                    }
                }
            })
   
            return "ok"
        }
    }
}

const profileResolver = () => {
    return {
        type: profileType,
        args: {
            id: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: async (_, args, context) => {
            const db = context.prisma
            return db.profile.findUnique({ 
                where: { 
                    id: args.id 
                },
                include: {
                    memberType: true
                }
            })
        }
    }
}

const profilesResolver = () => {
    return {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(profileType))),
        resolve: async (_, args, context) => {
            const db: PrismaClient = context.prisma
            return db.profile.findMany() || []
        }
    }
}

const deleteProfileResolver = () => {
    return {
        type: new GraphQLNonNull(GraphQLString),
        args: {
            id: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: async (_, args, context) => {
            const db: PrismaClient = context.prisma
            const profile = await db.profile.findUniqueOrThrow({
                where: {
                    id: args.id
                }
            })

            await db.profile.delete({
                where: {
                    id: args.id
                }
            })

            // await profileCache(profile.userId, context.userProfileDataloader, db)
            return "ok"
        }
    }
}

const postsResolver = () => {
    return {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(postType))),
        resolve: async (_, args, context) => {
            const db: PrismaClient = context.prisma
            return db.post.findMany() || []
        }
    }
}

const postResolver = () => {
    return {
        type: postType,
        args: {
            id: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: async (_, args, context) => {
            const db = context.prisma
            return db.post.findUnique({ 
                where: { 
                    id: args.id 
                }
            })
        }
    }
}

const postCache = async (authorId: string, postDataloader: DataLoader<string, any>, db: PrismaClient) => {
    await postDataloader.clear(authorId)
    const result = await db.user.findUnique({
        select: {
            id: true,
            posts: true
        },
        where: {
            id: authorId
        }
    })
    if (result != null) await postDataloader.prime(authorId, result.posts)
}

export const schemaFunc = (prisma: PrismaClient): GraphQLSchema => {
    return new GraphQLSchema({
        query: new GraphQLObjectType({
            name: "RootQueryType",
            fields: {
                memberTypes: memberTypesResolver(),
                memberType: memberTypeResolver(),
                users: usersResolver(),
                user: userResolver(),
                profile: profileResolver(),
                profiles: profilesResolver(),
                posts: postsResolver(),
                post: postResolver(),
            }
        }),
        mutation: new GraphQLObjectType({
            name: "Mutations",
            fields: {
                createUser: createUserResolver(),
                changeUser: changeUserResolver(),
                createProfile: createProfileResolver(),
                changeProfile: changeProfileResolver(),
                createPost: createPostResolver(),
                changePost: changePostResolver(),
                subscribeTo: subscribeToResolver(),
                unsubscribeFrom: unsubscribeFromResolver(),
                deleteUser: deleteUserResolver(),
                deletePost: deletePostResolver(),
                deleteProfile: deleteProfileResolver()
            }
        })
    })
}