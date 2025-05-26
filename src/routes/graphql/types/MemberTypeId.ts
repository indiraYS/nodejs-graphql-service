import {GraphQLEnumType} from 'graphql'

export const memberTypeId = new GraphQLEnumType({
    name: "MemberTypeId",
    values: {
        BASIC: {},
        BUSINESS: {}
    }
})