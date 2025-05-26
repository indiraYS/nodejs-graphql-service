import { GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLFloat, GraphQLString } from "graphql"
import { postType } from "./PostType.js"
import { UUIDType } from "./uuid.js"
import { profileType } from "./Profile.js"
import { memberType } from "./MemberType.js"

export const userType = new GraphQLObjectType({
    name: "User",
    fields: () => ({
        id: { type: new GraphQLNonNull(UUIDType) },
        name: { type: new GraphQLNonNull(GraphQLString) },
        balance: { type: new GraphQLNonNull(GraphQLFloat) },
        profile: { 
            type: profileType, 
            resolve: async (user, args, context, info) => {
                return context.prisma.profile.findUnique({
                    where: {
                        userId: user.id
                    }
                })
            } 
        },
        posts: {
            type: new GraphQLNonNull(new GraphQLList(postType)),
            resolve: async (user, args, context, info) => {
                return user.posts;
            }
        },
        userSubscribedTo: {
            type: new GraphQLNonNull(new GraphQLList(userType)),
            resolve: async (user, args, context, info) => {
                const users = await user.userSubscribedTo.map((author) => author.authorId) || []
                return context.userDataloader.loadMany(users)
            }
        },
        subscribedToUser: {
            type: new GraphQLNonNull(new GraphQLList(userType)),
            resolve: async (user, args, context, info) => {
                const subscribers = await context.prisma.subscribersOnAuthors.findMany({
                    where: {
                        authorId: user.id
                    }
                })
                // await context.subscribedToUserDataloader.load(user.id)
                const users = subscribers.map((subscriber) => subscriber.subscriberId) || []
                return context.userDataloader.loadMany(users)
            }
        },
    })
})