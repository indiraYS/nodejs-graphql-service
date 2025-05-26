import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql } from 'graphql';
import { schemaFunc } from './resolver/resolver.js';
import DataLoader from 'dataloader';
import { memberType } from './types/MemberType.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  const schema = schemaFunc(prisma)

  async function userBatchFunction(keys) {
    const results = await prisma.user.findMany({
      where: {
        id: {
          in: keys
        },
      },
      include: {
        posts: true,
        subscribedToUser: true,
        userSubscribedTo: true
      }
    })
    if (results) {
      const map = new Map(results.map((u) => [u.id, u]))
      return keys.map(key => map.get(key));
    } else {
      return []
    }
  }

  async function userPostBatchFunction(keys) {
    const results = await prisma.user.findMany({
      select: {
        id: true,
        posts: true
      },
      where: {
        id: {
          in: keys
        }
      }
    })

    if (results) {
      const map = new Map(results.map((u) => [u.id, u.posts]))
      return keys.map(key => map.get(key) || new Error(`No result for ${key}`));
    } else {
      return []
    }
  }

  // async function userProfileBatchFunction(keys) {
  //   const results = await prisma.user.findMany({
  //     select: {
  //       id: true,
  //       profile: {
  //         select: {
  //           id: true,
  //           isMale: true,
  //           yearOfBirth: true,
  //           memberType: true,
  //           memberTypeId: true,
  //           userId: true,
  //           user: true
  //         }
  //       }
  //     },
  //     where: {
  //       id: {
  //         in: keys
  //       }
  //     }
  //   })

  //   if (results) {
  //     const map = new Map(results.map((u) => [u.id, u.profile]))
  //     return keys.map(key => map.get(key));
  //   } else {
  //     return []
  //   }
  // }

  async function subscribedToUserBatch(keys) {
    const results = await prisma.user.findMany({
      select: {
        id: true,
        subscribedToUser: true
      },
      where: {
        id: {
          in: keys
        }
      }
    })

    const map = new Map(results.map((u) => [u.id, u.subscribedToUser]))
    return keys.map(key => map.get(key));
  }

  async function userSubscribedToUserBatch(keys) {
    const results = await prisma.user.findMany({
      select: {
        id: true,
        userSubscribedTo: true
      },
      where: {
        id: {
          in: keys
        }
      }
    })

    const map = new Map(results.map((u) => [u.id, u.userSubscribedTo]))
    return keys.map(key => map.get(key));
  }

  async function memberTypeFunction(keys) {
    const results = await prisma.memberType.findMany({
      where: {
        id: {
          in: keys
        }
      }
    })

    const map = new Map(results.map((u) => [u.id, u]))
    return keys.map(key => map.get(key));
  }

  const userDataloader = new DataLoader(userBatchFunction)
  const userPostDataloader = new DataLoader(userPostBatchFunction)
  const memberTypeDataloader = new DataLoader(memberTypeFunction)
  const userSubscribedToDataloader = new DataLoader(userSubscribedToUserBatch)
  const subscribedToUserDataloader = new DataLoader(subscribedToUserBatch)

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      return graphql(
        {
          schema,
          contextValue: { userDataloader, memberTypeDataloader, userPostDataloader, userSubscribedToDataloader, subscribedToUserDataloader, prisma },
          source: req.body.query,
          variableValues: req.body.variables
        }
      );
    },
  });
};

export default plugin;
