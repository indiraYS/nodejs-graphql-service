import { GraphQLNonNull, GraphQLString, GraphQLInputObjectType, GraphQLFloat } from "graphql";

export const createUserInputType =  new GraphQLInputObjectType({
    name: "CreateUserInput",
    fields: {
        name: { type: new GraphQLNonNull(GraphQLString)},
        balance: {type: new GraphQLNonNull(GraphQLFloat)}
    }
}) 