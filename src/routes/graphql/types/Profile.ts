import { GraphQLNonNull, GraphQLInt, 
    GraphQLObjectType, GraphQLBoolean } from "graphql";
import { UUIDType } from "./uuid.js";
import { memberType } from "../types/MemberType.js"

export const profileType = new GraphQLObjectType({
    name: "Profile",
    fields: {
        isMale: { type: new GraphQLNonNull(GraphQLBoolean)},
        yearOfBirth: {type: new GraphQLNonNull(GraphQLInt)},
        id: {type: new GraphQLNonNull(UUIDType)},
        memberType: {type: new GraphQLNonNull(memberType), resolve: async (profile, args, context) => {
            return context.memberTypeDataloader.load(profile.memberTypeId)
        } },
    }
}) 