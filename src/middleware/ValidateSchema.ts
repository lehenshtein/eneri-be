import Joi, { ObjectSchema } from 'joi';
import { NextFunction, Request, Response } from 'express';
import Logger from '../library/logger';

export const ValidateSchema = (schema: ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validateAsync(req.body);

      next();
    } catch (err) {
      Logger.err(err);

      return res.status(422).json({ err });
    }
  };
};
const idRegex = /^[0-9a-fA=F]{24}$/;
const imgRegex = /^(ftp|http|https):\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)/i;

const GameValidator = Joi.object({
  gameSystemId: Joi.number().required(),
  title: Joi.string().required().min(5).max(50),
  description: Joi.string().min(10).max(2000),
  organizedPlay: Joi.boolean(),
  tags: Joi.array().items(Joi.string()),
  imgUrl: Joi.string().empty(null).max(240),
  price: Joi.number().min(0),
  cityCode: Joi.number().required(),
  byInvite: Joi.boolean().default(false),
  maxPlayers: Joi.number().min(1).default(1),
  startDateTime: Joi.date(),
  booked: Joi.array().items(Joi.string()),
});

const GameRequestValidator = Joi.object({
  gameSystemId: Joi.number().required(),
  title: Joi.string().required().min(5).max(50),
  description: Joi.string().min(10).max(2000),
  organizedPlay: Joi.boolean(),
  tags: Joi.array().items(Joi.string()),
  imgUrl: Joi.string().empty(null).max(240),
  price: Joi.number().min(0),
  cityCode: Joi.number().required(),
  maxPlayers: Joi.number().min(1).default(1),
  startDateTime: Joi.date(),
  booked: Joi.array().items(Joi.string()),
});

export const Schema = {
  game: {
    create: GameValidator,
    update: GameValidator
  },

  gameRequest: {
    create: GameRequestValidator,
    update: GameRequestValidator
  },

  authentication: {
    register: Joi.object({
      username: Joi.string().required().min(4).max(30),
      email: Joi.string().required().email({ tlds: { allow: false } }),
      password: Joi.string().required().min(8).max(40)
    }),
    login: Joi.object({
      email: Joi.string().required().email({ tlds: { allow: false } }),
      password: Joi.string().required().min(8).max(40)
    })
  },

  userUpdate: Joi.object({
    name: Joi.string().max(30).empty(''),
    about: Joi.string().empty('').max(600),
    showContacts: Joi.boolean(),
    contactData: Joi.object(),
    avatar: Joi.string().empty(null)
  })
};
