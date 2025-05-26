import { GraphQLNonNull, GraphQLString, GraphQLInputObjectType, GraphQLFloat } from "graphql";

export const changeUserInputType =  new GraphQLInputObjectType({
    name: "ChangeUserInput",
    fields: {
        name: { type: GraphQLString},
        balance: {type: GraphQLFloat}
    }
}) 