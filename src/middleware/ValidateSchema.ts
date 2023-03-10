import Joi, { ObjectSchema } from 'joi';
import { NextFunction, Request, Response } from 'express';
import Logger from '../library/logger';

export const ValidateSchema = (schema: ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      Logger.log(req.body);
      // console.log(req.files);
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
  tags: Joi.array().items(Joi.string()),
  imgUrl: Joi.string().empty(null).regex(imgRegex).max(240),
  price: Joi.number().min(0),
  cityCode: Joi.number().required(),
  byInvite: Joi.boolean().default(false),
  maxPlayers: Joi.number().min(1).default(1),
  startDateTime: Joi.date()
});

export const Schema = {
  game: {
    create: GameValidator,
    update: GameValidator
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
  }
};
