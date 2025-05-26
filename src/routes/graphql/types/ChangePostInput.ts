import { GraphQLNonNull, GraphQLInt, 
    GraphQLInputObjectType,
    GraphQLString} from "graphql";

export const changePostInput = new GraphQLInputObjectType({
    name: "ChangePostInput",
    fields: {
        title: { type: GraphQLString},
        content: {type: GraphQLString},
    }
}) 