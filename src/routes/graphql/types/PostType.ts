import {GraphQLObjectType, GraphQLNonNull, GraphQLString} from "graphql"
import {UUIDType} from "../types/uuid.js"

export const postType =  new GraphQLObjectType({
    name: "Post",
    fields: {
        id: { type: new GraphQLNonNull(UUIDType)},
        title: {type: new GraphQLNonNull(GraphQLString)},
        content: {type: new GraphQLNonNull(GraphQLString)}
    }
})