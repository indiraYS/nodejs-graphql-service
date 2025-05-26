import { GraphQLNonNull, GraphQLInt, 
    GraphQLInputObjectType,
    GraphQLString} from "graphql";
import { UUIDType } from "./uuid.js";

export const createPostInput = new GraphQLInputObjectType({
    name: "CreatePostInput",
    fields: {
        title: { type: new GraphQLNonNull(GraphQLString)},
        content: {type: new GraphQLNonNull(GraphQLString)},
        authorId: {type: new GraphQLNonNull(UUIDType)}
    }
}) 