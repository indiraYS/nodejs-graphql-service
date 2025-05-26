import {GraphQLObjectType, GraphQLNonNull, GraphQLFloat, GraphQLInt} from "graphql"
import { memberTypeId } from "./MemberTypeId.js"
export const memberType = new GraphQLObjectType({
    name: "MemberType",
    fields: {
        id: { type: new GraphQLNonNull(memberTypeId) },
        discount: { type: new GraphQLNonNull(GraphQLFloat) },
        postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt) }
    }
})