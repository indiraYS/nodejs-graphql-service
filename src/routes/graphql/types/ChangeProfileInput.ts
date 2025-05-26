import { GraphQLNonNull, GraphQLInt, 
    GraphQLInputObjectType, GraphQLBoolean } from "graphql";
import { memberTypeId } from "../types/MemberTypeId.js"

export const changeProfileInput = new GraphQLInputObjectType({
    name: "ChangeProfileInput",
    fields: {
        isMale: { type: GraphQLBoolean},
        yearOfBirth: {type: GraphQLInt},
        memberTypeId: {type: memberTypeId},
    }
}) 