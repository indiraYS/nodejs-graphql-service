import { GraphQLNonNull, GraphQLInt, 
    GraphQLInputObjectType, GraphQLBoolean } from "graphql";
import { UUIDType } from "./uuid.js";
import { memberTypeId } from "../types/MemberTypeId.js"

export const createProfileInput = new GraphQLInputObjectType({
    name: "CreateProfileInput",
    fields: {
        isMale: { type: new GraphQLNonNull(GraphQLBoolean)},
        yearOfBirth: {type: new GraphQLNonNull(GraphQLInt)},
        userId: {type: new GraphQLNonNull(UUIDType)},
        memberTypeId: {type: new GraphQLNonNull(memberTypeId)},
    }
}) 